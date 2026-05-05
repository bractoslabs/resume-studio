import { uid } from "../../utils";
import type { ResumeReviewIssue, ResumeReviewRule } from "../types";

const issue = (patch: Omit<ResumeReviewIssue, "id">): ResumeReviewIssue => ({ id: uid("review"), ...patch });

export const exportRules: ResumeReviewRule = (document, context) => {
  const issues: ResumeReviewIssue[] = [];
  if ((context.pageCount ?? 1) > 2)
    issues.push(
      issue({
        title: "Likely page overflow",
        severity: "warning",
        priority: "should-improve",
        category: "export-safety",
        location: "Preview/export",
        whyItMatters: "Applications often expect concise one- or two-page resumes.",
        suggestedFix: "Use preview and print checks to trim or adjust spacing.",
        safeAutoFix: false,
      }),
    );
  if (document.plainText.warnings.length)
    issues.push(
      issue({
        title: "Plain-text parse warnings",
        severity: "warning",
        priority: "should-improve",
        category: "ats-readability",
        location: "Plain text preview",
        whyItMatters: "The plain-text preview approximates what a parser may read.",
        suggestedFix: "Review the plain-text preview and simplify any confusing sections.",
        safeAutoFix: false,
      }),
    );
  return issues;
};
