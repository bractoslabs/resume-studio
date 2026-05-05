import { clamp } from "../utils";
import type { ResumeReviewCategory, ResumeReviewIssue, ResumeReviewResult, ResumeReviewScore } from "./types";
import { hasMetricSignal } from "./rules/bulletRules";

const categoryPenalty = (issues: ResumeReviewIssue[], categories: ResumeReviewCategory[]) =>
  issues
    .filter((issue) => categories.includes(issue.category))
    .reduce((total, issue) => total + (issue.severity === "critical" ? 28 : issue.severity === "warning" ? 13 : 5), 0);

const score = (label: string, value: number, explanation: string): ResumeReviewScore => ({
  label,
  value: clamp(Math.round(value)),
  explanation,
});

export const scoreReview = (
  issues: ResumeReviewIssue[],
  bulletTexts: string[],
  keywordScore: number,
): ResumeReviewResult["scores"] => {
  const metricRate = bulletTexts.length ? bulletTexts.filter(hasMetricSignal).length / bulletTexts.length : 0;
  const bulletWarnings = categoryPenalty(issues, ["bullet-quality"]);
  const formattingPenalty = categoryPenalty(issues, ["formatting-risk"]);
  const structurePenalty = categoryPenalty(issues, ["structure"]);
  const skimPenalty = categoryPenalty(issues, ["recruiter-skim"]);
  return {
    contactInfo: score("Contact Info", 100 - categoryPenalty(issues, ["contact"]), "Name, email, phone, location, and professional links are checked for parser-friendly contact completeness."),
    structure: score("Structure", 100 - structurePenalty, "Standard sections, duplicate headings, empty sections, summary length, and document length are checked."),
    atsReadability: score("ATS Readability", 100 - categoryPenalty(issues, ["ats-readability", "date-consistency"]) - formattingPenalty * 0.35, "Plain-text reading order, dates, bullets, and parser-risk signals are checked."),
    formattingRisk: score("Formatting Risk", 100 - formattingPenalty, "Tables, images, icons, raw HTML, custom CSS, hidden content, and dense formatting are checked."),
    bulletQuality: score("Bullet Quality", bulletTexts.length ? 100 - bulletWarnings : 55, "Bullets are checked for action verbs, length, vague phrasing, repetition, ownership, and skim quality."),
    impactMetrics: score("Impact / Metrics", 55 + metricRate * 45 - categoryPenalty(issues, ["impact-metrics"]) * 0.45, "The engine looks for truthful scale, percentages, money, time, quality, reliability, team, and volume signals."),
    keywordMatch: score("Keyword Match", keywordScore, "When a job description is provided, deterministic extracted terms are compared against resume text."),
    recruiterSkim: score("Recruiter Skim", 100 - skimPenalty - structurePenalty * 0.25 - bulletWarnings * 0.2, "The review estimates how quickly a recruiter can scan the resume's sections, bullets, and summary."),
    exportSafety: score("Export Safety", 100 - categoryPenalty(issues, ["export-safety"]) - formattingPenalty * 0.25, "Design settings and export risks are checked while preserving text-based PDF/print output."),
  };
};

export const overallScore = (scores: ResumeReviewResult["scores"]) => {
  const weights: Array<[keyof ResumeReviewResult["scores"], number]> = [
    ["contactInfo", 0.12],
    ["structure", 0.13],
    ["atsReadability", 0.16],
    ["formattingRisk", 0.1],
    ["bulletQuality", 0.13],
    ["impactMetrics", 0.11],
    ["keywordMatch", 0.1],
    ["recruiterSkim", 0.1],
    ["exportSafety", 0.05],
  ];
  return Math.round(weights.reduce((total, [key, weight]) => total + scores[key].value * weight, 0));
};
