import { renderMarkdown } from "../markdown";
import { uid } from "../utils";
import type { JobKeywordMatch } from "./types";

type TermCategory = JobKeywordMatch["terms"][number]["category"];
type Confidence = JobKeywordMatch["terms"][number]["confidence"];

const dictionaries: Record<string, string[]> = {
  programming: ["JavaScript", "TypeScript", "Python", "Java", "C#", "Go", "Rust", "SQL"],
  frameworks: ["React", "Node.js", "Next.js", "Vue", "Angular", "Django", "Flask", "Express", "Tailwind", "GitHub Actions"],
  databases: ["PostgreSQL", "MySQL", "MongoDB", "Redis"],
  cloud: ["AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "Terraform"],
  aiData: [
    "LLM",
    "large language model",
    "generative AI",
    "AI agents",
    "autonomous agents",
    "machine learning",
    "model evaluation",
    "human feedback",
    "RLHF",
    "data pipelines",
    "analytics",
    "business intelligence",
    "Tableau",
    "Power BI",
  ],
  cybersecurity: [
    "SOC",
    "SIEM",
    "incident response",
    "vulnerability management",
    "NIST",
    "zero trust",
    "threat detection",
    "risk management",
  ],
  operations: [
    "WMS",
    "TMS",
    "ERP",
    "inventory",
    "fulfillment",
    "3PL",
    "warehouse operations",
    "supply chain",
    "logistics",
    "shipping",
    "receiving",
    "SLA",
    "uptime",
    "throughput",
  ],
  salesMarketing: ["Salesforce", "pipeline", "account management", "lead generation", "customer success", "revenue operations", "CRM"],
  product: ["roadmap", "product discovery", "launch readiness", "stakeholder alignment", "customer research", "experimentation", "Jira"],
  certifications: ["PMP", "CPA", "CISSP", "Security+", "AWS Certified", "Scrum", "Six Sigma", "SHRM", "RN", "PE"],
};

const aliases: Record<string, string> = {
  js: "JavaScript",
  ts: "TypeScript",
  node: "Node.js",
  nodejs: "Node.js",
  postgres: "PostgreSQL",
  gcp: "Google Cloud",
  "google cloud platform": "Google Cloud",
  llms: "LLM",
  "large language models": "LLM",
  genai: "generative AI",
  github: "GitHub",
  k8s: "Kubernetes",
  "ci cd": "CI/CD",
  cicd: "CI/CD",
};

const meaningfulPhrases = [
  "AI agents",
  "autonomous agents",
  "large language models",
  "human feedback",
  "model evaluation",
  "distributed systems",
  "design systems",
  "customer-facing dashboards",
  "remote contract work",
  "software development",
  "data pipelines",
  "warehouse management systems",
  "cybersecurity operations",
  "business intelligence",
  "customer support",
  "supply chain",
  "warehouse operations",
  "product operations",
  "launch readiness",
  "incident response",
];

const softSkills = [
  "stakeholder communication",
  "cross-functional leadership",
  "mentoring",
  "ownership",
  "problem solving",
  "written communication",
];
const seniorityTerms = ["senior", "lead", "principal", "director", "manager", "executive", "vp", "head of", "staff"];
const genericWords = new Set([
  "ability",
  "abilities",
  "opportunity",
  "passionate",
  "world",
  "innovative",
  "complex",
  "project",
  "projects",
  "system",
  "systems",
  "team",
  "teams",
  "work",
  "working",
  "experience",
  "experienced",
  "responsible",
  "responsibilities",
  "role",
  "candidate",
  "ideal",
  "excellent",
  "strong",
  "communication",
  "collaborate",
  "collaboration",
  "fast-paced",
  "detail-oriented",
  "self-starter",
  "motivated",
  "dynamic",
  "environment",
  "business",
  "support",
  "help",
  "contribute",
  "data",
  "agents",
  "rates",
]);
const stopWords = new Set([
  ...genericWords,
  "and",
  "the",
  "with",
  "for",
  "you",
  "will",
  "are",
  "our",
  "that",
  "this",
  "from",
  "have",
  "has",
  "into",
  "your",
  "their",
  "across",
  "within",
]);
const sectionWeights: Record<string, number> = {
  required: 4,
  requirements: 4,
  qualifications: 4,
  preferred: 2.4,
  responsibilities: 3,
  role: 2.2,
  company: 0.45,
  benefits: 0.25,
  legal: 0,
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const canonical = (value: string) =>
  aliases[
    value
      .toLowerCase()
      .replace(/[^a-z0-9+#. ]/g, "")
      .trim()
  ] ?? value.replace(/\s+/g, " ").trim();
const unique = (values: string[]) => [...new Set(values.map(canonical).filter(Boolean))];
const containsTerm = (text: string, term: string) =>
  new RegExp(`(^|[^a-z0-9])${escapeRegex(canonical(term).toLowerCase())}([^a-z0-9]|$)`, "i").test(text) ||
  Object.entries(aliases).some(
    ([alias, label]) => label === canonical(term) && new RegExp(`(^|[^a-z0-9])${escapeRegex(alias)}([^a-z0-9]|$)`, "i").test(text),
  );

const overlapLabel = (score: number): JobKeywordMatch["overlapLabel"] =>
  score < 35 ? "Low keyword overlap" : score < 70 ? "Moderate keyword overlap" : "Strong keyword overlap";

const splitSections = (description: string) => {
  const lines = description
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const sections: Array<{ kind: string; text: string }> = [];
  let current = "role";
  let buffer: string[] = [];
  const flush = () => {
    if (buffer.length) sections.push({ kind: current, text: buffer.join("\n") });
    buffer = [];
  };
  for (const line of lines) {
    const lower = line.toLowerCase().replace(/:$/, "");
    const next = /preferred|nice to have|bonus|plus/.test(lower)
      ? "preferred"
      : /required|minimum|must have|qualifications/.test(lower)
        ? "required"
        : /responsibilities|what you.?ll do|duties|about the role/.test(lower)
          ? "responsibilities"
          : /benefits|perks|equal opportunity|eeo|about us|about the company/.test(lower)
            ? /equal opportunity|eeo/.test(lower)
              ? "legal"
              : "company"
            : "";
    if (next && line.length < 90) {
      flush();
      current = next;
    } else {
      buffer.push(line);
    }
  }
  flush();
  return sections.length ? sections : [{ kind: "role", text: description }];
};

const addTerm = (
  map: Map<string, JobKeywordMatch["terms"][number]>,
  label: string,
  category: TermCategory,
  sectionKind: string,
  count = 1,
  confidence: Confidence = "medium",
) => {
  const normalized = canonical(label);
  if (!normalized || genericWords.has(normalized.toLowerCase())) return;
  const existing = map.get(normalized);
  const sectionWeight = sectionWeights[sectionKind] ?? 1;
  const weight =
    (category === "required"
      ? 4
      : category === "tool" || category === "certification"
        ? 3.4
        : category === "preferred"
          ? 2.4
          : category === "responsibility"
            ? 2
            : 1.5) * sectionWeight;
  if (existing) {
    existing.weight += weight;
    existing.count += count;
    existing.confidence = existing.confidence === "high" || confidence === "high" ? "high" : existing.confidence;
  } else {
    map.set(normalized, { label: normalized, category, confidence, weight, matched: false, count });
  }
};

const extractNgrams = (text: string) => {
  const words = text
    .toLowerCase()
    .replace(/^\s*[-*•]\s+/gm, " ")
    .replace(/[^a-z0-9+#. ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const phrases: string[] = [];
  for (let size = 4; size >= 2; size -= 1) {
    for (let index = 0; index <= words.length - size; index += 1) {
      const parts = words.slice(index, index + size);
      if (parts.every((word) => stopWords.has(word))) continue;
      if (stopWords.has(parts[0]) || stopWords.has(parts[parts.length - 1])) continue;
      const phrase = parts.join(" ");
      if (
        meaningfulPhrases.some((known) => known.toLowerCase() === phrase) ||
        /systems|pipelines|operations|agents|models|dashboards|intelligence|management/.test(phrase)
      )
        phrases.push(phrase);
    }
  }
  return unique(phrases);
};

export const analyzeJobKeywords = (resumeMarkdown: string, description = ""): JobKeywordMatch => {
  const resumeText = renderMarkdown(resumeMarkdown, true).plainText.toLowerCase();
  const desc = description.trim();
  const empty: JobKeywordMatch = {
    title: "No job description",
    overlapLabel: "Low keyword overlap",
    requiredSkills: [],
    preferredSkills: [],
    tools: [],
    certifications: [],
    senioritySignals: [],
    softSkills: [],
    industryTerms: [],
    responsibilities: [],
    ignoredGenericTerms: [],
    terms: [],
    matched: [],
    missing: [],
    underused: [],
    coverage: { requiredSkills: 0, tools: 0, domain: 0, seniority: 0, certifications: 100 },
    suggestions: [],
    score: 0,
  };
  if (!desc) return empty;

  const title =
    desc.match(/(?:job title|title|role)[:\s-]+([^\n]+)/i)?.[1]?.trim() ??
    desc
      .split("\n")
      .find((line) => line.trim().length > 8 && line.trim().length < 90)
      ?.trim() ??
    "Target role";
  const sections = splitSections(desc);
  const termMap = new Map<string, JobKeywordMatch["terms"][number]>();
  const ignored = new Set<string>();

  for (const section of sections) {
    const lower = section.text.toLowerCase();
    if (section.kind === "legal") continue;
    Object.values(dictionaries)
      .flat()
      .forEach((term) => {
        if (containsTerm(lower, term)) {
          const category: TermCategory = dictionaries.certifications.includes(term)
            ? "certification"
            : dictionaries.programming.includes(term) ||
                dictionaries.frameworks.includes(term) ||
                dictionaries.databases.includes(term) ||
                dictionaries.cloud.includes(term)
              ? "tool"
              : "domain";
          addTerm(
            termMap,
            term,
            section.kind === "required" && category !== "certification"
              ? "required"
              : section.kind === "preferred"
                ? "preferred"
                : category,
            section.kind,
            1,
            "high",
          );
        }
      });
    [...Object.entries(aliases)].forEach(([alias, label]) => {
      if (containsTerm(lower, alias)) addTerm(termMap, label, section.kind === "preferred" ? "preferred" : "tool", section.kind, 1, "high");
    });
    meaningfulPhrases
      .filter((phrase) => containsTerm(lower, phrase))
      .forEach((phrase) =>
        addTerm(
          termMap,
          phrase,
          section.kind === "preferred" ? "preferred" : section.kind === "responsibilities" ? "responsibility" : "domain",
          section.kind,
          1,
          "high",
        ),
      );
    extractNgrams(section.text).forEach((phrase) =>
      addTerm(
        termMap,
        phrase,
        section.kind === "preferred" ? "preferred" : section.kind === "responsibilities" ? "responsibility" : "domain",
        section.kind,
        1,
        "medium",
      ),
    );
    softSkills
      .filter((term) => containsTerm(lower, term))
      .forEach((term) => addTerm(termMap, term, "soft-skill", section.kind, 1, "medium"));
    seniorityTerms
      .filter((term) => containsTerm(lower, term))
      .forEach((term) => addTerm(termMap, term, "seniority", section.kind, 1, "medium"));
    lower
      .replace(/[^a-z0-9+#. -]+/g, " ")
      .split(/\s+/)
      .filter((word) => genericWords.has(word))
      .forEach((word) => ignored.add(word));
  }

  const terms = [...termMap.values()].sort((a, b) => b.weight - a.weight).slice(0, 60);
  terms.forEach((term) => {
    term.matched = containsTerm(resumeText, term.label);
  });
  const important = terms.filter((term) => term.weight >= 2.4 || term.confidence === "high");
  const matchedWeight = important.filter((term) => term.matched).reduce((sum, term) => sum + term.weight, 0);
  const totalWeight = important.reduce((sum, term) => sum + term.weight, 0);
  const score = Math.round((matchedWeight / Math.max(totalWeight, 1)) * 100);
  const byCategory = (category: TermCategory) => terms.filter((term) => term.category === category).map((term) => term.label);
  const coverage = (categoryTerms: string[]) =>
    categoryTerms.length
      ? Math.round((categoryTerms.filter((term) => containsTerm(resumeText, term)).length / categoryTerms.length) * 100)
      : 100;
  const matched = terms.filter((term) => term.matched).map((term) => term.label);
  const missing = important.filter((term) => !term.matched).map((term) => term.label);
  const underused = matched.filter((term) => (resumeText.match(new RegExp(escapeRegex(term.toLowerCase()), "g")) ?? []).length === 1);
  const suggestions = important
    .filter((term) => !term.matched)
    .slice(0, 8)
    .map((term) => ({
      keyword: term.label,
      section:
        term.category === "tool" || term.category === "certification" || term.category === "required"
          ? "Skills, Certifications, or the most relevant Experience bullet"
          : "Relevant Experience or Projects",
      note: `${term.label} appears in the job description but not your resume. Add only if true.`,
      verificationPrompt: `Can you point to a real project, role, credential, or task where you used ${term.label}? If not, leave it out.`,
      suggestedWording: `Used ${term.label} to [describe truthful scope] and deliver [add metric or result].`,
    }));

  return {
    title: title.slice(0, 90),
    overlapLabel: overlapLabel(score),
    requiredSkills: unique([
      ...byCategory("required"),
      ...byCategory("tool").filter((term) => terms.find((item) => item.label === term && item.weight >= 10)),
    ]).slice(0, 16),
    preferredSkills: byCategory("preferred").slice(0, 14),
    tools: unique([
      ...byCategory("tool"),
      ...byCategory("required").filter((term) => Object.values(dictionaries).flat().includes(term)),
    ]).slice(0, 20),
    certifications: byCategory("certification"),
    senioritySignals: byCategory("seniority"),
    softSkills: byCategory("soft-skill"),
    industryTerms: byCategory("domain").slice(0, 20),
    responsibilities: byCategory("responsibility").slice(0, 16),
    ignoredGenericTerms: [...ignored].slice(0, 20),
    terms,
    matched,
    missing,
    underused,
    coverage: {
      requiredSkills: coverage(byCategory("required")),
      tools: coverage(byCategory("tool")),
      domain: coverage(byCategory("domain")),
      seniority: coverage(byCategory("seniority")),
      certifications: coverage(byCategory("certification")),
    },
    suggestions,
    score,
  };
};

export const createJobTargetId = () => uid("job");
