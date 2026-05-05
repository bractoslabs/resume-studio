import { buildImportDraft } from "./resumeTransforms";
import type { ImportDraft } from "./types";
import { validateBackup } from "../lib/storage";

const textExtensions = [".md", ".markdown", ".txt", ".json", ".yaml", ".yml"];

const extensionFor = (fileName: string) => {
  const match = fileName.toLowerCase().match(/\.[^.]+$/);
  return match?.[0] ?? "";
};

type PdfTextItem = { str: string; transform: number[]; width: number; height: number };
type DocxInput = { arrayBuffer: ArrayBuffer } | { buffer: Buffer };
type PdfTextLine = { key: number; text: string; minX: number };
type PdfPageTextSegments = { header: string; main: string; sidebar: string };

const pdfContactPattern =
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.[a-z]{2,}\S*|(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}/i;
const textItemLineKey = (item: PdfTextItem) => Math.round(item.transform[5] / 2) * 2;

const normalizeDocxMarkdown = (markdown: string) => {
  const unescaped = [...markdown].reduce((output, character, index, characters) => {
    if (character === "\\" && /[\\`*_{}[\]()#+\-.!|]/.test(characters[index + 1] ?? "")) return output;
    return `${output}${character}`;
  }, "");
  return unescaped
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const textFromPdfLineItems = (lineItems: PdfTextItem[]) =>
  lineItems
    .sort((a, b) => a.transform[4] - b.transform[4])
    .reduce((line, item) => {
      const text = item.str.trim();
      if (!line) return text;
      if (text === "fi" && /(?:scienti|speci|arti)$/i.test(line)) return `${line}${text}`;
      if (text === "fi") return `${line} ${text}`;
      if (text === "fl" && /\bwork$/i.test(line)) return `${line}${text}`;
      if (text === "fl") return `${line} ${text}`;
      if (/(?:\bfi|fl|scientifi|specifi|artifi|workfl)$/i.test(line) && /^[a-z]/.test(text)) return `${line}${text}`;
      if (/^[,.;:!?)]/.test(text)) return `${line}${text}`;
      if (line.endsWith("(") || line.endsWith("/") || line.endsWith("-")) return `${line}${text}`;
      return `${line} ${text}`;
    }, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

const pdfLinesFromItems = (items: PdfTextItem[]) => {
  const lines = new Map<number, PdfTextItem[]>();
  items.forEach((item) => {
    if (!item.str.trim()) return;
    const key = textItemLineKey(item);
    lines.set(key, [...(lines.get(key) ?? []), item]);
  });

  return [...lines.entries()].flatMap<PdfTextLine>(([key, lineItems]) => {
    const sortedItems = [...lineItems].sort((a, b) => a.transform[4] - b.transform[4]);
    const segments = sortedItems.reduce<PdfTextItem[][]>((output, item) => {
      const current = output[output.length - 1];
      const previous = current?.[current.length - 1];
      const gap = previous ? item.transform[4] - (previous.transform[4] + previous.width) : 0;
      if (!current || gap > 24) {
        output.push([item]);
        return output;
      }
      current.push(item);
      return output;
    }, []);

    return segments.flatMap((segment) => {
      const text = textFromPdfLineItems(segment);
      if (!text || /^[.\-–—_=]+$/.test(text)) return [];
      const minX = Math.min(...segment.map((item) => item.transform[4]));
      return [{ key, text, minX }];
    });
  });
};

const textFromPdfLines = (lines: PdfTextLine[]) =>
  lines
    .sort((a, b) => b.key - a.key || a.minX - b.minX)
    .map((line) => line.text)
    .join("\n");

const isLikelyPdfMainColumn = (line: PdfTextLine) =>
  line.minX > 180 || /(?:experience|education|employment|work history|professional history)/i.test(line.text);

const pageTextSegmentsFromPdfItems = (items: PdfTextItem[]): PdfPageTextSegments => {
  const lines = pdfLinesFromItems(items);
  if (!lines.length) return { header: "", main: "", sidebar: "" };

  const topLines = lines.filter((line) => line.key >= 590);
  const hasResumeHeader = topLines.some((line) => pdfContactPattern.test(line.text));
  const bodyCandidates = hasResumeHeader ? lines.filter((line) => line.key < 590) : lines;
  const leftBody = bodyCandidates.filter((line) => line.minX < 180);
  const rightBody = bodyCandidates.filter((line) => line.minX >= 180);
  const hasTwoColumnBody = leftBody.length >= 2 && rightBody.length >= 4;

  if (!hasTwoColumnBody) return { header: "", main: textFromPdfLines(lines), sidebar: "" };

  const headerLines = hasResumeHeader ? topLines : [];
  const bodyLines = hasResumeHeader ? lines.filter((line) => line.key < 590) : lines;
  const mainLines = bodyLines.filter(isLikelyPdfMainColumn);
  const sidebarLines = bodyLines.filter((line) => !isLikelyPdfMainColumn(line));
  return { header: textFromPdfLines(headerLines), main: textFromPdfLines(mainLines), sidebar: textFromPdfLines(sidebarLines) };
};

const pageTextFromPdfItems = (items: PdfTextItem[]) => {
  const segments = pageTextSegmentsFromPdfItems(items);
  return [segments.header, segments.main, segments.sidebar].filter(Boolean).join("\n");
};

export const pdfPageTextFromItemsForTest = pageTextFromPdfItems;

const plainTextFromPdf = async (file: File) => {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const documentOptions: { data: Uint8Array; standardFontDataUrl?: string } = { data: new Uint8Array(await file.arrayBuffer()) };
  if (typeof window === "undefined") documentOptions.standardFontDataUrl = `${process.cwd()}/node_modules/pdfjs-dist/standard_fonts/`;
  pdfjs.GlobalWorkerOptions.workerSrc =
    typeof window === "undefined"
      ? new URL("../../node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString()
      : new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString();
  const loadingTask = pdfjs.getDocument(documentOptions);
  const pdf = await loadingTask.promise;
  const pages: PdfPageTextSegments[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageItems = content.items.flatMap((item) => {
      if (!("str" in item) || !Array.isArray(item.transform)) return [];
      return [{ str: item.str, transform: item.transform as number[], width: item.width, height: item.height }];
    });
    const pageText = pageTextSegmentsFromPdfItems(pageItems);
    if (pageText.header || pageText.main || pageText.sidebar) pages.push(pageText);
  }

  const hasSegmentedPages = pages.some((page) => page.sidebar);
  if (!hasSegmentedPages)
    return pages
      .map((page) => [page.header, page.main].filter(Boolean).join("\n"))
      .join("\n\n")
      .trim();
  return [...pages.map((page) => [page.header, page.main].filter(Boolean).join("\n")), ...pages.map((page) => page.sidebar)]
    .filter(Boolean)
    .join("\n\n")
    .trim();
};

const plainTextFromDocx = async (file: File) => {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const input: DocxInput = typeof Buffer === "undefined" ? { arrayBuffer } : { buffer: Buffer.from(arrayBuffer) };
  const markdownConverter = mammoth as unknown as typeof mammoth & {
    convertToMarkdown: (input: DocxInput) => Promise<{ value: string }>;
  };
  const markdownResult = await markdownConverter.convertToMarkdown(input);
  const markdown = normalizeDocxMarkdown(markdownResult.value);
  if (markdown) return markdown;
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
