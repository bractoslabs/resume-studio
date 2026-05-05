import type { AtsIssue, AtsReport } from "./types";
import { analyzeResume } from "./resume-review";

const severityToLegacy = (severity: "critical" | "warning" | "info") => severity;
const categoryToLegacy = (category: string) =>
  ({
    contact: "Contact",
    structure: "Sections",
    "ats-readability": "Formatting",
    "formatting-risk": "Formatting",
    "bullet-quality": "Bullet quality",
    "impact-metrics": "Bullet quality",
    "date-consistency": "Dates",
    "keyword-match": "Keyword overlap",
    "recruiter-skim": "Length",
    "export-safety": "Formatting",
  })[category] ?? category;

export const analyzeAts = (markdown: string, jobKeywords: string[] = []): AtsReport => {
  const review = analyzeResume({ markdown, jobDescription: jobKeywords.join("\n") });
  const issues: AtsIssue[] = review.issues.map((issue) => ({
    id: issue.id,
    severity: severityToLegacy(issue.severity),
    category: categoryToLegacy(issue.category),
    location: issue.location,
    explanation: issue.whyItMatters,
    suggestedFix: issue.suggestedFix,
    apply: issue.fix?.apply,
  }));
  return {
    scores: {
      overall: review.overallScore,
      parseability: review.scores.atsReadability.value,
      keywords: review.scores.keywordMatch.value,
      formatting: review.scores.formattingRisk.value,
      contact: review.scores.contactInfo.value,
      sections: review.scores.structure.value,
      bullets: review.scores.bulletQuality.value,
      length: review.scores.recruiterSkim.value,
    },
    issues,
  };
};

const metricPattern = /(\d+%|\$\d+|\b\d+x\b|\b\d+\+?\b|reduced|increased|improved|decreased|saved|grew)/i;

export const improveBulletLocal = (bullet: string, mode: string) => {
  const clean = bullet.replace(/^[-*]\s+/, "").trim();
  const hasMetric = metricPattern.test(clean);
  const action = clean.replace(/^(responsible for|helped|worked on|assisted with|handled)\s+/i, "");
  const startsWithAction =
    /^(built|led|improved|developed|migrated|launched|managed|created|designed|engineered|reduced|increased|delivered|coordinated|standardized|partnered)\b/i.test(
      action,
    );
  const prefix = mode === "executive" ? "Led" : mode === "technical" ? "Engineered" : mode === "sales" ? "Advanced" : "Improved";
  const after = `${startsWithAction ? action : `${prefix} ${action}`}${hasMetric ? "" : " to deliver [add metric/result]"}`;
  return { before: clean, after, needsUserMetric: !hasMetric };
};
