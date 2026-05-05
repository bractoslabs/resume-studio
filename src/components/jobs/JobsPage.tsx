import { Download, Plus } from "lucide-react";
import type { ApplicationRecord, JobTarget, ResumeDocument } from "../../lib/types";
import { uid } from "../../lib/utils";
import { Button } from "../common/Button";

const jobStatuses = [
  ["interested", "Interested"],
  ["tailoring", "Tailoring resume"],
  ["ready", "Ready to apply"],
  ["applied", "Applied"],
  ["follow-up-due", "Follow-up due"],
  ["interviewing", "Interviewing"],
  ["offer", "Offer"],
  ["rejected", "Rejected"],
  ["archived", "Archived"],
] as const;

const nextActionForJob = (job: JobTarget | ResumeDocument["applications"][number]) => {
  const status = "status" in job ? job.status : undefined;
  if (status === "tailoring") return "Review missing keywords";
  if (status === "ready") return "Export PDF";
  if (status === "follow-up-due") return "Follow up";
  if (status === "interviewing") return "Prep for interview";
  if (status === "applied") return "Track response";
  return "Create job-specific copy";
};

type UpdateResume = (id: string, patch: Partial<ResumeDocument> | ((resume: ResumeDocument) => Partial<ResumeDocument>)) => void;
type JobTargetRow = JobTarget & { resumeId: string; resumeTitle: string };
type ApplicationRow = ApplicationRecord & { resumeId: string; resumeTitle: string };

export const JobsPage = ({ resumes, activeResume, updateResume, openNewResume }: { resumes: ResumeDocument[]; activeResume?: ResumeDocument; updateResume: UpdateResume; openNewResume: () => void }) => {
  const jobTargets = resumes.flatMap((resume) => (resume.jobTargets ?? []).map((job) => ({ ...job, resumeId: resume.id, resumeTitle: resume.title })));
  const applications = resumes.flatMap((resume) => (resume.applications ?? []).map((app) => ({ ...app, resumeId: resume.id, resumeTitle: resume.title })));
  const addApplication = () => {
    if (!activeResume) return;
    updateResume(activeResume.id, { applications: [{ id: uid("app"), company: "", role: activeResume.targetRole ?? "", status: "interested" }, ...activeResume.applications] });
  };

  if (!resumes.length) {
    return (
      <div className="content-page">
        <header className="page-header">
          <div><h1>Job Targets</h1><p>Track job targets and applications once you have a resume to work from.</p></div>
          <div className="page-actions">
            <Button className="primary" onClick={openNewResume}><Plus size={16} /> New resume</Button>
          </div>
        </header>
        <section className="empty-state section-empty-state">
          <h2>No resume workspace yet</h2>
          <p>Create a new resume or import one before tracking applications.</p>
          <Button className="primary" onClick={openNewResume}><Plus size={16} /> New resume</Button>
        </section>
      </div>
    );
  }

  return (
  <div className="content-page">
    <header className="page-header">
      <div><h1>Job Targets</h1><p>Global workspace for job targets and applications across all resumes.</p></div>
      <div className="page-actions">
        <Button className="primary" onClick={addApplication} disabled={!activeResume}><Plus size={16} /> Add application</Button>
        <Button onClick={() => {
          const blob = new Blob([applicationCsv(applications)], { type: "text/csv;charset=utf-8" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "resume-studio-applications.csv";
          a.click();
          URL.revokeObjectURL(url);
        }}><Download size={16} /> Export CSV</Button>
      </div>
    </header>
    <section className="jobs-table">
      <h2>Job targets</h2>
      {jobTargets.length === 0 ? <div className="empty-state"><h2>No job targets yet</h2><p>Use Keyword & Fit Check from a resume to save a target role.</p></div> : (jobTargets as JobTargetRow[]).map((job) => (
        <article className="job-row" key={job.id}>
          <div><strong>{job.title}</strong><p>{job.company || "Company not set"} · {job.resumeTitle}</p><p className="muted">Next action: {nextActionForJob(job)}</p></div>
          <label>Status<select value={job.status ?? "interested"} onChange={(event) => updateResume(job.resumeId, (resume) => ({ jobTargets: resume.jobTargets.map((item) => item.id === job.id ? { ...item, status: event.target.value as JobTarget["status"] } : item) }))}>{jobStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="span-2">Notes<textarea value={job.checklist?.join("\n") ?? ""} onChange={(event) => updateResume(job.resumeId, (resume) => ({ jobTargets: resume.jobTargets.map((item) => item.id === job.id ? { ...item, checklist: event.target.value.split("\n").filter(Boolean) } : item) }))} /></label>
        </article>
      ))}
    </section>
    <section className="jobs-table">
      <h2>Applications</h2>
      {applications.length === 0 ? <div className="empty-state"><h2>No applications tracked yet</h2><p>Add a job when you apply or save a role you want to tailor for.</p></div> : (applications as ApplicationRow[]).map((app) => {
        const resume = resumes.find((item) => item.id === app.resumeId);
        if (!resume) return null;
        return (
        <article className="job-row" key={app.id}>
          <label>Company<input value={app.company} onChange={(event) => updateResume(resume.id, { applications: resume.applications.map((item) => item.id === app.id ? { ...item, company: event.target.value } : item) })} /></label>
          <label>Role<input value={app.role} onChange={(event) => updateResume(resume.id, { applications: resume.applications.map((item) => item.id === app.id ? { ...item, role: event.target.value } : item) })} /></label>
          <label>Status<select value={app.status} onChange={(event) => updateResume(resume.id, { applications: resume.applications.map((item) => item.id === app.id ? { ...item, status: event.target.value as ApplicationRecord["status"] } : item) })}>{jobStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>Job link<input value={app.jobLink ?? ""} onChange={(event) => updateResume(resume.id, { applications: resume.applications.map((item) => item.id === app.id ? { ...item, jobLink: event.target.value } : item) })} /></label>
          <label>Date applied<input type="date" value={app.dateApplied ?? ""} onChange={(event) => updateResume(resume.id, { applications: resume.applications.map((item) => item.id === app.id ? { ...item, dateApplied: event.target.value } : item) })} /></label>
          <label>Follow-up<input type="date" value={app.followUpDate ?? ""} onChange={(event) => updateResume(resume.id, { applications: resume.applications.map((item) => item.id === app.id ? { ...item, followUpDate: event.target.value } : item) })} /></label>
          <p className="muted">Resume: {app.resumeTitle} · Next action: {nextActionForJob(app)}</p>
          <label className="span-2">Notes<textarea value={app.notes ?? ""} onChange={(event) => updateResume(resume.id, { applications: resume.applications.map((item) => item.id === app.id ? { ...item, notes: event.target.value } : item) })} /></label>
        </article>
      );})}
    </section>
  </div>
  );
};

const applicationCsv = (applications: ResumeDocument["applications"]) => {
  const header = ["Company", "Role", "Job Link", "Contact", "Status", "Resume Version", "Cover Letter", "Date Applied", "Follow-up Date", "Notes", "Outcome"];
  const rows = applications.map((app) => [app.company, app.role, app.jobLink ?? "", app.contact ?? "", app.status, app.resumeVersionId ?? "", app.coverLetterVersionId ?? "", app.dateApplied ?? "", app.followUpDate ?? "", app.notes ?? "", app.outcome ?? ""]);
  return [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
};
