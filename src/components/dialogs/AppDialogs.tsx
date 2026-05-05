import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Download, FileCheck2, FileDown, LayoutTemplate, Upload, X } from "lucide-react";
import type { ImportDraft, NewResumeSetup, RenameDraft, RestoreDraft, SaveVersionDraft } from "../../app/types";
import { formatDate } from "../../lib/utils";
import { validateBackup } from "../../lib/storage";
import { buildImportDraft } from "../../app/resumeTransforms";
import { buildImportDraftFromFile } from "../../app/importers";
import { Button } from "../common/Button";

const feedbackDestinations = [
  { label: "Report a bug", href: "https://github.com/bractoslabs/resume-studio/issues/new?template=bug_report.yml", primary: true },
  { label: "Request a feature", href: "https://github.com/bractoslabs/resume-studio/issues/new?template=feature_request.yml" },
  { label: "Report an export/PDF issue", href: "https://github.com/bractoslabs/resume-studio/issues/new?template=export_issue.yml" },
  { label: "Report an import issue", href: "https://github.com/bractoslabs/resume-studio/issues/new?template=import_issue.yml" },
];

export const FeedbackModal = ({ onClose, setToast }: { onClose: () => void; setToast: (value: string) => void }) => {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Send feedback">
      <section className="modal-card feedback-modal-card">
        <header>
          <div>
            <h2>Send feedback</h2>
            <p>Resume Studio is in public beta. GitHub Issues are the best place to report bugs, request features, or share export/import problems. If your feedback includes private resume details, email us instead.</p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close feedback"><X size={18} /></button>
        </header>
        <div className="feedback-actions">
          {feedbackDestinations.map((destination) => (
            <a key={destination.href} className={`btn ${destination.primary ? "primary" : ""}`} href={destination.href} target="_blank" rel="noopener noreferrer">
              {destination.label}
            </a>
          ))}
          <a className="btn" href="mailto:labs@bractos.com?subject=Resume%20Studio%20Feedback" onClick={() => setToast("Feedback email opened")}>Email Bractos Labs</a>
        </div>
        <p className="feedback-privacy-note">Please do not post private resume content, personal contact information, or sensitive job-search details in a public GitHub issue.</p>
        <div className="inline-actions"><Button onClick={onClose}>Close</Button></div>
      </section>
    </div>
  );
};

export const ImportModal = ({ draft, error, setDraft, setError, onCreate, onClose }: { draft: ImportDraft | null; error: string; setDraft: (draft: ImportDraft | null) => void; setError: (value: string) => void; onCreate: () => void; onClose: () => void }) => {
  const [text, setText] = useState("");
  const [isReadingFile, setIsReadingFile] = useState(false);
  const analyze = (fileName = "pasted-resume.txt", source = text) => {
    try {
      const backupPreview = validateBackup(source);
      if (backupPreview.valid) {
        setError("This looks like a Resume Studio backup file. Restore it from Settings > Data & Privacy.");
        setDraft(null);
        return;
      }
      setDraft(buildImportDraft(fileName, source));
      setError("");
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Could not parse import");
    }
  };
  const analyzeFile = async (file: File | undefined) => {
    if (!file) return;
    setIsReadingFile(true);
    try {
      setDraft(await buildImportDraftFromFile(file));
      setError("");
    } catch (importError) {
      setDraft(null);
      setError(importError instanceof Error ? importError.message : "Could not parse import");
    } finally {
      setIsReadingFile(false);
    }
  };
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Import resume">
      <section className="modal-card import-modal-card">
        <header>
          <div>
            <h2>Import resume</h2>
            <p>Paste text or upload a resume file.</p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close import"><X size={18} /></button>
        </header>
        <div className="import-grid">
          <section className="import-choice-card">
            <h3>Paste</h3>
            <textarea id="resume-import-text" aria-label="Resume import text" value={text} onChange={(event) => setText(event.target.value)} placeholder="Paste resume text or Markdown..." />
            <Button disabled={!text.trim()} onClick={() => analyze()}>Preview import</Button>
          </section>
          <section className="import-choice-card upload-card">
            <Upload size={22} />
            <h3>Upload</h3>
            <p>DOCX, PDF, Markdown, TXT, JSON, or YAML.</p>
            <label className="btn import-upload-btn">{isReadingFile ? "Reading file..." : "Choose file"}<input type="file" accept=".doc,.docx,.pdf,.md,.markdown,.txt,.json,.yaml,.yml,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" hidden onChange={async (event) => {
              await analyzeFile(event.target.files?.[0]);
              event.currentTarget.value = "";
            }} /></label>
          </section>
        </div>
        <p className="import-note">PDF import works best with selectable text. Scanned PDFs may need OCR first.</p>
        {error && <p className="status-note error">{error}</p>}
        {draft && (
          <section className="import-review">
            <div className="import-review-head">
              <div>
                <h3>Ready to import</h3>
                <p>{draft.sections.length ? draft.sections.join(", ") : "No standard sections detected"} · {draft.confidence}% confidence</p>
              </div>
              <Button className="primary" onClick={onCreate}>Create resume</Button>
            </div>
            <div className="import-review-grid">
              <section className="import-review-panel">
                <h4>Detected contact</h4>
                <dl className="import-review-details">
                  <div><dt>Name</dt><dd>{draft.review.contact.name || "Not detected"}</dd></div>
                  <div><dt>Title</dt><dd>{draft.review.contact.title || "Not detected"}</dd></div>
                  <div><dt>Email</dt><dd>{draft.review.contact.email || "Not detected"}</dd></div>
                  <div><dt>Phone</dt><dd>{draft.review.contact.phone || "Not detected"}</dd></div>
                  <div><dt>Location</dt><dd>{draft.review.contact.location || "Not detected"}</dd></div>
                </dl>
              </section>
              <section className="import-review-panel">
                <h4>Parsed content</h4>
                <dl className="import-review-details">
                  <div><dt>Sections</dt><dd>{draft.sections.length ? draft.sections.join(", ") : "None"}</dd></div>
                  <div><dt>Bullets</dt><dd>{draft.review.bulletCount}</dd></div>
                  <div><dt>Confidence</dt><dd>{draft.confidence}%</dd></div>
                </dl>
              </section>
            </div>
            <div className="import-review-grid">
              <section className="import-review-panel">
                <h4>Cleanups applied</h4>
                {draft.review.repairedFields.length ? (
                  <ul className="import-review-list">{draft.review.repairedFields.map((field) => <li key={field}>{field}</li>)}</ul>
                ) : <p>No automatic cleanup was needed.</p>}
              </section>
              <section className="import-review-panel">
                <h4>Needs review</h4>
                {draft.review.ignoredFields.length ? (
                  <ul className="import-review-list">{draft.review.ignoredFields.map((field) => <li key={field}>{field}</li>)}</ul>
                ) : <p>No missing import fields detected.</p>}
              </section>
            </div>
            <details>
              <summary>Edit imported Markdown</summary>
              <textarea aria-label="Clean imported Markdown" value={draft.markdown} onChange={(event) => setDraft({ ...draft, markdown: event.target.value })} />
            </details>
          </section>
        )}
      </section>
    </div>
  );
};

export const NewResumeDialog = ({
  onTemplate,
  onImport,
  onClose,
}: {
  onTemplate: (setup: NewResumeSetup) => void;
  onImport: () => void;
  onClose: () => void;
}) => {
  const [step, setStep] = useState<"start" | "details">("start");
  const [setup, setSetup] = useState<NewResumeSetup>({
    startMode: "guided",
    resumeTitle: "",
    name: "",
    targetRole: "",
    email: "",
    phone: "",
    location: "",
    templateId: "ats-classic",
  });
  const firstOptionRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const canCreate = Boolean(setup.name.trim() || setup.resumeTitle.trim() || setup.targetRole.trim());
  const updateSetup = (patch: Partial<NewResumeSetup>) => setSetup((current) => ({ ...current, ...patch }));
  const chooseStartMode = (startMode: NewResumeSetup["startMode"]) => {
    updateSetup({ startMode, templateId: startMode === "template" ? "technical" : setup.templateId });
    setStep("details");
  };

  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    firstOptionRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previouslyFocusedRef.current?.focus();
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Create new resume">
      <section className="modal-card new-resume-card">
        <header>
          <div>
            <h2>{step === "start" ? "New resume" : "Set up your resume"}</h2>
            <p>{step === "start" ? "Choose the fastest way to begin." : "Add the basics now so Review and Export have a stronger starting point."}</p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close new resume"><X size={18} /></button>
        </header>
        {step === "start" ? (
          <div className="new-resume-options">
            <Button ref={firstOptionRef} className="new-resume-option" onClick={() => chooseStartMode("guided")}>
              <FileCheck2 size={20} />
              <span><strong>Guided setup</strong><small>Start with a form-based draft, then run Review and use Print / Save as PDF.</small></span>
              <ArrowRight className="new-resume-option-arrow" size={18} />
            </Button>
            <Button className="new-resume-option" onClick={() => chooseStartMode("template")}>
              <LayoutTemplate size={20} />
              <span><strong>Markdown template</strong><small>Use a structured Markdown resume with the core sections already in place.</small></span>
              <ArrowRight className="new-resume-option-arrow" size={18} />
            </Button>
            <Button className="new-resume-option" onClick={onImport}>
              <Upload size={18} />
              <span><strong>Import existing resume</strong><small>Paste your resume or upload a file. Supports DOCX, PDF, Markdown, TXT, JSON, and YAML.</small></span>
              <ArrowRight className="new-resume-option-arrow" size={18} />
            </Button>
          </div>
        ) : (
          <div className="setup-flow">
            <div className="setup-progress" aria-label="Setup path">
              <span className="done"><CheckCircle2 size={14} /> Start</span>
              <span className="active">Basics</span>
              <span>Review</span>
              <span>Export</span>
            </div>
            <div className="setup-grid">
              <section className="setup-fields">
                <label>Resume name<input autoFocus value={setup.resumeTitle} onChange={(event) => updateSetup({ resumeTitle: event.target.value })} placeholder="Product Manager Resume" /></label>
                <div className="form-grid two">
                  <label>Your name<input value={setup.name} onChange={(event) => updateSetup({ name: event.target.value })} placeholder="Jordan Lee" /></label>
                  <label>Target role<input value={setup.targetRole} onChange={(event) => updateSetup({ targetRole: event.target.value })} placeholder="Senior Product Manager" /></label>
                </div>
                <div className="form-grid two">
                  <label>Email<input value={setup.email} onChange={(event) => updateSetup({ email: event.target.value })} placeholder="you@example.com" /></label>
                  <label>Phone<input value={setup.phone} onChange={(event) => updateSetup({ phone: event.target.value })} placeholder="(555) 123-4567" /></label>
                </div>
                <label>Location<input value={setup.location} onChange={(event) => updateSetup({ location: event.target.value })} placeholder="City, State" /></label>
                <label>Starting template<select value={setup.templateId} onChange={(event) => updateSetup({ templateId: event.target.value as NewResumeSetup["templateId"] })}>
                  <option value="ats-classic">ATS Classic</option>
                  <option value="technical">Technical Resume</option>
                </select></label>
              </section>
              <aside className="setup-next-steps">
                <h3>After this</h3>
                <ol>
                  <li><strong>Complete the draft.</strong><span>{setup.startMode === "guided" ? "You will land in guided mode." : "You will land in Markdown mode."}</span></li>
                  <li><strong>Run Review.</strong><span>Fix must-fix items before sending.</span></li>
                  <li><strong>Print / Save as PDF.</strong><span>Open the browser print dialog when the review looks ready.</span></li>
                </ol>
              </aside>
            </div>
            <div className="modal-actions">
              <Button onClick={() => setStep("start")}><ArrowLeft size={15} /> Back</Button>
              <Button className="primary" disabled={!canCreate} onClick={() => onTemplate(setup)}><FileDown size={15} /> Create resume</Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export const ConfirmDialog = ({ title, body, confirmLabel, onCancel, onConfirm }: { title: string; body: string; confirmLabel: string; onCancel: () => void; onConfirm: () => void }) => (
  <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={title}>
    <section className="modal-card confirm-card">
      <h2>{title}</h2>
      <p>{body}</p>
      <div className="inline-actions"><Button onClick={onCancel}>Cancel</Button><Button className="danger" onClick={onConfirm}>{confirmLabel}</Button></div>
    </section>
  </div>
);

export const RenameResumeDialog = ({ draft, setDraft, onCancel, onSave }: { draft: RenameDraft; setDraft: (draft: RenameDraft | null) => void; onCancel: () => void; onSave: () => void }) => (
  <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Rename resume">
    <section className="modal-card confirm-card">
      <h2>Rename resume</h2>
      <label>Resume name<input autoFocus value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
      <div className="inline-actions"><Button onClick={onCancel}>Cancel</Button><Button className="primary" disabled={!draft.title.trim()} onClick={onSave}>Save name</Button></div>
    </section>
  </div>
);

export const SaveVersionDialog = ({ draft, setDraft, onCancel, onSave }: { draft: SaveVersionDraft; setDraft: (draft: SaveVersionDraft | null) => void; onCancel: () => void; onSave: () => void }) => (
  <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Save version">
    <section className="modal-card confirm-card">
      <h2>Save named version</h2>
      <label>Name<input autoFocus value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
      <label>Notes<textarea value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} placeholder="What changed in this version?" /></label>
      <div className="inline-actions"><Button onClick={onCancel}>Cancel</Button><Button className="primary" disabled={!draft.name.trim()} onClick={onSave}>Save version</Button></div>
    </section>
  </div>
);

export const RestoreBackupDialog = ({ draft, setDraft, onCancel, onSafetyBackup, onRestore }: { draft: RestoreDraft; setDraft: (draft: RestoreDraft) => void; onCancel: () => void; onSafetyBackup: () => void; onRestore: () => void }) => (
  <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Restore backup">
    <section className="modal-card confirm-card">
      <h2>Restore from backup</h2>
      <p>Review this backup file before restoring. Merge keeps the current workspace and adds restored resumes as copies. Replace removes the current resumes and app data saved in this browser, then loads the backup file.</p>
      <dl className="restore-preview">
        <div><dt>Resumes</dt><dd>{draft.preview.resumeCount}</dd></div>
        <div><dt>Jobs and applications</dt><dd>{draft.preview.jobCount}</dd></div>
        <div><dt>Versions</dt><dd>{draft.preview.versionCount}</dd></div>
        <div><dt>Backup date</dt><dd>{draft.preview.exportedAt ? formatDate(draft.preview.exportedAt) : "Unknown"}</dd></div>
      </dl>
      <fieldset className="restore-choice">
        <legend>Restore choice</legend>
        <label><input type="radio" checked={draft.mode === "merge"} onChange={() => setDraft({ ...draft, mode: "merge" })} /> Merge with current workspace</label>
        <label><input type="radio" checked={draft.mode === "replace"} onChange={() => setDraft({ ...draft, mode: "replace" })} /> Replace current workspace</label>
      </fieldset>
      {draft.mode === "merge" && <p className="status-note">Merge keeps your current local data and adds the backup contents as restored copies.</p>}
      {draft.mode === "replace" && <p className="status-note error">Replace removes the current local workspace in this browser. Resume Studio does not have a cloud copy. Download the current workspace first if you may need it later.</p>}
      <div className="inline-actions">
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={onSafetyBackup}><Download size={15} /> Download current workspace first</Button>
        <Button className="primary" onClick={onRestore}>Restore backup</Button>
      </div>
    </section>
  </div>
);

export const ClearLocalDataDialog = ({ onBackup, onCancel, onConfirm }: { onBackup: () => void; onCancel: () => void; onConfirm: () => void }) => (
  <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Clear local data">
    <section className="modal-card confirm-card">
      <h2>Clear local data?</h2>
      <p>This will remove resumes and app data saved in this browser. Resume Studio does not have a cloud copy. Download a backup first if you want to keep your work.</p>
      <div className="inline-actions">
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={onBackup}><Download size={15} /> Download backup first</Button>
        <Button className="danger" onClick={onConfirm}>Clear local data</Button>
      </div>
    </section>
  </div>
);
