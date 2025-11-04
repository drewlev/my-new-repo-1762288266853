import React from "react";
import RecruitingList from "./list.js";

type CandidateUI = {
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

export default function RecruitingUI() {
  const [candidates, setCandidates] = React.useState<CandidateUI[]>([]);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = React.useState<
    string | null
  >(null);

  const selectedCandidate = React.useMemo(
    () => candidates.find((c) => c.id === selectedCandidateId) ?? null,
    [candidates, selectedCandidateId]
  );

  function updateDisplayMode() {
    const displayMode = (window as any).openai?.displayMode || "inline";
    setIsFullscreen(displayMode === "fullscreen");

    if (displayMode !== "fullscreen") {
      setSelectedCandidateId(null);
    }
  }

  async function toggleDisplayMode() {
    const currentMode = (window as any).openai?.displayMode || "inline";
    const newMode = currentMode === "fullscreen" ? "inline" : "fullscreen";

    if ((window as any).openai?.requestDisplayMode) {
      try {
        await (window as any).openai.requestDisplayMode({ mode: newMode });
      } catch (e) {
        console.error("Failed to request display mode:", e);
      }
    }
  }

  React.useEffect(() => {
    const fromTool = (globalThis as any)?.openai?.toolOutput?.structuredContent
      ?.candidates;
    const fromBootstrap = (globalThis as any)?.__WIDGET_DATA__?.candidates;
    if (Array.isArray(fromTool)) {
      setCandidates(fromTool);
    } else if (Array.isArray(fromBootstrap)) {
      setCandidates(fromBootstrap);
    }
  }, []);

  React.useEffect(() => {
    const handler = () => updateDisplayMode();
    window.addEventListener("openai:set_globals", handler);
    return () => window.removeEventListener("openai:set_globals", handler);
  }, []);

  return (
    <RecruitingList
      candidates={candidates}
      onToggleDisplayMode={toggleDisplayMode}
      isFullscreen={isFullscreen}
      selectedCandidateId={selectedCandidateId}
      onSelectCandidate={setSelectedCandidateId}
      selectedCandidate={selectedCandidate}
    />
  );
}
