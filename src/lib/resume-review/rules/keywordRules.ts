import { uid } from "../../utils";
import { analyzeJobKeywords } from "../keywordMatcher";
import type { ResumeReviewIssue, ResumeReviewRule } from "../types";

const issue = (patch: Omit<ResumeReviewIssue, "id">): ResumeReviewIssue => ({ id: uid("review"), ...patch });

export const keywordRules: ResumeReviewRule = (document, context) => {
  if (!context.jobDescription?.trim()) return [];
  const match = analyzeJobKeywords(document.markdown, context.jobDescription);
  return match.missing.slice(0, 8).map((keyword) =>
    issue({
      title: "Missing job keyword",
      severity: "info",
      priority: "nice-to-have",
      category: "keyword-match",
      location: keyword,
      whyItMatters: "This term appears in the job description but not in the resume text.",
      suggestedFix: "Add it only if it truthfully reflects your experience, tools, credentials, or project scope.",
      safeAutoFix: false,
    }),
  );
};
