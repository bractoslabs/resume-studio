import type { ResumeDocument } from "../lib/types";
import { extractJobTarget } from "../lib/jobMatcher";
import { parseFrontmatter, parseStructuredResume, renderMarkdown } from "../lib/markdown";

export interface CareerResumeContext {
  resumeId: string;
  resumeTitle: string;
  candidateName: string;
  professionalTitle: string;
  targetRole: string;
  contactLine: string;
  summary: string;
  skills: string[];
  bullets: string[];
}

export interface LinkedInProfileDraft {
  headlines: string[];
  about: string;
  connectionMessage: string;
}

export interface InterviewPrepDraft {
  likelyQuestions: string[];
  starPrompts: string[];
  weakAreas: string[];
}

const placeholder = (label: string) => `[${label}]`;

const unique = (values: string[]) =>
  [...new Set(values.map((value) => value.trim()).filter(Boolean))];

const cleanBullet = (line: string) => line.replace(/^\s*[-*•‣▪]\s+/, "").trim();

const plainText = (markdown: string) => renderMarkdown(markdown, true).plainText;

const firstSentence = (value: string) => value.split(/(?<=[.!?])\s+/)[0]?.trim() ?? "";

const cleanRoleTitle = (value: string) =>
  value
    .split(/\b(?:at|with)\b/i)[0]
    .replace(/\b(?:required|requirements|qualifications)\b.*$/i, "")
    .replace(/[.:;,]\s*$/, "")
    .trim();

export const buildCareerResumeContext = (resume: ResumeDocument): CareerResumeContext => {
  const rendered = renderMarkdown(resume.markdown, true);
  const { frontmatter, content } = parseFrontmatter(resume.markdown);
  const structured = parseStructuredResume(resume.markdown);
  const text = rendered.plainText;
  const bullets = content.split("\n").filter((line) => /^\s*[-*•‣▪]\s+/.test(line)).map(cleanBullet).filter(Boolean);
  const skillCandidates = [
    ...structured.skills,
    ...(text.match(/\b(?:React|TypeScript|JavaScript|Python|SQL|PostgreSQL|Node\.js|Leadership|Operations|Product|Platform|AI|Machine Learning|Sales|Finance|Strategy|Go-to-market|Data|Analytics)\b/gi) ?? []),
  ];
  const summary = structured.summary || firstSentence(text) || placeholder("add a brief summary from your resume");
  return {
    resumeId: resume.id,
    resumeTitle: resume.title,
    candidateName: frontmatter.name || placeholder("your name"),
    professionalTitle: frontmatter.title || resume.targetRole || placeholder("professional title"),
    targetRole: frontmatter.targetRole || resume.targetRole || frontmatter.title || placeholder("target role"),
    contactLine: [frontmatter.email, frontmatter.phone, frontmatter.location].filter(Boolean).join(" | "),
    summary,
    skills: unique(skillCandidates).slice(0, 8),
    bullets: bullets.slice(0, 10),
  };
};

const jobContext = (value: string, fallbackRole: string) => {
  const target = extractJobTarget(value || fallbackRole);
  const companyMatch = value.match(/\b(?:at|with|for)\s+([A-Z][A-Za-z0-9&,' -]{2,60})(?:[.,"\n]|$)/);
  const role = cleanRoleTitle(target.title || fallbackRole);
  return {
    role: role || fallbackRole || placeholder("target role"),
    company: companyMatch?.[1]?.trim() || placeholder("company name"),
    skills: unique([...(target.requiredSkills ?? []), ...(target.tools ?? []), ...(target.keywords ?? [])]).slice(0, 5),
    hasInput: Boolean(value.trim()),
  };
};

export const generateCoverLetterDraft = (resume: ResumeDocument, roleContext = "") => {
  const context = buildCareerResumeContext(resume);
  const job = jobContext(roleContext, context.targetRole);
  const relevantSkills = job.skills.length ? job.skills : context.skills.slice(0, 4);
  const evidence = context.bullets.slice(0, 3);
  return `# Cover Letter Draft

Dear Hiring Team,

I am interested in the ${job.role} role at ${job.company}. My resume points to experience in ${relevantSkills.join(", ") || placeholder("verified skills from your resume")}, and I would like to connect that background to the needs of this role.

The strongest evidence from my resume includes:

${evidence.length ? evidence.map((item) => `- ${item}`).join("\n") : `- ${placeholder("choose a verified achievement from your resume")}`}
- ${job.hasInput ? "Add one sentence that connects your experience to the company or role." : placeholder("paste a job description to tailor this paragraph")}

I would welcome the chance to discuss where my experience is relevant and where I could contribute quickly.

Sincerely,
${context.candidateName}
`;
};

export const generateLinkedInProfileDraft = (resume: ResumeDocument, roleContext = ""): LinkedInProfileDraft => {
  const context = buildCareerResumeContext(resume);
  const job = jobContext(roleContext, context.targetRole);
  const skills = job.skills.length ? job.skills : context.skills.slice(0, 5);
  const skillPhrase = skills.length ? skills.slice(0, 3).join(" | ") : placeholder("verified strengths");
  return {
    headlines: [
      `${context.professionalTitle} | ${skillPhrase}`,
      `${job.role} candidate focused on ${skills.slice(0, 2).join(" and ") || placeholder("verified strengths")}`,
      `${context.targetRole} | ${skills.slice(0, 4).join(" · ") || placeholder("key skills")}`,
    ],
    about: `${context.professionalTitle} with experience reflected in my resume. I focus on ${skills.join(", ") || placeholder("verified strengths")} and try to make my work easy to evaluate through clear scope, outcomes, and examples.\n\n${context.summary}\n\nReplace this draft with your own voice, and verify every claim before posting.`,
    connectionMessage: `Hi ${placeholder("name")}, I saw your work related to ${job.role}. My background includes ${skills.slice(0, 3).join(", ") || placeholder("verified skills")}, and I would value connecting if that is relevant to your team or network.`,
  };
};

export const generateRecruiterMessageDraft = (resume: ResumeDocument, roleContext = "") => {
  const context = buildCareerResumeContext(resume);
  const job = jobContext(roleContext, context.targetRole);
  const skills = job.skills.length ? job.skills : context.skills.slice(0, 4);
  const proof = context.bullets.find((bullet) => /\d|%|\$|reduced|increased|improved|saved|grew|launched|built|led/i.test(bullet)) ?? context.bullets[0] ?? placeholder("add one verified resume proof point");
  return `Hi ${placeholder("recruiter name")},

I’m reaching out about ${job.role} at ${job.company}. My resume includes experience with ${skills.join(", ") || placeholder("verified skills from your resume")}.

One relevant example: ${proof}

If this background is aligned with the role, I’d be glad to send a tailored resume or share more context.

Best,
${context.candidateName}`;
};

export const generateInterviewPrepDraft = (resume: ResumeDocument, roleContext = ""): InterviewPrepDraft => {
  const context = buildCareerResumeContext(resume);
  const job = jobContext(roleContext, context.targetRole);
  const bullets = context.bullets.length ? context.bullets : [placeholder("add resume achievement")];
  const weakAreas = bullets
    .filter((bullet) => !/\d|%|\$|reduced|increased|improved|saved|grew|launched|built|led/i.test(bullet))
    .slice(0, 5)
    .map((bullet) => `Prepare more detail for: ${bullet}`);
  return {
    likelyQuestions: [
      `Walk me through your experience as it relates to ${job.role}.`,
      `Which resume achievement best shows impact for ${job.company}?`,
      "Tell me about a time you worked across teams or stakeholders.",
      "What would you do in the first 30-60 days in this role?",
      "Which part of your background is most relevant, and which part needs more context?",
    ],
    starPrompts: bullets.slice(0, 8).map((bullet) => `For "${bullet}", prepare Situation, Task, Action, Result, and add a verified metric if one exists.`),
    weakAreas: weakAreas.length ? weakAreas : ["No obvious weak areas from the current bullets. Still prepare context for scope, tradeoffs, and your exact role."],
  };
};

export const interviewPrepToMarkdown = (draft: InterviewPrepDraft) => `# Interview Prep

## Likely Questions

${draft.likelyQuestions.map((item) => `- ${item}`).join("\n")}

## STAR Story Prompts

${draft.starPrompts.map((item) => `- ${item}`).join("\n")}

## Weak Areas To Prepare

${draft.weakAreas.map((item) => `- ${item}`).join("\n")}
`;

export const linkedInDraftToMarkdown = (draft: LinkedInProfileDraft) => `# LinkedIn Profile Draft

## Headline Options

${draft.headlines.map((item) => `- ${item}`).join("\n")}

## About Section

${draft.about}

## Connection Message

${draft.connectionMessage}
`;

export const markdownToPlainText = (markdown: string) => markdown.replace(/^#+\s+/gm, "").replace(/\n{3,}/g, "\n\n").trim();
