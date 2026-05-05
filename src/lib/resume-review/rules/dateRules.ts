import { uid } from "../../utils";
import { normalizeCurrentRoleTerms, normalizeDateDashSpacing } from "../fixes/safeFixes";
import type { ResumeReviewIssue, ResumeReviewRule } from "../types";

const issue = (patch: Omit<ResumeReviewIssue, "id">): ResumeReviewIssue => ({ id: uid("review"), ...patch });
const dateRange =
  /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{1,2}\/\d{4}|\d{4})\s*[–—-]\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{1,2}\/\d{4}|\d{4}|Present|Current|Now)/gi;

const parseYear = (value: string) => {
  const year = value.match(/\d{4}/)?.[0];
  return year ? Number(year) : undefined;
};

export const dateRules: ResumeReviewRule = (document) => {
  const issues: ResumeReviewIssue[] = [];
  const ranges = [...document.content.matchAll(dateRange)];
  const usesMonth = ranges.some((match) => /[A-Za-z]/.test(match[1]));
  const usesSlash = ranges.some((match) => /\//.test(match[1]));
  if (ranges.length === 0 && document.headings.some((heading) => heading.level === 3))
    issues.push(
      issue({
        title: "Missing experience dates",
        severity: "warning",
        priority: "should-improve",
        category: "date-consistency",
        location: "Experience roles",
        whyItMatters: "Dates help recruiters understand recency and progression.",
        suggestedFix: "Add truthful start/end dates for each role.",
        safeAutoFix: false,
      }),
    );
  if (usesMonth && usesSlash)
    issues.push(
      issue({
        title: "Inconsistent date formats",
        severity: "warning",
        priority: "should-improve",
        category: "date-consistency",
        location: "Experience dates",
        whyItMatters: "Mixed date formats make scanning and parsing less predictable.",
        suggestedFix: "Use one format, such as Jan 2020 - Present or 2020 - 2023.",
        safeAutoFix: true,
        fix: normalizeDateDashSpacing(),
      }),
    );
  ranges.forEach((match) => {
    const start = parseYear(match[1]);
    const end = parseYear(match[2]);
    if (start && end && end < start)
      issues.push(
        issue({
          title: "End date before start date",
          severity: "critical",
          priority: "must-fix",
          category: "date-consistency",
          location: match[0],
          whyItMatters: "Impossible date ranges create credibility and parser issues.",
          suggestedFix: "Correct the date range using verified dates.",
          safeAutoFix: false,
        }),
      );
    if (/Now|Current/i.test(match[2]))
      issues.push(
        issue({
          title: "Use Present for current roles",
          severity: "info",
          priority: "nice-to-have",
          category: "date-consistency",
          location: match[0],
          whyItMatters: "Present is the most common resume convention for current roles.",
          suggestedFix: "Replace Now/Current with Present if the role is current.",
          safeAutoFix: true,
          fix: normalizeCurrentRoleTerms(),
        }),
      );
  });
  return issues;
};
