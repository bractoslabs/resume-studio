import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import type { ResumeDocument, ResumeTemplate, SimpleEntry, StructuredResume } from "./types";
import { parseStructuredResume, renderMarkdown } from "./markdown";
import { getTemplate } from "./templates";
import { downloadBlob, slugify } from "./utils";

const safeText = (value?: string) => (value ?? "").replace(/\s+/g, " ").trim();

const pdfFont = (font?: string) => {
  const normalized = (font ?? "").toLowerCase();
  if (normalized.includes("georgia") || normalized.includes("times")) return "Times-Roman";
  return "Helvetica";
};

const pointsFromPx = (value?: number) => (value === undefined ? undefined : value * 0.75);
const marginPoints = (valuePx: number | undefined, fallbackInches: number) => pointsFromPx(valuePx) ?? fallbackInches * 72;
const templateFontPoints = (template: ResumeTemplate, fontSizePx?: number) => pointsFromPx(fontSizePx) ?? template.fontSize;

const entryParts = (entry: SimpleEntry) => [entry.title, entry.subtitle, entry.meta].map(safeText).filter(Boolean).join(" - ");

const sectionHasContent = (items: unknown[]) => items.some(Boolean);

const ResumePdfDocument = ({ resume, template, structured }: { resume: ResumeDocument; template: ResumeTemplate; structured: StructuredResume }) => {
  const contact = structured.contact;
  const accent = contact.accentColor || template.accentColor;
  const baseFontSize = templateFontPoints(template, contact.fontSizePx);
  const marginVertical = marginPoints(contact.marginVerticalPx, template.margin);
  const marginHorizontal = marginPoints(contact.marginHorizontalPx, template.margin);
  const paragraphGap = pointsFromPx(contact.paragraphSpacingPx) ?? 3.75;
  const bulletGap = template.bulletSpacing === "compact" ? 1.5 : template.bulletSpacing === "airy" ? 4 : 2.5;
  const fontFamily = pdfFont(contact.font ?? template.fontFamily);
  const styles = StyleSheet.create({
    page: {
      paddingTop: marginVertical,
      paddingBottom: marginVertical,
      paddingHorizontal: marginHorizontal,
      fontFamily,
      fontSize: baseFontSize,
      lineHeight: contact.lineHeight ?? template.lineHeight,
      color: "#111827",
      backgroundColor: "#ffffff",
    },
    name: {
      fontSize: baseFontSize + 10,
      fontFamily: fontFamily === "Times-Roman" ? "Times-Bold" : "Helvetica-Bold",
      textAlign: "center",
      marginBottom: 3,
    },
    title: {
      fontSize: baseFontSize + 1,
      fontFamily: fontFamily === "Times-Roman" ? "Times-Bold" : "Helvetica-Bold",
      textAlign: "center",
      marginBottom: 3,
    },
    contact: {
      textAlign: "center",
      color: accent,
      marginBottom: paragraphGap + 5,
      fontSize: Math.max(8, baseFontSize - 0.8),
    },
    section: {
      marginTop: paragraphGap + 5,
    },
    heading: {
      borderBottomWidth: template.headingStyle === "boxed" ? 0 : 1,
      borderBottomColor: accent,
      color: template.headingStyle === "boxed" ? "#111827" : accent,
      backgroundColor: template.headingStyle === "boxed" ? `${accent}22` : undefined,
      paddingVertical: template.headingStyle === "boxed" ? 2 : 0,
      paddingHorizontal: template.headingStyle === "boxed" ? 4 : 0,
      marginBottom: paragraphGap,
      fontFamily: fontFamily === "Times-Roman" ? "Times-Bold" : "Helvetica-Bold",
      fontSize: baseFontSize + 0.4,
      textTransform: template.headingStyle === "accent" ? "none" : "uppercase",
    },
    summary: {
      marginBottom: paragraphGap,
    },
    entry: {
      marginBottom: paragraphGap + 1,
    },
    entryTitle: {
      fontFamily: fontFamily === "Times-Roman" ? "Times-Bold" : "Helvetica-Bold",
      marginBottom: 1.5,
    },
    entryMeta: {
      color: "#374151",
      fontStyle: "italic",
      marginBottom: 1.5,
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
    inlineList: {
      marginBottom: paragraphGap,
    },
  });
  const contactLine = [contact.email, contact.phone, contact.location, ...(contact.links ?? [])].map(safeText).filter(Boolean).join(" | ");
  const summary = safeText(structured.summary) || safeText(renderMarkdown(resume.markdown, true).plainText.split("\n").slice(0, 3).join(" "));

  const renderBullets = (bullets: string[]) =>
    bullets.map((bullet) => (
      <View key={bullet} style={styles.bulletRow}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.bulletText}>{safeText(bullet)}</Text>
      </View>
    ));

  const renderSection = (title: string, children: ReactNode, show = true) =>
    show ? (
      <View style={styles.section}>
        <Text style={styles.heading}>{title}</Text>
        {children}
      </View>
    ) : null;

  return (
    <Document title={resume.title} author={contact.name || "Resume Studio"}>
      <Page size={resume.pageSize === "a4" ? "A4" : "LETTER"} style={styles.page} wrap>
        <Text style={styles.name}>{safeText(contact.name) || resume.title}</Text>
        {safeText(contact.title) && <Text style={styles.title}>{safeText(contact.title)}</Text>}
        {contactLine && <Text style={styles.contact}>{contactLine}</Text>}
        {renderSection("Summary", <Text style={styles.summary}>{summary}</Text>, Boolean(summary))}
        {renderSection(
          "Experience",
          structured.experience.map((entry) => (
            <View key={entry.id} style={styles.entry} wrap={false}>
              <Text style={styles.entryTitle}>{[safeText(entry.role), safeText(entry.company)].filter(Boolean).join(" - ")}</Text>
              {[entry.location, [entry.startDate, entry.endDate].filter(Boolean).join(" - ")]
                .map(safeText)
                .filter(Boolean)
                .join(" | ") && (
                <Text style={styles.entryMeta}>
                  {[entry.location, [entry.startDate, entry.endDate].filter(Boolean).join(" - ")]
                    .map(safeText)
                    .filter(Boolean)
                    .join(" | ")}
                </Text>
              )}
              {renderBullets(entry.bullets)}
            </View>
          )),
          structured.experience.length > 0,
        )}
        {renderSection(
          "Skills",
          <Text style={styles.inlineList}>{structured.skills.map(safeText).filter(Boolean).join(", ")}</Text>,
          structured.skills.length > 0,
        )}
        {renderSection(
          "Education",
          structured.education.map((entry) => <Text key={entry.id} style={styles.inlineList}>{entryParts(entry)}</Text>),
          structured.education.length > 0,
        )}
        {renderSection(
          "Projects",
          structured.projects.map((entry) => (
            <View key={entry.id} style={styles.entry} wrap={false}>
              <Text style={styles.entryTitle}>{entryParts(entry)}</Text>
              {renderBullets(entry.bullets)}
            </View>
          )),
          structured.projects.length > 0,
        )}
        {renderSection(
          "Certifications",
          <Text style={styles.inlineList}>{structured.certifications.map(safeText).filter(Boolean).join(", ")}</Text>,
          sectionHasContent(structured.certifications),
        )}
        {renderSection(
          "Awards",
          <Text style={styles.inlineList}>{structured.awards.map(safeText).filter(Boolean).join(", ")}</Text>,
          sectionHasContent(structured.awards),
        )}
        {renderSection(
          "Publications",
          <Text style={styles.inlineList}>{structured.publications.map(safeText).filter(Boolean).join(", ")}</Text>,
          sectionHasContent(structured.publications),
        )}
        {renderSection(
          "Languages",
          <Text style={styles.inlineList}>{structured.languages.map(safeText).filter(Boolean).join(", ")}</Text>,
          sectionHasContent(structured.languages),
        )}
      </Page>
    </Document>
  );
};

export const exportPdf = async (resume: ResumeDocument) => {
  const rendered = renderMarkdown(resume.markdown, true);
  const template = getTemplate(rendered.frontmatter.template ?? resume.templateId);
  const structured = parseStructuredResume(resume.markdown);
  const blob = await pdf(<ResumePdfDocument resume={resume} template={template} structured={structured} />).toBlob();
  downloadBlob(blob, `${slugify(resume.title)}.pdf`);
};
