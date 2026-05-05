import { describe, expect, it } from "vitest";
import { analyzeResume, analyzeJobKeywords, parsePlainText } from ".";
import { defaultResumeMarkdown } from "../defaultDraft";

const weakResume = `---
name: ""
email: bad-email
phone: "555"
location: ""
links:
  - broken-url
---

## Profile

Responsible for many things.

## Experience

### Developer - Example Co
_Jan 2022 - Jan 2020_
• Responsible for working on stuff.
- Helped with systems.

## Projects

## Projects

| Skill | Years |
| --- | --- |
| React | 3 |
`;

const strongResume = `---
name: Avery Chen
title: Senior Frontend Engineer
email: avery@example.com
phone: "(206) 555-0148"
location: Seattle, WA
links:
  - https://github.com/example
  - https://linkedin.com/in/example
---

Senior frontend engineer focused on accessible React and TypeScript product surfaces.

## Experience

### Senior Frontend Engineer - ExampleSoft
_Jan 2021 - Present_
- Built React and TypeScript component patterns used by 12 product teams to reduce duplicate implementation by 30%.
- Improved accessibility testing coverage across 8 customer workflows and reduced release defects by 18%.
- Partnered with design and platform teams to launch CI/CD checks for critical dashboard UI.

## Skills

- React, TypeScript, JavaScript, Node.js, PostgreSQL, GitHub Actions

## Education

- B.S. Computer Science, Example University
`;

describe("resume review engine", () => {
  it("detects missing and malformed contact info", () => {
    const result = analyzeResume({ markdown: weakResume });
    expect(result.groups.mustFix.some((issue) => issue.title.includes("email"))).toBe(true);
    expect(result.issues.some((issue) => issue.title === "Weak phone format")).toBe(true);
    expect(result.issues.some((issue) => issue.title === "Broken-looking URL")).toBe(true);
  });

  it("detects duplicate empty sections and formatting risks", () => {
    const result = analyzeResume({ markdown: weakResume });
    expect(result.issues.some((issue) => issue.title === "Duplicate section")).toBe(true);
    expect(result.issues.some((issue) => issue.title === "Empty section")).toBe(true);
    expect(result.issues.some((issue) => issue.title === "Tables can confuse ATS reading order")).toBe(true);
    expect(result.issues.some((issue) => issue.safeAutoFix)).toBe(true);
  });

  it("detects weak bullets, missing metrics, and date issues", () => {
    const result = analyzeResume({ markdown: weakResume });
    expect(result.issues.some((issue) => issue.title === "Weak bullet opening")).toBe(true);
    expect(result.issues.some((issue) => issue.title === "Missing measurable result")).toBe(true);
    expect(result.groups.mustFix.some((issue) => issue.title === "End date before start date")).toBe(true);
  });

  it("groups starter placeholders into a pre-export warning", () => {
    const result = analyzeResume({ markdown: defaultResumeMarkdown });
    const placeholderIssue = result.groups.mustFix.find((issue) => issue.title === "Starter placeholders still present");
    expect(placeholderIssue?.location).toBe("Pre-export check");
    expect(placeholderIssue?.suggestedFix).toContain("candidate name");
    expect(placeholderIssue?.suggestedFix).toContain("metric placeholder");
  });

  it("matches deterministic job keywords without an LLM", () => {
    const match = analyzeJobKeywords(
      strongResume,
      "Role: Senior Frontend Engineer. Required: React, TypeScript, accessibility, Kubernetes. Preferred: GitHub Actions and mentoring.",
    );
    expect(match.matched).toEqual(expect.arrayContaining(["React", "TypeScript", "GitHub Actions"]));
    expect(match.missing).toContain("Kubernetes");
    expect(match.suggestions.find((suggestion) => suggestion.keyword === "Kubernetes")?.suggestedWording).toContain("[add metric");
  });

  it("creates an ATS-style plain text preview", () => {
    const preview = parsePlainText(strongResume);
    expect(preview.text).toContain("Avery Chen");
    expect(preview.text).toContain("- Built React");
    expect(preview.headings).toEqual(expect.arrayContaining(["Experience", "Skills", "Education"]));
  });

  it("summarizes section health and achievement coverage", () => {
    const result = analyzeResume({ markdown: strongResume });
    expect(result.sectionReviews.find((section) => section.id === "experience")?.status).not.toBe("missing");
    expect(result.sectionReviews.find((section) => section.id === "certifications")?.status).toBe("strong");
    expect(result.achievementAudit.totalBullets).toBeGreaterThan(0);
    expect(result.achievementAudit.metricBullets).toBeGreaterThan(0);
    expect(result.achievementAudit.roleSummaries.some((role) => role.section.includes("Senior Frontend Engineer"))).toBe(true);
  });

  it("uses stable issue ids across analyses", () => {
    const first = analyzeResume({ markdown: weakResume }).issues.map((issue) => issue.id);
    const second = analyzeResume({ markdown: weakResume }).issues.map((issue) => issue.id);
    expect(second).toEqual(first);
    expect(first.every((id) => id.startsWith("review-"))).toBe(true);
  });
});
