import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type Candidate = {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  yearsOfExperience: number;
  skills: string[];
  stage: string;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function loadCandidates(): Promise<Candidate[]> {
  const dataPath = resolve(__dirname, "./dummy-data.json");
  const raw = await readFile(dataPath, "utf-8");
  return JSON.parse(raw) as Candidate[];
}

export async function getRecruitingCandidates(): Promise<Candidate[]> {
  return await loadCandidates();
}
