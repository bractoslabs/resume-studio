import { uid } from "../../utils";
import { actionVerbs } from "../data/actionVerbs";
import { buzzwords } from "../data/buzzwords";
import { weakPhrases } from "../data/weakPhrases";
import type { ResumeReviewIssue, ResumeReviewRule } from "../types";

const issue = (patch: Omit<ResumeReviewIssue, "id">): ResumeReviewIssue => ({ id: uid("review"), ...patch });
const metricPattern = /(\d+%|\$\s?\d+|\b\d+x\b|\b\d+\+?\b|reduced|increased|improved|decreased|saved|grew|uptime|sla|revenue|cost|margin|throughput|users|customers)/i;

export const bulletRules: ResumeReviewRule = (document) => {
  const issues: ResumeReviewIssue[] = [];
  const add = (patch: Omit<ResumeReviewIssue, "id">) => issues.push(issue(patch));
  const actionCounts = new Map<string, number>();
  document.bullets.forEach((bullet, index) => {
    const lower = bullet.text.toLowerCase();
    const first = lower.match(/^([a-z]+)/)?.[1] ?? "";
    if (first) actionCounts.set(first, (actionCounts.get(first) ?? 0) + 1);
    if (weakPhrases.some((phrase) => lower.startsWith(phrase))) add({ title: "Weak bullet opening", severity: "warning", priority: "should-improve", category: "bullet-quality", location: `${bullet.section}, bullet ${index + 1}`, whyItMatters: "Passive openings make ownership and impact harder to see.", suggestedFix: "Start with a specific action verb, then add scope, method, and result.", safeAutoFix: false });
    if (!actionVerbs.some((verb) => lower.startsWith(verb))) add({ title: "No clear action verb", severity: "info", priority: "nice-to-have", category: "bullet-quality", location: `${bullet.section}, bullet ${index + 1}`, whyItMatters: "Action verbs help recruiters quickly understand ownership.", suggestedFix: "Use a truthful verb such as Led, Built, Improved, Managed, Created, Reduced, or Standardized.", safeAutoFix: false });
    if (bullet.text.length < 38) add({ title: "Bullet is too short", severity: "info", priority: "nice-to-have", category: "bullet-quality", location: `${bullet.section}, bullet ${index + 1}`, whyItMatters: "Very short bullets often lack scope or outcome.", suggestedFix: "Add truthful scope, audience, tool, or result.", safeAutoFix: false });
    if (bullet.text.length > 240) add({ title: "Bullet is too long", severity: "warning", priority: "should-improve", category: "recruiter-skim", location: `${bullet.section}, bullet ${index + 1}`, whyItMatters: "Long bullets are harder to scan and can wrap poorly in exports.", suggestedFix: "Split into one concise action/result bullet.", safeAutoFix: false });
    if (!metricPattern.test(bullet.text)) add({ title: "Missing measurable result", severity: "info", priority: "nice-to-have", category: "impact-metrics", location: `${bullet.section}, bullet ${index + 1}`, whyItMatters: "Metrics and scale make impact more credible when they are truthful.", suggestedFix: "Add [add metric], [add scale], [add timeframe], or [add business result] if you can verify it.", safeAutoFix: false });
    const buzzwordHits = buzzwords.filter((word) => lower.includes(word));
    if (buzzwordHits.length > 1) add({ title: "Buzzword-heavy bullet", severity: "info", priority: "nice-to-have", category: "bullet-quality", location: `${bullet.section}, bullet ${index + 1}`, whyItMatters: "Buzzwords take space from concrete evidence.", suggestedFix: "Replace vague claims with specific work, scope, tools, or outcomes.", safeAutoFix: false });
    if (/\b(supported|maintained|managed|worked)\b.+\b(various|multiple|several|many|things|tasks)\b/i.test(bullet.text)) add({ title: "Unclear ownership", severity: "info", priority: "nice-to-have", category: "bullet-quality", location: `${bullet.section}, bullet ${index + 1}`, whyItMatters: "Vague ownership makes it hard to evaluate seniority.", suggestedFix: "Name the process, team, customer group, system, or decision you owned.", safeAutoFix: false });
  });
  [...actionCounts.entries()].filter(([, count]) => count >= 4).forEach(([verb]) => add({ title: "Repeated action verb", severity: "info", priority: "nice-to-have", category: "bullet-quality", location: `Verb: ${verb}`, whyItMatters: "Repeating the same opening makes bullets feel less distinct.", suggestedFix: "Vary action verbs only when the new verb remains truthful.", safeAutoFix: false }));
  const roleBlocks = document.content.split(/\n(?=###\s+)/).filter((block) => /^###\s+/m.test(block));
  roleBlocks.forEach((block) => {
    const role = block.match(/^###\s+(.+)/m)?.[1] ?? "Role";
    const bulletCount = (block.match(/^\s*[-*•‣▪]\s+/gm) ?? []).length;
    if (bulletCount > 7) add({ title: "Too many bullets under one role", severity: "warning", priority: "should-improve", category: "recruiter-skim", location: role, whyItMatters: "Too many bullets under one role hide the strongest evidence.", suggestedFix: "Keep the most relevant 3-6 bullets for the target role.", safeAutoFix: false });
    if (bulletCount > 0 && bulletCount < 2) add({ title: "Too few bullets under role", severity: "info", priority: "nice-to-have", category: "bullet-quality", location: role, whyItMatters: "A role with one bullet may not show enough scope.", suggestedFix: "Add another truthful bullet or merge the role if it is less relevant.", safeAutoFix: false });
  });
  return issues;
};

export const hasMetricSignal = (text: string) => metricPattern.test(text);
