import { useEffect, useRef, useState } from "react";
import { ArrowRight, Download, LayoutTemplate, Upload, X } from "lucide-react";
import type { FeedbackRecord } from "../../lib/types";
import type { FeedbackType, ImportDraft, RenameDraft, RestoreDraft, SaveVersionDraft } from "../../app/types";
import { nowIso, uid, formatDate } from "../../lib/utils";
import { validateBackup } from "../../lib/storage";
import { buildImportDraft } from "../../app/resumeTransforms";
import { buildImportDraftFromFile } from "../../app/importers";
import { Button } from "../common/Button";

export const FeedbackModal = ({ onClose, setToast }: { onClose: () => void; setToast: (value: string) => void }) => {
  const [type, setType] = useState<FeedbackType>("bug");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const submit = () => {
    const record: FeedbackRecord = { id: uid("feedback"), type, message, email: email || undefined, createdAt: nowIso(), source: "mailto" };
    const subject = encodeURIComponent(`Resume Studio feedback: ${type}`);
    const body = encodeURIComponent(`${message}\n\nOptional email: ${email || "not provided"}\n\nLocal record:\n${JSON.stringify(record, null, 2)}`);
    window.location.href = `mailto:feedback@example.com?subject=${subject}&body=${body}`;
    setToast("Feedback email opened");
    onClose();
  };
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Send feedback">
      <section className="modal-card">
        <header><h2>Send feedback</h2><button className="icon-btn" onClick={onClose} aria-label="Close feedback"><X size={18} /></button></header>
        <label>Type<select value={type} onChange={(event) => setType(event.target.value as FeedbackType)}><option value="bug">Bug</option><option value="feature">Feature request</option><option value="confusing-ux">Confusing UX</option><option value="export-issue">Export issue</option><option value="other">Other</option></select></label>
        <label>What happened?<textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Tell us what felt broken, confusing, or useful." /></label>
        <label>Optional email<input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
        <p className="muted">No account required. This static beta opens your email client instead of sending data to a backend.</p>
        <div className="inline-actions"><Button onClick={onClose}>Cancel</Button><Button className="primary" disabled={!message.trim()} onClick={submit}>Open email draft</Button></div>
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
  onTemplate: () => void;
  onImport: () => void;
  onClose: () => void;
}) => {
  const firstOptionRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

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
            <h2>New resume</h2>
            <p>Choose the fastest way to begin.</p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close new resume"><X size={18} /></button>
        </header>
        <div className="new-resume-options">
          <Button ref={firstOptionRef} className="new-resume-option" onClick={onTemplate}>
            <LayoutTemplate size={20} />
            <span><strong>Start from a template</strong><small>Use a structured, editable resume with the core sections already in place.</small></span>
            <ArrowRight className="new-resume-option-arrow" size={18} />
          </Button>
          <Button className="new-resume-option" onClick={onImport}>
            <Upload size={18} />
            <span><strong>Import existing resume</strong><small>Paste your resume or upload a file. Supports DOCX, PDF, Markdown, TXT, JSON, and YAML.</small></span>
            <ArrowRight className="new-resume-option-arrow" size={18} />
          </Button>
        </div>
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
      <p>Review this backup file before restoring. Merge is safer because it keeps your current workspace and adds restored resumes as copies.</p>
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
      {draft.mode === "replace" && <p className="status-note error">Replace will overwrite everything currently saved in this browser. Download the current workspace first if you may need it later.</p>}
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
      <p>Your resumes are saved in this browser. Clearing local data removes resumes, versions, jobs, and settings from this browser.</p>
      <p>Download a backup file first if you want a copy you can restore later.</p>
      <div className="inline-actions">
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={onBackup}><Download size={15} /> Download backup first</Button>
        <Button className="danger" onClick={onConfirm}>Clear local data</Button>
      </div>
    </section>
  </div>
);
