import { buildImportDraft } from "./resumeTransforms";
import type { ImportDraft } from "./types";
import { validateBackup } from "../lib/storage";

const textExtensions = [".md", ".markdown", ".txt", ".json", ".yaml", ".yml"];

const extensionFor = (fileName: string) => {
  const match = fileName.toLowerCase().match(/\.[^.]+$/);
  return match?.[0] ?? "";
};

type PdfTextItem = { str: string; transform: number[]; width: number; height: number };

const textItemLineKey = (item: PdfTextItem) => Math.round(item.transform[5] / 2) * 2;

const pageTextFromPdfItems = (items: PdfTextItem[]) => {
  const lines = new Map<number, PdfTextItem[]>();
  items.forEach((item) => {
    if (!item.str.trim()) return;
    const key = textItemLineKey(item);
    lines.set(key, [...(lines.get(key) ?? []), item]);
  });

  return [...lines.entries()]
    .sort(([a], [b]) => b - a)
    .map(([, lineItems]) =>
      lineItems
        .sort((a, b) => a.transform[4] - b.transform[4])
        .reduce((line, item) => {
          const text = item.str.trim();
          if (!line) return text;
          if (/^[,.;:!?)]/.test(text)) return `${line}${text}`;
          if (line.endsWith("(") || line.endsWith("/") || line.endsWith("-")) return `${line}${text}`;
          return `${line} ${text}`;
        }, "")
        .replace(/[ \t]{2,}/g, " ")
        .trim(),
    )
    .filter(Boolean)
    .join("\n");
};

const plainTextFromPdf = async (file: File) => {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc =
    typeof window === "undefined"
      ? new URL("../../node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString()
      : new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString();
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const pdf = await loadingTask.promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageItems = content.items.flatMap((item) => {
      if (!("str" in item) || !Array.isArray(item.transform)) return [];
      return [{ str: item.str, transform: item.transform as number[], width: item.width, height: item.height }];
    });
    const pageText = pageTextFromPdfItems(pageItems);
    if (pageText) pages.push(pageText);
  }

  return pages.join("\n\n").trim();
};

const plainTextFromDocx = async (file: File) => {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const input = typeof Buffer === "undefined" ? { arrayBuffer } : { buffer: Buffer.from(arrayBuffer) };
  const result = await mammoth.extractRawText(input);
  return result.value.trim();
};

export const extractResumeTextFromFile = async (file: File) => {
  const extension = extensionFor(file.name);
  if (textExtensions.includes(extension)) return file.text();
  if (extension === ".pdf" || file.type === "application/pdf") return plainTextFromPdf(file);
  if (extension === ".docx" || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    return plainTextFromDocx(file);
  if (extension === ".doc") {
    try {
      const text = await plainTextFromDocx(file);
      if (text) return text;
    } catch {
      throw new Error(
        "Legacy .doc files are not readable in this browser import. Save the file as .docx, PDF, Markdown, or plain text and import it again.",
      );
    }
  }
  throw new Error("Unsupported import file. Use DOCX, PDF, Markdown, TXT, JSON Resume, or YAML.");
};

export const buildImportDraftFromFile = async (file: File): Promise<ImportDraft> => {
  const source = await extractResumeTextFromFile(file);
  if (!source.trim()) throw new Error("No readable resume text was found in that file.");
  const backupPreview = validateBackup(source);
  if (backupPreview.valid) {
    throw new Error("This looks like a Resume Studio backup file. Restore it from Settings > Data & Privacy.");
  }
  return buildImportDraft(file.name, source);
};
