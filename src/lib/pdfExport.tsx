import { Document, Link, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import type { ResumeDocument, ResumeFrontmatter, ResumeTemplate } from "./types";
import { renderMarkdown } from "./markdown";
import { getTemplate } from "./templates";
import { downloadBlob, slugify } from "./utils";

const safeText = (value?: string) => (value ?? "").replace(/\s+/g, " ").trim();

const pdfFont = (font?: string) => {
  const normalized = (font ?? "").toLowerCase();
  if (normalized.includes("georgia") || normalized.includes("times")) return "Times-Roman";
  return "Helvetica";
};

const boldFont = (fontFamily: string) => (fontFamily === "Times-Roman" ? "Times-Bold" : "Helvetica-Bold");
const italicFont = (fontFamily: string) => (fontFamily === "Times-Roman" ? "Times-Italic" : "Helvetica-Oblique");
const pointsFromPx = (value?: number) => (value === undefined ? undefined : value * 0.75);
const marginPoints = (valuePx: number | undefined, fallbackInches: number) => pointsFromPx(valuePx) ?? fallbackInches * 72;
const templateFontPoints = (template: ResumeTemplate, fontSizePx?: number) => pointsFromPx(fontSizePx) ?? template.fontSize;

type PdfStyles = ReturnType<typeof createPdfStyles>;

const createPdfStyles = (template: ResumeTemplate, frontmatter: ResumeFrontmatter) => {
  const accent = frontmatter.accentColor || template.accentColor;
  const baseFontSize = templateFontPoints(template, frontmatter.fontSizePx);
  const marginVertical = marginPoints(frontmatter.marginVerticalPx, template.margin);
  const marginHorizontal = marginPoints(frontmatter.marginHorizontalPx, template.margin);
  const paragraphGap = pointsFromPx(frontmatter.paragraphSpacingPx) ?? 3.75;
  const bulletGap = template.bulletSpacing === "compact" ? 1.5 : template.bulletSpacing === "airy" ? 4 : 2.5;
  const fontFamily = pdfFont(frontmatter.font ?? template.fontFamily);

  return StyleSheet.create({
    page: {
      paddingTop: marginVertical,
      paddingBottom: marginVertical,
      paddingHorizontal: marginHorizontal,
      fontFamily,
      fontSize: baseFontSize,
      lineHeight: frontmatter.lineHeight ?? template.lineHeight,
      color: "#111827",
      backgroundColor: "#ffffff",
    },
    h1: {
      marginBottom: 3,
      fontFamily: boldFont(fontFamily),
      fontSize: baseFontSize + (template.id === "executive" ? 12 : 10),
      textAlign: "center",
      color: template.id === "technical" ? "#1d4ed8" : template.id === "product" ? "#581c87" : "#111827",
    },
    headerText: {
      marginBottom: 2,
      textAlign: "center",
    },
    headerLink: {
      color: accent,
      textDecoration: "none",
    },
    h2: {
      marginTop: paragraphGap + 8,
      marginBottom: paragraphGap,
      paddingBottom: template.headingStyle === "boxed" ? 2 : 3,
      paddingHorizontal: template.headingStyle === "boxed" ? 4 : 0,
      borderBottomWidth: template.headingStyle === "boxed" ? 0 : template.id === "technical" ? 2 : 1,
      borderBottomColor: template.id === "ats-classic" || template.id === "minimal-one-page" ? "#111827" : accent,
      backgroundColor: template.headingStyle === "boxed" ? `${accent}22` : undefined,
      color: template.headingStyle === "boxed" ? "#111827" : template.id === "ats-classic" ? "#111827" : accent,
      fontFamily: boldFont(fontFamily),
      fontSize: baseFontSize + (template.id === "academic" ? 1.3 : 0.4),
      textTransform: template.headingStyle === "accent" || template.id === "academic" ? "none" : "uppercase",
    },
    h3: {
      marginTop: paragraphGap + 4,
      marginBottom: 1.5,
      fontFamily: template.id === "executive" ? italicFont(fontFamily) : boldFont(fontFamily),
      fontSize: baseFontSize + 0.2,
    },
    paragraph: {
      marginVertical: paragraphGap / 2,
    },
    strong: {
      fontFamily: boldFont(fontFamily),
    },
    em: {
      fontFamily: italicFont(fontFamily),
    },
    list: {
      marginVertical: paragraphGap / 2,
    },
    bulletRow: {
      flexDirection: "row",
      marginBottom: bulletGap,
    },
    bullet: {
      width: 10,
    },
    bulletText: {
      flex: 1,
    },
    link: {
      color: accent,
      textDecoration: "none",
    },
    break: {
      height: 0,
    },
  });
};

const textFrom = (node: ChildNode): string => node.textContent?.replace(/\s+/g, " ").trim() ?? "";

const renderInlineNodes = (nodes: ChildNode[], styles: PdfStyles, keyPrefix: string): ReactNode[] =>
  nodes.flatMap((node, index): ReactNode[] => {
    const key = `${keyPrefix}-${index}`;
    if (node.nodeType === Node.TEXT_NODE) return [node.textContent ?? ""];
    if (node.nodeType !== Node.ELEMENT_NODE) return [];

    const element = node as HTMLElement;
    const children = renderInlineNodes(Array.from(element.childNodes), styles, key);
    if (element.tagName === "STRONG" || element.tagName === "B")
      return [
        <Text key={key} style={styles.strong}>
          {children}
        </Text>,
      ];
    if (element.tagName === "EM" || element.tagName === "I")
      return [
        <Text key={key} style={styles.em}>
          {children}
        </Text>,
      ];
    if (element.tagName === "A") {
      const href = element.getAttribute("href") ?? "";
      const label = children.length ? children : textFrom(element);
      return href
        ? [
            <Link key={key} src={href} style={styles.link}>
              {label}
            </Link>,
          ]
        : [<Text key={key}>{label}</Text>];
    }
    if (element.tagName === "BR") return ["\n"];
    return children;
  });

const renderBlock = (element: HTMLElement, styles: PdfStyles, index: number): ReactNode => {
  const key = `pdf-node-${index}`;
  if (element.classList.contains("page-break")) return <View key={key} break style={styles.break} />;

  const children = renderInlineNodes(Array.from(element.childNodes), styles, key);
  if (element.tagName === "H1")
    return (
      <Text key={key} style={styles.h1}>
        {children}
      </Text>
    );
  if (element.tagName === "H2")
    return (
      <Text key={key} style={styles.h2}>
        {children}
      </Text>
    );
  if (element.tagName === "H3")
    return (
      <Text key={key} style={styles.h3}>
        {children}
      </Text>
    );
  if (element.tagName === "P") {
    const style = index <= 3 ? styles.headerText : styles.paragraph;
    return (
      <Text key={key} style={style}>
        {children}
      </Text>
    );
  }
  if (element.tagName === "UL" || element.tagName === "OL") {
    const items = Array.from(element.children).filter((child): child is HTMLElement => child instanceof HTMLElement);
    return (
      <View key={key} style={styles.list}>
        {items.map((item, itemIndex) => (
          <View key={`${key}-item-${itemIndex}`} style={styles.bulletRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>{renderInlineNodes(Array.from(item.childNodes), styles, `${key}-item-${itemIndex}`)}</Text>
          </View>
        ))}
      </View>
    );
  }
  return (
    <Text key={key} style={styles.paragraph}>
      {children.length ? children : textFrom(element)}
    </Text>
  );
};

const htmlToPdfNodes = (html: string, styles: PdfStyles) => {
  if (typeof DOMParser === "undefined" || typeof HTMLElement === "undefined") {
    return [
      <Text key="fallback" style={styles.paragraph}>
        {safeText(html.replace(/<[^>]+>/g, " "))}
      </Text>,
    ];
  }
  const document = new DOMParser().parseFromString(html, "text/html");
  const blocks = Array.from(document.body.children).filter((child): child is HTMLElement => child instanceof HTMLElement);
  return blocks.map((element, index) => renderBlock(element, styles, index));
};

const ResumePdfDocument = ({
  resume,
  template,
  html,
  frontmatter,
}: {
  resume: ResumeDocument;
  template: ResumeTemplate;
  html: string;
  frontmatter: ResumeFrontmatter;
}) => {
  const styles = createPdfStyles(template, frontmatter);
  return (
    <Document title={resume.title} author={frontmatter.name || "Resume Studio"}>
      <Page size={resume.pageSize === "a4" ? "A4" : "LETTER"} style={styles.page} wrap>
        {htmlToPdfNodes(html, styles)}
      </Page>
    </Document>
  );
};

export const exportPdf = async (resume: ResumeDocument) => {
  const rendered = renderMarkdown(resume.markdown, true);
  const template = getTemplate(rendered.frontmatter.template ?? resume.templateId);
  const blob = await pdf(
    <ResumePdfDocument resume={resume} template={template} html={rendered.html} frontmatter={rendered.frontmatter} />,
  ).toBlob();
  downloadBlob(blob, `${slugify(resume.title)}.pdf`);
};
