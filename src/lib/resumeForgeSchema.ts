import type { ResumeDocument } from "./types";
import { parseFrontmatter, parseStructuredResume } from "./markdown";
import { nowIso } from "./utils";

export const resumeForgeResumeSchemaVersion = 1;
export const resumeForgeResumeSchemaUrl = "https://resume-studio.local/schema/resume-studio-resume-v1.json";

export interface ResumeForgeResumeFile {
  $schema: string;
  appName: "Resume Studio" | "Resume Forge";
  kind: "resume";
  schemaVersion: number;
  exportedAt: string;
  resume: ResumeDocument;
  frontmatter: ReturnType<typeof parseFrontmatter>["frontmatter"];
  structured: ReturnType<typeof parseStructuredResume>;
}

export const resumeForgeResumeJsonSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: resumeForgeResumeSchemaUrl,
  title: "Resume Studio Resume",
  type: "object",
  required: ["appName", "kind", "schemaVersion", "exportedAt", "resume"],
  properties: {
    $schema: { type: "string" },
    appName: { const: "Resume Studio" },
    kind: { const: "resume" },
    schemaVersion: { type: "integer", minimum: 1 },
    exportedAt: { type: "string", format: "date-time" },
    resume: {
      type: "object",
      required: ["id", "title", "markdown", "templateId", "pageSize", "createdAt", "updatedAt"],
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        targetRole: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        markdown: { type: "string" },
        privateNotes: { type: "string", description: "Private notes. Never rendered in resume exports." },
        templateId: { type: "string" },
        pageSize: { enum: ["letter", "a4"] },
        createdAt: { type: "string" },
        updatedAt: { type: "string" },
        versions: { type: "array" },
        jobTargets: { type: "array" },
        applications: { type: "array" },
      },
      additionalProperties: true,
    },
    frontmatter: { type: "object", additionalProperties: true },
    structured: { type: "object", additionalProperties: true },
  },
  additionalProperties: false,
} as const;

export const createResumeForgeResumeFile = (resume: ResumeDocument): ResumeForgeResumeFile => ({
  $schema: resumeForgeResumeSchemaUrl,
  appName: "Resume Studio",
  kind: "resume",
  schemaVersion: resumeForgeResumeSchemaVersion,
  exportedAt: nowIso(),
  resume: {
    ...resume,
    privateNotes: resume.privateNotes ?? "",
    ownerType: "user",
  },
  frontmatter: parseFrontmatter(resume.markdown).frontmatter,
  structured: parseStructuredResume(resume.markdown),
});

export const parseResumeForgeResumeFile = (source: string): ResumeForgeResumeFile | null => {
  try {
    const parsed = JSON.parse(source) as Partial<ResumeForgeResumeFile>;
    if (
      (parsed?.appName !== "Resume Studio" && parsed?.appName !== "Resume Forge") ||
      parsed?.kind !== "resume" ||
      !parsed.resume?.markdown
    )
      return null;
    return {
      $schema: parsed.$schema ?? resumeForgeResumeSchemaUrl,
      appName: "Resume Studio",
      kind: "resume",
      schemaVersion: parsed.schemaVersion ?? 1,
      exportedAt: parsed.exportedAt ?? nowIso(),
      resume: parsed.resume,
      frontmatter: parsed.frontmatter ?? parseFrontmatter(parsed.resume.markdown).frontmatter,
      structured: parsed.structured ?? parseStructuredResume(parsed.resume.markdown),
    };
  } catch {
    return null;
  }
};
