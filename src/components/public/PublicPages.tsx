import { Check, FileText } from "lucide-react";
import type { View } from "../../app/types";
import { Button } from "../common/Button";

export const LandingSections = ({ setView }: { setView: (view: View) => void }) => (
  <>
    <section className="landing-section how-it-works">
      <h2>How it works</h2>
      <div className="landing-grid four">
        {["Create a resume in Markdown or guided mode.", "Run Resume Review for quality and readability issues.", "Use Keyword & Fit Check without fabricating facts.", "Use Print / Save as PDF, DOCX, Markdown, plain text, HTML, JSON Resume, or experimental YAML."].map((item, index) => <article key={item}><span>{index + 1}</span><p>{item}</p></article>)}
      </div>
    </section>
    <section className="landing-section">
      <h2>Features</h2>
      <div className="landing-grid">
        {["Markdown source of truth with guided editing", "Live preview with print-oriented styling", "Explainable Resume Review and plain-text parse preview", "Keyword overlap and truthful tailoring suggestions", "Version history, templates, and local backups", "Cover letter, LinkedIn, and interview prep career tools"].map((item) => <article key={item}><Check size={16} /><p>{item}</p></article>)}
      </div>
    </section>
    <section className="landing-section split">
      <div><h2>Privacy-first design</h2><p>Guest mode stores resumes in your browser. Resume Studio does not require accounts, does not add analytics by default, and does not upload resume content in this static beta.</p><Button onClick={() => setView("privacy")}>Read privacy notes</Button></div>
      <div><h2>Export formats</h2><p>Print / Save as PDF opens your browser print dialog and keeps text selectable through print CSS. Plain text helps with job portals. Markdown is ideal for editing and backups. JSON Resume supports portability.</p><Button onClick={() => setView("dashboard")}>Start free</Button></div>
    </section>
    <section className="landing-section beta-note-section">
      <article className="beta-note-card">
        <strong>Public beta</strong>
        <p>Resume Studio is in public beta. Core features are usable, but imports, exports, templates, and review tools may continue to change.</p>
        <p>Please keep a backup of important resumes and review exported files before sending them.</p>
      </article>
    </section>
    <section className="landing-section faq">
      <h2>FAQ</h2>
      {[
        ["Is Resume Studio free?", "Yes. The public beta is free to use, with no account requirement and no paywalls."],
        ["Does it use an LLM?", "No. Review, Keyword & Fit Check, and helper drafts are local rule-based suggestions."],
        ["Where is my data stored?", "In this browser until you export, copy, download, or delete it."],
        ["Can I import an existing resume?", "Yes. Paste text or upload Markdown, TXT, JSON Resume, YAML, and text-extracted formats when available."],
        ["Which browsers work best?", "Best tested on current Chrome, Edge, and Safari desktop. Firefox should work, but Print / Save as PDF output may vary. Mobile works for review and light edits, but full resume editing is best on desktop."],
        ["What are the current beta limitations?", "Resume Studio saves data locally in your browser, not to an account. Print / Save as PDF uses your browser's print dialog, DOCX export may not match visual templates perfectly, scanned PDFs may not import, and review tools are guidance only. Resume Studio does not guarantee ATS results, interviews, or job offers."],
      ].map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
    </section>
    <PublicFooter setView={setView} />
  </>
);

const PublicFooter = ({ setView }: { setView: (view: View) => void }) => (
  <footer className="public-footer">
    <strong>Resume Studio</strong>
    <span>Free, private, Markdown-first resume builder.</span>
    {(["about", "privacy", "terms", "security", "feedback", "free"] as View[]).map((item) => <button key={item} onClick={() => setView(item)}>{item}</button>)}
  </footer>
);

const privacySections = [
  {
    title: "What Resume Studio Stores",
    body: [
      "Resume drafts, settings, versions, imported source text, job targets, applications, and related app data may be stored locally in your browser. Resume Studio uses browser storage such as IndexedDB, with a localStorage fallback if needed.",
      "This storage is on your device and in your browser. It is not cloud sync, and it may not be available from another browser, profile, or device.",
    ],
  },
  {
    title: "What Bractos Labs Does Not Receive",
    body: [
      "Bractos Labs does not receive, store, or review your resume content in the current static public beta.",
      "No account is required. Resume content is not intentionally uploaded to a Resume Studio backend in the current public beta. Resume Studio does not use AI or cloud processing for resume content unless a future version explicitly introduces and discloses that feature.",
    ],
  },
  {
    title: "Browser Storage and Data-Loss Risk",
    body: [
      "Clearing browser data may delete saved resumes. Private or incognito mode may not persist data. Browser settings, extensions, managed-device policies, storage limits, or device changes may remove local storage.",
      "Because Resume Studio stores your work locally, you are responsible for backing up your resume data. Download a backup before clearing browser data, switching devices, or relying on the app for active job applications.",
    ],
  },
  {
    title: "File Imports",
    body: [
      "Imported files are processed in the browser where possible. Avoid importing files that contain sensitive information you do not want stored locally in this browser.",
      "Scanned PDFs and complex documents may not import perfectly. Review imported content before editing, saving, or exporting it.",
    ],
  },
  {
    title: "Exports and Downloads",
    body: [
      "Exported files are created for you to download, print, or save. Once a file is downloaded, you control where it goes and who receives it.",
      "Be careful when sharing exported resumes, especially if they contain home addresses, personal phone numbers, private email addresses, employer names, or job-search details.",
    ],
  },
  {
    title: "GitHub Issues and Public Feedback",
    body: [
      "GitHub Issues are public. Do not post private resume content, home addresses, phone numbers, personal email addresses, job application details, or other sensitive information in a public GitHub issue.",
      "Use GitHub Issues for non-sensitive bug reports and feature requests. Use labs@bractos.com for private feedback.",
    ],
  },
  {
    title: "Hosting and Technical Logs",
    body: [
      "The site may be served through hosting/CDN infrastructure that can process standard technical logs such as IP address, browser type, requested URL, and timestamp.",
      "These logs are used for hosting, security, and reliability. They are not used to inspect resume content.",
    ],
  },
  {
    title: "Analytics and Tracking",
    body: [
      "Resume Studio does not currently use analytics, tracking pixels, advertising cookies, or behavioral tracking in the public beta.",
      "If privacy-respecting analytics are added in the future, this page should be updated before or at the same time those tools are introduced.",
    ],
  },
  {
    title: "Third-Party Links",
    body: [
      "Resume Studio may link to GitHub, Bractos Labs, or other external sites. External sites have their own privacy practices, and this policy does not cover those sites.",
    ],
  },
  {
    title: "Children",
    body: [
      "Resume Studio is intended for general professional use and is not designed to collect information from children.",
    ],
  },
  {
    title: "Changes to This Policy",
    body: [
      "This policy may be updated as Resume Studio evolves, especially if cloud sync, accounts, analytics, optional AI features, or other hosted services are added later.",
    ],
  },
];

const PrivacyPolicyPage = () => (
  <section className="public-copy privacy-policy">
    <p className="policy-kicker">Effective date: May 2026</p>
    <h1>Privacy Policy</h1>
    <p className="policy-intro">Resume Studio is designed to be local-first. In the current public beta, your resume content stays in your browser. You do not need an account, and Bractos Labs does not receive, store, or review your resume content through the app.</p>
    {privacySections.map((section) => (
      <article className="policy-section" key={section.title}>
        <h2>{section.title}</h2>
        {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </article>
    ))}
    <article className="policy-section">
      <h2>Contact</h2>
      <p>Questions or private feedback can be sent to <a href="mailto:labs@bractos.com">labs@bractos.com</a>.</p>
    </article>
  </section>
);

const termsSections = [
  {
    title: "Public Beta",
    body: [
      "Resume Studio is in public beta. Features may change, and imports, exports, templates, and review tools may continue to evolve.",
      "Some behavior may vary by browser. Keep backups of important resumes before clearing browser data, switching devices, or relying on the app for active applications.",
    ],
  },
  {
    title: "No Hiring or ATS Guarantee",
    body: [
      "Resume Studio does not guarantee ATS results, employer ranking, interviews, job offers, or hiring outcomes.",
      "The app can help check formatting, readability, keyword overlap, and export readiness, but employers and applicant tracking systems make their own decisions.",
    ],
  },
  {
    title: "Review Tools Are Guidance Only",
    body: [
      "Resume Review and Keyword & Fit Check are local, rule-based guidance tools. They are not legal, career, hiring, or recruiting advice.",
      "You are responsible for deciding what to include before sending resume materials.",
    ],
  },
  {
    title: "User Content",
    body: [
      "You own your resume content. The MIT License applies to Resume Studio source code, not to the resume content you create with the app.",
      "You are responsible for making sure your resume content is accurate, lawful, and yours to use. Do not include content you do not have the right to use.",
    ],
  },
  {
    title: "Local Storage and Backups",
    body: [
      "In the current public beta, Resume Studio stores work locally in your browser. It is not cloud backup and it does not sync to an account.",
      "Clearing browser data, changing devices, switching browsers, or using private browsing may remove saved work. You are responsible for downloading backups.",
    ],
  },
  {
    title: "Public GitHub Issues",
    body: [
      "GitHub Issues are public. Do not post private resume content, personal contact information, job application details, or sensitive data in public issues.",
      "Send private feedback to labs@bractos.com.",
    ],
  },
  {
    title: "Open-Source License",
    body: [
      "Resume Studio source code is available under the MIT License.",
    ],
    link: { href: "https://github.com/bractoslabs/resume-studio/blob/main/LICENSE", label: "Read the MIT License" },
  },
  {
    title: "Limitation of Liability",
    body: [
      "Resume Studio is provided as-is in public beta. You are responsible for how you use the app, your resume content, your backups, and the files you send to employers or other people.",
    ],
  },
  {
    title: "Changes",
    body: [
      "These terms may be updated as Resume Studio evolves, especially if accounts, cloud sync, hosted services, analytics, or optional AI features are added later.",
    ],
  },
];

const securitySections = [
  {
    title: "Current Security Model",
    body: [
      "Resume Studio is currently a static, local-first public beta. Resume content is intended to remain in your browser.",
      "The current beta does not require an account and does not include cloud sync or cloud resume storage.",
    ],
  },
  {
    title: "Markdown and Content Rendering",
    body: [
      "Markdown is rendered in the browser, and rendered HTML is sanitized before display.",
      "If you find a way for unsafe HTML, JavaScript URLs, inline event handlers, or script execution to survive rendering, report it privately.",
    ],
  },
  {
    title: "File Imports",
    body: [
      "File imports are processed in the browser where possible. Complex documents, scanned PDFs, and unusual file contents may not import cleanly.",
      "Review imported content before saving or exporting it.",
    ],
  },
  {
    title: "Public Issues",
    body: [
      "Do not post private resume content, personal contact information, job application details, or sensitive data in public GitHub Issues.",
    ],
  },
  {
    title: "Report Vulnerabilities",
    body: [
      "Email security reports to labs@bractos.com. Do not open a public GitHub issue for security vulnerabilities.",
      "Include a description, steps to reproduce, browser and operating system if relevant, potential impact, and proof-of-concept details if safe to share privately.",
    ],
  },
];

const SectionedPublicPage = ({ title, intro, sections, effectiveDate }: {
  title: string;
  intro: string;
  effectiveDate?: string;
  sections: Array<{ title: string; body: string[]; link?: { href: string; label: string } }>;
}) => (
  <section className="public-copy privacy-policy">
    {effectiveDate && <p className="policy-kicker">Effective date: {effectiveDate}</p>}
    <h1>{title}</h1>
    <p className="policy-intro">{intro}</p>
    {sections.map((section) => (
      <article className="policy-section" key={section.title}>
        <h2>{section.title}</h2>
        {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        {section.link && <p><a href={section.link.href} target="_blank" rel="noopener noreferrer">{section.link.label}</a></p>}
      </article>
    ))}
    <article className="policy-section">
      <h2>Contact</h2>
      <p>Questions or private feedback can be sent to <a href="mailto:labs@bractos.com">labs@bractos.com</a>.</p>
    </article>
  </section>
);

export const PublicInfoPage = ({ view, setView, openFeedback }: { view: View; setView: (view: View) => void; openFeedback: () => void }) => {
  const content: Record<string, { title: string; body: string[] }> = {
    about: { title: "About", body: ["Resume Studio helps serious job seekers create, review, tailor, and export resumes without accounts or paywalls.", "The product is Markdown-first, privacy-conscious, and designed to avoid fabricated achievements."] },
    feedback: { title: "Feedback", body: ["Resume Studio is in public beta. GitHub Issues are the best place to report bugs, request features, or share export/import problems.", "If your feedback includes private resume details, email Bractos Labs instead of posting publicly."] },
    free: { title: "Resume Studio is free", body: ["There are no paywalls, no hidden export gates, and no account gates.", "The goal is a trustworthy free public beta for creating serious resumes."] },
  };
  const page = content[view] ?? content.about;
  return (
    <main className="public-page">
      <nav className="topbar clean-topbar"><button className="brand" onClick={() => setView("landing")}><FileText size={22} /> Resume Studio <small className="beta-pill">Public beta</small></button><Button className="primary" onClick={() => setView("dashboard")}>Start building</Button></nav>
      {view === "privacy" ? (
        <PrivacyPolicyPage />
      ) : view === "terms" ? (
        <SectionedPublicPage
          title="Terms of Use"
          effectiveDate="May 2026"
          intro="Resume Studio is a free public beta provided by Bractos Labs. By using the app, you are responsible for reviewing your resume content, exports, backups, and application materials before sending them."
          sections={termsSections}
        />
      ) : view === "security" ? (
        <SectionedPublicPage
          title="Security"
          intro="Resume Studio is designed as a local-first static app in the current public beta. This page explains the current security model and how to report vulnerabilities."
          sections={securitySections}
        />
      ) : (
        <section className="public-copy">
          <h1>{page.title}</h1>
          {page.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          {view === "feedback" && <Button className="primary" onClick={openFeedback}>Open feedback form</Button>}
        </section>
      )}
      <PublicFooter setView={setView} />
    </main>
  );
};
