import { useState } from "react";
import { Archive, Clipboard, Copy, Download, FileDown, Minimize2 } from "lucide-react";
import type { ResumeDocument, ResumeTemplate } from "../../lib/types";
import type { ResumeReviewIssue } from "../../lib/resume-review";
import { parseFrontmatter, renderMarkdown } from "../../lib/markdown";
import { exportDocx, exportHtml, exportJsonResume, exportMarkdown, exportPlainText, exportResumeForgeJson, exportYaml, printPdf } from "../../lib/exporters";
import { Button } from "../common/Button";
import { writeClipboard } from "../../app/resumeTransforms";

interface ExportCenterProps {
  resume: ResumeDocument;
  renderedHtml: string;
  style: string;
  appState?: unknown;
  template: ResumeTemplate;
  atsMode: boolean;
  setAtsMode: (value: boolean) => void;
  downloadBackup: () => void;
  recordExport?: (format: string) => void;
  activePageCount: number;
  reviewIssues: ResumeReviewIssue[];
  applyDesignPatch: (patch: Partial<ReturnType<typeof parseFrontmatter>["frontmatter"]>) => void;
  setMarkdown: (markdown: string) => void;
}

type ExportAction = [label: string, description: string, action: () => void | Promise<void>, enabled: boolean];

export const ExportCenter = ({ resume, renderedHtml, style, template, atsMode, setAtsMode, downloadBackup, recordExport, activePageCount, reviewIssues, applyDesignPatch, setMarkdown }: ExportCenterProps) => {
  const [status, setStatus] = useState("");
  const preExportIssues = reviewIssues.filter((issue) => issue.location === "Pre-export check" || issue.priority === "must-fix");
  const runExport = async (label: string, action: () => void | Promise<void>, shouldRecord = true) => {
    try {
      await action();
      if (shouldRecord) recordExport?.(label);
      setStatus(label === "Print / Save as PDF"
        ? "Print dialog opened. Choose Save as PDF, then check page size, margins, and page breaks before sending."
        : shouldRecord ? `${label} ready. If your browser blocked a download, allow downloads for this site and retry.` : `${label} applied.`);
    } catch (error) {
      setStatus(`${label} failed: ${error instanceof Error ? error.message : "Unknown export error"}`);
    }
  };
  return (
    <div className="workflow-panel export-panel">
      <section className="recommended-export">
        <div>
          <h2>Print / Save as PDF</h2>
          <p>This opens your browser's print dialog. Choose "Save as PDF," then check page size, margins, and page breaks before sending.</p>
          <p className="beta-inline-note">Public beta note: check page breaks, margins, and formatting before sending exported files.</p>
          <p className="beta-inline-note">Guidance only. Resume Studio does not guarantee ATS results, interviews, or job offers.</p>
          <p className="muted">Browser output may vary slightly between Chrome, Safari, Edge, and Firefox.</p>
        </div>
        <div className="inline-actions">
          <Button className="primary" onClick={() => runExport("Print / Save as PDF", () => printPdf(resume.pageSize))}><FileDown size={16} /> Print / Save as PDF</Button>
        </div>
      </section>
      {status && <p className="status-note" role="status">{status}</p>}
      {preExportIssues.length > 0 && (
        <section className="pre-export-warning" aria-label="Pre-export warnings">
          <h3>Fix before exporting</h3>
          <p>Resolve these items before sending this resume to an employer.</p>
          <ul>
            {preExportIssues.slice(0, 4).map((issue) => <li key={issue.id}><strong>{issue.title}</strong><span>{issue.suggestedFix}</span></li>)}
          </ul>
        </section>
      )}
      <section className="export-settings">
        <h3>Export settings</h3>
        <p className="muted">Template, color, font, and page size live in the Design panel.</p>
        <label><input type="checkbox" checked={atsMode} onChange={(event) => setAtsMode(event.target.checked)} /> ATS-safe mode</label>
        <span className={`risk-pill risk-${template.atsRisk}`}>{template.atsRisk} ATS risk</span>
      </section>
      <FitAssistant resume={resume} template={template} activePageCount={activePageCount} applyDesignPatch={applyDesignPatch} setMarkdown={setMarkdown} runExport={runExport} />
      <section className="format-list">
        <h3>Secondary formats</h3>
        {([
          ["DOCX", "Implemented. Editable Word document for recruiters or internal reviews.", () => exportDocx(resume), true],
          ["Resume Studio JSON", "Complete portable resume file with Markdown, settings, versions, jobs, and private notes.", () => exportResumeForgeJson(resume), true],
          ["Markdown", "Useful for editing, versioning, and backups.", () => exportMarkdown(resume), true],
          ["Plain text", "Useful for job application portals and ATS paste fields.", () => exportPlainText(resume), true],
          ["HTML", "Standalone rendered resume page.", () => exportHtml(resume, renderedHtml, style), true],
          ["JSON Resume", "Standards-oriented resume data for other resume tools.", () => exportJsonResume(resume), true],
          ["YAML", "Experimental JSON Resume-style YAML. Markdown remains the source of truth.", () => exportYaml(resume), true],
        ] satisfies ExportAction[]).map(([label, description, action, enabled]) => (
          <article key={label}>
            <div><strong>{label}</strong><p>{description}</p></div>
            <Button disabled={!enabled} onClick={() => runExport(label, action)}>{enabled ? "Export" : "Unavailable"}</Button>
          </article>
        ))}
      </section>
      <section className="copy-actions">
        <h3>Copy</h3>
        <p className="export-backup-note">Before sending this resume out, consider downloading a backup. Your work is saved locally in this browser only.</p>
        <Button onClick={() => runExport("Markdown copied", () => writeClipboard(resume.markdown))}><Copy size={16} /> Copy Markdown</Button>
        <Button onClick={() => runExport("Plain text copied", () => writeClipboard(renderMarkdown(resume.markdown, true).plainText))}><Clipboard size={16} /> Copy plain text for forms</Button>
        <Button onClick={() => runExport("Backup", () => downloadBackup())}><Archive size={16} /> Download backup</Button>
      </section>
    </div>
  );
};

export const documentStyle = (_templateId: string) => `.resume-page{font-family:Arial,sans-serif;color:#111}.resume-content h1{text-align:center}.page-break{break-before:page}`;

const FitAssistant = ({ resume, template, activePageCount, applyDesignPatch, setMarkdown, runExport }: {
  resume: ResumeDocument;
  template: ResumeTemplate;
  activePageCount: number;
  applyDesignPatch: (patch: Partial<ReturnType<typeof parseFrontmatter>["frontmatter"]>) => void;
  setMarkdown: (markdown: string) => void;
  runExport: (label: string, action: () => void | Promise<void>, shouldRecord?: boolean) => Promise<void>;
}) => {
  const rendered = renderMarkdown(resume.markdown, true);
  const parsed = parseFrontmatter(resume.markdown);
  const bullets = parsed.content.split("\n").filter((line) => /^\s*[-*•]\s+/.test(line));
  const longBullets = bullets.filter((line) => line.length > 190);
  const wordCount = rendered.plainText.split(/\s+/).filter(Boolean).length;
  const paragraphCount = rendered.plainText.split("\n").filter((line) => line.length > 260).length;
  const shouldAssist = activePageCount > 1 || wordCount > 820 || longBullets.length > 2 || paragraphCount > 0;
  const compactPatch = {
    fontSizePx: Math.max(10, (rendered.frontmatter.fontSizePx ?? template.fontSize) - 1),
    lineHeight: Math.max(1.18, Math.min(rendered.frontmatter.lineHeight ?? template.lineHeight, 1.28)),
    marginHorizontalPx: Math.max(42, Math.min(rendered.frontmatter.marginHorizontalPx ?? template.margin, 54)),
    marginVerticalPx: Math.max(42, Math.min(rendered.frontmatter.marginVerticalPx ?? template.margin, 54)),
    paragraphSpacingPx: Math.max(2, Math.min(rendered.frontmatter.paragraphSpacingPx ?? 4, 3)),
  };
  const trimLongestBullets = () => {
    const longSet = new Set(longBullets.slice(0, 4));
    const next = resume.markdown.split("\n").map((line) => {
      if (!longSet.has(line)) return line;
      return `${line.slice(0, 176).replace(/[ ,;:-]+$/g, "")}. [trim for relevance]`;
    }).join("\n");
    setMarkdown(next);
  };

  return (
    <section className={`fit-assistant ${shouldAssist ? "needs-fit" : ""}`}>
      <div>
        <h3><Minimize2 size={16} /> Fit assistant</h3>
        <p>{shouldAssist ? "This resume may benefit from fitting before export." : "This resume looks reasonably balanced for the current page target."}</p>
      </div>
      <div className="fit-metrics">
        <span><strong>{activePageCount}</strong> pages</span>
        <span><strong>{wordCount}</strong> words</span>
        <span><strong>{bullets.length}</strong> bullets</span>
        <span><strong>{longBullets.length}</strong> long bullets</span>
      </div>
      <div className="fit-actions">
        <Button onClick={() => runExport("Compact spacing", () => applyDesignPatch(compactPatch), false)}>Apply compact spacing</Button>
        <Button disabled={!longBullets.length} onClick={() => runExport("Trim markers", trimLongestBullets, false)}>Mark longest bullets</Button>
        <Button onClick={() => runExport("ATS-safe mode", () => applyDesignPatch({ template: "ats-classic" }), false)}>Use ATS Classic</Button>
      </div>
      <p className="muted">Fit changes are conservative. Review marked bullets before exporting; never remove verified impact just to hit one page.</p>
    </section>
  );
};
