import { actionVerbs } from "./data/actionVerbs";
import { requiredSectionGroups } from "./data/standardSections";
import { hasMetricSignal } from "./rules/bulletRules";
import type { ResumeAchievementAudit, ResumeReviewDocument, ResumeReviewIssue, ResumeSectionReview } from "./types";

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const scopePattern = /\b(team|teams|customer|customers|user|users|client|clients|revenue|budget|pipeline|platform|system|systems|product|products|market|markets|region|regions|country|countries|project|projects|program|programs|workflow|workflows|operation|operations|staff|engineer|engineers|stakeholder|stakeholders|vendor|vendors|\d+\+?)\b/i;
const outcomePattern = /\b(reduced|increased|improved|decreased|saved|grew|launched|delivered|accelerated|expanded|standardized|streamlined|optimized|enabled|converted|raised|secured|cut|lifted|lowered|shortened|prevented|resolved|recovered|generated|won)\b/i;

const sectionBlock = (document: ResumeReviewDocument, aliases: string[]) => {
  const escaped = aliases.map((alias) => alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  return document.content.match(new RegExp(`(?:^|\\n)##\\s+(?:${escaped})\\s*\\n([\\s\\S]*?)(?=\\n##\\s+|$)`, "i"))?.[1]?.trim() ?? "";
};

const hasSection = (document: ResumeReviewDocument, aliases: string[]) => {
  const normalized = new Set(aliases.map(normalize));
  return document.headings.some((heading) => normalized.has(normalize(heading.text)));
};

const sectionIssues = (issues: ResumeReviewIssue[], labels: string[], categories: ResumeReviewIssue["category"][]) => {
  const normalizedLabels = labels.map(normalize);
  return issues.filter((issue) => {
    const location = normalize(issue.location);
    return categories.includes(issue.category) && normalizedLabels.some((label) => location.includes(label) || label.includes(location));
  });
};

const section = (patch: ResumeSectionReview): ResumeSectionReview => patch;

export const buildSectionReviews = (document: ResumeReviewDocument, issues: ResumeReviewIssue[]): ResumeSectionReview[] => {
  const contactMissing = issues.filter((issue) => issue.category === "contact").length;
  const sectionDefs: Array<{ id: string; label: string; aliases: string[]; required: boolean; categories: ResumeReviewIssue["category"][] }> = [
    { id: "summary", label: "Summary", aliases: requiredSectionGroups.summary, required: true, categories: ["structure", "recruiter-skim"] },
    { id: "experience", label: "Experience", aliases: requiredSectionGroups.experience, required: true, categories: ["structure", "bullet-quality", "impact-metrics", "recruiter-skim"] },
    { id: "skills", label: "Skills", aliases: requiredSectionGroups.skills, required: true, categories: ["structure", "keyword-match"] },
    { id: "education", label: "Education", aliases: requiredSectionGroups.education, required: true, categories: ["structure"] },
    { id: "projects", label: "Projects", aliases: ["projects", "selected projects"], required: false, categories: ["structure", "bullet-quality", "impact-metrics"] },
    { id: "certifications", label: "Certifications", aliases: ["certifications", "certificates", "licenses"], required: false, categories: ["structure", "keyword-match"] },
  ];

  const contactScore = Math.max(0, 100 - contactMissing * 24);
  const reviews = [
    section({
      id: "header",
      label: "Header",
      status: contactMissing ? "needs-work" : "strong",
      score: contactScore,
      issueCount: contactMissing,
      signal: contactMissing ? "Some contact fields are missing or hard to parse." : "Contact details look parser-friendly.",
      recommendation: contactMissing ? "Complete name, email, phone, location, and the most useful professional links." : "Keep the header concise and text-based.",
    }),
  ];

  sectionDefs.forEach((definition) => {
    const present = hasSection(document, definition.aliases);
    const block = sectionBlock(document, definition.aliases);
    const relatedIssues = sectionIssues(issues, definition.aliases, definition.categories);
    const bulletCount = document.bullets.filter((bullet) => definition.aliases.some((alias) => normalize(bullet.section).includes(normalize(alias)))).length;
    const contentWords = block.split(/\s+/).filter(Boolean).length;
    const scoreValue = present ? Math.max(0, 100 - relatedIssues.length * 14 - (definition.id === "experience" && bulletCount < 3 ? 18 : 0)) : definition.required ? 0 : 100;
    const status: ResumeSectionReview["status"] = !present && definition.required ? "missing" : scoreValue < 72 ? "needs-work" : "strong";
    const signal = !present
      ? definition.required ? `${definition.label} section is not detected.` : `No ${definition.label.toLowerCase()} section detected, which is fine if it is not relevant.`
      : definition.id === "experience"
        ? `${bulletCount} experience bullet${bulletCount === 1 ? "" : "s"} detected.`
        : `${contentWords} word${contentWords === 1 ? "" : "s"} detected.`;
    const recommendation = !present
      ? definition.required ? `Add a truthful ${definition.label.toLowerCase()} section or rename the equivalent section clearly.` : `Add ${definition.label.toLowerCase()} only when it strengthens the target role story.`
      : relatedIssues.length
        ? `Resolve the ${relatedIssues.length} review item${relatedIssues.length === 1 ? "" : "s"} tied to this section.`
        : "No obvious section issue detected.";
    reviews.push(section({ id: definition.id, label: definition.label, status, score: scoreValue, issueCount: relatedIssues.length, signal, recommendation }));
  });

  return reviews;
};

const bulletCompleteness = (text: string) => {
  const lower = text.toLowerCase();
  const hasAction = actionVerbs.some((verb) => lower.startsWith(verb));
  const hasMetric = hasMetricSignal(text);
  const hasScope = scopePattern.test(text);
  const hasOutcome = outcomePattern.test(text) || hasMetric;
  const missing = [
    !hasAction && "action verb",
    !hasScope && "scope",
    !hasMetric && "metric or scale",
    !hasOutcome && "outcome",
  ].filter((value): value is string => Boolean(value));
  return { hasAction, hasMetric, hasScope, hasOutcome, missing, complete: missing.length === 0 };
};

export const buildAchievementAudit = (document: ResumeReviewDocument): ResumeAchievementAudit => {
  const checks = document.bullets.map((bullet) => ({ ...bullet, ...bulletCompleteness(bullet.text) }));
  const bySection = new Map<string, typeof checks>();
  checks.forEach((bullet) => bySection.set(bullet.section, [...(bySection.get(bullet.section) ?? []), bullet]));

  return {
    totalBullets: checks.length,
    completeBullets: checks.filter((bullet) => bullet.complete).length,
    metricBullets: checks.filter((bullet) => bullet.hasMetric).length,
    actionVerbBullets: checks.filter((bullet) => bullet.hasAction).length,
    scopeBullets: checks.filter((bullet) => bullet.hasScope).length,
    outcomeBullets: checks.filter((bullet) => bullet.hasOutcome).length,
    roleSummaries: [...bySection.entries()].map(([sectionName, bullets]) => {
      const completeCount = bullets.filter((bullet) => bullet.complete).length;
      return {
        section: sectionName,
        bulletCount: bullets.length,
        completeCount,
        recommendation: completeCount === bullets.length
          ? "Achievement signals look strong."
          : "Add verified scope, metrics, or outcomes to the weaker bullets.",
      };
    }),
    opportunities: checks
      .filter((bullet) => bullet.missing.length)
      .slice(0, 6)
      .map((bullet) => ({
        bullet: bullet.text,
        section: bullet.section,
        missing: bullet.missing,
        prompt: `Can you add truthful ${bullet.missing.join(", ")} evidence for this bullet?`,
      })),
  };
};
