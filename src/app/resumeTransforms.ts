import type { AtsIssue, JobTarget, ResumeDocument, ResumeVersion } from "../lib/types";
import { analyzeAts, improveBulletLocal } from "../lib/ats";
import { defaultResumeMarkdown } from "../lib/defaultDraft";
import { compareResumeToJob } from "../lib/jobMatcher";
import { ensureMarkdownFrontmatter, parseFrontmatter, renderMarkdown, updateMarkdownFrontmatter } from "../lib/markdown";
import { parseResumeForgeResumeFile } from "../lib/resumeForgeSchema";
import { nowIso, uid } from "../lib/utils";
import type { ImportDraft, NewResumeSetup } from "./types";

interface JsonResumeProfile {
  network?: string;
  url?: string;
}

interface JsonResumeBasics {
  name?: string;
  label?: string;
  email?: string;
  phone?: string;
  summary?: string;
  location?: {
    city?: string;
    region?: string;
  };
  profiles?: JsonResumeProfile[];
}

interface JsonResumeWork {
  name?: string;
  position?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  highlights?: string[];
}

interface JsonResumeSkill {
  name?: string;
  keywords?: string[];
}

interface JsonResumeEducation {
  institution?: string;
  area?: string;
  studyType?: string;
}

interface JsonResumeImport {
  basics?: JsonResumeBasics;
  work?: JsonResumeWork[];
  education?: JsonResumeEducation[];
  skills?: JsonResumeSkill[];
}

export const scoreTone = (score: number) => (score >= 85 ? "good" : score >= 70 ? "warn" : "bad");

export const writeClipboard = async (text: string) => {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
};

const titleCaseSection = (value: string) => value
  .toLowerCase()
  .replace(/\b[a-z]/g, (letter) => letter.toUpperCase())
  .replace(/\bAnd\b/g, "and");

const frontmatterValue = (value = "") => JSON.stringify(value.replace(/\s+/g, " ").trim());

const monthPattern = "(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";
const datePointPattern = `(?:(?:${monthPattern})\\s+)?(?:19|20)\\d{2}|present|current|now`;
const dateRangePattern = new RegExp(`\\b(?:${datePointPattern})\\s*(?:-|–|—|to)\\s*(?:${datePointPattern})\\b`, "i");

const isImportedSectionHeading = (line: string) => (
  /^[A-Z][A-Z0-9&/.,'() -]{2,}$/.test(line) &&
  /[A-Z]/.test(line) &&
  line.length < 70
);

const isExperienceSection = (section: string) => /experience|employment|work history|career|professional background/i.test(section);

const isLikelyJobHeader = (line: string, section: string) => (
  isExperienceSection(section) &&
  dateRangePattern.test(line) &&
  !line.startsWith("- ") &&
  !line.startsWith("#") &&
  line.length <= 180
);

const formatImportedBodyLines = (lines: string[]) => {
  let currentSection = "";
  const formatted = lines.reduce<string[]>((output, line) => {
    const normalized = line.replace(/^•\s*/, "- ");
    const existingSection = normalized.match(/^##\s+(.+)$/);
    if (existingSection) {
      currentSection = existingSection[1].trim();
      output.push(normalized);
      return output;
    }
    if (isImportedSectionHeading(normalized)) {
      currentSection = titleCaseSection(normalized);
      output.push(`\n## ${currentSection}\n`);
      return output;
    }
    if (isLikelyJobHeader(normalized, currentSection)) {
      output.push(`\n### ${normalized}\n`);
      return output;
    }
    const previous = output[output.length - 1];
    if (previous?.startsWith("- ") && !normalized.startsWith("- ") && !normalized.startsWith("#")) {
      output[output.length - 1] = `${previous.replace(/-\s*$/, "-")}${previous.endsWith("-") ? "" : " "}${normalized}`;
      return output;
    }
    output.push(normalized);
    return output;
  }, []);
  return formatted
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const importedMarkdownFromText = (fileName: string, source: string) => {
  const rawLines = source
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean);
  const lines = rawLines.reduce<string[]>((merged, line) => {
    const previous = merged[merged.length - 1];
    if (previous?.endsWith("-") && /^[a-z]/.test(line)) {
      merged[merged.length - 1] = `${previous}${line}`;
      return merged;
    }
    merged.push(line);
    return merged;
  }, []);
  const firstContentLine = lines.findIndex((line) => line.length > 0);
  const name = firstContentLine >= 0 && !/^(summary|experience|education|skills|projects|certifications?)$/i.test(lines[firstContentLine])
    ? lines[firstContentLine]
    : fileName.replace(/\.[^.]+$/, "");
  const contactLine = lines.slice(firstContentLine + 1, firstContentLine + 4).find((line) => /@|\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/.test(line)) ?? "";
  const email = contactLine.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? "";
  const phone = contactLine.match(/(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}/)?.[0] ?? "";
  const location = contactLine
    .split("|")
    .map((part) => part.trim())
    .find((part) => !part.includes("@") && !/\d{3}/.test(part)) ?? "";
  const roleLine = lines.slice(firstContentLine + 1, firstContentLine + 6).find((line) => (
    line !== contactLine &&
    line !== name &&
    !line.startsWith("#") &&
    !line.startsWith("- ") &&
    !/^•/.test(line) &&
    !/^(summary|core strengths|experience|professional experience|education|skills|projects|certifications?)$/i.test(line)
  )) ?? "";
  const bodyLines = formatImportedBodyLines(
    lines.slice(firstContentLine >= 0 && lines[firstContentLine] === name ? firstContentLine + 1 : 0)
      .filter((line, index) => index > 2 || line !== contactLine),
  );

  return `---
name: ${frontmatterValue(name)}
title: ${frontmatterValue(roleLine)}
email: ${frontmatterValue(email)}
phone: ${frontmatterValue(phone)}
location: ${frontmatterValue(location)}
targetRole: ${frontmatterValue(roleLine)}
pageSize: letter
template: ats-classic
---

${bodyLines}
`;
};

export const markdownFromImport = (fileName: string, source: string) => {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".json")) {
    try {
      const resumeForge = parseResumeForgeResumeFile(source);
      if (resumeForge) return resumeForge.resume.markdown;
      const parsed = JSON.parse(source) as JsonResumeImport;
      if (parsed.basics || parsed.work || parsed.education || parsed.skills) {
        const basics = parsed.basics ?? {};
        const work = Array.isArray(parsed.work) ? parsed.work : [];
        const education = Array.isArray(parsed.education) ? parsed.education : [];
        const skills = Array.isArray(parsed.skills) ? parsed.skills : [];
        return `---
name: ${basics.name ?? "Imported Resume"}
title: ${basics.label ?? ""}
email: ${basics.email ?? ""}
phone: ${basics.phone ?? ""}
location: ${basics.location?.city ?? basics.location?.region ?? ""}
links: ${(basics.profiles ?? []).map((profile) => `\n  - ${profile.url ?? profile.network ?? ""}`).join("")}
targetRole: ${basics.label ?? ""}
pageSize: letter
template: ats-classic
---

${basics.summary ?? ""}

## Experience

${work
  .map((job) => `### ${job.position ?? "Role"} - ${job.name ?? "Company"}\n_${[job.location, job.startDate, job.endDate].filter(Boolean).join(" | ")}_\n${(job.highlights ?? []).map((item) => `- ${item}`).join("\n")}`)
  .join("\n\n")}

## Skills

${skills.map((skill) => `- ${skill.name}: ${(skill.keywords ?? []).join(", ")}`).join("\n")}

## Education

${education.map((entry) => `- ${[entry.studyType, entry.area, entry.institution].filter(Boolean).join(", ")}`).join("\n")}
`;
      }
    } catch {
      return ensureMarkdownFrontmatter(source, { name: fileName.replace(/\.[^.]+$/, "") });
    }
  }
  if (source.trimStart().startsWith("---")) return source;
  if (/\n|•|^[A-Z][A-Z0-9&/.,'() -]{2,}$/m.test(source)) return importedMarkdownFromText(fileName, source);
  return ensureMarkdownFrontmatter(source, { name: fileName.replace(/\.[^.]+$/, "") });
};

export const buildImportDraft = (fileName: string, source: string): ImportDraft => {
  const resumeForge = fileName.toLowerCase().endsWith(".json") ? parseResumeForgeResumeFile(source) : null;
  const markdown = markdownFromImport(fileName, source);
  const { content, frontmatter } = parseFrontmatter(markdown);
  const sections = [...content.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1].trim());
  const confidence = Math.min(
    98,
    42 +
      (frontmatter.name ? 14 : 0) +
      (frontmatter.email ? 10 : 0) +
      (sections.some((section) => /experience/i.test(section)) ? 14 : 0) +
      (sections.some((section) => /skills/i.test(section)) ? 10 : 0) +
      (sections.some((section) => /education/i.test(section)) ? 8 : 0),
  );
  return {
    fileName,
    source,
    markdown,
    confidence: resumeForge ? Math.max(confidence, 96) : confidence,
    sections,
    resumePatch: resumeForge ? {
      title: resumeForge.resume.title,
      targetRole: resumeForge.resume.targetRole,
      tags: resumeForge.resume.tags ?? [],
      privateNotes: resumeForge.resume.privateNotes ?? "",
      templateId: resumeForge.resume.templateId,
      pageSize: resumeForge.resume.pageSize,
      versions: resumeForge.resume.versions ?? [],
      jobTargets: resumeForge.resume.jobTargets ?? [],
      applications: resumeForge.resume.applications ?? [],
      importedSource: `Resume Studio JSON exported ${resumeForge.exportedAt}`,
    } : undefined,
  };
};

export const createResume = (kind: "blank" | "wizard" | "template" | "import" | "duplicate", source?: ResumeDocument, setup?: NewResumeSetup): ResumeDocument => {
  const timestamp = nowIso();
  const baseMarkdown =
    kind === "duplicate" && source
      ? source.markdown
      : kind === "template" || setup?.templateId === "technical"
        ? defaultResumeMarkdown.replace("template: ats-classic", "template: technical")
        : defaultResumeMarkdown;
  const setupPatch = setup ? {
    name: setup.name || "Your Name",
    title: setup.targetRole || "Target Role",
    email: setup.email,
    phone: setup.phone,
    location: setup.location || "City, State",
    targetRole: setup.targetRole || "Target Role",
    template: setup.templateId,
  } : undefined;
  const markdown = setupPatch ? updateMarkdownFrontmatter(baseMarkdown, setupPatch) : baseMarkdown;
  const title = setup?.resumeTitle.trim() || setup?.name.trim() || (kind === "duplicate" && source ? `${source.title} Copy` : kind === "wizard" ? "Guided Resume" : kind === "import" ? "Imported Resume" : "Untitled Resume");
  const targetRole = setup?.targetRole.trim() || (kind === "duplicate" ? source?.targetRole : "Target Role");
  return {
    id: uid("resume"),
    title,
    targetRole,
    tags: kind === "wizard" || setup?.startMode === "guided" ? ["guided"] : [],
    markdown,
    templateId: setup?.templateId ?? (kind === "template" ? "technical" : "ats-classic"),
    pageSize: "letter",
    createdAt: timestamp,
    updatedAt: timestamp,
    versions: [{ id: uid("version"), name: "Initial version", markdown, createdAt: timestamp, isDefault: true }],
    jobTargets: [],
    applications: [],
    privateNotes: "",
    ownerType: "user",
  };
};

export const createResumeFromImportDraft = (draft: ImportDraft): ResumeDocument => {
  const resume = createResume("import");
  const fm = parseFrontmatter(draft.markdown).frontmatter;
  return {
    ...resume,
    title: fm.name || draft.fileName.replace(/\.[^.]+$/, "") || resume.title,
    targetRole: fm.targetRole || fm.title || resume.targetRole,
    templateId: fm.template || resume.templateId,
    pageSize: fm.pageSize || resume.pageSize,
    importedSource: draft.source,
    ...draft.resumePatch,
    id: resume.id,
    markdown: draft.markdown,
    createdAt: resume.createdAt,
    updatedAt: resume.updatedAt,
    ownerType: "user",
  };
};

export const resumeChecklist = (resume: ResumeDocument, ats: ReturnType<typeof analyzeAts>, jobDescription = "") => {
  const parsed = parseFrontmatter(resume.markdown);
  const content = parsed.content;
  const headings = [...content.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1].toLowerCase());
  const hasHeading = (name: string) => headings.some((heading) => heading.includes(name));
  return [
    { id: "contact", label: "Contact info complete", done: Boolean(parsed.frontmatter.email && parsed.frontmatter.phone && parsed.frontmatter.location) },
    { id: "summary", label: "Summary added", done: content.split(/^##\s+/m)[0]?.trim().length > 80 },
    { id: "experience", label: "Experience added", done: hasHeading("experience") && /###\s+/.test(content) },
    { id: "skills", label: "Skills added", done: hasHeading("skills") },
    { id: "review", label: "Resume reviewed", done: Boolean(resume.reviewMeta?.lastReviewedAt) },
    { id: "job", label: "Job target added", done: resume.jobTargets.length > 0 || jobDescription.trim().length > 0 },
    { id: "export", label: "Export tested", done: resume.versions.some((version) => /export/i.test(version.notes ?? version.name)) },
    { id: "version", label: "Version saved", done: resume.versions.length > 1 },
  ];
};

export const intelligenceScores = (markdown: string, ats: ReturnType<typeof analyzeAts>, jobMatch: ReturnType<typeof compareResumeToJob> | null) => {
  const text = renderMarkdown(markdown, true).plainText;
  const bullets = parseFrontmatter(markdown).content.split("\n").filter((line) => /^[-*]\s+/.test(line.trim()));
  const withMetrics = bullets.filter((bullet) => /\d|%|\$|reduced|increased|improved|saved|grew/i.test(bullet)).length;
  const longParagraphs = text.split("\n").filter((line) => line.length > 280).length;
  return {
    recruiterSkim: Math.max(45, Math.min(100, 96 - longParagraphs * 9 - Math.max(0, bullets.length - 18) * 2)),
    impact: bullets.length ? Math.round((withMetrics / bullets.length) * 100) : 45,
    keywordFit: jobMatch?.score ?? ats.scores.keywords,
    formattingRisk: ats.scores.formatting,
  };
};

export const duplicateSectionIssues = (markdown: string): AtsIssue[] => {
  const headings = [...parseFrontmatter(markdown).content.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1].trim().toLowerCase());
  const counts = headings.reduce<Record<string, number>>((acc, heading) => ({ ...acc, [heading]: (acc[heading] ?? 0) + 1 }), {});
  return Object.entries(counts)
    .filter(([, count]) => count > 1)
    .map(([heading]) => ({
      id: uid("issue"),
      severity: "warning" as const,
      category: "Sections",
      location: heading,
      explanation: "This section appears more than once, which can confuse skim readers and resume parsers.",
      suggestedFix: "Merge duplicate sections into one clearly labeled section.",
    }));
};

export const emptySectionIssues = (markdown: string): AtsIssue[] => {
  const content = parseFrontmatter(markdown).content;
  const matches = [...content.matchAll(/^##\s+(.+)\n([\s\S]*?)(?=\n##\s+|$)/gm)];
  return matches
    .filter(([, , body]) => body.replace(/[#_*`\-\s]/g, "").trim().length === 0)
    .map((match) => ({
      id: uid("issue"),
      severity: "info" as const,
      category: "Content",
      location: match[1].trim(),
      explanation: "This section is empty and makes the resume feel unfinished.",
      suggestedFix: "Remove the section until you have verified content to add.",
      apply: (source: string) => source.replace(match[0], "").replace(/\n{3,}/g, "\n\n"),
    }));
};

export const pageCountEstimate = (plainText: string) => Math.max(1, Math.ceil(plainText.length / 3300));
export const timeOnly = (iso: string) => new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(iso));

export const dedupeIssues = (issues: AtsIssue[]) => {
  const seen = new Set<string>();
  return issues.filter((issue) => {
    const key = `${issue.category}:${issue.location}:${issue.explanation}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const documentStyle = (_templateId: string) => `.resume-page{font-family:Arial,sans-serif;color:#111}.resume-content h1{text-align:center}.page-break{break-before:page}`;

export { improveBulletLocal };
