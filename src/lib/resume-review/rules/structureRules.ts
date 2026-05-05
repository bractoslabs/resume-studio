import { uid } from "../../utils";
import { requiredSectionGroups, standardSections } from "../data/standardSections";
import { sectionSynonyms } from "../data/sectionSynonyms";
import { removeEmptySection, renameSection } from "../fixes/safeFixes";
import type { ResumeReviewIssue, ResumeReviewRule } from "../types";

const issue = (patch: Omit<ResumeReviewIssue, "id">): ResumeReviewIssue => ({ id: uid("review"), ...patch });
const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9 ]+/g, "").trim();

export const structureRules: ResumeReviewRule = (document) => {
  const issues: ResumeReviewIssue[] = [];
  const add = (patch: Omit<ResumeReviewIssue, "id">) => issues.push(issue(patch));
  const headings = document.headings.filter((heading) => heading.level === 2);
  const normalized = headings.map((heading) => heading.normalized);
  Object.entries(requiredSectionGroups).forEach(([group, aliases]) => {
    if (!normalized.some((heading) => aliases.some((alias) => heading.includes(alias)))) {
      add({ title: `Missing ${group} section`, severity: group === "experience" ? "critical" : "warning", priority: group === "experience" ? "must-fix" : "should-improve", category: "structure", location: group, whyItMatters: "Standard resume sections make scanning and ATS parsing more predictable.", suggestedFix: `Add a truthful ${group} section or rename the equivalent section clearly.`, safeAutoFix: false });
    }
  });
  const counts = new Map<string, number>();
  headings.forEach((heading) => counts.set(normalize(heading.text), (counts.get(normalize(heading.text)) ?? 0) + 1));
  [...counts.entries()].filter(([, count]) => count > 1).forEach(([heading]) => add({ title: "Duplicate section", severity: "warning", priority: "should-improve", category: "structure", location: heading, whyItMatters: "Repeated sections can confuse reading order and make the resume feel unfinished.", suggestedFix: "Merge duplicate sections or remove the empty duplicate.", safeAutoFix: false }));
  headings.forEach((heading, index) => {
    const nextLine = headings[index + 1]?.line ?? Number.MAX_SAFE_INTEGER;
    const block = document.content.split("\n").slice(heading.line, nextLine - 1).join("\n").trim();
    if (!block || block.replace(/[#\s-]/g, "").length < 12) add({ title: "Empty section", severity: "warning", priority: "should-improve", category: "structure", location: heading.text, whyItMatters: "Empty sections make the resume look unfinished and add parser noise.", suggestedFix: "Remove the section until you have verified content to add.", safeAutoFix: true, fix: removeEmptySection(heading.text) });
    const standard = standardSections.some((section) => normalize(section) === normalize(heading.text));
    const synonym = sectionSynonyms[normalize(heading.text)];
    if (!standard && synonym) add({ title: "Non-standard heading can be normalized", severity: "info", priority: "nice-to-have", category: "structure", location: heading.text, whyItMatters: "Older ATS parsers expect common heading names.", suggestedFix: `Rename this heading to "${synonym}".`, safeAutoFix: true, fix: renameSection(heading.text, synonym) });
    if (!standard && !synonym && headings.length > 6) add({ title: "Custom section heading", severity: "info", priority: "nice-to-have", category: "structure", location: heading.text, whyItMatters: "Too many custom headings can dilute the core work story.", suggestedFix: "Keep custom sections only when they add meaningful evidence.", safeAutoFix: false });
  });
  const summary = document.content.match(/(?:^|\n)##\s+(?:summary|profile|professional summary)\s*\n([\s\S]*?)(?=\n##\s+|$)/i)?.[1] ?? "";
  if (summary.split(/\s+/).filter(Boolean).length > 90) add({ title: "Summary is too long", severity: "warning", priority: "should-improve", category: "recruiter-skim", location: "Summary", whyItMatters: "Recruiters skim summaries quickly; long paragraphs hide the value proposition.", suggestedFix: "Trim to 2-4 concise lines focused on target role, scope, and strengths.", safeAutoFix: false });
  if (document.wordCount < 260) add({ title: "Resume is very short", severity: "warning", priority: "should-improve", category: "structure", location: "Document", whyItMatters: "Very short resumes may lack enough evidence and keywords.", suggestedFix: "Add truthful scope, tools, outcomes, and relevant projects or experience.", safeAutoFix: false });
  if (document.wordCount > 1200) add({ title: "Resume may be too long", severity: "warning", priority: "should-improve", category: "recruiter-skim", location: "Document", whyItMatters: "Long resumes are harder to skim and may exceed realistic page targets.", suggestedFix: "Trim older, repeated, or less relevant bullets.", safeAutoFix: false });
  return issues;
};
