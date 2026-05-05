import { uid } from "../../utils";
import type { ResumeReviewIssue, ResumeReviewRule } from "../types";

const issue = (patch: Omit<ResumeReviewIssue, "id">): ResumeReviewIssue => ({ id: uid("review"), ...patch });

const metricSignals: Array<[RegExp, string]> = [
  [/\d+%/, "percentages"],
  [/\$\s?\d+|revenue|cost|margin/i, "financial impact"],
  [/\b\d+\s*(hours?|days?|weeks?|months?)\b|time saved|cycle time|faster/i, "time saved or speed"],
  [/\b\d+\+?\s*(users?|customers?|accounts?|orders?|tickets?|shipments?)\b/i, "scale numbers"],
  [/\bteam of \d+|\b\d+\s*(engineers?|direct reports|people)\b/i, "team size"],
  [/uptime|reliability|sla|error rate|quality/i, "reliability or quality"],
  [/throughput|volume|capacity|pipeline/i, "volume or throughput"],
];

export const metricsRules: ResumeReviewRule = (document) => {
  const present = metricSignals.filter(([pattern]) => pattern.test(document.plainText.text)).map(([, label]) => label);
  if (present.length >= 3) return [];
  return [
    issue({
      title: "Limited impact metric variety",
      severity: "info",
      priority: "nice-to-have",
      category: "impact-metrics",
      location: "Experience bullets",
      whyItMatters: "Different impact signals help recruiters understand scale, quality, speed, and business value.",
      suggestedFix: "Where truthful, add [add metric], [add scale], [add timeframe], or [add business result]. Do not invent numbers.",
      safeAutoFix: false,
    }),
  ];
};
