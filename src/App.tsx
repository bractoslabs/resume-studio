import { useEffect, useMemo, useRef, useState } from "react";
import {
  BriefcaseBusiness,
  Check,
  Download,
  FileText,
  History,
  Home,
  Moon,
  Plus,
  Printer,
  Save,
  Settings,
  Sparkles,
  Sun,
} from "lucide-react";
import type {
  AppState,
  JobTarget,
  ResumeDocument,
  ResumeVersion,
  StructuredResume,
} from "./lib/types";
import { analyzeAts } from "./lib/ats";
import { defaultResumeMarkdown } from "./lib/defaultDraft";
import {
  backupFilename,
  clearState,
  createInitialState,
  createSnapshotVersion,
  loadState,
  loadStateAsync,
  pruneSnapshots,
  restoreBackup,
  saveState,
  serializeBackup,
  validateBackup,
} from "./lib/storage";
import { getTemplate } from "./lib/templates";
import { downloadBlob, nowIso, uid } from "./lib/utils";
import { compareResumeToJob, extractJobTarget } from "./lib/jobMatcher";
import { analyzeResume } from "./lib/resume-review";
import {
  parseFrontmatter,
  parseStructuredResume,
  renderMarkdown,
  structuredToMarkdown,
  updateMarkdownFrontmatter,
} from "./lib/markdown";
import { printPdf } from "./lib/exporters";
import {
  ClearLocalDataDialog,
  ConfirmDialog,
  Dashboard,
  documentStyle,
  EditorWorkspace,
  FeedbackModal,
  HelpersPage,
  ImportModal,
  JobsPage,
  LandingSections,
  NewResumeDialog,
  PublicInfoPage,
  RenameResumeDialog,
  BackupReminderBanner,
  LocalStorageWarningBanner,
  ResumePreview,
  RestoreBackupDialog,
  SaveVersionDialog,
  SettingsPage,
} from "./components/AppSections";
import type { DeleteDraft, EditMode, ImportDraft, NewResumeSetup, RenameDraft, RestoreDraft, SaveVersionDraft, TermReviewState, View, WorkflowTab } from "./app/types";
import { snippets } from "./app/constants";
import { publicPathToView, viewToPath } from "./app/viewRouting";
import { Button } from "./components/common/Button";
import {
  createResume,
  createResumeFromImportDraft,
  dedupeIssues,
  duplicateSectionIssues,
  emptySectionIssues,
  intelligenceScores,
  pageCountEstimate,
  resumeChecklist,
  timeOnly,
} from "./app/resumeTransforms";
import { buildImportDraftFromFile } from "./app/importers";

function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [view, setViewState] = useState<View>(() => publicPathToView(window.location.pathname));
  const [tab, setTab] = useState<WorkflowTab>("edit");
  const [editMode, setEditMode] = useState<EditMode>("markdown");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("updated");
  const [atsMode, setAtsMode] = useState(false);
  const [zoom, setZoom] = useState(0.92);
  const [saveStateText, setSaveStateText] = useState("Saved locally");
  const [lastSavedAt, setLastSavedAt] = useState(state.storageMeta?.lastSavedAt ?? "");
  const [saveFailed, setSaveFailed] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobAnalyzed, setJobAnalyzed] = useState(false);
  const [toast, setToast] = useState("");
  const [structured, setStructured] = useState<StructuredResume | null>(null);
  const [versionCompareId, setVersionCompareId] = useState("");
  const [designOpen, setDesignOpen] = useState(false);
  const [ignoredIssues, setIgnoredIssues] = useState<string[]>([]);
  const [commandOpen, setCommandOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [newResumeOpen, setNewResumeOpen] = useState(false);
  const [importDraft, setImportDraft] = useState<ImportDraft | null>(null);
  const [importError, setImportError] = useState("");
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [restoreDraft, setRestoreDraft] = useState<RestoreDraft | null>(null);
  const [renameDraft, setRenameDraft] = useState<RenameDraft | null>(null);
  const [deleteDraft, setDeleteDraft] = useState<DeleteDraft | null>(null);
  const [saveVersionDraft, setSaveVersionDraft] = useState<SaveVersionDraft | null>(null);
  const [restoreVersionDraft, setRestoreVersionDraft] = useState<ResumeVersion | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const hydratedRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);
  const snapshotTimerRef = useRef<number | null>(null);
  const lastSnapshotMarkdownRef = useRef("");

  const setView = (next: View) => {
    setViewState(next);
    const path = viewToPath(next);
    if (window.location.pathname !== path) window.history.pushState({ view: next }, "", path);
  };

  const downloadBackup = (sourceState = state, message = "Backup downloaded. Keep this file somewhere safe so you can restore your work later.") => {
    downloadBlob(new Blob([serializeBackup(sourceState)], { type: "application/json;charset=utf-8" }), backupFilename());
    setState((current) => ({
      ...current,
      storageMeta: {
        ...current.storageMeta,
        lastBackupAt: nowIso(),
        significantChangesSinceBackup: false,
      },
    }));
    setToast(message);
  };

  const openRestorePreview = async (file: File) => {
    const json = await file.text();
    const preview = validateBackup(json);
    if (!preview.valid) {
      setToast(preview.error ?? "We couldn't restore this backup file.");
      return;
    }
    setRestoreDraft({ json, preview, mode: "merge" });
  };

  const createSystemSnapshot = (label: string, notes: string) => {
    if (!activeResume) return;
    const snapshot = createSnapshotVersion(activeResume.markdown, label, notes, "system");
    updateResume(activeResume.id, (resume) => ({ versions: pruneSnapshots([snapshot, ...resume.versions]) }));
  };

  const activeResume = state.resumes.find((resume) => resume.id === state.activeResumeId) ?? state.resumes[0];
  const rendered = useMemo(() => renderMarkdown(activeResume?.markdown ?? defaultResumeMarkdown, atsMode), [activeResume?.markdown, atsMode]);
  const landingRendered = useMemo(() => renderMarkdown(defaultResumeMarkdown, false), []);
  const template = getTemplate(activeResume?.templateId ?? rendered.frontmatter.template);
  const jobMatch = useMemo(() => (jobDescription.trim() ? compareResumeToJob(activeResume?.markdown ?? "", jobDescription) : null), [activeResume?.markdown, jobDescription]);
  const activePageCount = pageCountEstimate(rendered.plainText);
  const resumeReview = useMemo(
    () => analyzeResume({ markdown: activeResume?.markdown ?? "", jobDescription, pageCount: activePageCount }),
    [activeResume?.markdown, activePageCount, jobDescription],
  );
  const ats = useMemo(
    () => analyzeAts(activeResume?.markdown ?? "", jobMatch ? [...jobMatch.requiredSkills, ...jobMatch.tools, ...jobMatch.keywords] : []),
    [activeResume?.markdown, jobMatch],
  );
  const reviewIssues = useMemo(
    () => resumeReview.issues.filter((issue) => !ignoredIssues.includes(issue.id)),
    [resumeReview.issues, ignoredIssues],
  );
  const checklist = useMemo(() => (activeResume ? resumeChecklist(activeResume, ats, jobDescription) : []), [activeResume, ats, jobDescription]);
  const compareVersion = activeResume?.versions.find((version) => version.id === versionCompareId);

  useEffect(() => {
    loadStateAsync().then((loaded) => {
      hydratedRef.current = true;
      setState(loaded);
      lastSnapshotMarkdownRef.current = (loaded.resumes.find((resume) => resume.id === loaded.activeResumeId) ?? loaded.resumes[0])?.markdown ?? "";
      setLastSavedAt(loaded.storageMeta?.lastSavedAt ?? "");
      setSaveStateText(loaded.storageMeta?.lastSavedAt ? `Saved locally at ${timeOnly(loaded.storageMeta.lastSavedAt)}` : "Saved locally");
    }).catch(() => {
      hydratedRef.current = true;
      setSaveFailed("Could not read browser storage. Download a backup before closing.");
      setSaveStateText("Save failed");
    });
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    setSaveStateText("Saving...");
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      saveState(state).then((result) => {
        const savedAt = result.state.storageMeta?.lastSavedAt ?? nowIso();
        setLastSavedAt(savedAt);
        setSaveFailed(result.ok ? "" : result.error);
        setSaveStateText(result.ok ? `Saved locally at ${timeOnly(savedAt)}` : "Save failed");
      }).catch((error) => {
        setSaveFailed(error instanceof Error ? error.message : "Could not save. Download a backup before closing.");
        setSaveStateText("Save failed");
      });
    }, 350);
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [state]);

  useEffect(() => {
    if (!activeResume || activeResume.markdown === lastSnapshotMarkdownRef.current) return;
    if (snapshotTimerRef.current) window.clearTimeout(snapshotTimerRef.current);
    snapshotTimerRef.current = window.setTimeout(() => {
      if (!activeResume || activeResume.markdown === lastSnapshotMarkdownRef.current) return;
      const snapshot = createSnapshotVersion(activeResume.markdown, "Autosaved snapshot", "Created automatically while editing.", "autosave");
      lastSnapshotMarkdownRef.current = activeResume.markdown;
      updateResume(activeResume.id, (resume) => ({ versions: pruneSnapshots([snapshot, ...resume.versions]) }));
    }, 5 * 60 * 1000);
    return () => {
      if (snapshotTimerRef.current) window.clearTimeout(snapshotTimerRef.current);
    };
  }, [activeResume?.id, activeResume?.markdown]);

  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = state.themeMode === "system" ? (prefersDark ? "dark" : "light") : state.themeMode;
  }, [state.themeMode]);

  useEffect(() => {
    const onPop = () => setViewState(publicPathToView(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        captureVersion("Manual save");
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "p") {
        event.preventDefault();
          printPdf(activeResume?.pageSize ?? "letter");
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const updateResume = (id: string, patch: Partial<ResumeDocument> | ((resume: ResumeDocument) => Partial<ResumeDocument>)) => {
    setSaveStateText("Saving...");
    setState((current) => ({
      ...current,
      storageMeta: { ...current.storageMeta, significantChangesSinceBackup: true },
      resumes: current.resumes.map((resume) => {
        if (resume.id !== id) return resume;
        const resolved = typeof patch === "function" ? patch(resume) : patch;
        const markdownChanged = "markdown" in resolved && resolved.markdown !== resume.markdown;
        return { ...resume, ...resolved, updatedAt: nowIso(), exportedSinceLastChange: markdownChanged ? false : resume.exportedSinceLastChange };
      }),
    }));
  };

  const setMarkdown = (markdown: string) => {
    const parsed = parseFrontmatter(markdown);
    updateResume(activeResume.id, {
      markdown,
      title: parsed.hasFrontmatter ? parsed.frontmatter.name || activeResume.title : activeResume.title,
      targetRole: parsed.hasFrontmatter ? parsed.frontmatter.targetRole || activeResume.targetRole : activeResume.targetRole,
      pageSize: parsed.hasFrontmatter ? parsed.frontmatter.pageSize ?? activeResume.pageSize : activeResume.pageSize,
      templateId: parsed.hasFrontmatter ? parsed.frontmatter.template ?? activeResume.templateId : activeResume.templateId,
    });
  };

  const selectResume = (id: string) => {
    const nextResume = state.resumes.find((resume) => resume.id === id);
    lastSnapshotMarkdownRef.current = nextResume?.markdown ?? "";
    setState((current) => ({ ...current, activeResumeId: id }));
    setView("editor");
    setTab("edit");
  };

  const reviewResume = (id: string) => {
    const nextResume = state.resumes.find((resume) => resume.id === id);
    lastSnapshotMarkdownRef.current = nextResume?.markdown ?? "";
    setState((current) => ({ ...current, activeResumeId: id }));
    setView("editor");
    setTab("review");
  };

  const addResume = (kind: "blank" | "wizard" | "template" | "import" | "duplicate", source?: ResumeDocument, setup?: NewResumeSetup) => {
    const resume = createResume(kind, source, setup);
    const shouldRecommendBackup = kind === "duplicate" || kind === "import";
    setState((current) => ({
      ...current,
      storageMeta: { ...current.storageMeta, significantChangesSinceBackup: shouldRecommendBackup ? true : current.storageMeta?.significantChangesSinceBackup },
      resumes: [resume, ...current.resumes],
      activeResumeId: resume.id,
    }));
    setNewResumeOpen(false);
    setView("editor");
    setTab("edit");
    setEditMode(kind === "wizard" || setup?.startMode === "guided" ? "guided" : "markdown");
    if (kind === "wizard" || setup?.startMode === "guided") setStructured(parseStructuredResume(resume.markdown));
    setToast("Resume created. Complete the draft, run Review, then export a PDF.");
  };

  const deleteResume = (id: string) => {
    const deletingLastResume = state.resumes.length === 1 && state.resumes[0]?.id === id;
    setState((current) => {
      const resumes = current.resumes.filter((resume) => resume.id !== id);
      return { ...current, storageMeta: { ...current.storageMeta, significantChangesSinceBackup: true }, resumes, activeResumeId: resumes[0]?.id ?? "" };
    });
    if (deletingLastResume) {
      setView("dashboard");
      setTab("edit");
    }
  };

  const importFromDraft = () => {
    if (!importDraft) return;
    createSystemSnapshot("Before import", "Automatic safety snapshot before importing a resume.");
    const resume = createResumeFromImportDraft(importDraft);
    setState((current) => ({ ...current, storageMeta: { ...current.storageMeta, significantChangesSinceBackup: true }, resumes: [resume, ...current.resumes], activeResumeId: resume.id }));
    setImportOpen(false);
    setNewResumeOpen(false);
    setImportDraft(null);
    setImportError("");
    setView("editor");
    setToast("Resume imported");
  };

  const openImport = () => {
    setImportDraft(null);
    setImportError("");
    setImportOpen(true);
    setNewResumeOpen(false);
  };

  const importFile = async (file: File) => {
    try {
      setImportDraft(await buildImportDraftFromFile(file));
      setImportError("");
      setImportOpen(true);
      setNewResumeOpen(false);
    } catch (error) {
      setImportDraft(null);
      setImportError(error instanceof Error ? error.message : "Import failed");
      setImportOpen(true);
      setNewResumeOpen(false);
    }
  };

  const captureVersion = (name = "Saved version", notes = "") => {
    if (!activeResume) return;
    const version: ResumeVersion = { id: uid("version"), name, notes, markdown: activeResume.markdown, createdAt: nowIso(), kind: "named" };
    updateResume(activeResume.id, (resume) => ({ versions: pruneSnapshots([version, ...resume.versions]) }));
    setToast("Version saved");
  };

  const recordExport = (format: string) => {
    updateResume(activeResume.id, {
      lastExportedAt: nowIso(),
      lastExportedFormat: format,
      exportedSinceLastChange: true,
    });
  };

  const insertSnippet = (text: string) => {
    const editor = editorRef.current;
    if (!editor) {
      setMarkdown(`${activeResume.markdown}\n${text}`);
      return;
    }
    const hasEditorFocus = document.activeElement === editor;
    const start = hasEditorFocus ? editor.selectionStart : activeResume.markdown.length;
    const end = hasEditorFocus ? editor.selectionEnd : activeResume.markdown.length;
    setMarkdown(`${activeResume.markdown.slice(0, start)}${text}${activeResume.markdown.slice(end)}`);
    setCommandOpen(false);
  };

  const applyStructured = () => {
    if (!structured) return;
    setMarkdown(structuredToMarkdown(structured, activeResume.markdown));
    setToast("Markdown updated from form");
  };

  const applyDesignPatch = (patch: Partial<ReturnType<typeof parseFrontmatter>["frontmatter"]>) => {
    updateResume(activeResume.id, {
      markdown: updateMarkdownFrontmatter(activeResume.markdown, patch),
      pageSize: patch.pageSize ?? activeResume.pageSize,
      templateId: patch.template ?? activeResume.templateId,
    });
  };

  const saveJobTarget = (createVersion: boolean, termReview: Record<string, "important" | "not-relevant" | "have" | "do-not-have"> = {}) => {
    if (!jobDescription.trim()) return;
    const target: JobTarget = extractJobTarget(jobDescription);
    const termDecisions = Object.entries(termReview).map(([label, status]) => ({ label, status, updatedAt: nowIso() }));
    const missingImportant = target.analysis?.missing?.filter((term) => termReview[term] !== "not-relevant" && termReview[term] !== "do-not-have").slice(0, 12) ?? [];
    const targetWithReview: JobTarget = {
      ...target,
      status: createVersion ? "tailoring" : "interested",
      termDecisions,
      checklist: [
        "Review important missing terms",
        "Add skills or claims only if they are true",
        "Export a clean PDF when ready",
      ],
    };
    const version: ResumeVersion = {
      id: uid("version"),
      name: `${target.title} job-specific copy`,
      markdown: activeResume.markdown,
      jobTargetId: target.id,
      notes: `Created from Keyword & Fit Check. Missing important terms to review: ${missingImportant.join(", ") || "none"}. Add only truthful missing keywords.`,
      createdAt: nowIso(),
      kind: "named",
    };
    updateResume(activeResume.id, (resume) => ({
      jobTargets: [{ ...targetWithReview, tailoredVersionId: createVersion ? version.id : undefined }, ...resume.jobTargets],
      versions: createVersion ? [version, ...resume.versions] : resume.versions,
    }));
    setToast(createVersion ? "Job target and job-specific copy saved" : "Job target saved");
  };

  const filteredResumes = [...state.resumes]
    .filter((resume) => `${resume.title} ${resume.targetRole} ${resume.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "role") return (a.targetRole ?? "").localeCompare(b.targetRole ?? "");
      if (sort === "score") return analyzeAts(b.markdown).scores.overall - analyzeAts(a.markdown).scores.overall;
      return +new Date(b.updatedAt) - +new Date(a.updatedAt);
    });

  const pageStyle = {
    "--resume-font": [rendered.frontmatter.font || template.fontFamily, rendered.frontmatter.cjkFont, "Arial", "sans-serif"].filter(Boolean).join(", "),
    "--resume-font-size": rendered.frontmatter.fontSizePx ? `${rendered.frontmatter.fontSizePx}px` : `${template.fontSize}pt`,
    "--resume-line-height": rendered.frontmatter.lineHeight ?? template.lineHeight,
    "--resume-margin-y": rendered.frontmatter.marginVerticalPx !== undefined ? `${rendered.frontmatter.marginVerticalPx}px` : `${template.margin}in`,
    "--resume-margin-x": rendered.frontmatter.marginHorizontalPx !== undefined ? `${rendered.frontmatter.marginHorizontalPx}px` : `${template.margin}in`,
    "--accent": rendered.frontmatter.accentColor || template.accentColor,
    "--paragraph-spacing": `${rendered.frontmatter.paragraphSpacingPx ?? 5}px`,
    "--bullet-gap": template.bulletSpacing === "compact" ? "1px" : template.bulletSpacing === "airy" ? "5px" : "3px",
  } as React.CSSProperties;

  const hasMeaningfulBackupWork = state.resumes.some((resume) => (
    resume.updatedAt !== resume.createdAt ||
    resume.versions.length > 1 ||
    Boolean(resume.lastExportedAt || resume.importedSource) ||
    resume.jobTargets.length > 0 ||
    resume.applications.length > 0
  ));
  const backupRecommended = Boolean(state.storageMeta?.significantChangesSinceBackup) || (!state.storageMeta?.lastBackupAt && hasMeaningfulBackupWork);

  const shouldShowBackupReminder = (() => {
    const meta = state.storageMeta;
    if (meta?.backupReminderDisabled) return false;
    if (!state.resumes.length) return false;
    const dismissedAt = meta?.lastBackupReminderDismissedAt ? +new Date(meta.lastBackupReminderDismissedAt) : 0;
    if (dismissedAt && Date.now() - dismissedAt < 24 * 60 * 60 * 1000) return false;
    if (!meta?.lastBackupAt && hasMeaningfulBackupWork) return true;
    if (meta?.lastBackupAt && meta.significantChangesSinceBackup && Date.now() - +new Date(meta.lastBackupAt) > 7 * 24 * 60 * 60 * 1000) return true;
    return false;
  })();
  const shouldShowLocalStorageWarning = state.resumes.length > 0 && !state.storageMeta?.localStorageWarningDismissedAt;
  const dismissLocalStorageWarning = () => {
    setState((current) => ({ ...current, storageMeta: { ...current.storageMeta, localStorageWarningDismissedAt: nowIso() } }));
  };

  const shell = (children: React.ReactNode) => (
    <main className="product-shell">
      <aside className="app-rail" aria-label="Primary navigation">
        <button className="rail-brand" onClick={() => setView("dashboard")}><FileText size={18} /> Resume Studio</button>
        {([
          ["dashboard", "Dashboard", Home],
          ["jobs", "Job Targets", BriefcaseBusiness],
          ["helpers", "Resume Tools", Sparkles],
          ["settings", "Settings", Settings],
        ] satisfies Array<[View, string, typeof Home]>).map(([key, label, Icon]) => (
          <button key={key} className={view === key ? "active" : ""} aria-label={label} onClick={() => setView(key)}>
            <Icon size={18} /> <span>{label}</span>
          </button>
        ))}
        <Button className="feedback-rail-btn" onClick={() => setFeedbackOpen(true)}>Feedback</Button>
      </aside>
      <section className="product-main">
        {shouldShowLocalStorageWarning ? (
          <LocalStorageWarningBanner
            onBackup={() => {
              downloadBackup();
              dismissLocalStorageWarning();
            }}
            onDismiss={dismissLocalStorageWarning}
            onLearnMore={() => setView("privacy")}
          />
        ) : shouldShowBackupReminder && (
          <BackupReminderBanner
            onBackup={() => downloadBackup()}
            onLater={() => setState((current) => ({ ...current, storageMeta: { ...current.storageMeta, lastBackupReminderDismissedAt: nowIso() } }))}
          />
        )}
        {children}
      </section>
    </main>
  );

  return (
    <div className="app">
      {toast && (
        <div className="toast" role="status" onAnimationEnd={() => setToast("")}>
          <Check size={16} /> {toast}
        </div>
      )}

      {view === "landing" && (
        <main className="landing">
          <nav className="topbar clean-topbar">
            <button className="brand" onClick={() => setView("dashboard")}><FileText size={22} /> Resume Studio</button>
            <div className="topbar-actions">
              <Button onClick={() => setState((current) => ({ ...current, themeMode: current.themeMode === "dark" ? "light" : "dark" }))}>
                {state.themeMode === "dark" ? <Sun size={16} /> : <Moon size={16} />} Theme
              </Button>
              <Button className="primary" onClick={() => setView("dashboard")}>Start building</Button>
            </div>
          </nav>
          <section className="hero focused-hero">
            <div className="hero-copy">
              <h1>Free, private, Markdown-first resume builder for serious job seekers.</h1>
              <p>Create, review, tailor, and export resumes without an account. Resume Studio keeps your data local by default and never invents your experience.</p>
              <div className="hero-actions">
                <Button className="primary large" onClick={() => setView("dashboard")}>Start building</Button>
              </div>
              <div className="benefits">
                {["Free to use", "No account required", "Markdown and guided editing", "Live preview", "Resume Review", "Keyword & Fit Check", "PDF, DOCX, Markdown, and plain text exports", "Local-first privacy"].map((benefit) => (
                  <span key={benefit}><Check size={14} /> {benefit}</span>
                ))}
              </div>
            </div>
            <div className="hero-preview">
              <ResumePreview renderedHtml={landingRendered.html} pageStyle={pageStyle} templateId="technical" pageSize="letter" zoom={0.62} warnings={0} />
            </div>
          </section>
          <LandingSections setView={setView} />
        </main>
      )}

      {view === "dashboard" && shell(
        <Dashboard
          resumes={filteredResumes}
          query={query}
          setQuery={setQuery}
          sort={sort}
          setSort={setSort}
          totalResumeCount={state.resumes.length}
          lastBackupAt={state.storageMeta?.lastBackupAt}
          backupRecommended={backupRecommended}
          selectResume={selectResume}
          reviewResume={reviewResume}
          deleteResume={(resume) => setDeleteDraft({ id: resume.id, title: resume.title })}
          duplicateResume={(resume) => addResume("duplicate", resume)}
          renameResume={(resume) => setRenameDraft({ id: resume.id, title: resume.title })}
          openNewResume={() => setNewResumeOpen(true)}
          downloadBackup={downloadBackup}
          openRestorePreview={openRestorePreview}
        />,
      )}

      {view === "editor" && activeResume && shell(
        <EditorWorkspace
          resume={activeResume}
          resumes={state.resumes}
          rendered={rendered}
          template={template}
          ats={ats}
          review={resumeReview}
          reviewIssues={reviewIssues}
          jobDescription={jobDescription}
          setJobDescription={setJobDescription}
          jobAnalyzed={jobAnalyzed}
          setJobAnalyzed={setJobAnalyzed}
          jobMatch={jobMatch}
          tab={tab}
          setTab={setTab}
          editMode={editMode}
          setEditMode={(next) => {
            setEditMode(next);
            if (next === "guided") setStructured(parseStructuredResume(activeResume.markdown));
          }}
          structured={structured}
          setStructured={setStructured}
          setMarkdown={setMarkdown}
          updateResume={updateResume}
          setView={setView}
          selectResume={selectResume}
          captureVersion={captureVersion}
          createSystemSnapshot={createSystemSnapshot}
          applyStructured={applyStructured}
          insertSnippet={insertSnippet}
          editorRef={editorRef}
          zoom={zoom}
          setZoom={setZoom}
          atsMode={atsMode}
          setAtsMode={setAtsMode}
          activePageCount={activePageCount}
          checklist={checklist}
          intelligence={intelligenceScores(activeResume.markdown, ats, jobMatch)}
          pageStyle={pageStyle}
          saveStateText={saveStateText}
          lastSavedAt={lastSavedAt}
          saveFailed={saveFailed}
          downloadBackup={downloadBackup}
          applyDesignPatch={applyDesignPatch}
          designOpen={designOpen}
          setDesignOpen={setDesignOpen}
          saveJobTarget={saveJobTarget}
          recordExport={recordExport}
          ignoredIssues={ignoredIssues}
          setIgnoredIssues={setIgnoredIssues}
          compareVersion={compareVersion}
          versionCompareId={versionCompareId}
          setVersionCompareId={setVersionCompareId}
          state={state}
          openSaveVersion={() => setSaveVersionDraft({ name: "Named version", notes: "" })}
          openRestoreVersion={setRestoreVersionDraft}
        />,
      )}

      {view === "jobs" && shell(<JobsPage resumes={state.resumes} activeResume={activeResume} updateResume={updateResume} openNewResume={() => setNewResumeOpen(true)} />)}
      {view === "helpers" && shell(<HelpersPage resume={activeResume} resumes={state.resumes} jobDescription={jobDescription} openNewResume={() => setNewResumeOpen(true)} />)}
      {view === "settings" && shell(<SettingsPage state={state} setState={setState} openClear={() => setConfirmClearOpen(true)} downloadBackup={downloadBackup} openRestorePreview={openRestorePreview} lastSavedAt={lastSavedAt} saveFailed={saveFailed} />)}
      {["privacy", "terms", "security", "feedback", "about", "free"].includes(view) && <PublicInfoPage view={view} setView={setView} openFeedback={() => setFeedbackOpen(true)} />}

      {commandOpen && (
        <div className="command-modal" role="dialog" aria-label="Command palette">
          <div className="command-box">
            <header><strong>Command palette</strong><button onClick={() => setCommandOpen(false)}>Close</button></header>
            {snippets.map((snippet) => <button key={snippet.command} onClick={() => insertSnippet(snippet.text)}>{snippet.command}<span>{snippet.text.trim().slice(0, 70)}</span></button>)}
            <button onClick={() => captureVersion("Command palette version")}><History size={15} /> Create version</button>
          </div>
        </div>
      )}
      {feedbackOpen && <FeedbackModal onClose={() => setFeedbackOpen(false)} setToast={setToast} />}
      {newResumeOpen && (
        <NewResumeDialog
          onTemplate={(setup) => addResume(setup.startMode === "guided" ? "wizard" : "template", undefined, setup)}
          onImport={openImport}
          onClose={() => setNewResumeOpen(false)}
        />
      )}
      {importOpen && (
        <ImportModal
          draft={importDraft}
          error={importError}
          setDraft={setImportDraft}
          setError={setImportError}
          onCreate={importFromDraft}
          onClose={() => {
            setImportOpen(false);
            setImportError("");
          }}
        />
      )}
      {confirmClearOpen && (
        <ClearLocalDataDialog
          onBackup={() => downloadBackup(state, "Safety backup downloaded. Keep it somewhere safe before clearing local data.")}
          onCancel={() => setConfirmClearOpen(false)}
          onConfirm={async () => {
            await clearState();
            const initial = createInitialState();
            setState(initial);
            setConfirmClearOpen(false);
            setToast("Local data cleared. Sample resumes restored.");
          }}
        />
      )}
      {restoreDraft && (
        <RestoreBackupDialog
          draft={restoreDraft}
          setDraft={setRestoreDraft}
          onCancel={() => setRestoreDraft(null)}
          onSafetyBackup={() => downloadBackup(state, "Current workspace backup downloaded before restore.")}
          onRestore={() => {
            createSystemSnapshot("Before restore", "Automatic safety snapshot before restoring a backup.");
            if (restoreDraft.mode === "replace") downloadBackup(state, "Safety backup downloaded before replacing this workspace.");
            const restored = restoreBackup(restoreDraft.json, state, restoreDraft.mode);
            setState(restored);
            setRestoreDraft(null);
            setToast("Backup restored. Your resumes are now saved locally in this browser.");
          }}
        />
      )}
      {renameDraft && (
        <RenameResumeDialog
          draft={renameDraft}
          setDraft={setRenameDraft}
          onCancel={() => setRenameDraft(null)}
          onSave={() => {
            if (renameDraft.title.trim()) updateResume(renameDraft.id, { title: renameDraft.title.trim() });
            setRenameDraft(null);
          }}
        />
      )}
      {deleteDraft && (
        <ConfirmDialog
          title="Delete resume?"
          body={`This deletes "${deleteDraft.title}" and its saved versions from this browser. Resume Studio does not have a cloud copy. Download a backup first if you may need it later.`}
          confirmLabel="Delete resume"
          onCancel={() => setDeleteDraft(null)}
          onConfirm={() => {
            deleteResume(deleteDraft.id);
            setDeleteDraft(null);
          }}
        />
      )}
      {saveVersionDraft && (
        <SaveVersionDialog
          draft={saveVersionDraft}
          setDraft={setSaveVersionDraft}
          onCancel={() => setSaveVersionDraft(null)}
          onSave={() => {
            captureVersion(saveVersionDraft.name || "Named version", saveVersionDraft.notes);
            setSaveVersionDraft(null);
          }}
        />
      )}
      {restoreVersionDraft && (
        <ConfirmDialog
          title="Restore version?"
          body={`Restore "${restoreVersionDraft.name}" in this browser? Your current resume will be saved as a local safety snapshot first, but it is still smart to download a backup before changing important work.`}
          confirmLabel="Restore version"
          onCancel={() => setRestoreVersionDraft(null)}
          onConfirm={() => {
            createSystemSnapshot("Before version restore", "Automatic safety snapshot before restoring an older version.");
            setMarkdown(restoreVersionDraft.markdown);
            setRestoreVersionDraft(null);
          }}
        />
      )}
    </div>
  );
}


export default App;
