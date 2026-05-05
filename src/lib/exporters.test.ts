import { describe, expect, it } from "vitest";
import { createResumeFromImportDraft, buildImportDraft } from "../app/resumeTransforms";
import { htmlDocument, jsonResumeFromMarkdown } from "./exporters";
import { createResumeForgeResumeFile } from "./resumeForgeSchema";
import type { ResumeDocument } from "./types";

const resume: ResumeDocument = {
  id: "resume-test",
  title: "Avery <Engineer>",
  targetRole: "Engineer",
  tags: [],
  markdown: `---
name: Avery Chen
title: Engineer
email: avery@example.com
phone: "555-111-2222"
location: Austin, TX
links:
  - https://example.com
---

Summary.

## Experience

### Engineer - Example Co
- Built accessible React tools.

## Skills

- React, TypeScript

## Education

- B.S. Computer Science, Example University
`,
  templateId: "ats-classic",
  pageSize: "letter",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  versions: [],
  jobTargets: [],
  applications: [],
  privateNotes: "Target fintech platform roles.",
  ownerType: "user",
};

describe("export helpers", () => {
  it("escapes exported HTML title", () => {
    const html = htmlDocument(resume, "<p>Resume</p>", "");
    expect(html).toContain("<title>Avery &lt;Engineer&gt;</title>");
    expect(html).toContain("page-letter");
  });

  it("maps Markdown sections into JSON Resume fields", () => {
    const json = jsonResumeFromMarkdown(resume);
    expect(json.basics.email).toBe("avery@example.com");
    expect(json.work[0].position).toBe("Engineer");
    expect(json.skills[0].keywords).toEqual(["React", "TypeScript"]);
    expect(json.education[0].institution).toContain("Computer Science");
  });

  it("round-trips Resume Studio JSON with private notes", () => {
    const file = createResumeForgeResumeFile(resume);
    const draft = buildImportDraft("avery.resume-studio.json", JSON.stringify(file));
    const imported = createResumeFromImportDraft(draft);
    expect(draft.confidence).toBeGreaterThanOrEqual(96);
    expect(imported.markdown).toBe(resume.markdown);
    expect(imported.privateNotes).toBe("Target fintech platform roles.");
    expect(imported.title).toBe(resume.title);
  });
});
