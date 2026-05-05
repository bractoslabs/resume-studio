import { Copy, Download, FileCheck2, FileDown, MoreHorizontal, Pencil, Plus, Save, Search, Trash2, Upload } from "lucide-react";
import type { ResumeDocument } from "../../lib/types";
import { analyzeAts } from "../../lib/ats";
import { getTemplate } from "../../lib/templates";
import { formatDate } from "../../lib/utils";
import { renderMarkdown } from "../../lib/markdown";
import { exportMarkdown } from "../../lib/exporters";
import { Button } from "../common/Button";
import { pageCountEstimate, resumeChecklist, scoreTone, timeOnly } from "../../app/resumeTransforms";

export const Dashboard = ({
  resumes,
  query,
  setQuery,
  sort,
  setSort,
  totalResumeCount,
  lastBackupAt,
  backupRecommended,
  selectResume,
  reviewResume,
  deleteResume,
  duplicateResume,
  renameResume,
  openNewResume,
  downloadBackup,
  openRestorePreview,
}: {
  resumes: ResumeDocument[];
  query: string;
  setQuery: (value: string) => void;
  sort: string;
  setSort: (value: string) => void;
  totalResumeCount: number;
  lastBackupAt?: string;
  backupRecommended: boolean;
  selectResume: (id: string) => void;
  reviewResume: (id: string) => void;
  deleteResume: (resume: ResumeDocument) => void;
  duplicateResume: (resume: ResumeDocument) => void;
  renameResume: (resume: ResumeDocument) => void;
  openNewResume: () => void;
  downloadBackup: () => void;
  openRestorePreview: (file: File) => Promise<void>;
}) => {
  const userResumes = resumes;
  const hasResumes = totalResumeCount > 0;
  return (
    <div className="dashboard-page">
      <header className="page-header">
        <div>
          <h1>Your resume workspace</h1>
          <p>Create, improve, and export resumes that stay saved in this browser.</p>
        </div>
        <div className="page-actions">
          <Button className="primary" onClick={openNewResume}>
            <Plus size={16} /> New resume
          </Button>
        </div>
      </header>

      <section className="local-save-strip" aria-label="Local save and backup status">
        <div>
          <p>
            <Save size={15} />{" "}
            {lastBackupAt
              ? `Saved locally · Last backup: ${formatDate(lastBackupAt)} at ${timeOnly(lastBackupAt)}`
              : backupRecommended
                ? "Saved locally · Backup recommended"
                : "Saved locally"}
          </p>
          <span>Your resumes are saved in this browser. Download a backup before switching devices or clearing browser data.</span>
        </div>
        <div className="local-save-actions">
          <Button onClick={() => downloadBackup()} disabled={!hasResumes}>
            <Download size={15} /> Download backup
          </Button>
          <label className="btn quiet-btn">
            <Upload size={15} /> Restore
            <input
              type="file"
              accept="application/json"
              hidden
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                await openRestorePreview(file);
              }}
            />
          </label>
        </div>
      </section>

      <section className="onboarding-card" aria-label="Resume workflow">
        {[
          ["1", "Build or import", "Start from a structured template or bring in an existing resume."],
          ["2", "Choose design", "Pick an ATS-friendly layout and adjust spacing only when needed."],
          ["3", "Review content", "Check structure, readability, bullets, sections, and missing details."],
          ["4", "Print / Save as PDF", "Open the browser print dialog, choose Save as PDF, and check page breaks."],
        ].map(([step, title, body]) => (
          <article key={step}>
            <span>{step}</span>
            <strong>{title}</strong>
            <p>{body}</p>
          </article>
        ))}
      </section>

      {hasResumes && (
        <div className="dashboard-tools">
          <label className="search">
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, role, or tags" />
          </label>
          <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort resumes">
            <option value="updated">Last edited</option>
            <option value="title">Title</option>
            <option value="role">Target role</option>
            <option value="score">Review score</option>
          </select>
        </div>
      )}

      {!hasResumes ? (
        <section className="empty-state dashboard-empty-state">
          <h2>No resumes yet</h2>
          <p>Start from a structured template or import an existing resume.</p>
          <div className="inline-actions">
            <Button className="primary" onClick={openNewResume}>
              <Plus size={16} /> New resume
            </Button>
          </div>
        </section>
      ) : userResumes.length === 0 ? (
        <section className="empty-state dashboard-empty-state">
          <h2>No matching resumes</h2>
          <p>Try a different search or sort option.</p>
        </section>
      ) : (
        <>
          <h2 className="section-title">Resumes</h2>
          <section className="resume-grid refined-grid">
            {userResumes.map((resume) => {
              const report = analyzeAts(resume.markdown);
              const plain = renderMarkdown(resume.markdown, true).plainText;
              const progress = resumeChecklist(resume, report);
              const done = progress.filter((item) => item.done).length;
              return (
                <article className="resume-card refined-card" key={resume.id}>
                  <div className="resume-card-head">
                    <div>
                      <div className="resume-title-row">
                        <h2>{resume.title}</h2>
                        <button
                          className="icon-btn subtle-icon-btn"
                          onClick={() => renameResume(resume)}
                          aria-label={`Rename ${resume.title}`}
                          title="Rename resume"
                        >
                          <Pencil size={15} />
                        </button>
                      </div>
                      <p>{resume.targetRole || "No target role set"}</p>
                    </div>
                    <span className={`score-chip ${scoreTone(report.scores.overall)}`}>
                      {done}/{progress.length} reviewed
                    </span>
                  </div>
                  <div className="card-meta">
                    <span>Last edited {formatDate(resume.updatedAt)}</span>
                    <span>{getTemplate(resume.templateId).name}</span>
                    {resume.lastExportedAt && (
                      <span>
                        Last exported {formatDate(resume.lastExportedAt)}
                        {resume.lastExportedFormat ? ` (${resume.lastExportedFormat})` : ""}
                      </span>
                    )}
                    <span>{pageCountEstimate(plain)} page est.</span>
                  </div>
                  <div className="mini-progress">
                    <span style={{ width: `${Math.round((done / progress.length) * 100)}%` }} />
                    <strong>
                      {done}/{progress.length} checklist
                    </strong>
                  </div>
                  <div className="tags">
                    {resume.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                  <div className="card-actions resume-card-actions">
                    <Button className="primary" onClick={() => selectResume(resume.id)}>
                      Open
                    </Button>
                    <Button onClick={() => reviewResume(resume.id)}>
                      <FileCheck2 size={16} /> Review
                    </Button>
                    <Button onClick={() => exportMarkdown(resume)}>
                      <FileDown size={16} /> Export
                    </Button>
                    <details className="resume-more-menu">
                      <summary aria-label={`More actions for ${resume.title}`} title="More actions">
                        <MoreHorizontal size={18} />
                      </summary>
                      <div>
                        <button onClick={() => renameResume(resume)}>
                          <Pencil size={15} /> Rename
                        </button>
                        <button onClick={() => duplicateResume(resume)}>
                          <Copy size={15} /> Duplicate
                        </button>
                        <button onClick={() => exportMarkdown(resume)}>
                          <FileDown size={15} /> Export copy
                        </button>
                        <button className="danger" onClick={() => deleteResume(resume)}>
                          <Trash2 size={15} /> Delete
                        </button>
                      </div>
                    </details>
                  </div>
                </article>
              );
            })}
          </section>
        </>
      )}
    </div>
  );
};
