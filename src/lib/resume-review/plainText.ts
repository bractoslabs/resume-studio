import { parseFrontmatter, renderMarkdown } from "../markdown";
import { atsRiskPatterns } from "./data/atsRiskPatterns";
import type { PlainTextParseResult, ResumeReviewDocument } from "./types";

const stripDirectives = (source: string) =>
  source
    .replace(/\{\{hideForAts\}\}[\s\S]*?\{\{\/hideForAts\}\}/gi, "")
    .replace(/\{\{atsOnly\}\}([\s\S]*?)\{\{\/atsOnly\}\}/gi, "$1")
    .replace(/\{\{icon:([a-z0-9-]+)\}\}/gi, "$1")
    .replace(/\{\{pagebreak\}\}|^\\newpage\s*$/gim, "\n[page break]\n");

export const parsePlainText = (markdown: string): PlainTextParseResult => {
  const { content, frontmatter } = parseFrontmatter(markdown);
  const warnings: string[] = [];
  const readingOrderNotes: string[] = [];
  const source = stripDirectives(content);
  if (atsRiskPatterns.table.test(source)) warnings.push("Tables may produce confusing reading order in ATS text extraction.");
  if (atsRiskPatterns.image.test(source)) warnings.push("Images are removed from the plain-text parse.");
  if (atsRiskPatterns.columnHint.test(source)) warnings.push("Column/sidebar layout hints may create confusing reading order.");
  if (atsRiskPatterns.hiddenAts.test(content)) warnings.push("ATS-only or hidden-from-ATS directives change what parsers may see.");
  if (/^\s*\|.+\|\s*$/m.test(source))
    readingOrderNotes.push("Table rows are flattened into normal text; verify that labels and values still make sense.");
  if (/sidebar|left column|right column|two-column/i.test(source))
    readingOrderNotes.push("Column/sidebar language was detected; verify that the preview reads top-to-bottom in the intended order.");
  if ((source.match(/\{\{icon:/gi) ?? []).length > 3) readingOrderNotes.push("Several icon labels were converted to plain words.");

  const contact = [
    frontmatter.name,
    frontmatter.title,
    frontmatter.email,
    frontmatter.phone,
    frontmatter.location,
    ...(frontmatter.links ?? []),
  ].filter(Boolean);

  const lines = source
    .replace(/```[\s\S]*?```/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[([^\]]*)]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)]\(([^)]+)\)/g, "$1 ($2)")
    .split("\n")
    .map((line) =>
      line
        .replace(/^#{1,6}\s+/, "")
        .replace(/^>\s+/, "")
        .replace(/^\s*[•‣▪*+-]\s+/, "- ")
        .replace(/[*_`~]/g, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);

  const headings = source
    .split("\n")
    .map((line) => line.match(/^##+\s+(.+)$/)?.[1]?.trim())
    .filter((value): value is string => Boolean(value));

  const bullets = lines.filter((line) => line.startsWith("- ")).map((line) => line.slice(2));
  const parseConfidence = Math.max(45, 100 - warnings.length * 14 - readingOrderNotes.length * 9);
  return {
    text: [...contact, "", ...lines].filter((line, index, arr) => line || arr[index - 1]).join("\n"),
    headings,
    bullets,
    warnings,
    readingOrderNotes,
    parseConfidence,
  };
};

export const buildReviewDocument = (markdown: string): ResumeReviewDocument => {
  const { frontmatter, content } = parseFrontmatter(markdown);
  const plainText = parsePlainText(markdown);
  const headings = [...content.matchAll(/^(#{2,4})\s+(.+)$/gm)].map((match) => ({
    level: match[1].length,
    text: match[2].trim(),
    line: content.slice(0, match.index).split("\n").length,
    normalized: match[2].trim().toLowerCase(),
  }));
  let section = "Summary";
  const bullets: ResumeReviewDocument["bullets"] = [];
  content.split("\n").forEach((line, index) => {
    const heading = line.match(/^##+\s+(.+)$/);
    if (heading) section = heading[1].trim();
    const bullet = line.match(/^\s*[-*•‣▪]\s+(.+)$/);
    if (bullet) bullets.push({ text: bullet[1].trim(), line: index + 1, section });
  });
  const wordCount = renderMarkdown(markdown, true).plainText.split(/\s+/).filter(Boolean).length;
  return { markdown, content, frontmatter, plainText, headings, bullets, wordCount };
};
