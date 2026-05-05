import type { ResumeSafeFix } from "../types";

export const removeDuplicateBlankLines = (): ResumeSafeFix => ({
  id: "remove-duplicate-blank-lines",
  label: "Clean blank lines",
  description: "Remove repeated blank lines and trailing whitespace.",
  apply: (markdown) =>
    markdown
      .replace(/[ \t]+$/gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .trimEnd() + "\n",
});

export const normalizeDateDashSpacing = (): ResumeSafeFix => ({
  id: "normalize-date-dash-spacing",
  label: "Normalize date spacing",
  description: "Convert date separators to a readable spaced dash.",
  apply: (markdown) => markdown.replace(/\s*[–—-]\s*(Present|Current|Now|\d{4}|[A-Z][a-z]{2,8}\s+\d{4})/g, " - $1"),
});

export const normalizeCurrentRoleTerms = (): ResumeSafeFix => ({
  id: "normalize-current-role-terms",
  label: "Use Present",
  description: "Replace Now/Current with the standard current-role term Present.",
  apply: (markdown) => markdown.replace(/\b(Now|Current)\b/g, "Present").replace(/\s*[–—-]\s*/g, " - "),
});

export const normalizeRepeatedSpaces = (): ResumeSafeFix => ({
  id: "normalize-repeated-spaces",
  label: "Clean spacing",
  description: "Convert repeated spaces and trailing whitespace to clean Markdown spacing.",
  apply: (markdown) =>
    markdown
      .replace(/[ \t]{2,}/g, " ")
      .replace(/[ \t]+$/gm, "")
      .trimEnd() + "\n",
});

export const convertSmartBullets = (): ResumeSafeFix => ({
  id: "convert-smart-bullets",
  label: "Convert bullets",
  description: "Convert decorative bullets to standard Markdown hyphen bullets.",
  apply: (markdown) => markdown.replace(/^\s*[•‣▪]\s+/gm, "- "),
});

export const removeEmptySection = (heading: string): ResumeSafeFix => ({
  id: `remove-empty-section-${heading.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
  label: "Remove empty section",
  description: `Remove the empty "${heading}" section.`,
  apply: (markdown) => {
    const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return markdown.replace(new RegExp(`\\n##\\s+${escaped}\\s*\\n(?=\\n?##|\\s*$)`, "i"), "\n").replace(/\n{3,}/g, "\n\n");
  },
});

export const renameSection = (from: string, to: string): ResumeSafeFix => ({
  id: `rename-section-${from.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
  label: `Rename to ${to}`,
  description: `Rename "${from}" to the standard "${to}" heading.`,
  apply: (markdown) => markdown.replace(new RegExp(`^(##+)\\s+${from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "gim"), `$1 ${to}`),
});
