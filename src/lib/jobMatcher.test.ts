import { describe, expect, it } from "vitest";
import { compareResumeToJob } from "./jobMatcher";
import { analyzeJobKeywords } from "./resume-review";

describe("job matcher", () => {
  it("extracts and compares keywords", () => {
    const report = compareResumeToJob("## Skills\n- React, TypeScript", "Senior Frontend Engineer required React TypeScript AWS collaboration");
    expect(report.matched).toContain("React");
    expect(report.missing.length).toBeGreaterThan(0);
  });

  it("filters generic noisy words while keeping meaningful phrases", () => {
    const report = analyzeJobKeywords("", "We are an innovative team seeking a motivated candidate with experience in AI agents, distributed systems, and human feedback. Required qualifications: Python and model evaluation.");
    expect(report.ignoredGenericTerms).toEqual(expect.arrayContaining(["innovative", "team", "candidate", "experience"]));
    expect(report.industryTerms).toEqual(expect.arrayContaining(["AI agents", "distributed systems", "human feedback", "model evaluation"]));
    expect(report.missing).not.toEqual(expect.arrayContaining(["ability", "team", "systems", "project"]));
  });

  it("normalizes aliases and calculates keyword overlap", () => {
    const resume = "## Skills\n- JavaScript, TypeScript, Node.js, PostgreSQL, Kubernetes";
    const report = analyzeJobKeywords(resume, "Requirements: JS, TS, Node, Postgres, K8s, AWS.");
    expect(report.matched).toEqual(expect.arrayContaining(["JavaScript", "TypeScript", "Node.js", "PostgreSQL", "Kubernetes"]));
    expect(report.missing).toContain("AWS");
    expect(report.score).toBeGreaterThan(70);
    expect(report.overlapLabel).toBe("Strong keyword overlap");
  });

  it("weights required terms above preferred terms", () => {
    const report = analyzeJobKeywords("", "Required qualifications:\n- Python\n- data pipelines\nPreferred qualifications:\n- mentoring\n- Tableau");
    expect(report.requiredSkills).toEqual(expect.arrayContaining(["Python", "data pipelines"]));
    expect(report.preferredSkills).toEqual(expect.arrayContaining(["Tableau"]));
  });

  it("uses truthful suggestion placeholders only", () => {
    const report = analyzeJobKeywords("", "Required: Python, AWS, large language models.");
    const suggestion = report.suggestions.find((item) => item.keyword === "Python");
    expect(suggestion?.verificationPrompt).toContain("If not, leave it out");
    expect(suggestion?.suggestedWording).toContain("[describe truthful scope]");
    expect(suggestion?.suggestedWording).toContain("[add metric or result]");
  });

  it("handles empty and fluffy job descriptions honestly", () => {
    expect(analyzeJobKeywords("", "").score).toBe(0);
    const fluffy = analyzeJobKeywords("", "We are a dynamic fast-paced team with excellent opportunities for passionate candidates.");
    expect(fluffy.terms.length).toBeLessThan(3);
    expect(fluffy.missing).not.toContain("dynamic");
  });
});
