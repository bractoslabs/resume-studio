import { describe, expect, it } from "vitest";
import { Document, Packer, Paragraph } from "docx";
import { buildImportDraftFromFile } from "./importers";
import { buildImportDraft, createResume, pageCountEstimate, resumeChecklist } from "./resumeTransforms";
import { analyzeAts } from "../lib/ats";

const minimalPdfWithText = (text: string) => {
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    `5 0 obj\n<< /Length ${text.length + 43} >>\nstream\nBT /F1 18 Tf 72 720 Td (${text}) Tj ET\nendstream\nendobj\n`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(new TextEncoder().encode(pdf).length);
    pdf += object;
  }
  const xref = new TextEncoder().encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index < offsets.length; index += 1) pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(pdf);
};

describe("resume app transforms", () => {
  it("creates user-owned resumes with a baseline version", () => {
    const resume = createResume("blank");
    expect(resume.ownerType).toBe("user");
    expect(resume.versions[0].name).toBe("Initial version");
    expect(resume.pageSize).toBe("letter");
  });

  it("builds import drafts defensively from plain text", () => {
    const draft = buildImportDraft("resume.txt", "Avery Chen\n\n## Experience\n- Built tools\n\n## Skills\n- React");
    expect(draft.markdown).toContain('name: "Avery Chen"');
    expect(draft.markdown).toContain("Avery Chen");
    expect(draft.sections).toEqual(expect.arrayContaining(["Experience", "Skills"]));
    expect(draft.confidence).toBeGreaterThan(50);
    expect(draft.review.contact.name).toBe("Avery Chen");
    expect(draft.review.bulletCount).toBe(2);
  });

  it("summarizes import review cleanups and missing fields", () => {
    const draft = buildImportDraft(
      "resume.txt",
      [
        "Avery Chen",
        "avery@example.com | Chicago, IL",
        "EXPERIENCE",
        "Northwind Labs | 2022 - Present",
        "• Improved onboarding by 24%",
      ].join("\n"),
    );
    expect(draft.review.contact.email).toBe("avery@example.com");
    expect(draft.review.contact.location).toBe("Chicago, IL");
    expect(draft.review.bulletCount).toBe(1);
    expect(draft.review.repairedFields).toEqual(
      expect.arrayContaining([
        "Added Resume Studio frontmatter",
        "Converted bullet symbols to Markdown bullets",
        "Converted plain-text headings to Markdown sections",
        "Marked dated experience lines as job entries",
      ]),
    );
    expect(draft.review.ignoredFields).toContain("Phone not detected");
  });

  it("splits imported experience into generic dated job entries", () => {
    const draft = buildImportDraft(
      "resume.txt",
      [
        "Avery Chen",
        "avery@example.com",
        "EXPERIENCE",
        "Northwind Labs - Remote | Jan 2024 - Present",
        "Head of Product",
        "• Led platform roadmap",
        "across three product teams.",
        "Contoso, Austin, TX | 2020 - 2023",
        "Director of Operations",
        "- Improved delivery by 35%",
      ].join("\n"),
    );
    expect(draft.markdown).toContain("## Experience");
    expect(draft.markdown.match(/^###\s+/gm)).toHaveLength(2);
    expect(draft.markdown).toContain("### Northwind Labs - Remote | Jan 2024 - Present");
    expect(draft.markdown).toContain("- Led platform roadmap across three product teams.");
    expect(draft.markdown).toContain("### Contoso, Austin, TX | 2020 - 2023");
  });

  it("keeps sidebar PDF labels out of imported contact fields", () => {
    const draft = buildImportDraft(
      "sidebar.pdf",
      [
        "CONTACT",
        "Daniel Cho",
        "Plano, TX<br/>(555) 010-1002<br/",
        ">daniel.cho@example.com<br/>e",
        "IT Support Specialist",
        "xample.com/daniel-cho",
        "SKILLS",
        "PROFILE",
        "Support specialist with experience across Microsoft 365.",
        "EXPERIENCE",
        "IT Support Specialist | BrightPath Logistics | Plano, TX | Apr 2022 - Present",
        "- Resolved 45 to 60 tickets per week.",
      ].join("\n"),
    );
    expect(draft.review.contact.name).toBe("Daniel Cho");
    expect(draft.review.contact.title).toBe("IT Support Specialist");
    expect(draft.review.contact.email).toBe("daniel.cho@example.com");
    expect(draft.review.contact.phone).toBe("(555) 010-1002");
    expect(draft.review.contact.location).toBe("Plano, TX");
  });

  it("extracts contact details from visual PDF contact rows", () => {
    const draft = buildImportDraft(
      "visual.pdf",
      [
        "Marcus Reed (555) 010-1004 | marcus.reed@example.com",
        "Memphis, TN | example.com/marcus-reed",
        "Warehouse Reliability Lead",
        "PROFILE",
        "Warehouse reliability lead who bridges operations, maintenance, and IT.",
        "SKILLS PROJECTS",
        "Floor Systems: RF scanners, Label printers",
        "EXPERIENCE",
        "Warehouse Reliability Lead | Riverbend Distribution 2020 - Present",
        "- Owned first-response troubleshooting.",
      ].join("\n"),
    );
    expect(draft.review.contact.name).toBe("Marcus Reed");
    expect(draft.review.contact.title).toBe("Warehouse Reliability Lead");
    expect(draft.review.contact.email).toBe("marcus.reed@example.com");
    expect(draft.review.contact.phone).toBe("(555) 010-1004");
    expect(draft.review.contact.location).toBe("Memphis, TN");
  });

  it("builds import drafts from uploaded markdown files", async () => {
    const file = new File(["Avery Chen\n\n## Experience\n- Built tools"], "avery.md", { type: "text/markdown" });
    const draft = await buildImportDraftFromFile(file);
    expect(draft.fileName).toBe("avery.md");
    expect(draft.markdown).toContain("Avery Chen");
    expect(draft.sections).toContain("Experience");
  });

  it("extracts readable text from DOCX uploads", async () => {
    const doc = new Document({
      sections: [
        {
          children: [new Paragraph("Avery Chen"), new Paragraph("Experience"), new Paragraph("Built onboarding workflows")],
        },
      ],
    });
    const buffer = await Packer.toBuffer(doc);
    const fileBytes = new Uint8Array(buffer.buffer as ArrayBuffer, buffer.byteOffset, buffer.byteLength);
    const file = new File([fileBytes], "avery.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    const draft = await buildImportDraftFromFile(file);
    expect(draft.markdown).toContain("Avery Chen");
    expect(draft.markdown).toContain("Built onboarding workflows");
  });

  it("extracts readable text from PDF uploads", async () => {
    const file = new File([minimalPdfWithText("Avery Chen Experience React")], "avery.pdf", { type: "application/pdf" });
    const draft = await buildImportDraftFromFile(file);
    expect(draft.markdown).toContain("Avery Chen");
    expect(draft.markdown).toContain("Experience React");
  });

  it("keeps checklist and page estimate deterministic", () => {
    const resume = createResume("blank");
    const checklist = resumeChecklist(resume, analyzeAts(resume.markdown));
    expect(checklist.map((item) => item.id)).toEqual(["contact", "summary", "experience", "skills", "job"]);
    expect(pageCountEstimate("x".repeat(3301))).toBe(2);
  });
});
