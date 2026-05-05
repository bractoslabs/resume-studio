import { useState } from "react";
import type { JobKeywordMatch } from "../../lib/resume-review";
import type { TermReviewDecision, TermReviewState } from "../../app/types";
import { Button } from "../common/Button";

const overlapTone = (score: number) => score < 35 ? "low" : score < 70 ? "medium" : "high";

interface TailorPanelProps {
  value: string;
  setValue: (value: string) => void;
  analyzed: boolean;
  setAnalyzed: (value: boolean) => void;
  report: JobKeywordMatch | null;
  onCreateVersion: (decisions: TermReviewState) => void;
  onSaveTarget: (decisions: TermReviewState) => void;
  resume?: unknown;
  updateResume?: unknown;
}

export const TailorPanel = ({ value, setValue, analyzed, setAnalyzed, report, onCreateVersion, onSaveTarget }: TailorPanelProps) => {
  const [termReview, setTermReview] = useState<TermReviewState>({});
  const visibleTerms = (report?.terms ?? []).filter((term) => termReview[term.label] !== "not-relevant");
  const missingSuggestions = (report?.suggestions ?? []).filter((suggestion) => termReview[suggestion.keyword] !== "do-not-have" && termReview[suggestion.keyword] !== "not-relevant");
  const mark = (term: string, value: TermReviewDecision) => setTermReview((current) => ({ ...current, [term]: value }));
  return (
    <div className="workflow-panel tailor-panel">
      <div className="panel-heading">
        <div>
          <h2>Keyword & Fit Check</h2>
          <p>Paste a job description, review what the app finds, then create a truthful job-specific resume version.</p>
          <p className="beta-inline-note">Guidance only. Resume Studio does not guarantee ATS results, interviews, or job offers.</p>
          <p className="muted">No AI. No external upload. This runs locally. Use this as a guide, not a hiring outcome signal.</p>
        </div>
        <div className="inline-actions">
          <Button className="primary" disabled={!value.trim()} onClick={() => setAnalyzed(true)}>Analyze job description</Button>
          <Button onClick={() => { setValue(""); setAnalyzed(false); setTermReview({}); }}>Clear</Button>
          <Button disabled={!value.trim()} onClick={() => onSaveTarget(termReview)}>Save job target</Button>
        </div>
      </div>
      <textarea className="job-input refined-job-input" value={value} onChange={(event) => {
        setValue(event.target.value);
        setAnalyzed(false);
        setTermReview({});
      }} placeholder="Paste the full job description here, including responsibilities and qualifications." />
      {analyzed && report && (
        <div className="tailor-results">
          <section className="job-summary-card">
            <span className={`score-chip ${overlapTone(report.score)}`}>Keyword overlap: {report.score}%</span>
            <h3>{report.title}</h3>
            <p><strong>{report.overlapLabel ?? "Keyword overlap"}</strong>. This measures keyword overlap only. It is not a qualification score or a guarantee of ATS results.</p>
            <div className="score-row">
              <span><strong>{report.coverage?.requiredSkills ?? 0}%</strong>Required coverage</span>
              <span><strong>{report.coverage?.tools ?? 0}%</strong>Tools coverage</span>
              <span><strong>{report.coverage?.domain ?? 0}%</strong>Domain language</span>
              <span><strong>{report.coverage?.seniority ?? 0}%</strong>Seniority signals</span>
            </div>
            <div className="inline-actions">
              <Button className="primary" onClick={() => onCreateVersion(termReview)}>Create job-specific copy</Button>
              <Button onClick={() => onSaveTarget(termReview)}>Save job target</Button>
            </div>
          </section>
          {visibleTerms.length === 0 ? (
            <section className="empty-state"><h3>Few confident job signals found</h3><p>We could not confidently extract many job requirements. Try pasting the full job description, including responsibilities and qualifications.</p></section>
          ) : (
            <>
              <section className="signal-grid">
                <KeywordList title="Role/title signals" values={[report.title, ...(report.senioritySignals ?? [])].filter(Boolean)} />
                <KeywordList title="Required hard skills" values={report.requiredSkills} />
                <KeywordList title="Preferred skills" values={report.preferredSkills} />
                <KeywordList title="Tools & platforms" values={report.tools} />
                <KeywordList title="Certifications/licenses" values={report.certifications ?? []} />
                <KeywordList title="Industry/domain terms" values={report.industryTerms ?? []} />
                <KeywordList title="Soft skills" values={report.softSkills} />
                <KeywordList title="Responsibilities/outcomes" values={report.responsibilities ?? []} />
              </section>
              <section className="term-review-list">
                <h3>Review extracted terms</h3>
                <p className="muted">Remove noise, mark important terms, or mark whether a missing term is true for your background.</p>
                {visibleTerms.slice(0, 30).map((term) => (
                  <article key={term.label} className={`term-review-card ${termReview[term.label] ?? ""}`}>
                    <div>
                      <strong>{term.label}</strong>
                      <span>{term.category} · {term.confidence === "high" ? "High confidence" : term.confidence === "medium" ? "Medium confidence" : "Needs review"} · {term.matched ? "covered" : "missing"}</span>
                    </div>
                    <div className="inline-actions">
                      <Button onClick={() => mark(term.label, "important")}>Important</Button>
                      {!term.matched && <Button onClick={() => mark(term.label, "have")}>I have this</Button>}
                      {!term.matched && <Button onClick={() => mark(term.label, "do-not-have")}>I do not have this</Button>}
                      <Button onClick={() => mark(term.label, "not-relevant")}>Not relevant</Button>
                    </div>
                  </article>
                ))}
              </section>
              <section className="alignment-grid">
                <KeywordList title="Already covered in resume" values={report.matched} />
                <KeywordList title="Missing from resume: add only if true" values={report.missing.filter((term: string) => termReview[term] !== "do-not-have")} />
                <KeywordList title="Mentioned only once" values={report.underused} />
                <KeywordList title="Ignored generic terms" values={report.ignoredGenericTerms ?? []} />
              </section>
            </>
          )}
          <section className="suggestion-list">
            <h3>Truthful update suggestions</h3>
            {missingSuggestions.length === 0 ? <p className="muted">Your resume already covers the main extracted keywords, or missing terms were marked not relevant/not true. Review wording and export an ATS-safe version.</p> : missingSuggestions.map((suggestion) => (
              <article key={suggestion.keyword}>
                <strong>{suggestion.keyword}</strong>
                <p>{suggestion.note}</p>
                <p><strong>Suggested place:</strong> {suggestion.section}</p>
                <p><strong>Truth check:</strong> {suggestion.verificationPrompt}</p>
                <code>{suggestion.suggestedWording}</code>
              </article>
            ))}
          </section>
          <section className="tailoring-checklist">
            <h3>Before creating a job-specific copy</h3>
            <ul>
              <li>Important terms reviewed</li>
              <li>No unverified skills added</li>
              <li>Missing terms marked true/not true where needed</li>
              <li>Job target saved for this resume</li>
            </ul>
          </section>
        </div>
      )}
    </div>
  );
};

const KeywordList = ({ title, values }: { title: string; values: string[] }) => (
  <section className="keyword-list"><h3>{title}</h3>{values.length ? <div>{values.slice(0, 28).map((value) => <span key={value}>{value}</span>)}</div> : <p className="muted">None detected yet.</p>}</section>
);
