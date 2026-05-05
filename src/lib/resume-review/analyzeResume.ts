import { buildReviewDocument } from "./plainText";
import { analyzeJobKeywords } from "./keywordMatcher";
import { contactRules } from "./rules/contactRules";
import { structureRules } from "./rules/structureRules";
import { formattingRules } from "./rules/formattingRules";
import { bulletRules } from "./rules/bulletRules";
import { metricsRules } from "./rules/metricsRules";
import { dateRules } from "./rules/dateRules";
import { keywordRules } from "./rules/keywordRules";
import { exportRules } from "./rules/exportRules";
import { placeholderRules } from "./rules/placeholderRules";
import { overallScore, scoreReview } from "./scoring";
import { buildAchievementAudit, buildSectionReviews } from "./insights";
import type { ResumeReviewContext, ResumeReviewIssue, ResumeReviewResult, ResumeReviewRule } from "./types";

const rules: ResumeReviewRule[] = [
  placeholderRules,
  contactRules,
  structureRules,
  formattingRules,
  bulletRules,
  metricsRules,
  dateRules,
  keywordRules,
  exportRules,
];

const dedupe = (issues: ResumeReviewIssue[]) => {
  const seen = new Set<string>();
  return issues.filter((issue) => {
    const key = `${issue.title}:${issue.category}:${issue.location}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const stableIssueId = (issue: ResumeReviewIssue) =>
  `review-${[issue.category, issue.location, issue.title, issue.suggestedFix]
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120)}`;

export const analyzeResume = (context: ResumeReviewContext): ResumeReviewResult => {
  const document = buildReviewDocument(context.markdown);
  const keywordMatch = analyzeJobKeywords(context.markdown, context.jobDescription ?? "");
  const issues = dedupe(rules.flatMap((rule) => rule(document, context)))
    .map((issue) => ({ ...issue, id: stableIssueId(issue) }))
    .sort((a, b) => {
      const rank = { critical: 0, warning: 1, info: 2 };
      return rank[a.severity] - rank[b.severity] || a.category.localeCompare(b.category);
    });
  const scores = scoreReview(
    issues,
    document.bullets.map((bullet) => bullet.text),
    keywordMatch.score,
  );
  const overall = overallScore(scores);
  const sectionReviews = buildSectionReviews(document, issues);
  const achievementAudit = buildAchievementAudit(document);
  return {
    overallScore: overall,
    scores,
    issues,
    groups: {
      mustFix: issues.filter((issue) => issue.priority === "must-fix"),
      shouldImprove: issues.filter((issue) => issue.priority === "should-improve"),
      niceToHave: issues.filter((issue) => issue.priority === "nice-to-have"),
    },
    plainText: document.plainText,
    keywordMatch,
    sectionReviews,
    achievementAudit,
    scoringExplanation: [
      "Scores are deterministic and local. They are not an ATS ranking or hiring outcome signal.",
      "Critical issues have the largest impact, warnings have moderate impact, and nice-to-have items have small impact.",
      "Keyword Match only reflects the pasted job description. Add missing terms only when they are truthful.",
      "Safe auto-fixes are limited to mechanical Markdown cleanup, heading normalization, whitespace, and bullet/date formatting.",
    ],
  };
};
