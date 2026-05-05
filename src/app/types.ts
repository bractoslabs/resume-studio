import type { FeedbackRecord } from "../lib/types";
import type { ResumeDocument } from "../lib/types";
import type { RestorePreview } from "../lib/storage";

export type View = "landing" | "dashboard" | "editor" | "jobs" | "helpers" | "settings" | "privacy" | "terms" | "security" | "feedback" | "about" | "free";
export type WorkflowTab = "edit" | "review" | "tailor" | "export" | "notes" | "history";
export type EditMode = "markdown" | "guided";
export type ImportDraft = { fileName: string; source: string; markdown: string; confidence: number; sections: string[]; resumePatch?: Partial<ResumeDocument> };
export type FeedbackType = FeedbackRecord["type"];
export type RestoreDraft = { json: string; preview: RestorePreview; mode: "merge" | "replace" };
export type RenameDraft = { id: string; title: string };
export type DeleteDraft = { id: string; title: string };
export type SaveVersionDraft = { name: string; notes: string };
export type TermReviewDecision = "important" | "not-relevant" | "have" | "do-not-have";
export type TermReviewState = Record<string, TermReviewDecision>;
