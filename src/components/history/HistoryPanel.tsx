import { Copy, History, Undo2 } from "lucide-react";
import type { ResumeDocument, ResumeVersion } from "../../lib/types";
import { formatDate } from "../../lib/utils";
import { Button } from "../common/Button";

interface HistoryPanelProps {
  resume: ResumeDocument;
  compareVersion?: ResumeVersion;
  compareId: string;
  setCompareId: (id: string) => void;
  captureVersion?: (name?: string, notes?: string) => void;
  openSaveVersion: () => void;
  restore: (version: ResumeVersion) => void;
  duplicate: (version: ResumeVersion) => void;
}

export const HistoryPanel = ({
  resume,
  compareVersion,
  compareId,
  setCompareId,
  openSaveVersion,
  restore,
  duplicate,
}: HistoryPanelProps) => (
  <div className="workflow-panel history-panel">
    <div className="panel-heading">
      <div>
        <h2>History</h2>
        <p>Named versions and recent autosaved snapshots are stored locally in this browser.</p>
      </div>
      <Button className="primary" onClick={openSaveVersion}>
        <History size={16} /> Save named version
      </Button>
    </div>
    <label className="compare-select">
      Compare with current
      <select value={compareId} onChange={(event) => setCompareId(event.target.value)}>
        <option value="">Choose version</option>
        {resume.versions.map((version: ResumeVersion) => (
          <option key={version.id} value={version.id}>
            {version.name} • {formatDate(version.createdAt)}
          </option>
        ))}
      </select>
    </label>
    {compareVersion && (
      <div className="diff">
        <pre>{simpleDiff(compareVersion.markdown, resume.markdown)}</pre>
      </div>
    )}
    <div className="timeline">
      {resume.versions.map((version: ResumeVersion) => (
        <article key={version.id} className="timeline-row">
          <div>
            <strong>{version.kind === "autosave" ? "Autosaved snapshot" : version.name}</strong>
            <span>
              {formatDate(version.createdAt)}{" "}
              {version.kind === "system" ? "• safety snapshot" : version.jobTargetId ? "• job-specific" : ""}
            </span>
            <p>{version.notes || "No notes."}</p>
          </div>
          <div className="inline-actions">
            <Button onClick={() => restore(version)}>
              <Undo2 size={15} /> Restore
            </Button>
            <Button onClick={() => duplicate(version)}>
              <Copy size={15} /> Duplicate
            </Button>
          </div>
        </article>
      ))}
    </div>
  </div>
);

const simpleDiff = (oldText: string, newText: string) => {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const length = Math.max(oldLines.length, newLines.length);
  const rows = [];
  for (let i = 0; i < length; i += 1) {
    if (oldLines[i] !== newLines[i]) {
      if (oldLines[i] !== undefined) rows.push(`- ${oldLines[i]}`);
      if (newLines[i] !== undefined) rows.push(`+ ${newLines[i]}`);
    }
  }
  return rows.slice(0, 260).join("\n") || "No differences from current Markdown.";
};
