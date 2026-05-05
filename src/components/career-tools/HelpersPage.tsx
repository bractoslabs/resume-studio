import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ClipboardList, Copy, Download, FileText, Linkedin, MessageSquare, Plus, RefreshCw, Send } from "lucide-react";
import type { ResumeDocument } from "../../lib/types";
import { downloadBlob, slugify } from "../../lib/utils";
import { Button } from "../common/Button";
import { writeClipboard } from "../../app/resumeTransforms";
import {
  type InterviewPrepDraft,
  type LinkedInProfileDraft,
  generateCoverLetterDraft,
  generateInterviewPrepDraft,
  generateLinkedInProfileDraft,
  generateRecruiterMessageDraft,
  interviewPrepToMarkdown,
  linkedInDraftToMarkdown,
  markdownToPlainText,
} from "../../app/careerTools";

type ToolStatus = { tone: "success" | "error"; message: string } | null;
type ToolKey = "cover" | "linkedin" | "recruiter" | "interview";

interface HelpersPageProps {
  resume?: ResumeDocument;
  resumes: ResumeDocument[];
  jobDescription: string;
  openNewResume: () => void;
}

interface ToolCardProps {
  id: ToolKey;
  title: string;
  icon: ReactNode;
  description: string;
  children: ReactNode;
}

interface ResumeContextSelectProps {
  selectedResumeId: string;
  resumes: ResumeDocument[];
  onChange: (value: string) => void;
  id: string;
}

export const HelpersPage = ({ resume, resumes, jobDescription, openNewResume }: HelpersPageProps) => {
  const [selectedResumeId, setSelectedResumeId] = useState(resume?.id ?? resumes[0]?.id ?? "");
  const selectedResume = useMemo(
    () => resumes.find((item) => item.id === selectedResumeId) ?? resume ?? resumes[0],
    [resume, resumes, selectedResumeId],
  );
  const [status, setStatus] = useState<ToolStatus>(null);
  const [coverContext, setCoverContext] = useState(jobDescription);
  const [linkedInContext, setLinkedInContext] = useState("");
  const [recruiterContext, setRecruiterContext] = useState(jobDescription);
  const [interviewContext, setInterviewContext] = useState(jobDescription);
  const [coverDraft, setCoverDraft] = useState("");
  const [linkedInDraft, setLinkedInDraft] = useState<LinkedInProfileDraft>({ headlines: ["", "", ""], about: "", connectionMessage: "" });
  const [recruiterDraft, setRecruiterDraft] = useState("");
  const [interviewDraft, setInterviewDraft] = useState<InterviewPrepDraft>({ likelyQuestions: [], starPrompts: [], weakAreas: [] });

  useEffect(() => {
    if (resume?.id && !resumes.some((item) => item.id === selectedResumeId)) setSelectedResumeId(resume.id);
  }, [resume?.id, resumes, selectedResumeId]);

  useEffect(() => {
    if (!selectedResume) return;
    setCoverDraft(generateCoverLetterDraft(selectedResume, coverContext));
    setLinkedInDraft(generateLinkedInProfileDraft(selectedResume, linkedInContext));
    setRecruiterDraft(generateRecruiterMessageDraft(selectedResume, recruiterContext));
    setInterviewDraft(generateInterviewPrepDraft(selectedResume, interviewContext));
  }, [selectedResume?.id]);

  const safeCopy = async (label: string, value: string) => {
    if (!value.trim()) {
      setStatus({ tone: "error", message: `${label} is empty. Generate or write a draft first.` });
      return;
    }
    try {
      await writeClipboard(value);
      setStatus({ tone: "success", message: `${label} copied.` });
    } catch (error) {
      setStatus({
        tone: "error",
        message: `Could not copy ${label.toLowerCase()}: ${error instanceof Error ? error.message : "unknown error"}`,
      });
    }
  };

  const safeExport = (label: string, filename: string, value: string, type = "text/plain;charset=utf-8") => {
    if (!value.trim()) {
      setStatus({ tone: "error", message: `${label} is empty. Generate or write a draft first.` });
      return;
    }
    try {
      downloadBlob(new Blob([value], { type }), filename);
      setStatus({ tone: "success", message: `${label} exported.` });
    } catch (error) {
      setStatus({
        tone: "error",
        message: `Could not export ${label.toLowerCase()}: ${error instanceof Error ? error.message : "unknown error"}`,
      });
    }
  };

  if (!selectedResume) {
    return (
      <div className="content-page helpers-page">
        <header className="page-header">
          <div>
            <h1>Resume Tools</h1>
            <p>
              Draft cover letters, LinkedIn copy, recruiter messages, and interview prep using your resume as the starting point. Nothing is
              assumed, and every claim stays editable.
            </p>
          </div>
          <div className="page-actions">
            <Button className="primary" onClick={openNewResume}>
              <Plus size={16} /> New resume
            </Button>
          </div>
        </header>
        <section className="empty-state section-empty-state">
          <h2>No resume selected</h2>
          <p>Create a new resume or import one to use Resume Tools.</p>
          <Button className="primary" onClick={openNewResume}>
            <Plus size={16} /> New resume
          </Button>
        </section>
      </div>
    );
  }

  const baseSlug = slugify(selectedResume.title);
  const linkedInMarkdown = linkedInDraftToMarkdown(linkedInDraft);
  const interviewMarkdown = interviewPrepToMarkdown(interviewDraft);

  return (
    <div className="content-page helpers-page">
      <header className="page-header career-tools-header">
        <div>
          <h1>Resume Tools</h1>
          <p>
            Draft cover letters, LinkedIn copy, recruiter messages, and interview prep using your resume as the starting point. Nothing is
            assumed, and every claim stays editable.
          </p>
        </div>
      </header>

      <section className="career-tools-context">
        <ResumeContextSelect
          id="career-tools-context-resume"
          selectedResumeId={selectedResume.id}
          resumes={resumes}
          onChange={setSelectedResumeId}
        />
        <p>
          Everything here is generated in your browser from the selected resume. Review the wording and replace placeholders before sending
          or posting.
        </p>
      </section>

      {status && (
        <p className={`status-note ${status.tone === "error" ? "error" : ""}`} role="status">
          {status.message}
        </p>
      )}

      <section className="career-tools-grid" aria-label="Career tool drafts">
        <ToolCard
          id="cover"
          title="Cover Letter"
          icon={<FileText size={20} />}
          description="Create a concise letter starter from your resume and optional job description."
        >
          <ResumeContextSelect
            id="cover-resume-context"
            selectedResumeId={selectedResume.id}
            resumes={resumes}
            onChange={setSelectedResumeId}
          />
          <label className="field-stack">
            Job description or role context
            <textarea
              value={coverContext}
              onChange={(event) => setCoverContext(event.target.value)}
              placeholder="Paste the job description or add the company, role, and key requirements."
            />
          </label>
          <Button className="primary" onClick={() => setCoverDraft(generateCoverLetterDraft(selectedResume, coverContext))}>
            <RefreshCw size={16} /> Generate draft
          </Button>
          <label className="field-stack draft-field">
            Editable cover letter draft
            <textarea className="document-draft-area" value={coverDraft} onChange={(event) => setCoverDraft(event.target.value)} />
          </label>
          <DraftActions
            copy={() => safeCopy("Cover letter", coverDraft)}
            copyText={() => safeCopy("Cover letter text", markdownToPlainText(coverDraft))}
            exportMarkdown={() =>
              safeExport("Cover letter Markdown", `${baseSlug}-cover-letter.md`, coverDraft, "text/markdown;charset=utf-8")
            }
            exportText={() => safeExport("Cover letter text", `${baseSlug}-cover-letter.txt`, markdownToPlainText(coverDraft))}
          />
        </ToolCard>

        <ToolCard
          id="linkedin"
          title="LinkedIn Profile"
          icon={<Linkedin size={20} />}
          description="Draft headline options, an About section, and a short connection message."
        >
          <ResumeContextSelect
            id="linkedin-resume-context"
            selectedResumeId={selectedResume.id}
            resumes={resumes}
            onChange={setSelectedResumeId}
          />
          <label className="field-stack">
            Optional role focus
            <textarea
              value={linkedInContext}
              onChange={(event) => setLinkedInContext(event.target.value)}
              placeholder="Optional: add a role, audience, or positioning direction."
            />
          </label>
          <Button className="primary" onClick={() => setLinkedInDraft(generateLinkedInProfileDraft(selectedResume, linkedInContext))}>
            <RefreshCw size={16} /> Generate from resume
          </Button>
          <section className="linkedin-output" aria-label="Editable LinkedIn profile drafts">
            <h3>Headline options</h3>
            {linkedInDraft.headlines.map((headline, index) => (
              <label className="field-stack compact-field" key={`headline-${index}`}>
                Headline option {index + 1}
                <textarea
                  value={headline}
                  onChange={(event) => {
                    const next = [...linkedInDraft.headlines];
                    next[index] = event.target.value;
                    setLinkedInDraft({ ...linkedInDraft, headlines: next });
                  }}
                />
              </label>
            ))}
            <label className="field-stack draft-field">
              About section
              <textarea
                className="profile-draft-area"
                value={linkedInDraft.about}
                onChange={(event) => setLinkedInDraft({ ...linkedInDraft, about: event.target.value })}
              />
            </label>
            <label className="field-stack">
              Connection message
              <textarea
                value={linkedInDraft.connectionMessage}
                onChange={(event) => setLinkedInDraft({ ...linkedInDraft, connectionMessage: event.target.value })}
              />
            </label>
          </section>
          <DraftActions
            copy={() => safeCopy("LinkedIn profile draft", linkedInMarkdown)}
            copyText={() => safeCopy("LinkedIn About section", linkedInDraft.about)}
            exportText={() => safeExport("LinkedIn profile draft", `${baseSlug}-linkedin.txt`, markdownToPlainText(linkedInMarkdown))}
          />
        </ToolCard>

        <ToolCard
          id="recruiter"
          title="Recruiter Message"
          icon={<Send size={20} />}
          description="Write a short outreach message that uses only resume-backed claims."
        >
          <ResumeContextSelect
            id="recruiter-resume-context"
            selectedResumeId={selectedResume.id}
            resumes={resumes}
            onChange={setSelectedResumeId}
          />
          <label className="field-stack">
            Role, recruiter, or company context
            <textarea
              value={recruiterContext}
              onChange={(event) => setRecruiterContext(event.target.value)}
              placeholder="Optional: paste a job post excerpt or add the recruiter/company/role."
            />
          </label>
          <Button className="primary" onClick={() => setRecruiterDraft(generateRecruiterMessageDraft(selectedResume, recruiterContext))}>
            <MessageSquare size={16} /> Generate message
          </Button>
          <label className="field-stack draft-field">
            Editable recruiter message
            <textarea className="message-draft-area" value={recruiterDraft} onChange={(event) => setRecruiterDraft(event.target.value)} />
          </label>
          <DraftActions
            copy={() => safeCopy("Recruiter message", recruiterDraft)}
            exportText={() => safeExport("Recruiter message", `${baseSlug}-recruiter-message.txt`, recruiterDraft)}
          />
        </ToolCard>

        <ToolCard
          id="interview"
          title="Interview Prep"
          icon={<ClipboardList size={20} />}
          description="Turn resume bullets into likely questions, STAR prompts, and prep gaps."
        >
          <ResumeContextSelect
            id="interview-resume-context"
            selectedResumeId={selectedResume.id}
            resumes={resumes}
            onChange={setSelectedResumeId}
          />
          <label className="field-stack">
            Job description or interview context
            <textarea
              value={interviewContext}
              onChange={(event) => setInterviewContext(event.target.value)}
              placeholder="Optional: paste the job description or add interview focus areas."
            />
          </label>
          <Button className="primary" onClick={() => setInterviewDraft(generateInterviewPrepDraft(selectedResume, interviewContext))}>
            <RefreshCw size={16} /> Generate prep
          </Button>
          <InterviewPrepEditor draft={interviewDraft} setDraft={setInterviewDraft} />
          <DraftActions
            copy={() => safeCopy("Interview prep", interviewMarkdown)}
            copyText={() => safeCopy("Interview prep text", markdownToPlainText(interviewMarkdown))}
            exportMarkdown={() =>
              safeExport("Interview prep Markdown", `${baseSlug}-interview-prep.md`, interviewMarkdown, "text/markdown;charset=utf-8")
            }
            exportText={() => safeExport("Interview prep text", `${baseSlug}-interview-prep.txt`, markdownToPlainText(interviewMarkdown))}
          />
        </ToolCard>
      </section>
    </div>
  );
};

const ToolCard = ({ id, title, icon, description, children }: ToolCardProps) => (
  <article className={`career-tool-card career-tool-${id}`}>
    <header>
      <span aria-hidden="true">{icon}</span>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </header>
    {children}
  </article>
);

const ResumeContextSelect = ({ selectedResumeId, resumes, onChange, id }: ResumeContextSelectProps) => (
  <label className="field-stack resume-context-select" htmlFor={id}>
    Resume context
    <select id={id} value={selectedResumeId} onChange={(event) => onChange(event.target.value)}>
      {resumes.map((item) => (
        <option key={item.id} value={item.id}>
          {item.title}
        </option>
      ))}
    </select>
  </label>
);

const DraftActions = ({
  copy,
  copyText,
  exportMarkdown,
  exportText,
}: {
  copy: () => void;
  copyText?: () => void;
  exportMarkdown?: () => void;
  exportText?: () => void;
}) => (
  <div className="career-tool-actions">
    <Button onClick={copy}>
      <Copy size={16} /> Copy draft
    </Button>
    {copyText && (
      <Button onClick={copyText}>
        <Copy size={16} /> Copy text
      </Button>
    )}
    {exportMarkdown && (
      <Button onClick={exportMarkdown}>
        <Download size={16} /> Export Markdown
      </Button>
    )}
    {exportText && (
      <Button onClick={exportText}>
        <Download size={16} /> Export TXT
      </Button>
    )}
  </div>
);

const InterviewPrepEditor = ({ draft, setDraft }: { draft: InterviewPrepDraft; setDraft: (draft: InterviewPrepDraft) => void }) => {
  const updateList = (key: keyof InterviewPrepDraft, value: string) =>
    setDraft({
      ...draft,
      [key]: value
        .split("\n")
        .map((item) => item.replace(/^-\s*/, "").trim())
        .filter(Boolean),
    });
  return (
    <section className="interview-prep-editor" aria-label="Editable interview prep sections">
      <details open>
        <summary>Likely questions</summary>
        <textarea
          aria-label="Likely interview questions"
          value={draft.likelyQuestions.map((item) => `- ${item}`).join("\n")}
          onChange={(event) => updateList("likelyQuestions", event.target.value)}
        />
      </details>
      <details>
        <summary>STAR story prompts</summary>
        <textarea
          aria-label="STAR story prompts"
          value={draft.starPrompts.map((item) => `- ${item}`).join("\n")}
          onChange={(event) => updateList("starPrompts", event.target.value)}
        />
      </details>
      <details>
        <summary>Weak areas to prepare</summary>
        <textarea
          aria-label="Weak areas to prepare"
          value={draft.weakAreas.map((item) => `- ${item}`).join("\n")}
          onChange={(event) => updateList("weakAreas", event.target.value)}
        />
      </details>
    </section>
  );
};
