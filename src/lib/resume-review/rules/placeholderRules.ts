import { uid } from "../../utils";
import type { ResumeReviewIssue, ResumeReviewRule } from "../types";

const issue = (patch: Omit<ResumeReviewIssue, "id">): ResumeReviewIssue => ({ id: uid("review"), ...patch });

const starterPlaceholderPatterns: Array<[RegExp, string]> = [
  [/\bYour Name\b/i, "candidate name"],
  [/\bTarget Role\b/i, "target role"],
  [/\byou@example\.com\b/i, "starter email"],
  [/\bCity,\s*State\b/i, "starter location"],
  [/linkedin\.com\/in\/your-profile/i, "starter LinkedIn URL"],
  [/\bBrief professional summary using only truthful scope/i, "starter summary"],
  [/\bRole\s*-\s*Company\b/i, "starter role/company"],
  [/\bStart Date\s*-\s*End Date\b/i, "starter dates"],
  [/\bAction\s+\+\s+scope\s+\+\s+method\s+\+\s+result\b/i, "starter achievement bullet"],
  [/\bDescribe tools, stakeholders, or operational context truthfully\b/i, "starter context bullet"],
  [/\bSkill group:\s*Skill\b/i, "starter skills"],
  [/\bDegree or credential,\s*Institution\b/i, "starter education"],
  [/\[add metric[^\]]*\]/i, "metric placeholder"],
];

export const placeholderRules: ResumeReviewRule = (document) => {
  const found = starterPlaceholderPatterns
    .filter(([pattern]) => pattern.test(document.markdown))
    .map(([, label]) => label);

  if (!found.length) return [];

  const labels = [...new Set(found)];
  return [issue({
    title: "Starter placeholders still present",
    severity: "critical",
    priority: "must-fix",
    category: "export-safety",
    location: "Pre-export check",
    whyItMatters: "Starter placeholders can accidentally be sent to employers and make the resume look unfinished.",
    suggestedFix: `Replace or remove these placeholders before exporting: ${labels.join(", ")}.`,
    safeAutoFix: false,
  })];
};
