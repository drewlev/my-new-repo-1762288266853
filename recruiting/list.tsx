import React from "react";

interface Candidate {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  yearsOfExperience: number;
  skills: string[];
  stage: string;
}

interface RecruitingListProps {
  candidates: Candidate[];
  onToggleDisplayMode: () => void;
  isFullscreen?: boolean;
  selectedCandidateId: string | null;
  onSelectCandidate: (id: string) => void;
  selectedCandidate: Candidate | null;
}

const container: React.CSSProperties = {
  fontFamily:
    '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
  position: "relative",
  display: "flex",
  gap: "16px",
};

const card: React.CSSProperties = {
  borderRadius: "15px",
  overflow: "hidden",
  border: "1px solid #eee",
  background: "#fff",
  flex: "1 1 auto",
};

const tableGrid: React.CSSProperties = {
  display: "grid",
  width: "100%",
  columnGap: "1px",
  rowGap: "1px",
  background: "#eee",
};

const baseColumns = "1fr 1.8fr 1.6fr 1fr";
const fullColumns = "1fr 1.8fr 1.6fr 1fr 1.2fr auto";

const headerCell: React.CSSProperties = {
  height: "36px",
  display: "flex",
  alignItems: "center",
  padding: "0 16px",
  fontSize: "12px",
  fontWeight: 500,
  lineHeight: "140%",
  background: "#f9f9f9",
  color: "#666",
  minWidth: 0,
};

const bodyCell: React.CSSProperties = {
  height: "40px",
  display: "flex",
  alignItems: "center",
  padding: "16px",
  fontSize: "12px",
  background: "#fff",
  minWidth: 0,
};

const rowAsContents: React.CSSProperties = { display: "contents" };

function actionButtonStyle(active: boolean): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: 27,
    padding: "0 12px",
    borderRadius: 999,
    fontSize: 11.25,
    cursor: active ? "default" : "pointer",
    background: "linear-gradient(180deg, #292929 0%, #0A0A0A 100%)",
    opacity: active ? 0.3 : 1,
    color: "#fff",
    width: "100%",
  };
}

export default function RecruitingList({
  candidates,
  onToggleDisplayMode,
  isFullscreen,
  selectedCandidateId,
  onSelectCandidate,
  selectedCandidate,
}: RecruitingListProps) {
  const columns = isFullscreen ? fullColumns : baseColumns;

  return (
    <div
      style={{
        ...container,
        ...(isFullscreen && {
          padding: "24px",
        }),
      }}
    >
      <div style={card}>
        <div style={{ ...tableGrid, gridTemplateColumns: columns }}>
          {/* Header row */}
          <div style={rowAsContents}>
            <div style={headerCell}>Name</div>
            <div style={headerCell}>Title</div>
            <div style={headerCell}>Email</div>
            <div style={headerCell}>Stage</div>
            {isFullscreen && <div style={headerCell}>Location</div>}
            {isFullscreen && (
              <div style={{ ...headerCell, justifyContent: "center" }}>
                Action
              </div>
            )}
          </div>

          {/* Body rows */}
          {candidates.length === 0 ? (
            <div style={rowAsContents}>
              <div
                style={{
                  ...bodyCell,
                  gridColumn: "1 / -1",
                  justifyContent: "center",
                  color: "#9ca3af",
                }}
              >
                Loading data...
              </div>
            </div>
          ) : (
            candidates.map((candidate) => {
              const isActive = selectedCandidateId === candidate.id;
              return (
                <div key={candidate.id} style={rowAsContents}>
                  <div style={bodyCell}>{candidate.name}</div>
                  <div style={bodyCell}>{candidate.title}</div>
                  <div style={bodyCell}>
                    <a
                      href={`mailto:${candidate.email}`}
                      style={{
                        color: "#2563eb",
                        textDecoration: "none",
                        fontSize: "12px",
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.textDecoration = "underline")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.textDecoration = "none")
                      }
                    >
                      {candidate.email}
                    </a>
                  </div>
                  <div style={bodyCell}>{candidate.stage}</div>

                  {isFullscreen && (
                    <div style={bodyCell}>{candidate.location}</div>
                  )}
                  {isFullscreen && (
                    <div style={{ ...bodyCell, justifyContent: "center" }}>
                      <button
                        aria-pressed={isActive}
                        onClick={() =>
                          !isActive && onSelectCandidate(candidate.id)
                        }
                        style={actionButtonStyle(isActive)}
                      >
                        {isActive ? "Viewing" : "View Email Draft"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Display mode toggle */}
      <div
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          width: 24,
          height: 24,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          background: "#fff",
          boxShadow: "0px 25px 50px -12px #00000040",

          ...(isFullscreen && {
            display: "none",
          }),
        }}
        onClick={onToggleDisplayMode}
      >
        <svg
          width="11"
          height="11"
          viewBox="0 0 11 11"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M6.11111 0.611111C6.11111 0.273607 6.38471 0 6.72222 0H10.3889C10.7264 0 11 0.273607 11 0.611111V4.27778C11 4.61529 10.7264 4.88889 10.3889 4.88889C10.0514 4.88889 9.77778 4.61529 9.77778 4.27778V2.08646L7.15434 4.70989C6.9157 4.94853 6.52874 4.94853 6.29011 4.70989C6.05147 4.47126 6.05147 4.08431 6.29011 3.84565L8.91354 1.22222H6.72222C6.38471 1.22222 6.11111 0.948616 6.11111 0.611111ZM0.611111 6.11111C0.948616 6.11111 1.22222 6.38471 1.22222 6.72222V8.91354L3.84565 6.29011C4.08431 6.05147 4.47126 6.05147 4.70989 6.29011C4.94853 6.52874 4.94853 6.9157 4.70989 7.15434L2.08646 9.77778H4.27778C4.61529 9.77778 4.88889 10.0514 4.88889 10.3889C4.88889 10.7264 4.61529 11 4.27778 11H0.611111C0.273607 11 0 10.7264 0 10.3889V6.72222C0 6.38471 0.273607 6.11111 0.611111 6.11111Z"
            fill="black"
          />
        </svg>
      </div>

      {/* Sidebar only in fullscreen */}
      {isFullscreen && selectedCandidate && (
        <div
          style={{
            width: 383,
            borderRadius: "16px",
            border: "1px solid #eee",
            height: "100%",
            flexShrink: 0,
            background: "#fff",
          }}
        >
          <div
            style={{
              padding: "16px",
              borderBottom: "1px solid #eee",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {`Email Draft to ${selectedCandidate.name}`}
          </div>
          <div style={{ padding: "24px", fontWeight: 400, fontSize: 13 }}>
            <strong>Subject:</strong>{" "}
            {`Exploring a ${selectedCandidate.title} opportunity at [Your Company]`}
            <br />
            {`Hi ${selectedCandidate.name.split(" ")[0]},`}
            <br />
            {`I came across your background as a ${selectedCandidate.title}, and your experience really stood out. We’re currently expanding our team at Our Company, working on projects where your skills would be a great fit.`}
            <br />
            {`If you’re open to a quick chat, I’d love to tell you more about what we’re building and see if it aligns with your interests. Would you be available later this week for a short intro call?`}
            <br /> <br /> Best,
            <br /> Desmond Davis
            <br /> Head of Talent at Company
          </div>
        </div>
      )}
    </div>
  );
}
