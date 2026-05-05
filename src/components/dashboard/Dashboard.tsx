import { Check, Copy, FolderOpen, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useState } from "react";
import type { ResumeDocument } from "../../lib/types";
import { analyzeAts } from "../../lib/ats";
import { getTemplate } from "../../lib/templates";
import { formatDate } from "../../lib/utils";
import { renderMarkdown } from "../../lib/markdown";
import { Button } from "../common/Button";
import { pageCountEstimate, resumeChecklist, scoreTone } from "../../app/resumeTransforms";

export const Dashboard = ({
  resumes,
  query,
  setQuery,
  sort,
  setSort,
  totalResumeCount,
  selectResume,
  deleteResume,
  duplicateResume,
  renameResume,
  openNewResume,
}: {
  resumes: ResumeDocument[];
  query: string;
  setQuery: (value: string) => void;
  sort: string;
  setSort: (value: string) => void;
  totalResumeCount: number;
  selectResume: (id: string) => void;
  deleteResume: (resume: ResumeDocument) => void;
  duplicateResume: (resume: ResumeDocument) => void;
  renameResume: (resume: ResumeDocument, title: string) => void;
  openNewResume: () => void;
}) => {
  const userResumes = resumes;
  const hasResumes = totalResumeCount > 0;
  const [editingResumeId, setEditingResumeId] = useState("");
  const [draftTitle, setDraftTitle] = useState("");
  const beginRename = (resume: ResumeDocument) => {
    setEditingResumeId(resume.id);
    setDraftTitle(resume.title);
  };
  const cancelRename = () => {
    setEditingResumeId("");
    setDraftTitle("");
  };
  const saveRename = (resume: ResumeDocument) => {
    const title = draftTitle.trim();
    if (title && title !== resume.title) renameResume(resume, title);
    cancelRename();
  };

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

      <section className="onboarding-card" aria-label="Resume workflow">
        {[
          ["1", "Create your resume", "Start a new resume or continue one you already saved."],
          ["2", "Add your details", "Write your experience, skills, education, and projects in the format you prefer."],
          ["3", "Improve the content", "Check structure, keywords, readability, and fit for the roles you want."],
          ["4", "Save and send", "Download a backup, then export your resume or save it as a PDF."],
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
                        {editingResumeId === resume.id ? (
                          <form
                            className="resume-title-edit"
                            onSubmit={(event) => {
                              event.preventDefault();
                              saveRename(resume);
                            }}
                          >
                            <input
                              value={draftTitle}
                              onChange={(event) => setDraftTitle(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault();
                                  saveRename(resume);
                                }
                                if (event.key === "Escape") cancelRename();
                              }}
                              aria-label={`New title for ${resume.title}`}
                              autoFocus
                            />
                            <button className="icon-btn" type="submit" aria-label="Save resume title" title="Save title">
                              <Check size={15} />
                            </button>
                            <button className="icon-btn" type="button" onClick={cancelRename} aria-label="Cancel rename" title="Cancel">
                              <X size={15} />
                            </button>
                          </form>
                        ) : (
                          <>
                            <h2>{resume.title}</h2>
                            <button
                              className="icon-btn subtle-icon-btn"
                              onClick={() => beginRename(resume)}
                              aria-label={`Rename ${resume.title}`}
                              title="Rename resume"
                            >
                              <Pencil size={15} />
                            </button>
                          </>
                        )}
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
                      <FolderOpen size={16} /> Open
                    </Button>
                    <Button onClick={() => duplicateResume(resume)}>
                      <Copy size={16} /> Duplicate
                    </Button>
                    <Button className="danger" onClick={() => deleteResume(resume)}>
                      <Trash2 size={16} /> Delete
                    </Button>
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
