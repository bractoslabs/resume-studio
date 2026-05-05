import { uid } from "../../utils";
import { atsRiskPatterns } from "../data/atsRiskPatterns";
import { convertSmartBullets, normalizeRepeatedSpaces, removeDuplicateBlankLines } from "../fixes/safeFixes";
import type { ResumeReviewIssue, ResumeReviewRule } from "../types";

const issue = (patch: Omit<ResumeReviewIssue, "id">): ResumeReviewIssue => ({ id: uid("review"), ...patch });

export const formattingRules: ResumeReviewRule = (document) => {
  const issues: ResumeReviewIssue[] = [];
  const add = (patch: Omit<ResumeReviewIssue, "id">) => issues.push(issue(patch));
  const checks: Array<[RegExp, string, string, "critical" | "warning" | "info"]> = [
    [atsRiskPatterns.table, "Tables can confuse ATS reading order", "Tables", "warning"],
    [atsRiskPatterns.image, "Images do not survive plain-text parsing", "Images", "warning"],
    [atsRiskPatterns.iconDirective, "Icons add parse noise", "Icon directives", "info"],
    [atsRiskPatterns.emoji, "Emojis may not parse consistently", "Symbols", "warning"],
    [atsRiskPatterns.htmlBlock, "Raw HTML increases export and sanitizer risk", "HTML blocks", "warning"],
    [atsRiskPatterns.styleBlock, "Custom CSS can diverge from print/export safety", "Custom CSS", "warning"],
    [atsRiskPatterns.hiddenAts, "Hidden/ATS-only content can create mismatched resume versions", "ATS visibility directives", "warning"],
    [atsRiskPatterns.columnHint, "Columns can create confusing plain-text order", "Layout", "warning"],
  ];
  checks.forEach(([pattern, title, location, severity]) => {
    if (pattern.test(document.content)) add({ title, severity, priority: severity === "critical" ? "must-fix" : severity === "warning" ? "should-improve" : "nice-to-have", category: "formatting-risk", location, whyItMatters: "The review favors text-first resumes that keep reading order predictable.", suggestedFix: "Use plain headings, bullets, and readable links for critical content.", safeAutoFix: false });
  });
  if (/^\s*[•‣▪]\s+/m.test(document.content)) add({ title: "Decorative bullet style", severity: "info", priority: "nice-to-have", category: "ats-readability", location: "Bullets", whyItMatters: "Plain hyphen bullets are safer in Markdown and text exports.", suggestedFix: "Convert decorative bullets to standard Markdown bullets.", safeAutoFix: true, fix: convertSmartBullets() });
  if (/\n{3,}/.test(document.markdown) || /[ \t]+$/m.test(document.markdown)) add({ title: "Whitespace cleanup available", severity: "info", priority: "nice-to-have", category: "ats-readability", location: "Markdown source", whyItMatters: "Clean source produces more predictable Markdown, plain text, and exports.", suggestedFix: "Remove repeated blank lines and trailing spaces.", safeAutoFix: true, fix: removeDuplicateBlankLines() });
  if (/[^\n]\s{3,}[^\n]/.test(document.markdown)) add({ title: "Repeated spaces", severity: "info", priority: "nice-to-have", category: "ats-readability", location: "Markdown source", whyItMatters: "Repeated spaces can produce odd wrapping in plain text and print exports.", suggestedFix: "Normalize repeated spaces without changing resume facts.", safeAutoFix: true, fix: normalizeRepeatedSpaces() });
  const dense = document.content.split(/\n{2,}/).filter((block) => block.split(/\s+/).length > 85 && !block.trim().startsWith("-"));
  if (dense.length) add({ title: "Dense paragraph", severity: "warning", priority: "should-improve", category: "recruiter-skim", location: "Long paragraph", whyItMatters: "Dense paragraphs are difficult for recruiters to skim.", suggestedFix: "Split into short summary lines or bullets.", safeAutoFix: false });
  if ((document.content.match(/\*\*|__/g) ?? []).length > 20) add({ title: "Excessive emphasis", severity: "info", priority: "nice-to-have", category: "formatting-risk", location: "Markdown emphasis", whyItMatters: "Too much bold/italic creates visual noise and can make plain text less readable.", suggestedFix: "Reserve emphasis for role titles, companies, or a few key terms.", safeAutoFix: false });
  const { fontSizePx, marginHorizontalPx, marginVerticalPx, lineHeight } = document.frontmatter;
  if (fontSizePx && fontSizePx < 11) add({ title: "Tiny font setting", severity: "warning", priority: "should-improve", category: "export-safety", location: "Design settings", whyItMatters: "Tiny fonts hurt readability and print/export quality.", suggestedFix: "Use 11-14px body text for most templates.", safeAutoFix: false });
  if ((marginHorizontalPx && marginHorizontalPx > 95) || (marginVerticalPx && marginVerticalPx > 95)) add({ title: "Large margins may waste space", severity: "info", priority: "nice-to-have", category: "export-safety", location: "Design settings", whyItMatters: "Very large margins can force unnecessary page overflow.", suggestedFix: "Use moderate margins unless the resume is intentionally sparse.", safeAutoFix: false });
  if (lineHeight && lineHeight > 1.8) add({ title: "Loose line spacing", severity: "info", priority: "nice-to-have", category: "export-safety", location: "Design settings", whyItMatters: "Loose line spacing can cause page overflow.", suggestedFix: "Use line spacing near 1.2-1.55 for resumes.", safeAutoFix: false });
  return issues;
};
