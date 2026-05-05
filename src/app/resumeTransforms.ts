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

const titleCaseSection = (value: string) =>
  value
    .toLowerCase()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase())
    .replace(/\bAnd\b/g, "and");

const frontmatterValue = (value = "") => JSON.stringify(value.replace(/\s+/g, " ").trim());

const monthPattern =
  "(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";
const datePointPattern = `(?:(?:${monthPattern})[\\s-]+)?(?:19|20)\\d{2}|present|current|now`;
const dateRangePattern = new RegExp(`\\b(?:${datePointPattern})\\s*(?:-|–|—|to)\\s*(?:${datePointPattern})\\b`, "i");
const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const phonePattern = /(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}/;
const loosePhonePattern = /(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]*\d{3}[\s.-]*\d[\s.-]*\d{3}/;
const locationPattern = /\b[A-Z][A-Za-z .'-]+,\s*[A-Z]{2}\b/;

const importedSectionAliases = [
  "professional experience",
  "recent professional experience",
  "work experience",
  "employment history",
  "career history",
  "selected highlights",
  "highlights",
  "summary",
  "professional summary",
  "profile",
  "core competencies",
  "competencies",
  "skills",
  "technical skills",
  "selected recent publications",
  "selected publications",
  "publications",
  "education",
  "certifications",
  "projects",
  "awards",
] as const;

const importedSectionAliasPattern = new RegExp(`\\b(${importedSectionAliases.join("|").replace(/\s+/g, "\\s+")})\\b`, "gi");

const normalizeImportedSectionName = (section: string) => {
  const normalized = section.replace(/\s+/g, " ").trim();
  if (/recent professional experience/i.test(normalized)) return "Professional Experience";
  if (/selected recent publications|selected publications/i.test(normalized)) return "Selected Publications";
  if (/core competencies|competencies|technical skills|skills/i.test(normalized)) return "Skills";
  if (/selected highlights|highlights/i.test(normalized)) return "Highlights";
  if (/professional summary|profile|summary/i.test(normalized)) return "Summary";
  return titleCaseSection(normalized);
};

const isImportedSectionHeading = (line: string) =>
  (/^[A-Z][A-Z0-9&/.,'() -]{2,}$/.test(line) && /[A-Z]/.test(line) && line.length < 70) ||
  importedSectionAliases.some((section) => section.toLowerCase() === line.toLowerCase());

const isExperienceSection = (section: string) => /experience|employment|work history|career|professional background/i.test(section);

const isLikelyJobHeader = (line: string, section: string) =>
  isExperienceSection(section) &&
  dateRangePattern.test(line) &&
  !line.startsWith("- ") &&
  !line.startsWith("#") &&
  line.length <= 220 &&
  !/^[^|]+:\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|(?:19|20)\d{2})/i.test(line);

const splitInlineImportedSections = (line: string) => {
  const normalized = line.replace(/[ \t]+/g, " ").trim();
  if (!normalized || normalized.startsWith("#") || normalized.startsWith("- ")) return [normalized].filter(Boolean);
  const output: string[] = [];
  let remaining = normalized;
  let safety = 0;
  while (remaining && safety < 8) {
    safety += 1;
    const matches = [...remaining.matchAll(importedSectionAliasPattern)];
    const match = matches.find((candidate) => {
      const text = candidate[0];
      const isSingleWord = !/\s/.test(text);
      return isSingleWord
        ? (candidate.index ?? 0) === 0 || text === text.toUpperCase()
        : /^[A-Z]/.test(text) || text === text.toUpperCase();
    });
    if (!match || match.index === undefined) {
      output.push(remaining);
      break;
    }
    const before = remaining.slice(0, match.index).trim();
    const section = normalizeImportedSectionName(match[0]);
    if (before) output.push(before);
    output.push(`## ${section}`);
    remaining = remaining.slice(match.index + match[0].length).trim();
  }
  return output.filter(Boolean);
};

const splitInlineExperienceRuns = (line: string, currentSection: string) => {
  if (!isExperienceSection(currentSection) || line.startsWith("#") || line.startsWith("- ")) return [line];
  const companyPattern =
    /(?=\b[A-Z][A-Za-z0-9&.,'()/ -]{2,80}\s*\|\s*[A-Z][A-Za-z .'-]+,\s*(?:[A-Z]{2}|[A-Z][A-Za-z ]+)\s*\|\s*(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?|(?:19|20)\d{2})[A-Za-z0-9\s-]*(?:-|–|—|to)\s*(?:Present|Current|Now|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?|(?:19|20)\d{2})[A-Za-z0-9\s-]*))/g;
  const starts = [...line.matchAll(companyPattern)]
    .map((match) => match.index ?? 0)
    .filter((index) => {
      const header = line.slice(index, line.indexOf("|", index)).trim();
      const words = header.split(/\s+/).filter(Boolean);
      return header && header.length <= 65 && words.length <= 7 && !/[.!?]/.test(header);
    })
    .reduce<number[]>((accepted, index) => {
      const previous = accepted[accepted.length - 1];
      if (previous !== undefined && index < line.indexOf("|", previous)) return accepted;
      accepted.push(index);
      return accepted;
    }, [])
    .filter((index) => index > 0);
  if (!starts.length) return [line];

  const splitAt = [0, ...starts, line.length];
  return splitAt
    .slice(0, -1)
    .map((start, index) => line.slice(start, splitAt[index + 1]).trim())
    .filter(Boolean);
};

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
    const expandedLines = splitInlineExperienceRuns(normalized, currentSection);
    if (expandedLines.length > 1) {
      expandedLines.forEach((expandedLine) => {
        if (isLikelyJobHeader(expandedLine, currentSection)) {
          output.push(`\n### ${expandedLine}\n`);
        } else {
          output.push(expandedLine);
        }
      });
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

const importLayoutLabels = /^(contact|profile|summary|skills?|tools?|certs?|certifications?|education|experience|projects?)$/i;
const roleWords =
  /\b(manager|specialist|technician|analyst|engineer|architect|scientist|executive|consultant|founder|president|co-founder|cofounder|coo|ceo|cto|cio|coordinator|assistant|developer|director|officer|lead|support|success|planner|operations?|marketing|service|network|cloud|cybersecurity|financial|clinic|warehouse|product|project|supply|chain|data|hr)\b/i;

const normalizeImportedSource = (source: string) =>
  source
    .replace(/\r\n?/g, "\n")
    .replace(/<\s*br\s*\/?\s*\n?\s*>/gi, "\n")
    .replace(/<\/?[^>\n]+>/g, " ");

const normalizeImportedLine = (line: string) =>
  line
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/(?:__|\*\*)/g, "")
    .replace(/^\*(.+)\*$/, "$1")
    .replace(/[ \t]+/g, " ")
    .trim();

const contactStartIndex = (line: string) => {
  const indexes = [
    line.search(emailPattern),
    line.search(phonePattern),
    line.search(/\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.[a-z]{2,}\S*/i),
  ].filter((index) => index >= 0);
  return indexes.length ? Math.min(...indexes) : -1;
};

const lineWithoutContactDetails = (line: string) => {
  const contactIndex = contactStartIndex(line);
  return (contactIndex >= 0 ? line.slice(0, contactIndex) : line).split("|")[0].trim();
};

const isContactLikeLine = (line: string) =>
  emailPattern.test(line) || phonePattern.test(line) || /\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.[a-z]{2,}\S*/i.test(line);

const isLikelyImportedName = (line: string) => {
  const candidate = lineWithoutContactDetails(line);
  if (!candidate || importLayoutLabels.test(candidate) || isContactLikeLine(candidate) || roleWords.test(candidate)) return false;
  const words = candidate.split(/\s+/).filter(Boolean);
  return words.length >= 2 && words.length <= 4 && words.every((word) => /^[A-Z][A-Za-z.'-]*$/.test(word) || /^[A-Z]{2,}$/.test(word));
};

const importedNameCandidate = (line: string) => (isLikelyImportedName(line) ? lineWithoutContactDetails(line) : "");

const importedRoleCandidate = (line: string) => {
  const candidate = lineWithoutContactDetails(line);
  if (
    !candidate ||
    candidate.length > 140 ||
    /[.!?]/.test(candidate) ||
    candidate.length < 3 ||
    phonePattern.test(candidate) ||
    loosePhonePattern.test(candidate) ||
    /^\(?\d/.test(candidate) ||
    importLayoutLabels.test(candidate) ||
    isLikelyImportedName(candidate) ||
    locationPattern.test(candidate) ||
    /^[=_-]{3,}$/.test(candidate) ||
    candidate.startsWith("#") ||
    candidate.startsWith("- ") ||
    /^•/.test(candidate)
  ) {
    return "";
  }
  return candidate;
};

const lineWithoutObviousContact = (line: string) =>
  line
    .replace(emailPattern, " ")
    .replace(phonePattern, " ")
    .replace(loosePhonePattern, " ")
    .replace(/\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.[a-z]{2,}\S*/gi, " ")
    .replace(locationPattern, " ")
    .replace(/\|/g, " ")
    .replace(/🕿|🖂/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const isHeaderNoiseLine = (line: string, name: string, roleLine: string) => {
  const candidate = lineWithoutContactDetails(line);
  if (!candidate) return true;
  if (line.startsWith("##") || isImportedSectionHeading(line)) return false;
  if (candidate === name || candidate === roleLine) return true;
  if (isContactLikeLine(line)) {
    const remaining = lineWithoutObviousContact(line);
    return !(remaining.length > 100 && /[.!?]/.test(remaining));
  }
  if (locationPattern.test(candidate)) return true;
  if (/^(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.[a-z]{2,}\S*$/i.test(candidate)) return true;
  return candidate.length <= 120 && !/[.!?]/.test(candidate) && !line.startsWith("##") && !line.startsWith("- ");
};

const importedMarkdownFromText = (fileName: string, source: string) => {
  const rawLines = normalizeImportedSource(source)
    .split("\n")
    .map(normalizeImportedLine)
    .flatMap(splitInlineImportedSections)
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
  const nameMatchIndex = lines.slice(0, 12).findIndex((line) => importedNameCandidate(line));
  const nameIndex = nameMatchIndex >= 0 ? nameMatchIndex : firstContentLine;
  const fallbackName = fileName.replace(/\.[^.]+$/, "");
  const name =
    nameIndex >= 0 && importedNameCandidate(lines[nameIndex])
      ? importedNameCandidate(lines[nameIndex])
      : firstContentLine >= 0 && !importLayoutLabels.test(lines[firstContentLine])
        ? lineWithoutContactDetails(lines[firstContentLine]) || fallbackName
        : fallbackName;
  const contactBlock = lines.slice(0, Math.min(lines.length, 12)).join(" | ");
  const contactBlockCompact = contactBlock.replace(/\s*\|\s*/g, " ");
  const contactLine = lines.slice(0, Math.min(lines.length, 12)).find((line) => isContactLikeLine(line)) ?? "";
  const email =
    contactBlock.match(emailPattern)?.[0] ??
    contactBlock
      .match(/([A-Z0-9._%+-]+@[A-Z0-9.-]+)\s*\|\s*[^|]{2,60}\|\s*(\.[A-Z]{2,})/i)
      ?.slice(1)
      .join("") ??
    "";
  const phone = contactBlockCompact.match(phonePattern)?.[0] ?? contactBlockCompact.match(loosePhonePattern)?.[0] ?? "";
  const location = contactBlock.match(locationPattern)?.[0] ?? "";
  const roleLine =
    lines
      .slice(Math.max(0, nameIndex + 1), Math.max(0, nameIndex + 9))
      .map(importedRoleCandidate)
      .find((line) => line && line !== contactLine && line !== name) ?? "";
  const firstSectionIndex = lines.findIndex((line, index) => index > nameIndex && line.startsWith("## "));
  const firstNarrativeIndex = lines.findIndex(
    (line, index) => index > nameIndex && (firstSectionIndex < 0 || index < firstSectionIndex) && !isHeaderNoiseLine(line, name, roleLine),
  );
  const bodyStartIndex =
    firstNarrativeIndex >= 0 ? firstNarrativeIndex : firstSectionIndex >= 0 ? firstSectionIndex : nameIndex >= 0 ? nameIndex + 1 : 0;
  const bodyLines = formatImportedBodyLines(lines.slice(bodyStartIndex).filter((line, index) => index > 2 || line !== contactLine));

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

const detectedImportSections = (content: string) => [...content.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1].trim());

const sourceHasImportedSectionHeading = (source: string) =>
  source
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .some((line) => isImportedSectionHeading(line.replace(/[ \t]+/g, " ").trim()));

const sourceHasDatedJobHeader = (source: string) =>
  source
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .some((line) => dateRangePattern.test(line.trim()) && !/^[-*•]\s+/.test(line.trim()));

const importReviewNotes = (
  fileName: string,
  source: string,
  markdown: string,
  sections: string[],
  resumeForge: ReturnType<typeof parseResumeForgeResumeFile>,
) => {
  const { frontmatter } = parseFrontmatter(markdown);
  const bulletCount = (markdown.match(/^\s*[-*]\s+/gm) ?? []).length;
  const repairedFields = [
    resumeForge ? "Restored Resume Studio JSON metadata" : "",
    fileName.toLowerCase().endsWith(".json") && !resumeForge ? "Converted JSON Resume fields to Resume Studio Markdown" : "",
    !source.trimStart().startsWith("---") ? "Added Resume Studio frontmatter" : "",
    /•/.test(source) ? "Converted bullet symbols to Markdown bullets" : "",
    sourceHasImportedSectionHeading(source) ? "Converted plain-text headings to Markdown sections" : "",
    sourceHasDatedJobHeader(source) ? "Marked dated experience lines as job entries" : "",
  ].filter(Boolean);
  const ignoredFields = [
    frontmatter.name ? "" : "Name not detected",
    frontmatter.email ? "" : "Email not detected",
    frontmatter.phone ? "" : "Phone not detected",
    frontmatter.location ? "" : "Location not detected",
    sections.length ? "" : "Standard sections not detected",
    bulletCount ? "" : "Resume bullets not detected",
  ].filter(Boolean);
  return {
    contact: {
      name: frontmatter.name ?? "",
      title: frontmatter.title ?? frontmatter.targetRole ?? "",
      email: frontmatter.email ?? "",
      phone: frontmatter.phone ?? "",
      location: frontmatter.location ?? "",
    },
    bulletCount,
    ignoredFields,
    repairedFields: [...new Set(repairedFields)],
  };
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
  .map(
    (job) =>
      `### ${job.position ?? "Role"} - ${job.name ?? "Company"}\n_${[job.location, job.startDate, job.endDate].filter(Boolean).join(" | ")}_\n${(job.highlights ?? []).map((item) => `- ${item}`).join("\n")}`,
  )
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
  const sections = detectedImportSections(content);
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
    review: importReviewNotes(fileName, source, markdown, sections, resumeForge),
    resumePatch: resumeForge
      ? {
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
        }
      : undefined,
  };
};

export const createResume = (
  kind: "blank" | "wizard" | "template" | "import" | "duplicate",
  source?: ResumeDocument,
  setup?: NewResumeSetup,
): ResumeDocument => {
  const timestamp = nowIso();
  const baseMarkdown =
    kind === "duplicate" && source
      ? source.markdown
      : kind === "template" || setup?.templateId === "technical"
        ? defaultResumeMarkdown.replace("template: ats-classic", "template: technical")
        : defaultResumeMarkdown;
  const setupPatch = setup
    ? {
        name: setup.name || "Your Name",
        title: setup.targetRole || "Target Role",
        email: setup.email,
        phone: setup.phone,
        location: setup.location || "City, State",
        targetRole: setup.targetRole || "Target Role",
        template: setup.templateId,
      }
    : undefined;
  const markdown = setupPatch ? updateMarkdownFrontmatter(baseMarkdown, setupPatch) : baseMarkdown;
  const title =
    setup?.resumeTitle.trim() ||
    setup?.name.trim() ||
    (kind === "duplicate" && source
      ? `${source.title} Copy`
      : kind === "wizard"
        ? "Guided Resume"
        : kind === "import"
          ? "Imported Resume"
          : "Untitled Resume");
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
    {
      id: "contact",
      label: "Contact info complete",
      done: Boolean(parsed.frontmatter.email && parsed.frontmatter.phone && parsed.frontmatter.location),
    },
    { id: "summary", label: "Summary added", done: content.split(/^##\s+/m)[0]?.trim().length > 80 },
    { id: "experience", label: "Experience added", done: hasHeading("experience") && /###\s+/.test(content) },
    { id: "skills", label: "Skills added", done: hasHeading("skills") },
    { id: "job", label: "Job target added", done: resume.jobTargets.length > 0 || jobDescription.trim().length > 0 },
  ];
};

export const intelligenceScores = (
  markdown: string,
  ats: ReturnType<typeof analyzeAts>,
  jobMatch: ReturnType<typeof compareResumeToJob> | null,
) => {
  const text = renderMarkdown(markdown, true).plainText;
  const bullets = parseFrontmatter(markdown)
    .content.split("\n")
    .filter((line) => /^[-*]\s+/.test(line.trim()));
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

export const documentStyle = (_templateId: string) =>
  `.resume-page{font-family:Arial,sans-serif;color:#111}.resume-content h1{text-align:center}.page-break{break-before:page}`;

export { improveBulletLocal };
