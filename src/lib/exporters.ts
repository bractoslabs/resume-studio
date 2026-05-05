import YAML from "yaml";
import type { AppState, ResumeDocument } from "./types";
import { renderMarkdown, parseFrontmatter, parseStructuredResume } from "./markdown";
import { createResumeForgeResumeFile } from "./resumeForgeSchema";
import { downloadBlob, slugify } from "./utils";
import { backupFilename, serializeBackup } from "./storage";

export const jsonResumeFromMarkdown = (resume: ResumeDocument) => {
  const render = renderMarkdown(resume.markdown, true);
  const fm = render.frontmatter;
  const structured = parseStructuredResume(resume.markdown);
  return {
    basics: {
      name: fm.name,
      label: fm.title,
      email: fm.email,
      phone: fm.phone,
      location: { city: fm.location },
      profiles: (fm.links ?? []).map((url) => ({ url })),
    },
    summary: structured.summary || render.plainText.split("\n").slice(0, 4).join(" "),
    work: structured.experience.map((entry) => ({
      name: entry.company,
      position: entry.role,
      location: entry.location,
      startDate: entry.startDate,
      endDate: entry.endDate,
      highlights: entry.bullets,
    })),
    education: structured.education.map((entry) => ({ institution: entry.title, area: entry.subtitle, studyType: entry.meta })),
    skills: structured.skills.length ? [{ name: "Skills", keywords: structured.skills }] : [],
    projects: structured.projects.map((entry) => ({ name: entry.title, description: entry.subtitle, highlights: entry.bullets })),
    certificates: structured.certifications.map((name) => ({ name })),
    awards: structured.awards.map((title) => ({ title })),
    publications: structured.publications.map((name) => ({ name })),
    meta: {
      title: resume.title,
      targetRole: resume.targetRole,
      tags: resume.tags,
      source: "Resume Studio Markdown",
    },
  };
};

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const htmlDocument = (resume: ResumeDocument, renderedHtml: string, style = "") => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(resume.title)}</title>
  <style>${style}</style>
</head>
<body><main class="resume-page page-${resume.pageSize} template-${escapeHtml(resume.templateId)}"><div class="resume-content">${renderedHtml}</div></main></body>
</html>`;

export const exportMarkdown = (resume: ResumeDocument) =>
  downloadBlob(new Blob([resume.markdown], { type: "text/markdown;charset=utf-8" }), `${slugify(resume.title)}.md`);

export const exportPlainText = (resume: ResumeDocument) =>
  downloadBlob(new Blob([renderMarkdown(resume.markdown, true).plainText], { type: "text/plain;charset=utf-8" }), `${slugify(resume.title)}.txt`);

export const exportHtml = (resume: ResumeDocument, renderedHtml: string, style = "") =>
  downloadBlob(new Blob([htmlDocument(resume, renderedHtml, style)], { type: "text/html;charset=utf-8" }), `${slugify(resume.title)}.html`);

export const exportJsonResume = (resume: ResumeDocument) =>
  downloadBlob(new Blob([JSON.stringify(jsonResumeFromMarkdown(resume), null, 2)], { type: "application/json;charset=utf-8" }), `${slugify(resume.title)}.json`);

export const exportResumeForgeJson = (resume: ResumeDocument) =>
  downloadBlob(new Blob([JSON.stringify(createResumeForgeResumeFile(resume), null, 2)], { type: "application/json;charset=utf-8" }), `${slugify(resume.title)}.resume-studio.json`);

export const exportYaml = (resume: ResumeDocument) =>
  downloadBlob(new Blob([YAML.stringify(jsonResumeFromMarkdown(resume))], { type: "text/yaml;charset=utf-8" }), `${slugify(resume.title)}.yaml`);

export const exportBackup = (state: AppState) =>
  downloadBlob(new Blob([serializeBackup(state)], { type: "application/json;charset=utf-8" }), backupFilename());

export const exportDocx = async (resume: ResumeDocument) => {
  const { Document, HeadingLevel, Packer, Paragraph, TextRun } = await import("docx");
  const { content, frontmatter } = parseFrontmatter(resume.markdown);
  const contact = [frontmatter.email, frontmatter.phone, frontmatter.location, ...(frontmatter.links ?? [])].filter(Boolean).join(" | ");
  const children = [
    new Paragraph({ text: frontmatter.name, heading: HeadingLevel.TITLE }),
    ...(frontmatter.title ? [new Paragraph({ children: [new TextRun({ text: frontmatter.title, bold: true })] })] : []),
    ...(contact ? [new Paragraph(contact)] : []),
    ...content
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => {
        if (/^##\s+/.test(line)) return new Paragraph({ text: line.replace(/^##+\s*/, ""), heading: HeadingLevel.HEADING_2 });
        if (/^###\s+/.test(line)) return new Paragraph({ text: line.replace(/^###+\s*/, ""), heading: HeadingLevel.HEADING_3 });
        if (/^[-*]\s+/.test(line.trim())) return new Paragraph({ text: line.replace(/^[-*]\s*/, ""), bullet: { level: 0 } });
        return new Paragraph({ children: [new TextRun(line.replace(/^#+\s*/, ""))] });
      }),
  ];
  const doc = new Document({
    sections: [
      {
        children,
      },
    ],
  });
  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `${slugify(resume.title)}.docx`);
};

export const printPdf = (pageSize: "letter" | "a4" = "letter") => {
  const styleId = "resume-studio-print-page-size";
  const existing = document.getElementById(styleId);
  existing?.remove();
  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `@page{size:${pageSize === "a4" ? "A4" : "Letter"};margin:0}`;
  document.head.appendChild(style);
  document.documentElement.dataset.printPageSize = pageSize;
  window.print();
};
