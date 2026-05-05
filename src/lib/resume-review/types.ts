import type { ResumeFrontmatter } from "../types";

export type ResumeReviewSeverity = "critical" | "warning" | "info";
export type ResumeReviewPriority = "must-fix" | "should-improve" | "nice-to-have";
export type ResumeReviewCategory =
  | "contact"
  | "structure"
  | "ats-readability"
  | "formatting-risk"
  | "bullet-quality"
  | "impact-metrics"
  | "date-consistency"
  | "keyword-match"
  | "recruiter-skim"
  | "export-safety";

export interface ResumeSafeFix {
  id: string;
  label: string;
  description: string;
  apply: (markdown: string) => string;
}

export interface ResumeReviewIssue {
  id: string;
  title: string;
  severity: ResumeReviewSeverity;
  priority: ResumeReviewPriority;
  category: ResumeReviewCategory;
  location: string;
  whyItMatters: string;
  suggestedFix: string;
  safeAutoFix: boolean;
  fix?: ResumeSafeFix;
}

export interface ResumeReviewScore {
  label: string;
  value: number;
  explanation: string;
}

export interface ResumeSectionReview {
  id: string;
  label: string;
  status: "strong" | "needs-work" | "missing";
  score: number;
  issueCount: number;
  signal: string;
  recommendation: string;
}

export interface ResumeAchievementAudit {
  totalBullets: number;
  completeBullets: number;
  metricBullets: number;
  actionVerbBullets: number;
  scopeBullets: number;
  outcomeBullets: number;
  roleSummaries: Array<{
    section: string;
    bulletCount: number;
    completeCount: number;
    recommendation: string;
  }>;
  opportunities: Array<{
    bullet: string;
    section: string;
    missing: string[];
    prompt: string;
  }>;
}

export interface PlainTextParseResult {
  text: string;
  headings: string[];
  bullets: string[];
  warnings: string[];
  readingOrderNotes: string[];
  parseConfidence: number;
}

export interface JobKeywordMatch {
  title: string;
  overlapLabel: "Low keyword overlap" | "Moderate keyword overlap" | "Strong keyword overlap";
  requiredSkills: string[];
  preferredSkills: string[];
  tools: string[];
  certifications: string[];
  senioritySignals: string[];
  softSkills: string[];
  industryTerms: string[];
  responsibilities: string[];
  ignoredGenericTerms: string[];
  terms: Array<{
    label: string;
    category: "required" | "preferred" | "tool" | "certification" | "domain" | "seniority" | "soft-skill" | "responsibility";
    confidence: "high" | "medium" | "needs-review";
    weight: number;
    matched: boolean;
    count: number;
  }>;
  matched: string[];
  missing: string[];
  underused: string[];
  coverage: {
    requiredSkills: number;
    tools: number;
    domain: number;
    seniority: number;
    certifications: number;
  };
  suggestions: Array<{
    keyword: string;
    section: string;
    note: string;
    verificationPrompt: string;
    suggestedWording: string;
  }>;
  score: number;
}

export interface ResumeReviewContext {
  markdown: string;
  jobDescription?: string;
  pageCount?: number;
}

export interface ResumeReviewDocument {
  markdown: string;
  content: string;
  frontmatter: ResumeFrontmatter;
  plainText: PlainTextParseResult;
  headings: Array<{ level: number; text: string; line: number; normalized: string }>;
  bullets: Array<{ text: string; line: number; section: string }>;
  wordCount: number;
}

export interface ResumeReviewResult {
  overallScore: number;
  scores: {
    contactInfo: ResumeReviewScore;
    structure: ResumeReviewScore;
    atsReadability: ResumeReviewScore;
    formattingRisk: ResumeReviewScore;
    bulletQuality: ResumeReviewScore;
    impactMetrics: ResumeReviewScore;
    keywordMatch: ResumeReviewScore;
    recruiterSkim: ResumeReviewScore;
    exportSafety: ResumeReviewScore;
  };
  issues: ResumeReviewIssue[];
  groups: {
    mustFix: ResumeReviewIssue[];
    shouldImprove: ResumeReviewIssue[];
    niceToHave: ResumeReviewIssue[];
  };
  plainText: PlainTextParseResult;
  keywordMatch: JobKeywordMatch;
  sectionReviews: ResumeSectionReview[];
  achievementAudit: ResumeAchievementAudit;
  scoringExplanation: string[];
}

export type ResumeReviewRule = (document: ResumeReviewDocument, context: ResumeReviewContext) => ResumeReviewIssue[];
