import React from "react";
import { Check, Code, Download, FileDown, History, Palette, Plus, Printer, Save, ShieldCheck, Sparkles, StickyNote, X } from "lucide-react";
import type { AppState, PageSize, ResumeDocument, ResumeFrontmatter, ResumeTemplate, ResumeVersion, SimpleEntry, StructuredResume } from "../../lib/types";
import { analyzeAts } from "../../lib/ats";
import { defaultResumeMarkdown } from "../../lib/defaultDraft";
import { compareResumeToJob } from "../../lib/jobMatcher";
import type { ResumeReviewIssue, ResumeReviewResult } from "../../lib/resume-review";
import { parseFrontmatter, parseStructuredResume, renderMarkdown } from "../../lib/markdown";
import { printPdf } from "../../lib/exporters";
import type { EditMode, View, WorkflowTab } from "../../app/types";
import { englishFonts, snippets, themeColors } from "../../app/constants";
import { Button } from "../common/Button";
import { intelligenceScores, resumeChecklist, scoreTone, timeOnly } from "../../app/resumeTransforms";
import { nowIso, uid } from "../../lib/utils";
import { templates } from "../../lib/templates";
import { ReviewPanel } from "../review/ReviewPanel";
import { TailorPanel } from "../tailor/TailorPanel";
import { ExportCenter, documentStyle } from "../export/ExportCenter";
import { HistoryPanel } from "../history/HistoryPanel";
import { ResumePreview } from "../preview/ResumePreview";

type UpdateResume = (id: string, patch: Partial<ResumeDocument> | ((resume: ResumeDocument) => Partial<ResumeDocument>)) => void;
type DesignPatch = Partial<ReturnType<typeof parseFrontmatter>["frontmatter"]>;
type ZoomSetter = (value: number | ((value: number) => number)) => void;

interface EditorWorkspaceProps {
  resume: ResumeDocument;
  resumes: ResumeDocument[];
  rendered: ReturnType<typeof renderMarkdown>;
  template: ResumeTemplate;
  ats: ReturnType<typeof analyzeAts>;
  review: ResumeReviewResult;
  reviewIssues: ResumeReviewIssue[];
  jobDescription: string;
  setJobDescription: (value: string) => void;
  jobAnalyzed: boolean;
  setJobAnalyzed: (value: boolean) => void;
  jobMatch: ReturnType<typeof compareResumeToJob> | null;
  tab: WorkflowTab;
  setTab: (value: WorkflowTab) => void;
  editMode: EditMode;
  setEditMode: (value: EditMode) => void;
  structured: StructuredResume | null;
  setStructured: (value: StructuredResume) => void;
  setMarkdown: (markdown: string) => void;
  updateResume: UpdateResume;
  setView: (view: View) => void;
  selectResume: (id: string) => void;
  captureVersion: (name?: string, notes?: string) => void;
  createSystemSnapshot: (name: string, notes: string) => void;
  applyStructured: () => void;
  insertSnippet: (text: string) => void;
  editorRef: React.RefObject<HTMLTextAreaElement | null>;
  zoom: number;
  setZoom: ZoomSetter;
  atsMode: boolean;
  setAtsMode: (value: boolean) => void;
  activePageCount: number;
  checklist: ReturnType<typeof resumeChecklist>;
  intelligence: ReturnType<typeof intelligenceScores>;
  pageStyle: React.CSSProperties;
  saveStateText: string;
  lastSavedAt: string;
  saveFailed: string;
  downloadBackup: () => void;
  recordExport: (format: string) => void;
  applyDesignPatch: (patch: DesignPatch) => void;
  designOpen: boolean;
  setDesignOpen: (value: boolean) => void;
  saveJobTarget: (createVersion: boolean, termReview?: Record<string, "important" | "not-relevant" | "have" | "do-not-have">) => void;
  ignoredIssues: string[];
  setIgnoredIssues: (ids: string[]) => void;
  compareVersion?: ResumeVersion;
  versionCompareId: string;
  setVersionCompareId: (value: string) => void;
  state: AppState;
  openSaveVersion: () => void;
  openRestoreVersion: (version: ResumeVersion) => void;
}

interface EditPanelProps {
  resume: ResumeDocument;
  checklist: ReturnType<typeof resumeChecklist>;
  editMode: EditMode;
  setEditMode: (value: EditMode) => void;
  onChecklistSelect: (id: string) => void;
  structured: StructuredResume | null;
  setStructured: (value: StructuredResume) => void;
  setMarkdown: (markdown: string) => void;
  updateResume: UpdateResume;
  insertSnippet: (text: string) => void;
  applyStructured: () => void;
  editorRef: React.RefObject<HTMLTextAreaElement | null>;
}

interface PreviewToolbarProps {
  zoom: number;
  setZoom: ZoomSetter;
  atsMode: boolean;
  setAtsMode: (value: boolean) => void;
  pageSize: PageSize;
  applyDesignPatch: (patch: DesignPatch) => void;
  warnings: number;
  pageCount: number;
}

interface DesignDrawerProps {
  activeResume: ResumeDocument;
  template: ResumeTemplate;
  frontmatter: ResumeFrontmatter;
  applyDesignPatch: (patch: DesignPatch) => void;
  onClose: () => void;
}

interface RangeControlProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  suffix?: string;
  onChange: (value: number) => void;
}

interface SimpleEntryEditorProps {
  title: string;
  values: SimpleEntry[];
  onChange: (values: SimpleEntry[]) => void;
}

const contactFields = ["name", "title", "email", "phone", "location", "targetRole"] as const;

export const EditorWorkspace = (props: EditorWorkspaceProps) => {
  const {
    resume,
    resumes,
    rendered,
    template,
    ats,
    review,
    reviewIssues,
    jobDescription,
    setJobDescription,
    jobAnalyzed,
    setJobAnalyzed,
    jobMatch,
    tab,
    setTab,
    editMode,
    setEditMode,
    structured,
    setStructured,
    setMarkdown,
    updateResume,
    setView,
    selectResume,
    captureVersion,
    createSystemSnapshot,
    applyStructured,
    insertSnippet,
    editorRef,
    zoom,
    setZoom,
    atsMode,
    setAtsMode,
    activePageCount,
    checklist,
    intelligence,
    pageStyle,
    saveStateText,
    lastSavedAt,
    saveFailed,
    downloadBackup,
    recordExport,
    applyDesignPatch,
    designOpen,
    setDesignOpen,
    saveJobTarget,
    ignoredIssues,
    setIgnoredIssues,
    compareVersion,
    versionCompareId,
    setVersionCompareId,
    state,
    openSaveVersion,
    openRestoreVersion,
  } = props;

  return (
    <div className="editor-workspace">
      <header className="editor-topbar">
        <div className="document-switcher">
          <button className="link-button" onClick={() => setView("dashboard")}>All resumes</button>
          <select value={resume.id} onChange={(event) => selectResume(event.target.value)} aria-label="Switch resume">
            {resumes.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
        </div>
        <div className="document-status">
          <strong>{resume.title}</strong>
          <span className={`save-status ${saveFailed ? "failed" : ""}`} title="Resume Studio saves your work in this browser. If you clear site data or switch devices, your work may not come with you. Download a backup file for extra safety."><Save size={14} /> {saveStateText || (lastSavedAt ? `Saved locally at ${timeOnly(lastSavedAt)}` : "Saved locally")}</span>
          {state.storageMeta?.significantChangesSinceBackup && <button className="backup-chip" onClick={downloadBackup}>Backup recommended</button>}
          <span className={`score-chip ${scoreTone(ats.scores.overall)}`}>Review {ats.scores.overall}</span>
          <span className="meta-chip">{activePageCount} page{activePageCount > 1 ? "s" : ""}</span>
        </div>
        <div className="page-actions">
          <Button onClick={() => setDesignOpen(true)}><Palette size={16} /> Design</Button>
          <Button onClick={() => {
            recordExport("PDF");
            printPdf(resume.pageSize);
          }}><Printer size={16} /> Print</Button>
          <Button className="primary" aria-label="Open export center" onClick={() => setTab("export")}><Download size={16} /> Export</Button>
        </div>
      </header>

      <nav className="workflow-tabs" aria-label="Resume workflow">
        {[
          ["edit", "Edit", Code],
          ["review", "Review", ShieldCheck],
          ["tailor", "Tailor", Sparkles],
          ["export", "Export", FileDown],
          ["notes", "Notes", StickyNote],
          ["history", "History", History],
        ].map(([key, label, Icon]) => (
          <button key={key as string} className={tab === key ? "active" : ""} onClick={() => setTab(key as WorkflowTab)}>
            <Icon size={16} /> {label as string}
          </button>
        ))}
      </nav>

      <section className="editor-layout">
        <section className="editor-main">
          {tab === "edit" && (
            <EditPanel
              resume={resume}
              checklist={checklist}
              editMode={editMode}
              setEditMode={setEditMode}
              onChecklistSelect={(id: string) => {
                const tabTargets: Record<string, WorkflowTab> = {
                  review: "review",
                  job: "tailor",
                  export: "export",
                  version: "history",
                };
                if (tabTargets[id]) {
                  setTab(tabTargets[id]);
                  return;
                }
                setEditMode("guided");
                window.setTimeout(() => {
                  document.querySelector(`[data-checklist-target="${id}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 0);
              }}
              structured={structured}
              setStructured={setStructured}
              setMarkdown={setMarkdown}
              updateResume={updateResume}
              insertSnippet={insertSnippet}
              applyStructured={applyStructured}
              editorRef={editorRef}
            />
          )}
          {tab === "review" && (
            <ReviewPanel
              ats={ats}
              review={review}
              intelligence={intelligence}
              issues={reviewIssues}
              markdown={resume.markdown}
              setMarkdown={setMarkdown}
              createSystemSnapshot={createSystemSnapshot}
              editSection={(section: string) => {
                setTab("edit");
                setEditMode("markdown");
                setTimeout(() => editorRef.current?.focus(), 0);
              }}
              ignoreIssue={(id: string) => setIgnoredIssues([...ignoredIssues, id])}
              onReviewed={() => updateResume(resume.id, { reviewMeta: { openedAt: resume.reviewMeta?.openedAt ?? nowIso(), lastReviewedAt: nowIso(), currentMustFixCount: review.groups.mustFix.length, noMustFixIssues: review.groups.mustFix.length === 0 } })}
            />
          )}
          {tab === "tailor" && (
            <TailorPanel
              value={jobDescription}
              setValue={setJobDescription}
              analyzed={jobAnalyzed}
              setAnalyzed={setJobAnalyzed}
              report={jobAnalyzed ? review.keywordMatch : null}
              onCreateVersion={(decisions: Record<string, "important" | "not-relevant" | "have" | "do-not-have">) => saveJobTarget(true, decisions)}
              onSaveTarget={(decisions: Record<string, "important" | "not-relevant" | "have" | "do-not-have">) => saveJobTarget(false, decisions)}
              resume={resume}
              updateResume={updateResume}
            />
          )}
          {tab === "export" && (
            <ExportCenter
              resume={resume}
              renderedHtml={rendered.html}
              style={documentStyle(template.id)}
              appState={state}
              template={template}
              atsMode={atsMode}
              setAtsMode={setAtsMode}
              downloadBackup={downloadBackup}
              recordExport={recordExport}
              activePageCount={activePageCount}
              applyDesignPatch={applyDesignPatch}
              setMarkdown={setMarkdown}
            />
          )}
          {tab === "notes" && (
            <NotesPanel
              resume={resume}
              updateResume={updateResume}
            />
          )}
          {tab === "history" && (
            <HistoryPanel
              resume={resume}
              compareVersion={compareVersion}
              compareId={versionCompareId}
              setCompareId={setVersionCompareId}
              captureVersion={captureVersion}
              openSaveVersion={openSaveVersion}
              restore={openRestoreVersion}
              duplicate={(version: ResumeVersion) => updateResume(resume.id, { versions: [{ ...version, id: uid("version"), name: `${version.name} copy`, createdAt: nowIso() }, ...resume.versions] })}
            />
          )}
        </section>

        <aside className="preview-column" aria-label="Live resume preview">
          <PreviewToolbar
            zoom={zoom}
            setZoom={setZoom}
            atsMode={atsMode}
            setAtsMode={setAtsMode}
            pageSize={resume.pageSize}
            applyDesignPatch={applyDesignPatch}
            warnings={rendered.warnings.length + reviewIssues.filter((issue) => issue.severity !== "info").length}
            pageCount={activePageCount}
          />
          <ResumePreview renderedHtml={rendered.html} pageStyle={pageStyle} templateId={template.id} pageSize={resume.pageSize} zoom={zoom} warnings={rendered.warnings.length + reviewIssues.filter((issue) => issue.severity !== "info").length} />
        </aside>
      </section>

      {designOpen && (
        <DesignDrawer
          activeResume={resume}
          template={template}
          frontmatter={rendered.frontmatter}
          applyDesignPatch={applyDesignPatch}
          onClose={() => setDesignOpen(false)}
        />
      )}
    </div>
  );
};

const NotesPanel = ({ resume, updateResume }: { resume: ResumeDocument; updateResume: UpdateResume }) => (
  <div className="workflow-panel notes-panel">
    <div className="panel-heading">
      <div>
        <h2>Private notes</h2>
        <p>Track job links, version intent, interview prep, salary notes, or follow-ups. These notes never appear in resume exports.</p>
      </div>
    </div>
    <section className="notes-card">
      <label>
        Notes for this resume
        <textarea
          value={resume.privateNotes ?? ""}
          onChange={(event) => updateResume(resume.id, { privateNotes: event.target.value })}
          placeholder={[
            "Example:",
            "- Target roles: VP Product, AI Platform Lead",
            "- Sent to: company, date, contact",
            "- Interview prep: stories to emphasize",
            "- Version notes: what changed and why",
          ].join("\n")}
        />
      </label>
      <p className="muted">Private notes are included only in full backups and Resume Studio JSON exports so you can restore your workspace. They are excluded from PDF, DOCX, Markdown, HTML, plain text, JSON Resume, and YAML exports.</p>
    </section>
  </div>
);

const EditPanel = ({ resume, checklist, editMode, setEditMode, onChecklistSelect, structured, setStructured, setMarkdown, updateResume, insertSnippet, applyStructured, editorRef }: EditPanelProps) => (
  <div className="workflow-panel edit-panel">
    <div className="panel-heading">
      <div>
        <h2>Edit resume</h2>
        <p>Markdown stays the source of truth. Use guided mode when you want a structured form.</p>
      </div>
      <div className="segmented" role="tablist" aria-label="Edit mode">
        <button className={editMode === "markdown" ? "active" : ""} onClick={() => setEditMode("markdown")}>Markdown</button>
        <button className={editMode === "guided" ? "active" : ""} onClick={() => setEditMode("guided")}>Guided</button>
      </div>
    </div>
    <ChecklistCard checklist={checklist} onSelect={onChecklistSelect} />
    <label className="title-field">
      Resume name
      <input value={resume.title} onChange={(event) => updateResume(resume.id, { title: event.target.value })} />
    </label>
    {editMode === "markdown" ? (
      <>
        <div className="snippet-bar refined-snippets">
          {snippets.map((snippet) => <button key={snippet.command} onClick={() => insertSnippet(snippet.text)}>{snippet.command}</button>)}
        </div>
        <textarea
          ref={editorRef}
          className="markdown-editor refined-editor"
          spellCheck={false}
          value={resume.markdown}
          onChange={(event) => setMarkdown(event.target.value)}
          aria-label="Markdown resume editor"
          placeholder={defaultResumeMarkdown}
        />
      </>
    ) : (
      <GuidedEditor structured={structured ?? parseStructuredResume(resume.markdown)} onChange={setStructured} onApply={applyStructured} />
    )}
  </div>
);

const PreviewToolbar = ({ zoom, setZoom, atsMode, setAtsMode, pageSize, applyDesignPatch, warnings, pageCount }: PreviewToolbarProps) => (
  <div className="preview-toolbar">
    <div>
      <strong>{pageSize.toUpperCase()}</strong>
      <span>{pageCount} page{pageCount > 1 ? "s" : ""}</span>
      <span>{warnings} review item{warnings === 1 ? "" : "s"}</span>
    </div>
    <div className="preview-controls">
      <button onClick={() => setZoom((z: number) => Math.max(0.55, z - 0.08))}>-</button>
      <button onClick={() => setZoom(0.92)}>Fit width</button>
      <button onClick={() => setZoom((z: number) => Math.min(1.25, z + 0.08))}>+</button>
      <select value={pageSize} onChange={(event) => applyDesignPatch({ pageSize: event.target.value as PageSize })} aria-label="Preview page size"><option value="letter">Letter</option><option value="a4">A4</option></select>
      <label><input type="checkbox" checked={atsMode} onChange={(event) => setAtsMode(event.target.checked)} /> ATS-safe</label>
      <span>{Math.round(zoom * 100)}%</span>
    </div>
  </div>
);

const templateFontPx = (item: ResumeTemplate) => Math.round(item.fontSize * 96 / 72 * 10) / 10;

const DesignDrawer = ({ activeResume, template, frontmatter, applyDesignPatch, onClose }: DesignDrawerProps) => {
  const accentColor = frontmatter.accentColor ?? template.accentColor;
  const selectedFont = frontmatter.font ?? template.fontFamily.split(",")[0].replaceAll("'", "");
  const applyTemplatePreset = (templateId: string) => {
    const next = templates.find((item) => item.id === templateId) ?? templates[0];
    applyDesignPatch({
      template: next.id,
      pageSize: next.pageSize,
      accentColor: next.accentColor,
      font: next.fontFamily.split(",")[0].replaceAll("'", ""),
      fontSizePx: templateFontPx(next),
      lineHeight: next.lineHeight,
      marginVerticalPx: Math.round(next.margin * 96),
      marginHorizontalPx: Math.round(next.margin * 96),
      paragraphSpacingPx: next.bulletSpacing === "airy" ? 7 : next.bulletSpacing === "compact" ? 4 : 5,
    });
  };

  return (
    <div className="drawer-backdrop" role="dialog" aria-modal="true" aria-label="Design controls">
      <aside className="design-drawer">
        <header>
          <div><h2>Design</h2><p>Choose a template, then tune the visual details for export.</p></div>
          <button className="icon-btn" onClick={onClose} aria-label="Close design drawer"><X size={18} /></button>
        </header>
        <div className="design-controls" aria-label="Resume design controls">
          <section className="design-group template-picker">
            <div className="design-section-heading">
              <h3>Template</h3>
              <span className={`risk-pill risk-${template.atsRisk}`}>{template.atsRisk} ATS risk</span>
            </div>
            <label>
              Resume template
              <select value={template.id} onChange={(event) => applyTemplatePreset(event.target.value)}>
                {templates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <div className="template-preview-card">
              <TemplateThumbnail template={template} />
              <div>
                <strong>{template.name}</strong>
                <p>{template.bestFor}</p>
              </div>
            </div>
          </section>

          <section className="design-group">
            <div className="design-section-heading"><h3>Color</h3></div>
            <div className="swatches">
              {themeColors.map((color) => (
                <button key={color} className={accentColor === color ? "selected" : ""} style={{ "--swatch": color } as React.CSSProperties} aria-label={`Use ${color}`} onClick={() => applyDesignPatch({ accentColor: color })} />
              ))}
            </div>
            <label className="color-input">
              <input type="color" value={accentColor} onChange={(event) => applyDesignPatch({ accentColor: event.target.value })} />
              <input value={accentColor} onChange={(event) => applyDesignPatch({ accentColor: event.target.value })} aria-label="Accent color hex" />
            </label>
          </section>

          <section className="design-group">
            <div className="design-section-heading"><h3>Typography</h3></div>
            <label>
              Font
              <select value={selectedFont} onChange={(event) => applyDesignPatch({ font: event.target.value })}>{englishFonts.map((font) => <option key={font} value={font}>{font}</option>)}</select>
            </label>
            <RangeControl label="Font size" min={10} max={20} step={0.5} value={frontmatter.fontSizePx ?? templateFontPx(template)} suffix="px" onChange={(value: number) => applyDesignPatch({ fontSizePx: value })} />
            <RangeControl label="Line spacing" min={1} max={1.8} step={0.05} value={frontmatter.lineHeight ?? template.lineHeight} onChange={(value: number) => applyDesignPatch({ lineHeight: value })} />
          </section>

          <section className="design-group">
            <div className="design-section-heading"><h3>Page and spacing</h3></div>
            <label>
              Page size
              <select value={activeResume.pageSize} onChange={(event) => applyDesignPatch({ pageSize: event.target.value as PageSize })}>
                <option value="letter">US Letter (8.5 x 11")</option>
                <option value="a4">A4</option>
              </select>
            </label>
            <RangeControl label="Top and bottom margin" min={32} max={96} value={frontmatter.marginVerticalPx ?? Math.round(template.margin * 96)} suffix="px" onChange={(value: number) => applyDesignPatch({ marginVerticalPx: value })} />
            <RangeControl label="Left and right margin" min={32} max={96} value={frontmatter.marginHorizontalPx ?? Math.round(template.margin * 96)} suffix="px" onChange={(value: number) => applyDesignPatch({ marginHorizontalPx: value })} />
            <RangeControl label="Paragraph spacing" min={0} max={18} value={frontmatter.paragraphSpacingPx ?? 5} suffix="px" onChange={(value: number) => applyDesignPatch({ paragraphSpacingPx: value })} />
          </section>
        </div>
      </aside>
    </div>
  );
};

const TemplateThumbnail = ({ template }: { template: ResumeTemplate }) => (
  <div
    className={`template-thumb thumb-${template.id} risk-${template.atsRisk}`}
    style={{ "--thumb-accent": template.accentColor } as React.CSSProperties}
    aria-hidden="true"
  >
    <div className="thumb-page">
      <div className="thumb-header">
        <span className="thumb-name" />
        <span className="thumb-contact" />
      </div>
      <div className="thumb-body">
        <div className="thumb-main">
          <span className="thumb-section" />
          <span className="thumb-copy long" />
          <span className="thumb-copy" />
          <span className="thumb-role" />
          <span className="thumb-bullet" />
          <span className="thumb-bullet short" />
          <span className="thumb-section second" />
          <span className="thumb-copy medium" />
        </div>
        {template.layout === "two-column" && (
          <div className="thumb-side">
            <span className="thumb-section" />
            <span className="thumb-pill" />
            <span className="thumb-pill" />
            <span className="thumb-copy" />
          </div>
        )}
      </div>
    </div>
  </div>
);

const RangeControl = ({ label, min, max, step = 1, value, suffix = "", onChange }: RangeControlProps) => (
  <div className="design-range">
    <h3>{label}</h3>
    <label className="range-with-value">
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
      <span>{value}{suffix}</span>
    </label>
    <div className="range-labels"><span>{min}{suffix}</span><span>{max}{suffix}</span></div>
  </div>
);

const GuidedEditor = ({ structured, onChange, onApply }: { structured: StructuredResume; onChange: (value: StructuredResume) => void; onApply: () => void }) => {
  const updateContact = (key: (typeof contactFields)[number], value: string) => onChange({ ...structured, contact: { ...structured.contact, [key]: value } });
  const updateExperience = (index: number, patch: Partial<(typeof structured.experience)[number]>) => {
    const experience = [...structured.experience];
    experience[index] = { ...experience[index], ...patch };
    onChange({ ...structured, experience });
  };
  return (
    <div className="guided-builder">
      <section className="form-card" data-checklist-target="contact">
        <h3>Contact</h3>
        <div className="form-grid">
          {contactFields.map((field) => (
            <label key={field}>{field}<input value={String(structured.contact[field] ?? "")} onChange={(event) => updateContact(field, event.target.value)} /></label>
          ))}
        </div>
      </section>
      <section className="form-card" data-checklist-target="summary">
        <h3>Professional summary</h3>
        <textarea value={structured.summary} onChange={(event) => onChange({ ...structured, summary: event.target.value })} />
      </section>
      <section className="form-card" data-checklist-target="experience">
        <header className="card-section-head"><h3>Experience</h3><Button onClick={() => onChange({ ...structured, experience: [...structured.experience, { id: uid("exp"), company: "", role: "Role", bullets: ["Action + scope + method + result."], technologies: [], impactMetrics: [], keywords: [] }] })}><Plus size={15} /> Add experience</Button></header>
        {structured.experience.map((entry, index) => (
          <details className="experience-card" key={entry.id} open={index === 0}>
            <summary>{entry.role || "Role"} {entry.company ? `at ${entry.company}` : ""}</summary>
            <div className="form-grid">
              <label>Role<input value={entry.role} onChange={(event) => updateExperience(index, { role: event.target.value })} /></label>
              <label>Company<input value={entry.company} onChange={(event) => updateExperience(index, { company: event.target.value })} /></label>
              <label>Location<input value={entry.location ?? ""} onChange={(event) => updateExperience(index, { location: event.target.value })} /></label>
              <label>Start date<input value={entry.startDate ?? ""} onChange={(event) => updateExperience(index, { startDate: event.target.value })} /></label>
              <label>End date<input value={entry.endDate ?? ""} onChange={(event) => updateExperience(index, { endDate: event.target.value })} /></label>
              <label className="checkbox-label"><input type="checkbox" checked={entry.current ?? false} onChange={(event) => updateExperience(index, { current: event.target.checked })} /> Current role</label>
            </div>
            <div className="bullet-rows">
              <h4>Bullets</h4>
              {entry.bullets.map((bullet, bulletIndex) => (
                <label key={`${entry.id}-${bulletIndex}`}>Bullet {bulletIndex + 1}<textarea value={bullet} onChange={(event) => {
                  const bullets = [...entry.bullets];
                  bullets[bulletIndex] = event.target.value;
                  updateExperience(index, { bullets });
                }} /></label>
              ))}
              <Button onClick={() => updateExperience(index, { bullets: [...entry.bullets, "Action + scope + method + result."] })}><Plus size={15} /> Add bullet</Button>
            </div>
          </details>
        ))}
      </section>
      <section className="form-card" data-checklist-target="skills">
        <h3>Skills and sections</h3>
        <label>Skills<textarea value={structured.skills.join(", ")} onChange={(event) => onChange({ ...structured, skills: event.target.value.split(",").map((skill) => skill.trim()).filter(Boolean) })} /></label>
        <div className="form-grid">
          <SimpleEntryEditor title="Education" values={structured.education} onChange={(education) => onChange({ ...structured, education })} />
          <SimpleEntryEditor title="Projects" values={structured.projects} onChange={(projects) => onChange({ ...structured, projects })} />
          <label>Certifications<textarea value={structured.certifications.join("\n")} onChange={(event) => onChange({ ...structured, certifications: event.target.value.split("\n").filter(Boolean) })} /></label>
          <label>Awards<textarea value={structured.awards.join("\n")} onChange={(event) => onChange({ ...structured, awards: event.target.value.split("\n").filter(Boolean) })} /></label>
        </div>
      </section>
      <section className="sync-card">
        <div><strong>Update Markdown from form</strong><p>This replaces the Markdown body with the structured fields above while keeping frontmatter settings.</p></div>
        <Button className="primary" onClick={onApply}>Update Markdown from form</Button>
      </section>
    </div>
  );
};

const SimpleEntryEditor = ({ title, values, onChange }: SimpleEntryEditorProps) => (
  <label>{title}<textarea value={values.map((entry) => entry.title).join("\n")} onChange={(event) => onChange(event.target.value.split("\n").filter(Boolean).map((item) => ({ id: uid(title.toLowerCase()), title: item, bullets: [] })))} /></label>
);

const ChecklistCard = ({ checklist, onSelect }: { checklist: ReturnType<typeof resumeChecklist>; onSelect: (id: string) => void }) => {
  const done = checklist.filter((item) => item.done).length;
  return (
    <section className="checklist-card" aria-label="Job seeker checklist">
      <div><strong>Job seeker checklist</strong><span>{done}/{checklist.length} complete</span></div>
      <ul>
        {checklist.map((item) => (
          <li key={item.id} className={item.done ? "done" : ""}>
            <button type="button" onClick={() => onSelect(item.id)} aria-label={`${item.done ? "Review" : "Complete"} ${item.label}`}>
              <Check size={13} /> <span>{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
};
