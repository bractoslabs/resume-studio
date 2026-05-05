import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { ResumeAchievementAudit, ResumeReviewIssue, ResumeReviewResult, ResumeSectionReview } from "../../lib/resume-review";
import { parseFrontmatter } from "../../lib/markdown";
import { Button } from "../common/Button";
import { improveBulletLocal, scoreTone } from "../../app/resumeTransforms";

interface ReviewPanelProps {
  ats?: unknown;
  review: ResumeReviewResult;
  intelligence?: unknown;
  issues: ResumeReviewIssue[];
  markdown: string;
  setMarkdown: (markdown: string) => void;
  createSystemSnapshot: (name: string, notes: string) => void;
  editSection: (section: string) => void;
  ignoreIssue: (id: string) => void;
  onReviewed?: () => void;
}

interface IssueCardProps {
  issue: ResumeReviewIssue;
  markdown: string;
  setMarkdown: (markdown: string) => void;
  createSystemSnapshot: (name: string, notes: string) => void;
  editSection: (section: string) => void;
  ignoreIssue: (id: string) => void;
}

type IssueGroup = [string, ResumeReviewIssue[], number];
type ReviewMode = "quick" | "deep" | "ats" | "recruiter";

const modeLabels: Array<[ReviewMode, string]> = [
  ["quick", "Quick Scan"],
  ["deep", "Deep Review"],
  ["ats", "ATS Optimization"],
  ["recruiter", "Recruiter Skim"],
];

const modeIssueFilter = (mode: ReviewMode, issue: ResumeReviewIssue) => {
  if (mode === "quick") return issue.priority !== "nice-to-have";
  if (mode === "deep") return true;
  if (mode === "ats")
    return ["ats-readability", "formatting-risk", "keyword-match", "contact", "structure", "date-consistency", "export-safety"].includes(
      issue.category,
    );
  return ["recruiter-skim", "bullet-quality", "impact-metrics", "structure"].includes(issue.category);
};

const modeIntro: Record<ReviewMode, string> = {
  quick: "Top risks and fastest fixes before exporting.",
  deep: "Section-by-section review with achievement coverage.",
  ats: "Plain-text parseability, keyword fit, and formatting risk.",
  recruiter: "Skimmability, seniority signal, and bullet impact.",
};

export const ReviewPanel = ({
  review,
  issues,
  markdown,
  setMarkdown,
  createSystemSnapshot,
  editSection,
  ignoreIssue,
  onReviewed,
}: ReviewPanelProps) => {
  const [showAll, setShowAll] = useState(false);
  const [mode, setMode] = useState<ReviewMode>("quick");
  useEffect(() => {
    onReviewed?.();
  }, []);
  const modeIssues = issues.filter((issue) => modeIssueFilter(mode, issue));
  const groups: IssueGroup[] = [
    ["Must fix", modeIssues.filter((issue) => issue.priority === "must-fix"), 3],
    ["Should improve", modeIssues.filter((issue) => issue.priority === "should-improve"), mode === "quick" ? 4 : 6],
    ["Nice to have", modeIssues.filter((issue) => issue.priority === "nice-to-have"), mode === "deep" ? 3 : 0],
  ];
  const scores = Object.values(review.scores) as Array<{ label: string; value: number; explanation: string }>;
  const visibleScores = scores.filter((score) => {
    if (mode === "quick" || mode === "deep") return true;
    if (mode === "ats")
      return ["Contact Info", "Structure", "ATS Readability", "Formatting Risk", "Keyword Match", "Export Safety"].includes(score.label);
    return ["Bullet Quality", "Impact / Metrics", "Recruiter Skim", "Structure"].includes(score.label);
  });
  const verdict =
    review.plainText.text.trim().length < 220
      ? "This looks like a draft. Add contact info, experience, skills, and education to get a useful review."
      : review.groups.mustFix.length
        ? "Review this before exporting. Start with the must-fix items."
        : review.scores.impactMetrics.value < 65
          ? "Strong baseline. Main weakness: missing measurable results."
          : "Strong baseline. Formatting risk is low; do a final truth check before exporting.";
  return (
    <div className="workflow-panel review-panel">
      <div className="segmented review-mode-tabs" role="tablist" aria-label="Review mode">
        {modeLabels.map(([key, label]) => (
          <button key={key} className={mode === key ? "active" : ""} onClick={() => setMode(key)}>
            {label}
          </button>
        ))}
      </div>
      <div className="review-hero">
        <div>
          <span className={`score-chip large ${scoreTone(review.overallScore)}`}>{review.overallScore}</span>
          <h2>Resume Review</h2>
          <p>{verdict}</p>
          <p className="beta-inline-note">Guidance only. Resume Studio does not guarantee ATS results, interviews, or job offers.</p>
          <p>{modeIntro[mode]} This is a deterministic local review, not an ATS ranking or hiring outcome signal.</p>
        </div>
        <details className="score-details">
          <summary>
            How scoring works <ChevronDown size={15} />
          </summary>
          <div className="score-row">
            {scores.map((score) => (
              <span key={score.label}>
                <strong>{score.value}</strong>
                {score.label}
              </span>
            ))}
          </div>
          <ul className="review-explainers">
            {review.scoringExplanation.map((item: string) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </details>
      </div>
      <section className="intelligence-grid">
        {visibleScores.map((score) => (
          <article key={score.label}>
            <strong>{score.value}</strong>
            <span>{score.label}</span>
            <p>{score.explanation}</p>
          </article>
        ))}
      </section>

      {(mode === "deep" || mode === "recruiter") && <AchievementAudit audit={review.achievementAudit} />}
      {(mode === "deep" || mode === "quick") && <SectionReviewGrid sections={review.sectionReviews} editSection={editSection} />}
      {(mode === "ats" || mode === "deep") && <AtsOptimizationPanel review={review} />}
      {(mode === "quick" || mode === "recruiter") && <BulletImprover markdown={markdown} setMarkdown={setMarkdown} />}

      <div className="inline-actions">
        <Button onClick={() => setShowAll(!showAll)}>{showAll ? "Show fewer issues" : "Show all issues"}</Button>
      </div>
      {groups.map(([title, list, defaultCount]) => {
        const visible = showAll ? list : list.slice(0, defaultCount);
        if (!showAll && defaultCount === 0 && list.length > 0) {
          return (
            <details className="issue-group" key={title}>
              <summary>
                <h3>{title}</h3>
                <span>{list.length} collapsed</span>
              </summary>
              {list.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  markdown={markdown}
                  setMarkdown={setMarkdown}
                  createSystemSnapshot={createSystemSnapshot}
                  editSection={editSection}
                  ignoreIssue={ignoreIssue}
                />
              ))}
            </details>
          );
        }
        return (
          <section className="issue-group" key={title}>
            <h3>{title}</h3>
            {list.length === 0 ? (
              <p className="muted">Nothing in this group right now.</p>
            ) : (
              visible.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  markdown={markdown}
                  setMarkdown={setMarkdown}
                  createSystemSnapshot={createSystemSnapshot}
                  editSection={editSection}
                  ignoreIssue={ignoreIssue}
                />
              ))
            )}
          </section>
        );
      })}
    </div>
  );
};

const SectionReviewGrid = ({ sections, editSection }: { sections: ResumeSectionReview[]; editSection: (section: string) => void }) => (
  <section className="section-review-grid">
    <header>
      <h3>Section review</h3>
      <p>Each section is checked for presence, clarity, issue density, and fit with common resume parsing expectations.</p>
    </header>
    <div>
      {sections.map((section) => (
        <article key={section.id} className={`section-review-card ${section.status}`}>
          <span>{section.status.replace("-", " ")}</span>
          <strong>{section.label}</strong>
          <p>{section.signal}</p>
          <p>{section.recommendation}</p>
          <Button onClick={() => editSection(section.label)}>{section.status === "missing" ? "Add section" : "Edit section"}</Button>
        </article>
      ))}
    </div>
  </section>
);

const AchievementAudit = ({ audit }: { audit: ResumeAchievementAudit }) => {
  const pct = (value: number) => (audit.totalBullets ? Math.round((value / audit.totalBullets) * 100) : 0);
  return (
    <section className="achievement-audit">
      <header>
        <h3>Key achievements audit</h3>
        <p>Strong bullets usually combine action, scope, metric, and outcome without inventing facts.</p>
      </header>
      <div className="achievement-metrics">
        <span>
          <strong>
            {audit.completeBullets}/{audit.totalBullets}
          </strong>{" "}
          complete bullets
        </span>
        <span>
          <strong>{pct(audit.metricBullets)}%</strong> include metrics
        </span>
        <span>
          <strong>{pct(audit.scopeBullets)}%</strong> include scope
        </span>
        <span>
          <strong>{pct(audit.outcomeBullets)}%</strong> include outcomes
        </span>
      </div>
      <div className="role-audit-list">
        {audit.roleSummaries.slice(0, 5).map((role) => (
          <article key={role.section}>
            <strong>{role.section}</strong>
            <p>
              {role.completeCount}/{role.bulletCount} bullets have the full achievement pattern. {role.recommendation}
            </p>
          </article>
        ))}
      </div>
      {audit.opportunities.length > 0 && (
        <div className="achievement-opportunities">
          <h4>Best improvement opportunities</h4>
          {audit.opportunities.map((item) => (
            <article key={`${item.section}-${item.bullet}`}>
              <p>{item.bullet}</p>
              <span>Missing: {item.missing.join(", ")}</span>
              <small>{item.prompt}</small>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

const AtsOptimizationPanel = ({ review }: { review: ResumeReviewResult }) => (
  <section className="ats-optimization-panel">
    <div className="keyword-review-card">
      <h3>Keyword fit</h3>
      <p>{review.keywordMatch.overlapLabel}. Add missing terms only when they are truthful and naturally belong in the resume.</p>
      <div>
        <KeywordPills title="Matched" values={review.keywordMatch.matched.slice(0, 16)} />
        <KeywordPills title="Missing" values={review.keywordMatch.missing.slice(0, 16)} />
        <KeywordPills title="Underused" values={review.keywordMatch.underused.slice(0, 12)} />
      </div>
    </div>
    <details className="plain-text-preview">
      <summary>Plain text parse preview ({review.plainText.parseConfidence}% confidence)</summary>
      <p>
        <strong>Parse confidence:</strong> {review.plainText.parseConfidence}%
      </p>
      {review.plainText.warnings.length > 0 && (
        <ul>
          {review.plainText.warnings.map((warning: string) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}
      {review.plainText.readingOrderNotes.length > 0 && (
        <ul>
          {review.plainText.readingOrderNotes.map((note: string) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      )}
      <pre>{review.plainText.text.slice(0, 5000)}</pre>
    </details>
  </section>
);

const KeywordPills = ({ title, values }: { title: string; values: string[] }) => (
  <section className="keyword-pill-group">
    <h4>{title}</h4>
    {values.length ? (
      <div>
        {values.map((value) => (
          <span key={value}>{value}</span>
        ))}
      </div>
    ) : (
      <p className="muted">None detected.</p>
    )}
  </section>
);

const IssueCard = ({ issue, markdown, setMarkdown, createSystemSnapshot, editSection, ignoreIssue }: IssueCardProps) => (
  <article className={`issue-card severity-${issue.severity}`} key={issue.id}>
    <div>
      <span>
        {issue.severity} · {issue.category}
      </span>
      <h4>{issue.title}</h4>
      <p>
        <strong>Where:</strong> {issue.location}
      </p>
      <p>
        <strong>Why it matters:</strong> {issue.whyItMatters}
      </p>
      <p>
        <strong>Suggested fix:</strong> {issue.suggestedFix}
      </p>
      <p className="muted">
        {issue.safeAutoFix
          ? "Safe mechanical fix available. A snapshot is saved before it runs."
          : "Requires user judgment or verified facts."}
      </p>
    </div>
    <div className="issue-actions">
      {issue.fix ? (
        <Button
          className="primary"
          onClick={() => {
            createSystemSnapshot("Before safe fix", `Automatic safety snapshot before applying: ${issue.fix?.label}.`);
            setMarkdown(issue.fix?.apply(markdown) ?? markdown);
          }}
        >
          {issue.fix.label}
        </Button>
      ) : (
        <Button onClick={() => editSection(issue.location)}>Edit section</Button>
      )}
      <Button onClick={() => ignoreIssue(issue.id)}>Ignore</Button>
    </div>
  </article>
);

const BulletImprover = ({ markdown, setMarkdown }: { markdown: string; setMarkdown: (markdown: string) => void }) => {
  const body = parseFrontmatter(markdown).content;
  const experience = body.match(/##\s+Experience\s*([\s\S]*?)(?=\n##\s+|$)/i)?.[1] ?? body;
  const bullets = experience
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^[-*]\s+/.test(line))
    .slice(0, 4);
  if (!bullets.length)
    return (
      <section className="bullet-lab compact-lab">
        <h3>Bullet improvement lab</h3>
        <p>No experience bullets found yet.</p>
      </section>
    );
  return (
    <section className="bullet-lab compact-lab">
      <h3>Bullet improvement lab</h3>
      {bullets.map((line) => {
        const suggestion = improveBulletLocal(line, "concise");
        return (
          <article key={line}>
            <div>
              <span>Before</span>
              <p>{suggestion.before}</p>
              <span>Suggested</span>
              <p>{suggestion.after}</p>
            </div>
            <Button
              onClick={() => {
                const lines = markdown.split("\n");
                const index = lines.findIndex((candidate) => candidate.trim() === line);
                if (index !== -1) {
                  lines[index] = `- ${suggestion.after}`;
                  setMarkdown(lines.join("\n"));
                }
              }}
            >
              Accept
            </Button>
          </article>
        );
      })}
    </section>
  );
};
