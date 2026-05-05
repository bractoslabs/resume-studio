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
    <section className="landing-section faq">
      <h2>FAQ</h2>
      {[
        ["Is Resume Studio free?", "Yes. The public beta is free to use, with no account requirement and no paywalls."],
        ["Does it use an LLM?", "No. Review, Keyword & Fit Check, and helper drafts are local rule-based suggestions."],
        ["Where is my data stored?", "In this browser until you export, copy, download, or delete it."],
        ["Can I import an existing resume?", "Yes. Paste text or upload Markdown, TXT, JSON Resume, YAML, and text-extracted formats when available."],
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

export const PublicInfoPage = ({ view, setView, openFeedback }: { view: View; setView: (view: View) => void; openFeedback: () => void }) => {
  const content: Record<string, { title: string; body: string[] }> = {
    terms: { title: "Terms", body: ["Resume Studio is provided as a free public beta resume tool.", "You are responsible for verifying resume content before sending it to employers.", "Local suggestions are guidance only and should not be treated as legal, hiring, or career guarantees."] },
    security: { title: "Security", body: ["Resume content is processed locally in the browser in this static beta.", "Rendered Markdown is sanitized to reduce script execution risk.", "Future cloud sync or review links would need backend security controls before launch."] },
    about: { title: "About", body: ["Resume Studio helps serious job seekers create, review, tailor, and export resumes without accounts or paywalls.", "The product is Markdown-first, privacy-conscious, and designed to avoid fabricated achievements."] },
    feedback: { title: "Feedback", body: ["Resume Studio is in public beta. GitHub Issues are the best place to report bugs, request features, or share export/import problems.", "If your feedback includes private resume details, email Bractos Labs instead of posting publicly."] },
    free: { title: "Resume Studio is free", body: ["There are no paywalls, no hidden export gates, and no account gates.", "The goal is a trustworthy free public beta for creating serious resumes."] },
  };
  const page = content[view] ?? content.about;
  return (
    <main className="public-page">
      <nav className="topbar clean-topbar"><button className="brand" onClick={() => setView("landing")}><FileText size={22} /> Resume Studio</button><Button className="primary" onClick={() => setView("dashboard")}>Start building</Button></nav>
      {view === "privacy" ? (
        <PrivacyPolicyPage />
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
