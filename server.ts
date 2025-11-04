import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  type ListResourcesRequest,
  type ReadResourceRequest,
  type Resource,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "node:fs";
import path, { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { getRecruitingCandidates } from "../downstream-apps/recruiting";
import {
  ApifyLeadScraperAPI,
  type LeadOutput,
} from "@/server/downstream-apps/integrations/people-search";

export const server = new McpServer(
  {
    name: "chatos",
    version: "1.0.0",
  },
  {
    capabilities: {
      resources: {},
    },
  }
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, "..");
const ASSETS_DIR = resolve(ROOT_DIR, "assets");

function widgetMetaFor(appName: string) {
  const uri = `ui://widget/${appName}.html`;
  return {
    "openai/outputTemplate": uri,
    "openai/toolInvocation/invoking": `Preparing ${appName} UI`,
    "openai/toolInvocation/invoked": `Rendered ${appName} UI`,
    "openai/widgetAccessible": true,
    "openai/resultCanProduceWidget": true,
  } as const;
}

type WidgetEntry = {
  html: string;
  templateUri: string;
  title: string;
};

const widgetsByUri = new Map<string, WidgetEntry>();
const resources: Resource[] = [];

function loadAllWidgetAssets() {
  if (!fs.existsSync(ASSETS_DIR)) return;
  const files = fs.readdirSync(ASSETS_DIR).filter((f) => f.endsWith(".html"));
  for (const file of files) {
    const appName = path.basename(file, ".html");
    const uri = `ui://widget/${appName}.html`;
    const html = fs.readFileSync(path.join(ASSETS_DIR, file), "utf8");
    widgetsByUri.set(uri, {
      html,
      templateUri: uri,
      title: `${appName.charAt(0).toUpperCase()}${appName.slice(1)} Widget`,
    });
    resources.push({
      uri,
      name: `${appName} UI`,
      description: `UI for ${appName}`,
      mimeType: "text/html+skybridge",
      _meta: {
        "openai/widgetDescription": `Displays ${appName} UI`,
        "openai/widgetAccessible": true,
      },
    });
  }
}

loadAllWidgetAssets();

// Helper function to convert LeadOutput to Candidate format
function leadToCandidate(
  lead: LeadOutput,
  index: number
): {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  yearsOfExperience: number;
  skills: string[];
  stage: string;
} {
  // Extract years from position/seniority if possible, otherwise use a default
  const yearsOfExperience =
    lead.seniority === "C-Suite" || lead.seniority === "VP"
      ? 15
      : lead.seniority === "Director"
      ? 10
      : lead.seniority === "Manager"
      ? 7
      : lead.seniority === "Senior"
      ? 5
      : 2;

  return {
    id: `apify-${index}-${lead.email}`,
    name: lead.fullName,
    title: lead.position,
    email: lead.email,
    phone: lead.phone || "",
    location: `${lead.city}, ${lead.state}`,
    yearsOfExperience,
    skills: [lead.functional, lead.orgIndustry].filter(Boolean) as string[],
    stage: "Screening", // Default stage for new prospects
  };
}

server.registerTool(
  "list_candidates",
  {
    title: "List Recruiting Candidates",
    description:
      "Searches for and displays recruiting candidates/prospects using Apify lead scraper. You can filter by person title, seniority, location, company details, and more.",
    inputSchema: {
      // Person Filters
      personTitle: z
        .array(z.string())
        .optional()
        .describe(
          "Filter by person job titles (e.g., ['Software Engineer', 'Product Manager'])"
        ),
      seniority: z
        .array(
          z.enum(["C-Suite", "VP", "Director", "Manager", "Senior", "Entry"])
        )
        .optional()
        .describe("Filter by seniority level"),
      functional: z
        .array(
          z.enum([
            "Sales",
            "Marketing",
            "Engineering",
            "Operations",
            "Finance",
            "Human Resources",
            "Legal",
            "IT",
          ])
        )
        .optional()
        .describe("Filter by functional area"),
      personCountry: z
        .array(z.string())
        .optional()
        .describe("Filter by person country"),
      personState: z
        .array(z.string())
        .optional()
        .describe("Filter by person state"),
      personCity: z
        .array(z.string())
        .optional()
        .describe("Filter by person city"),

      // Company Filters
      companyKeyword: z
        .array(z.string())
        .optional()
        .describe("Filter by company keywords"),
      companyIndustry: z
        .array(z.string())
        .optional()
        .describe("Filter by company industry"),
      companyEmployeeSize: z
        .array(
          z.enum([
            "1",
            "2 - 10",
            "11 - 50",
            "51 - 200",
            "201 - 500",
            "501 - 1000",
            "1001 - 5000",
            "5001 - 10000",
            "10001+",
          ])
        )
        .optional()
        .describe("Filter by company employee size"),
      companyDomain: z
        .array(z.string())
        .optional()
        .describe("Filter by company domain (e.g., ['example.com'])"),
      companyCountry: z
        .array(z.string())
        .optional()
        .describe("Filter by company country"),
      companyState: z
        .array(z.string())
        .optional()
        .describe("Filter by company state"),
      companyCity: z
        .array(z.string())
        .optional()
        .describe("Filter by company city"),

      // Quality Filters
      contactEmailStatus: z
        .array(z.enum(["Verified", "Unverified"]))
        .optional()
        .describe("Filter by email verification status"),
      hasEmail: z.boolean().optional().describe("Require email address"),
      hasPhone: z.boolean().optional().describe("Require phone number"),

      // Output Control
      totalResults: z
        .number()
        .int()
        .min(1)
        .max(50000)
        .optional()
        .describe(
          "Maximum number of results to return (default: 100, max: 50000 for paid tier)"
        ),

      // Option to use existing candidates or fetch new ones
      useExistingCandidates: z
        .boolean()
        .optional()
        .default(false)
        .describe(
          "If true, returns existing candidates from the pipeline instead of searching for new prospects"
        ),
    },
    _meta: widgetMetaFor("recruiting"),
  },
  async (params) => {
    let candidates;

    // If useExistingCandidates is true, use the existing pipeline
    if (params?.useExistingCandidates) {
      candidates = await getRecruitingCandidates();
    } else {
      // Use Apify to search for new prospects
      const api = new ApifyLeadScraperAPI();

      // Build the input object, filtering out undefined values
      const input: any = {};
      if (params?.personTitle) input.personTitle = params.personTitle;
      if (params?.seniority) input.seniority = params.seniority;
      if (params?.functional) input.functional = params.functional;
      if (params?.personCountry) input.personCountry = params.personCountry;
      if (params?.personState) input.personState = params.personState;
      if (params?.personCity) input.personCity = params.personCity;
      if (params?.companyKeyword) input.companyKeyword = params.companyKeyword;
      if (params?.companyIndustry)
        input.companyIndustry = params.companyIndustry;
      if (params?.companyEmployeeSize)
        input.companyEmployeeSize = params.companyEmployeeSize;
      if (params?.companyDomain) input.companyDomain = params.companyDomain;
      if (params?.companyCountry) input.companyCountry = params.companyCountry;
      if (params?.companyState) input.companyState = params.companyState;
      if (params?.companyCity) input.companyCity = params.companyCity;
      if (params?.contactEmailStatus)
        input.contactEmailStatus = params.contactEmailStatus;
      if (params?.hasEmail !== undefined) input.hasEmail = params.hasEmail;
      if (params?.hasPhone !== undefined) input.hasPhone = params.hasPhone;
      if (params?.totalResults) input.totalResults = params.totalResults;

      try {
        const leads = await api.scrapeLeads(input);
        candidates = leads.map((lead, index) => leadToCandidate(lead, index));
      } catch (error) {
        throw new Error(
          `Failed to fetch prospects from Apify: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    return {
      content: [
        {
          type: "text",
          text: `Found ${candidates.length} candidates${
            params?.useExistingCandidates
              ? " in the recruiting pipeline"
              : " from Apify lead search"
          }. The interactive widget displays candidate information including name, title, location, experience, skills, and current stage in the hiring process.`,
        },
      ],
      structuredContent: {
        candidates,
      },
      _meta: widgetMetaFor("recruiting"),
    } as any;
  }
);

server.server.setRequestHandler(
  ListResourcesRequestSchema,
  async (_request: ListResourcesRequest) => ({
    resources,
  })
);

server.server.setRequestHandler(
  ReadResourceRequestSchema,
  async (request: ReadResourceRequest) => {
    const widget = widgetsByUri.get(request.params.uri);

    if (!widget) {
      throw new Error(`Unknown resource: ${request.params.uri}`);
    }

    return {
      contents: [
        {
          uri: widget.templateUri,
          mimeType: "text/html+skybridge",
          text: widget.html,
          _meta: widgetMetaFor(path.basename(widget.templateUri, ".html")),
        },
      ],
    };
  }
);
