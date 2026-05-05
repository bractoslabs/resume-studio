import MarkdownIt from "markdown-it";
import DOMPurify from "dompurify";
import { z } from "zod";
import YAML from "yaml";
import type { FrontmatterParseResult, RenderResult, RenderWarning, ResumeFrontmatter, StructuredResume } from "./types";
import { uid } from "./utils";

const frontmatterSchema = z.object({
  name: z.string().default("Untitled Candidate"),
  title: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  location: z.string().optional(),
  links: z.array(z.string()).optional(),
  targetRole: z.string().optional(),
  pageSize: z.enum(["letter", "a4"]).optional(),
  template: z.string().optional(),
  theme: z.string().optional(),
  font: z.string().optional(),
  cjkFont: z.string().optional(),
  accentColor: z.string().optional(),
  fontSizePx: z.coerce.number().min(8).max(30).optional(),
  marginVerticalPx: z.coerce.number().min(0).max(160).optional(),
  marginHorizontalPx: z.coerce.number().min(0).max(160).optional(),
  paragraphSpacingPx: z.coerce.number().min(0).max(80).optional(),
  lineHeight: z.coerce.number().min(0.9).max(2.4).optional(),
});

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: false,
});

const safeUriPattern = /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i;

const techTerms: Record<string, string> = {
  github: "GitHub",
  javascript: "JavaScript",
  typescript: "TypeScript",
  postgres: "PostgreSQL",
  postgresql: "PostgreSQL",
  nodejs: "Node.js",
  "node.js": "Node.js",
  reactjs: "React",
  kubernetes: "Kubernetes",
  aws: "AWS",
  azure: "Azure",
  gcp: "GCP",
  cicd: "CI/CD",
};

export const normalizeTechTerms = (text: string) =>
  text.replace(
    /\b(github|javascript|typescript|postgres|postgresql|nodejs|node\.js|reactjs|kubernetes|aws|azure|gcp|cicd)\b/gi,
    (match) => {
      const key = match.toLowerCase();
      return techTerms[key] ?? match;
    },
  );

const stripHtml = (html: string) => {
  if (typeof document === "undefined") {
    return html
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  const node = document.createElement("div");
  node.innerHTML = html;
  return node.textContent ?? "";
};

const sanitizeHtml = (html: string) => {
  const purifier = DOMPurify as unknown as { sanitize?: (dirty: string, config?: Record<string, unknown>) => string };
  if (typeof purifier.sanitize === "function") {
    return purifier.sanitize(html, {
      ADD_TAGS: ["span", "div"],
      ADD_ATTR: ["class", "aria-label", "aria-hidden"],
      ALLOWED_URI_REGEXP: safeUriPattern,
    });
  }
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<svg[\s\S]*?>[\s\S]*?<\/svg>/gi, "")
    .replace(/<svg[\s\S]*?>/gi, "")
    .replace(/&lt;script[\s\S]*?&lt;\/script&gt;/gi, "")
    .replace(/\son\w+=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(
      /\s(?:href|src)=(?:"(?:javascript|data|vbscript):[^"]*"|'(?:javascript|data|vbscript):[^']*'|(?:javascript|data|vbscript):[^\s>]+)/gi,
      "",
    )
    .replace(/javascript:/gi, "");
};

const preprocessDirectives = (source: string, warnings: RenderWarning[], atsMode: boolean) => {
  let markdown = normalizeTechTerms(source);
  markdown = markdown.replace(/^\\newpage\s*$/gm, '<div class="page-break" aria-hidden="true"></div>');
  markdown = markdown.replace(/\{\{pagebreak\}\}/g, '<div class="page-break" aria-hidden="true"></div>');
  markdown = markdown.replace(/\{\{icon:([a-z0-9-]+)\}\}/gi, (_all, icon) => {
    warnings.push({ severity: "info", message: `Icon directive rendered as text-safe label: ${icon}`, location: "directive" });
    return atsMode ? ` ${icon} ` : `<span class="resume-icon" aria-label="${icon}">${icon}</span>`;
  });
  markdown = markdown.replace(/\{\{section:([a-z0-9 -]+)\}\}/gi, (_all, section) => `\n## ${section}\n`);
  markdown = markdown.replace(/\{\{atsOnly\}\}([\s\S]*?)\{\{\/atsOnly\}\}/gi, (_all, content) =>
    atsMode ? content : `<span class="ats-only">${content}</span>`,
  );
  markdown = markdown.replace(/\{\{hideForAts\}\}([\s\S]*?)\{\{\/hideForAts\}\}/gi, (_all, content) => (atsMode ? "" : content));
  markdown = markdown.replace(/\[\[ref:([^\]]+)\]\]/g, (_all, ref) => `(${ref})`);
  if (/\|.+\|/.test(markdown)) {
    warnings.push({
      severity: "warning",
      message: "Tables can reduce ATS parseability. Prefer simple bullet lists for critical qualifications.",
      location: "tables",
    });
  }
  return markdown;
};

const defaultFrontmatter: ResumeFrontmatter = { name: "Untitled Candidate", pageSize: "letter", template: "ats-classic" };

const normalizeIntroLine = (line: string) =>
  line
    .replace(/^#+\s*/, "")
    .replace(/[*_`[\]()]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const removeDuplicateIntroLine = (source: string, frontmatter: ResumeFrontmatter) => {
  const duplicates = [frontmatter.name, frontmatter.title].filter(Boolean).map((value) => normalizeIntroLine(value ?? ""));
  if (!duplicates.length) return source;
  const lines = source.split("\n");
  const firstContentIndex = lines.findIndex((line) => line.trim());
  if (firstContentIndex === -1) return source;
  if (lines[firstContentIndex].trim().startsWith("##")) return source;
  if (!duplicates.includes(normalizeIntroLine(lines[firstContentIndex]))) return source;
  return [...lines.slice(0, firstContentIndex), ...lines.slice(firstContentIndex + 1)].join("\n").trimStart();
};

export const parseFrontmatter = (markdown: string): FrontmatterParseResult => {
  const warnings: RenderWarning[] = [];
  try {
    const match = markdown.match(/^\s*---\n([\s\S]*?)\n---\n?/);
    const data = match ? (YAML.parse(match[1]) ?? {}) : {};
    const content = match ? markdown.slice(match[0].length).trimStart() : markdown;
    const result = frontmatterSchema.safeParse(data);
    if (!match) {
      warnings.push({
        severity: "info",
        message: "No YAML frontmatter found. Add contact fields for better exports and ATS review.",
        location: "frontmatter",
      });
    }
    if (!result.success) {
      warnings.push({ severity: "warning", message: "Frontmatter has invalid fields; safe defaults were used.", location: "frontmatter" });
    }
    return {
      frontmatter: result.success
        ? { ...defaultFrontmatter, ...result.data }
        : { ...defaultFrontmatter, name: String(data.name ?? "Untitled Candidate") },
      content,
      warnings,
      hasFrontmatter: Boolean(match),
    };
  } catch (error) {
    warnings.push({ severity: "error", message: `Frontmatter could not be parsed: ${(error as Error).message}`, location: "frontmatter" });
    return { frontmatter: defaultFrontmatter, content: markdown, warnings, hasFrontmatter: false };
  }
};

export const updateMarkdownFrontmatter = (markdown: string, patch: Partial<ResumeFrontmatter>) => {
  const parsed = parseFrontmatter(markdown);
  const frontmatter = { ...parsed.frontmatter, ...patch };
  const yaml = YAML.stringify(frontmatter).trim();
  return `---\n${yaml}\n---\n\n${parsed.content.trimStart()}`.trimEnd() + "\n";
};

export const ensureMarkdownFrontmatter = (markdown: string, patch: Partial<ResumeFrontmatter> = {}) => {
  const parsed = parseFrontmatter(markdown);
  if (parsed.hasFrontmatter) return updateMarkdownFrontmatter(markdown, patch);
  const firstHeading = markdown.match(/^#\s+(.+)$/m)?.[1];
  return updateMarkdownFrontmatter(markdown, { name: firstHeading ?? "Imported Resume", ...patch });
};

export const renderMarkdown = (markdown: string, atsMode = false): RenderResult => {
  const parsed = parseFrontmatter(markdown);
  const warnings = [...parsed.warnings];
  const processed = preprocessDirectives(parsed.content, warnings, atsMode);
  const content = removeDuplicateIntroLine(processed, parsed.frontmatter);
  const contactLine = [
    parsed.frontmatter.email ? `[${parsed.frontmatter.email}](mailto:${parsed.frontmatter.email})` : "",
    parsed.frontmatter.phone ?? "",
    parsed.frontmatter.location ?? "",
    ...(parsed.frontmatter.links ?? [])
      .filter((link) => /^(https?:|mailto:|tel:)/i.test(link))
      .map((link) => `[${link.replace(/^https?:\/\//, "")}](${link})`),
  ]
    .filter(Boolean)
    .join(" | ");
  const headerMarkdown = parsed.hasFrontmatter
    ? `# ${parsed.frontmatter.name}\n\n${parsed.frontmatter.title ? `**${parsed.frontmatter.title}**\n\n` : ""}${contactLine}\n\n`
    : "";
  const unsafe = md.render(`${headerMarkdown}${content}`);
  const html = sanitizeHtml(unsafe);
  return {
    html,
    plainText: stripHtml(html),
    frontmatter: parsed.frontmatter,
    warnings,
  };
};

const sectionBlocks = (markdown: string) => {
  const parsed = parseFrontmatter(markdown);
  const lines = removeDuplicateIntroLine(parsed.content, parsed.frontmatter).split("\n");
  const sections: Record<string, string[]> = {};
  let current = "summary";
  sections[current] = [];
  for (const line of lines) {
    const match = line.match(/^##\s+(.+)/);
    if (match) {
      current = match[1].trim().toLowerCase();
      sections[current] = [];
    } else {
      sections[current].push(line);
    }
  }
  return sections;
};

export const parseStructuredResume = (markdown: string): StructuredResume => {
  const { frontmatter } = parseFrontmatter(markdown);
  const sections = sectionBlocks(markdown);
  const bulletsFrom = (name: string) =>
    (sections[name] ?? []).filter((line) => /^[-*]\s+/.test(line.trim())).map((line) => line.replace(/^[-*]\s+/, "").trim());
  const experienceLines = sections.experience ?? sections["professional experience"] ?? [];
  const experience = experienceLines
    .join("\n")
    .split(/\n(?=###\s+)/)
    .filter((block) => /^###\s+/m.test(block))
    .map((block) => {
      const title = block.match(/^###\s+(.+)/m)?.[1] ?? "Experience";
      const [role = title, company = ""] = title.split(/\s+[-|]\s+/);
      return {
        id: uid("exp"),
        company,
        role,
        bullets: block
          .split("\n")
          .filter((line) => /^[-*]\s+/.test(line.trim()))
          .map((line) => line.replace(/^[-*]\s+/, "").trim()),
        technologies: [],
        impactMetrics: [],
        keywords: [],
      };
    });
  return {
    contact: frontmatter,
    summary: (sections.summary ?? []).join("\n").trim(),
    experience,
    education: bulletsFrom("education").map((bullet) => ({ id: uid("edu"), title: bullet, bullets: [] })),
    skills: bulletsFrom("skills").flatMap((line) =>
      line
        .split(/,|•/)
        .map((part) => part.trim())
        .filter(Boolean),
    ),
    projects: bulletsFrom("projects").map((bullet) => ({ id: uid("project"), title: bullet, bullets: [] })),
    certifications: bulletsFrom("certifications"),
    awards: bulletsFrom("awards"),
    publications: bulletsFrom("publications"),
    languages: bulletsFrom("languages"),
    volunteer: bulletsFrom("volunteer work").map((bullet) => ({ id: uid("volunteer"), title: bullet, bullets: [] })),
    custom: [],
  };
};

export const structuredToMarkdown = (structured: StructuredResume, previousMarkdown: string) => {
  const previous = parseFrontmatter(previousMarkdown);
  const frontmatter = { ...previous.frontmatter, ...structured.contact };
  const lines = [
    "---",
    YAML.stringify(frontmatter).trim(),
    "---",
    "",
    structured.summary,
    "",
    "## Experience",
    ...structured.experience.flatMap((entry) => [
      `### ${entry.role}${entry.company ? ` - ${entry.company}` : ""}`,
      entry.location ? `_${entry.location}_` : "",
      ...entry.bullets.map((bullet) => `- ${bullet}`),
      "",
    ]),
    "## Skills",
    structured.skills.length ? `- ${structured.skills.join(", ")}` : "",
    "",
    "## Education",
    ...structured.education.map((entry) => `- ${entry.title}${entry.subtitle ? `, ${entry.subtitle}` : ""}`),
    "",
    "## Projects",
    ...structured.projects.flatMap((entry) => [
      entry.title ? `### ${entry.title}` : "",
      ...entry.bullets.map((bullet) => `- ${bullet}`),
      "",
    ]),
    "## Certifications",
    ...structured.certifications.map((item) => `- ${item}`),
    "",
    "## Awards",
    ...structured.awards.map((item) => `- ${item}`),
    "",
    "## Publications",
    ...structured.publications.map((item) => `- ${item}`),
    "",
    "## Languages",
    ...structured.languages.map((item) => `- ${item}`),
  ];
  return (
    lines
      .filter((line, index) => line !== "" || lines[index - 1] !== "")
      .join("\n")
      .trim() + "\n"
  );
};
