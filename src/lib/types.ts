export type ThemeMode = "light" | "dark" | "system";
export type PageSize = "letter" | "a4";
export type ResumeMode =
  | "markdown"
  | "guided"
  | "preview"
  | "ats"
  | "job"
  | "exports"
  | "versions"
  | "settings";

export interface ResumeFrontmatter {
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  location?: string;
  links?: string[];
  targetRole?: string;
  pageSize?: PageSize;
  template?: string;
  theme?: string;
  font?: string;
  cjkFont?: string;
  accentColor?: string;
  fontSizePx?: number;
  marginVerticalPx?: number;
  marginHorizontalPx?: number;
  paragraphSpacingPx?: number;
  lineHeight?: number;
}

export interface FrontmatterParseResult {
  frontmatter: ResumeFrontmatter;
  content: string;
  warnings: RenderWarning[];
  hasFrontmatter: boolean;
}

export interface ResumeVersion {
  id: string;
  name: string;
  markdown: string;
  notes?: string;
  jobTargetId?: string;
  createdAt: string;
  isDefault?: boolean;
  kind?: "named" | "autosave" | "system";
}

export interface TailorTermDecision {
  label: string;
  status: "important" | "not-relevant" | "have" | "do-not-have";
  updatedAt: string;
}

export interface JobTarget {
  id: string;
  title: string;
  status?: "interested" | "tailoring" | "ready" | "applied" | "follow-up-due" | "interviewing" | "offer" | "rejected" | "archived";
  company?: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  tools: string[];
  keywords: string[];
  analysis?: JobMatchReport;
  termDecisions?: TailorTermDecision[];
  checklist?: string[];
  lastAnalyzedAt?: string;
  tailoredVersionId?: string;
  createdAt: string;
}

export interface ApplicationRecord {
  id: string;
  company: string;
  role: string;
  jobLink?: string;
  contact?: string;
  status: "interested" | "tailoring" | "ready" | "applied" | "follow-up-due" | "interviewing" | "offer" | "rejected" | "archived" | "saved" | "closed";
  resumeVersionId?: string;
  coverLetterVersionId?: string;
  plainTextExportId?: string;
  dateApplied?: string;
  followUpDate?: string;
  notes?: string;
  outcome?: string;
}

export interface ResumeDocument {
  id: string;
  title: string;
  targetRole?: string;
  tags: string[];
  markdown: string;
  privateNotes?: string;
  templateId: string;
  pageSize: PageSize;
  createdAt: string;
  updatedAt: string;
  versions: ResumeVersion[];
  jobTargets: JobTarget[];
  applications: ApplicationRecord[];
  importedSource?: string;
  ownerType?: "user";
  lastExportedAt?: string;
  lastExportedFormat?: string;
  exportedSinceLastChange?: boolean;
  reviewMeta?: {
    openedAt?: string;
    lastReviewedAt?: string;
    currentMustFixCount?: number;
    noMustFixIssues?: boolean;
  };
}

export interface ResumeTemplate {
  id: string;
  name: string;
  bestFor: string;
  atsRisk: "low" | "medium" | "high";
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  margin: number;
  accentColor: string;
  headingStyle: "rule" | "accent" | "caps" | "boxed";
  bulletSpacing: "compact" | "normal" | "airy";
  layout: "single" | "two-column";
  pageSize: PageSize;
}

export interface StructuredResume {
  contact: ResumeFrontmatter;
  summary: string;
  experience: ExperienceEntry[];
  education: SimpleEntry[];
  skills: string[];
  projects: SimpleEntry[];
  certifications: string[];
  awards: string[];
  publications: string[];
  languages: string[];
  volunteer: SimpleEntry[];
  custom: SimpleEntry[];
}

export interface ExperienceEntry {
  id: string;
  company: string;
  role: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  bullets: string[];
  technologies: string[];
  impactMetrics: string[];
  keywords: string[];
  hiddenNotes?: string;
}

export interface SimpleEntry {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  bullets: string[];
}

export interface RenderWarning {
  severity: "info" | "warning" | "error";
  message: string;
  location?: string;
}

export interface RenderResult {
  html: string;
  plainText: string;
  frontmatter: ResumeFrontmatter;
  warnings: RenderWarning[];
}

export interface AtsIssue {
  id: string;
  severity: "info" | "warning" | "critical";
  category: string;
  location: string;
  explanation: string;
  suggestedFix: string;
  apply?: (markdown: string) => string;
}

export interface AtsScores {
  overall: number;
  parseability: number;
  keywords: number;
  formatting: number;
  contact: number;
  sections: number;
  bullets: number;
  length: number;
}

export interface AtsReport {
  scores: AtsScores;
  issues: AtsIssue[];
}

export interface JobMatchReport {
  title: string;
  overlapLabel?: string;
  requiredSkills: string[];
  preferredSkills: string[];
  tools: string[];
  certifications?: string[];
  industryTerms?: string[];
  responsibilities?: string[];
  ignoredGenericTerms?: string[];
  terms?: Array<{
    label: string;
    category: string;
    confidence: string;
    weight: number;
    matched: boolean;
    count: number;
  }>;
  keywords: string[];
  senioritySignals: string[];
  softSkills: string[];
  matched: string[];
  missing: string[];
  underused: string[];
  coverage?: {
    requiredSkills: number;
    tools: number;
    domain: number;
    seniority: number;
    certifications: number;
  };
  suggestions?: Array<{
    keyword: string;
    section: string;
    note: string;
    verificationPrompt: string;
    suggestedWording: string;
  }>;
  score: number;
}

export interface AppState {
  resumes: ResumeDocument[];
  activeResumeId: string;
  themeMode: ThemeMode;
  onboardingDone: string[];
  storageMeta?: StorageMeta;
}

export interface StorageMeta {
  schemaVersion?: number;
  lastSavedAt?: string;
  lastBackupAt?: string;
  lastBackupReminderDismissedAt?: string;
  localStorageWarningDismissedAt?: string;
  backupReminderDisabled?: boolean;
  significantChangesSinceBackup?: boolean;
  storageMode?: "indexeddb" | "localstorage";
  lastSaveError?: string;
}

export interface FutureCloudSyncProfile {
  id: string;
  email?: string;
  displayName?: string;
  syncEnabled: boolean;
  createdAt: string;
}

export interface FutureShareLinkSettings {
  resumeId: string;
  versionId?: string;
  commentsEnabled: boolean;
  passwordProtected: boolean;
  expiresAt?: string;
}

export interface FeedbackRecord {
  id: string;
  type: "bug" | "feature" | "confusing-ux" | "export-issue" | "other";
  message: string;
  email?: string;
  createdAt: string;
  source: "mailto" | "local-export";
}
