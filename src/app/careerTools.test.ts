import { describe, expect, it } from "vitest";
import {
  generateCoverLetterDraft,
  generateInterviewPrepDraft,
  generateLinkedInProfileDraft,
  generateRecruiterMessageDraft,
  linkedInDraftToMarkdown,
  markdownToPlainText,
} from "./careerTools";
import { createResume } from "./resumeTransforms";

describe("career tools", () => {
  it("generates editable drafts from a sparse resume without a job description", () => {
    const resume = createResume("blank");

    const coverLetter = generateCoverLetterDraft(resume);
    const linkedIn = generateLinkedInProfileDraft(resume);
    const recruiterMessage = generateRecruiterMessageDraft(resume);
    const interviewPrep = generateInterviewPrepDraft(resume);

    expect(coverLetter).toContain("Cover Letter Draft");
    expect(coverLetter).toContain("[company name]");
    expect(linkedIn.headlines).toHaveLength(3);
    expect(linkedIn.connectionMessage).toContain("[name]");
    expect(recruiterMessage).toContain("[recruiter name]");
    expect(interviewPrep.likelyQuestions.length).toBeGreaterThan(0);
    expect(interviewPrep.starPrompts.length).toBeGreaterThan(0);
  });

  it("uses pasted role context without requiring external services", () => {
    const resume = createResume("blank");
    const draft = generateCoverLetterDraft(resume, "Senior Product Manager at Acme. Required skills: SQL and analytics.");

    expect(draft).toContain("Senior Product Manager");
    expect(draft).toContain("role at Acme.");
    expect(draft).not.toContain("Acme. Required skills");
  });

  it("converts generated markdown into copyable plain text", () => {
    const resume = createResume("blank");
    const linkedIn = generateLinkedInProfileDraft(resume);
    const plainText = markdownToPlainText(linkedInDraftToMarkdown(linkedIn));

    expect(plainText).toContain("LinkedIn Profile Draft");
    expect(plainText).not.toContain("##");
  });
});
