import type { JobMatchReport, JobTarget } from "./types";
import { createJobTargetId, analyzeJobKeywords } from "./resume-review";
import { nowIso } from "./utils";

export const extractJobTarget = (description: string): JobTarget => {
  const match = analyzeJobKeywords("", description);
  return {
    id: createJobTargetId(),
    title: match.title,
    description,
    requiredSkills: match.requiredSkills,
    preferredSkills: match.preferredSkills,
    tools: match.tools,
    keywords: match.industryTerms,
    analysis: {
      title: match.title,
      overlapLabel: match.overlapLabel,
      requiredSkills: match.requiredSkills,
      preferredSkills: match.preferredSkills,
      tools: match.tools,
      certifications: match.certifications,
      industryTerms: match.industryTerms,
      responsibilities: match.responsibilities,
      ignoredGenericTerms: match.ignoredGenericTerms,
      terms: match.terms,
      keywords: match.industryTerms,
      senioritySignals: match.senioritySignals,
      softSkills: match.softSkills,
      matched: match.matched,
      missing: match.missing,
      underused: match.underused,
      coverage: match.coverage,
      suggestions: match.suggestions,
      score: match.score,
    },
    lastAnalyzedAt: nowIso(),
    createdAt: nowIso(),
  };
};

export const compareResumeToJob = (markdown: string, description: string): JobMatchReport => {
  const match = analyzeJobKeywords(markdown, description);
  return {
    title: match.title,
    overlapLabel: match.overlapLabel,
    requiredSkills: match.requiredSkills,
    preferredSkills: match.preferredSkills,
    tools: match.tools,
    certifications: match.certifications,
    industryTerms: match.industryTerms,
    responsibilities: match.responsibilities,
    ignoredGenericTerms: match.ignoredGenericTerms,
    terms: match.terms,
    keywords: match.industryTerms,
    senioritySignals: match.senioritySignals,
    softSkills: match.softSkills,
    matched: match.matched,
    missing: match.missing,
    underused: match.underused,
    coverage: match.coverage,
    suggestions: match.suggestions,
    score: match.score,
  };
};
