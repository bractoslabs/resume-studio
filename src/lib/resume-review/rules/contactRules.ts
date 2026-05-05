import { uid } from "../../utils";
import type { ResumeReviewIssue, ResumeReviewRule } from "../types";

const issue = (patch: Omit<ResumeReviewIssue, "id">): ResumeReviewIssue => ({ id: uid("review"), ...patch });
const linkLike = /^https?:\/\/[^\s]+\.[^\s]+/i;
const rawField = (markdown: string, key: string) => {
  const match = markdown.match(new RegExp(`^${key}:\\s*\"?([^\"\\n]+)\"?\\s*$`, "im"));
  return match?.[1]?.trim();
};
const rawLinks = (markdown: string) => {
  const block = markdown.match(/^links:\s*\n((?:\s+-\s+[^\n]+\n?)+)/im)?.[1] ?? "";
  return block
    .split("\n")
    .map((line) => line.replace(/^\s+-\s+/, "").trim())
    .filter(Boolean);
};

export const contactRules: ResumeReviewRule = (document) => {
  const issues: ResumeReviewIssue[] = [];
  const { frontmatter, content } = document;
  const rawEmail = frontmatter.email || rawField(document.markdown, "email");
  const rawPhone = frontmatter.phone || rawField(document.markdown, "phone");
  const add = (patch: Omit<ResumeReviewIssue, "id">) => issues.push(issue(patch));
  if (!frontmatter.name || /your name|untitled/i.test(frontmatter.name))
    add({
      title: "Missing candidate name",
      severity: "critical",
      priority: "must-fix",
      category: "contact",
      location: "Header",
      whyItMatters: "Recruiters and parsers need a clear name at the top of the resume.",
      suggestedFix: "Add your real name in YAML frontmatter.",
      safeAutoFix: false,
    });
  if (!rawEmail)
    add({
      title: "Missing email",
      severity: "critical",
      priority: "must-fix",
      category: "contact",
      location: "Header email",
      whyItMatters: "Email is the most common recruiter contact field extracted by ATS systems.",
      suggestedFix: "Add a verified email address in frontmatter.",
      safeAutoFix: false,
    });
  if (rawEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail))
    add({
      title: "Invalid-looking email",
      severity: "critical",
      priority: "must-fix",
      category: "contact",
      location: "Header email",
      whyItMatters: "Malformed email addresses may fail contact extraction.",
      suggestedFix: "Check the email spelling and format.",
      safeAutoFix: false,
    });
  if (!rawPhone)
    add({
      title: "Missing phone",
      severity: "warning",
      priority: "should-improve",
      category: "contact",
      location: "Header phone",
      whyItMatters: "Some recruiters still call or text candidates directly.",
      suggestedFix: "Add a phone number if you want to be contacted that way.",
      safeAutoFix: false,
    });
  if (rawPhone && rawPhone.replace(/\D/g, "").length < 10)
    add({
      title: "Weak phone format",
      severity: "warning",
      priority: "should-improve",
      category: "contact",
      location: "Header phone",
      whyItMatters: "Short or unclear phone formats can be misread by parsers.",
      suggestedFix: "Use a complete phone number with area/country code as appropriate.",
      safeAutoFix: false,
    });
  if (!frontmatter.location)
    add({
      title: "Missing location",
      severity: "warning",
      priority: "should-improve",
      category: "contact",
      location: "Header location",
      whyItMatters: "Location helps recruiters assess remote, hybrid, relocation, or region constraints.",
      suggestedFix: "Add city/state, region, or remote preference.",
      safeAutoFix: false,
    });
  const links = frontmatter.links?.length ? frontmatter.links : rawLinks(document.markdown);
  if (
    (frontmatter.targetRole ?? frontmatter.title ?? "").match(/software|engineer|developer|data|security/i) &&
    !links.some((link) => /github|gitlab|portfolio|linkedin/i.test(link))
  )
    add({
      title: "Missing relevant professional link",
      severity: "info",
      priority: "nice-to-have",
      category: "contact",
      location: "Header links",
      whyItMatters: "Technical roles often benefit from LinkedIn, GitHub, or portfolio links.",
      suggestedFix: "Add only professional links you actively want reviewed.",
      safeAutoFix: false,
    });
  if (links.length > 5)
    add({
      title: "Too many links",
      severity: "info",
      priority: "nice-to-have",
      category: "contact",
      location: "Header links",
      whyItMatters: "Too many links add parse noise and distract from the strongest destinations.",
      suggestedFix: "Keep LinkedIn, portfolio, GitHub, or one role-relevant link.",
      safeAutoFix: false,
    });
  links
    .filter((link) => !linkLike.test(link))
    .forEach((link) =>
      add({
        title: "Broken-looking URL",
        severity: "warning",
        priority: "should-improve",
        category: "contact",
        location: link,
        whyItMatters: "Malformed URLs may not export as clickable links.",
        suggestedFix: "Use a complete https:// URL.",
        safeAutoFix: false,
      }),
    );
  if (content.slice(0, 700).match(/@/) && !frontmatter.email)
    add({
      title: "Contact info outside structured header",
      severity: "info",
      priority: "nice-to-have",
      category: "contact",
      location: "Resume body",
      whyItMatters: "Header/frontmatter contact data exports more consistently across templates.",
      suggestedFix: "Move contact details into frontmatter.",
      safeAutoFix: false,
    });
  return issues;
};
