import React from "react";
import type { ResumeFrontmatter } from "../../lib/types";

const safeText = (value?: string) => (value ?? "").replace(/\s+/g, " ").trim();
const parseCssLength = (value: unknown, fallbackPx: number) => {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return fallbackPx;
  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric)) return fallbackPx;
  if (value.endsWith("in")) return numeric * 96;
  if (value.endsWith("pt")) return numeric * (96 / 72);
  return numeric;
};

export const ResumePreview = ({
  renderedHtml,
  frontmatter,
  pageStyle,
  templateId,
  pageSize,
  zoom,
  warnings,
  pageCount,
  currentPage,
  onPageCountChange,
}: {
  renderedHtml: string;
  frontmatter: ResumeFrontmatter;
  pageStyle: React.CSSProperties;
  templateId: string;
  pageSize: string;
  zoom: number;
  warnings: number;
  pageCount: number;
  currentPage: number;
  onPageCountChange?: (pageCount: number) => void;
}) => {
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const contactLine = [frontmatter.email, frontmatter.phone, frontmatter.location, ...(frontmatter.links ?? [])]
    .map(safeText)
    .filter(Boolean);
  const pageIndex = Math.max(0, currentPage - 1);
  const contentOffset = `calc((var(--preview-content-width) + var(--preview-column-gap)) * -${pageIndex})`;
  const pageWidthPx = pageSize === "a4" ? 8.27 * 96 : 8.5 * 96;
  const pageHeightPx = pageSize === "a4" ? 11.69 * 96 : 11 * 96;
  const styleVars = pageStyle as React.CSSProperties & Record<string, unknown>;
  const marginX = parseCssLength(styleVars["--resume-margin-x"], 0.55 * 96);
  const marginY = parseCssLength(styleVars["--resume-margin-y"], 0.55 * 96);
  const columnGap = 72;
  const contentWidth = Math.max(240, pageWidthPx - marginX * 2);
  const contentHeight = Math.max(320, pageHeightPx - marginY * 2);
  const previewStyle = {
    ...pageStyle,
    "--preview-page-count": pageCount,
    "--preview-current-page": currentPage,
    "--preview-content-width": `${contentWidth}px`,
    "--preview-content-height": `${contentHeight}px`,
    "--preview-column-gap": `${columnGap}px`,
  } as React.CSSProperties;
  React.useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content || !onPageCountChange) return;
    const measure = () => {
      const computed = window.getComputedStyle(content);
      const contentWidth = parseCssLength(computed.getPropertyValue("--preview-content-width"), 1);
      const columnGap = parseCssLength(computed.getPropertyValue("--preview-column-gap"), 0);
      const pageStride = Math.max(1, contentWidth + columnGap);
      const measured = Math.max(1, Math.round((content.scrollWidth + columnGap) / pageStride));
      onPageCountChange(measured);
    };
    const frame = window.requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [renderedHtml, pageSize, pageStyle, onPageCountChange]);
  return (
    <div className="page-wrap" style={{ width: `${pageWidthPx * zoom}px`, height: `${pageHeightPx * zoom}px` }}>
      <article
        className={`resume-page page-${pageSize} template-${templateId} ${currentPage > 1 ? "continued-page" : ""}`}
        style={{ ...previewStyle, transform: `scale(${zoom})`, transformOrigin: "top left" }}
      >
        <div className="preview-page-sheet" aria-hidden="true">
          <span>Page {currentPage}</span>
        </div>
        {warnings > 0 && <span className="overflow-warning">{warnings} review items</span>}
        {currentPage > 1 && (
          <header className="continued-page-header" aria-label="Repeated resume header">
            <strong>{safeText(frontmatter.name)}</strong>
            {contactLine.length > 0 && <span>{contactLine.join(" | ")}</span>}
          </header>
        )}
        <div className="resume-content-window">
          <div
            ref={contentRef}
            className="resume-content"
            style={{ transform: `translateX(${contentOffset})` }}
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        </div>
      </article>
    </div>
  );
};
