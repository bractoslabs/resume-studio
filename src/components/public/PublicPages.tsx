import { ArrowRight, Check, ClipboardCheck, Code2, Eye, FileDown, Github, LockKeyhole, SearchCheck, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import type { View } from "../../app/types";
import { Button } from "../common/Button";
import { ResumeStudioLogo } from "../common/ResumeStudioLogo";

const githubUrl = "https://github.com/bractoslabs/resume-studio";

export const LandingPage = ({ setView, themeToggle }: { setView: (view: View) => void; themeToggle?: ReactNode }) => (
  <main className="landing landing-home">
    <LandingNav setView={setView} themeToggle={themeToggle} />
    <LandingHero setView={setView} />
    <FeatureGrid />
    <PrivacySection setView={setView} />
    <MarkdownSection />
    <PublicFooter setView={setView} />
  </main>
);

const LandingNav = ({ setView, themeToggle }: { setView: (view: View) => void; themeToggle?: ReactNode }) => (
  <nav className="landing-nav" aria-label="Home">
    <button className="landing-brand" onClick={() => setView("landing")}>
      <span className="landing-brand-mark" aria-hidden="true">
        <ResumeStudioLogo className="landing-brand-logo" />
      </span>
      <span>Resume Studio</span>
    </button>
    <div className="landing-nav-actions">
      {themeToggle}
      <a
        className="landing-icon-link"
        href={githubUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="View on GitHub"
        title="GitHub"
      >
        <Github size={18} />
      </a>
      <Button className="primary" onClick={() => setView("dashboard")}>
        Start building
      </Button>
    </div>
  </nav>
);

const LandingHero = ({ setView }: { setView: (view: View) => void }) => (
  <section className="landing-hero" aria-labelledby="landing-title">
    <div className="landing-hero-copy">
      <h1 id="landing-title">Resume Studio</h1>
      <p className="landing-subheadline">A free, private, Markdown-first resume builder.</p>
      <p className="landing-support">
        Write in Markdown. Preview instantly. Review, tailor, and export your resume without creating an account.
      </p>
      <div className="landing-hero-actions">
        <Button className="primary large" onClick={() => setView("dashboard")}>
          Start building <ArrowRight size={17} />
        </Button>
        <a className="btn landing-secondary-btn" href={githubUrl} target="_blank" rel="noopener noreferrer">
          <Github size={17} /> View on GitHub
        </a>
      </div>
      <div className="landing-trust-list" aria-label="Key product details">
        {["No account required", "Local-first", "Open source", "Multi-format export"].map((item) => (
          <span key={item}>
            <Check size={14} /> {item}
          </span>
        ))}
      </div>
    </div>
    <ProductMockup />
  </section>
);

const ProductMockup = () => (
  <div className="product-mockup" aria-label="Resume Studio Markdown editor and resume preview mockup">
    <div className="mockup-frame">
      <div className="mockup-chrome" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="mockup-toolbar">
        <strong>John Smith</strong>
        <span>Autosaved locally</span>
      </div>
      <div className="mockup-workspace">
        <section className="mockup-editor" aria-label="Markdown editor example">
          <div className="mockup-pane-label">Markdown</div>
          <pre>{`---
name: John Smith
title: Product Operations Manager
email: john.smith@example.com
location: San Francisco, CA
---

## Summary
Product operations manager who turns
messy workflows into clear operating systems.

## Experience
### Product Operations Manager
Acme Labs · 2021 - Present
- Led quarterly planning and operating reviews
  across product, engineering, and operations.
- Improved intake and handoff workflows,
  reducing cycle time by 28%.
- Built KPI dashboards used by leadership to
  track delivery, quality, and customer outcomes.

## Skills
Operations strategy, KPI dashboards, planning

## Education
B.S. Business Administration`}</pre>
        </section>
        <section className="mockup-preview" aria-label="Resume preview example">
          <div className="mockup-pane-label">Preview</div>
          <article className="mockup-resume">
            <header>
              <h2>John Smith</h2>
              <p>Product Operations Manager</p>
              <span>john.smith@example.com · San Francisco, CA</span>
            </header>
            <div>
              <h3>Summary</h3>
              <p>Product operations manager who turns messy workflows into clear operating systems.</p>
            </div>
            <div>
              <h3>Experience</h3>
              <h4>Product Operations Manager · Acme Labs</h4>
              <ul>
                <li>Led quarterly planning and operating reviews across product, engineering, and operations.</li>
                <li>Improved intake and handoff workflows, reducing cycle time by 28%.</li>
                <li>Built KPI dashboards used by leadership to track delivery, quality, and customer outcomes.</li>
              </ul>
            </div>
            <div className="mockup-resume-grid">
              <div>
                <h3>Skills</h3>
                <p>Operations strategy, KPI dashboards, planning</p>
              </div>
              <div>
                <h3>Education</h3>
                <p>B.S. Business Administration</p>
              </div>
            </div>
          </article>
        </section>
      </div>
    </div>
  </div>
);

const featureItems = [
  {
    title: "Live Preview",
    body: "See your resume update as you write.",
    icon: Eye,
  },
  {
    title: "Resume Review",
    body: "Catch weak bullets, ATS readability issues, formatting problems, and missing context.",
    icon: ClipboardCheck,
  },
  {
    title: "Keyword & Fit Check",
    body: "Compare your resume with a job description and find relevant keywords, skills, and gaps.",
    icon: SearchCheck,
  },
  {
    title: "Export to multiple formats",
    body: "Download PDF, DOCX, Markdown, plain text, HTML, JSON Resume, YAML, and backups.",
    icon: FileDown,
  },
];

const FeatureGrid = () => (
  <section className="landing-section landing-feature-section" aria-labelledby="feature-title">
    <div className="landing-section-heading">
      <h2 id="feature-title">Everything you need to get a resume ready</h2>
    </div>
    <div className="landing-feature-grid">
      {featureItems.map(({ title, body, icon: Icon }) => (
        <article className="landing-feature-card" key={title}>
          <span className="landing-card-icon" aria-hidden="true">
            <Icon size={20} />
          </span>
          <h3>{title}</h3>
          <p>{body}</p>
        </article>
      ))}
    </div>
  </section>
);

const PrivacySection = ({ setView }: { setView: (view: View) => void }) => (
  <section className="landing-section landing-split-section landing-privacy-section" aria-labelledby="privacy-title">
    <div>
      <span className="landing-section-icon" aria-hidden="true">
        <LockKeyhole size={22} />
      </span>
      <h2 id="privacy-title">Private by default</h2>
      <p>
        Resume Studio does not require an account. Your resumes are stored locally in your browser unless you choose to export, copy, or
        share them.
      </p>
      <Button onClick={() => setView("privacy")}>Read privacy notes</Button>
    </div>
    <div className="privacy-diagram" aria-label="Your browser stores your resume locally">
      <span>Your browser</span>
      <ArrowRight size={20} aria-hidden="true" />
      <strong>Your resume</strong>
      <ShieldCheck size={22} aria-hidden="true" />
    </div>
  </section>
);

const MarkdownSection = () => (
  <section className="landing-section landing-split-section landing-markdown-section" aria-labelledby="markdown-title">
    <div>
      <span className="landing-section-icon" aria-hidden="true">
        <Code2 size={22} />
      </span>
      <h2 id="markdown-title">Built around Markdown</h2>
      <p>No fighting with text boxes. No mystery formatting. Your resume content stays readable, portable, and easy to edit.</p>
    </div>
    <div className="markdown-transform" aria-label="Markdown turns into a resume preview">
      <pre>{`## Experience
- Improved intake workflows by 28%
- Built KPI dashboards for leaders`}</pre>
      <ArrowRight size={20} aria-hidden="true" />
      <div>
        <strong>Experience</strong>
        <span>Improved intake workflows by 28%</span>
        <span>Built KPI dashboards for leaders</span>
      </div>
    </div>
  </section>
);

const PublicFooter = ({ setView }: { setView: (view: View) => void }) => (
  <footer className="public-footer">
    <div className="public-footer-brand">
      <strong>Resume Studio</strong>
      <span>Free, private, Markdown-first resume builder.</span>
      <span>
        Built by{" "}
        <a href="https://bractos.com" target="_blank" rel="noopener noreferrer">
          Bractos Labs
        </a>
        . Open source under{" "}
        <a href="https://github.com/bractoslabs/resume-studio/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">
          MIT
        </a>
        .
      </span>
    </div>
    <nav aria-label="Public pages">
      {(["about", "privacy", "terms", "security", "feedback", "free"] as View[]).map((item) => (
        <button key={item} onClick={() => setView(item)}>
          {item}
        </button>
      ))}
      <a href="https://github.com/bractoslabs/resume-studio" target="_blank" rel="noopener noreferrer">
        GitHub
      </a>
    </nav>
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
      "Bractos Labs does not receive, store, or review your resume content through the static local-first app.",
      "No account is required. Resume content is not intentionally uploaded to a Resume Studio backend. Resume Studio does not use AI or cloud processing for resume content unless a future version explicitly introduces and discloses that feature.",
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
      "Resume Studio does not currently use analytics, tracking pixels, advertising cookies, or behavioral tracking.",
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
    body: ["Resume Studio is intended for general professional use and is not designed to collect information from children."],
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
    <p className="policy-intro">
      Resume Studio is designed to be local-first. Your resume content stays in your browser. You do not need an account, and Bractos Labs
      does not receive, store, or review your resume content through the app.
    </p>
    {privacySections.map((section) => (
      <article className="policy-section" key={section.title}>
        <h2>{section.title}</h2>
        {section.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </article>
    ))}
    <article className="policy-section">
      <h2>Contact</h2>
      <p>
        Questions or private feedback can be sent to <a href="mailto:labs@bractos.com">labs@bractos.com</a>.
      </p>
    </article>
  </section>
);

const termsSections = [
  {
    title: "Product Changes",
    body: [
      "Resume Studio features may change, and imports, exports, templates, and review tools may continue to evolve.",
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
      "Resume Studio stores work locally in your browser. It is not cloud backup and it does not sync to an account.",
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
    body: ["Resume Studio source code is available under the MIT License."],
    link: { href: "https://github.com/bractoslabs/resume-studio/blob/main/LICENSE", label: "Read the MIT License" },
  },
  {
    title: "Limitation of Liability",
    body: [
      "Resume Studio is provided as-is. You are responsible for how you use the app, your resume content, your backups, and the files you send to employers or other people.",
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
      "Resume Studio is a static, local-first app. Resume content is intended to remain in your browser.",
      "Resume Studio does not require an account and does not include cloud sync or cloud resume storage.",
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

const SectionedPublicPage = ({
  title,
  intro,
  sections,
  effectiveDate,
}: {
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
        {section.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        {section.link && (
          <p>
            <a href={section.link.href} target="_blank" rel="noopener noreferrer">
              {section.link.label}
            </a>
          </p>
        )}
      </article>
    ))}
    <article className="policy-section">
      <h2>Contact</h2>
      <p>
        Questions or private feedback can be sent to <a href="mailto:labs@bractos.com">labs@bractos.com</a>.
      </p>
    </article>
  </section>
);

export const PublicInfoPage = ({
  view,
  setView,
  openFeedback,
  themeToggle,
}: {
  view: View;
  setView: (view: View) => void;
  openFeedback: () => void;
  themeToggle?: ReactNode;
}) => {
  const content: Record<string, { title: string; body: string[] }> = {
    about: {
      title: "About",
      body: [
        "Resume Studio helps serious job seekers create, review, tailor, and export resumes without accounts or paywalls.",
        "The product is Markdown-first, privacy-conscious, and designed to avoid fabricated achievements.",
      ],
    },
    feedback: {
      title: "Feedback",
      body: [
        "GitHub Issues are the best place to report bugs, request features, or share export/import problems.",
        "If your feedback includes private resume details, email Bractos Labs instead of posting publicly.",
      ],
    },
    free: {
      title: "Resume Studio is free",
      body: [
        "There are no paywalls, no hidden export gates, and no account gates.",
        "The goal is a trustworthy free tool for creating serious resumes.",
      ],
    },
  };
  const page = content[view] ?? content.about;
  return (
    <main className="public-page">
      <nav className="topbar clean-topbar">
        <button className="brand" onClick={() => setView("landing")}>
          <ResumeStudioLogo className="brand-logo" /> Resume Studio
        </button>
        <div className="topbar-actions">
          {themeToggle}
          <Button className="primary" onClick={() => setView("dashboard")}>
            Start building
          </Button>
        </div>
      </nav>
      {view === "privacy" ? (
        <PrivacyPolicyPage />
      ) : view === "terms" ? (
        <SectionedPublicPage
          title="Terms of Use"
          effectiveDate="May 2026"
          intro="Resume Studio is a free open-source app provided by Bractos Labs. By using the app, you are responsible for reviewing your resume content, exports, backups, and application materials before sending them."
          sections={termsSections}
        />
      ) : view === "security" ? (
        <SectionedPublicPage
          title="Security"
          intro="Resume Studio is designed as a local-first static app. This page explains the current security model and how to report vulnerabilities."
          sections={securitySections}
        />
      ) : (
        <section className="public-copy">
          <h1>{page.title}</h1>
          {page.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {view === "feedback" && (
            <Button className="primary" onClick={openFeedback}>
              Open feedback form
            </Button>
          )}
        </section>
      )}
      <PublicFooter setView={setView} />
    </main>
  );
};
