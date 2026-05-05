import { Check, FileText } from "lucide-react";
import type { View } from "../../app/types";
import { Button } from "../common/Button";

export const LandingSections = ({ setView }: { setView: (view: View) => void }) => (
  <>
    <section className="landing-section how-it-works">
      <h2>How it works</h2>
      <div className="landing-grid four">
        {["Create a resume in Markdown or guided mode.", "Run Resume Review for quality and readability issues.", "Use Keyword & Fit Check without fabricating facts.", "Export PDF, DOCX, Markdown, plain text, HTML, JSON Resume, or experimental YAML."].map((item, index) => <article key={item}><span>{index + 1}</span><p>{item}</p></article>)}
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
      <div><h2>Export formats</h2><p>PDF keeps text selectable through browser print CSS. Plain text helps with job portals. Markdown is ideal for editing and backups. JSON Resume supports portability.</p><Button onClick={() => setView("dashboard")}>Start free</Button></div>
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

export const PublicInfoPage = ({ view, setView, openFeedback }: { view: View; setView: (view: View) => void; openFeedback: () => void }) => {
  const content: Record<string, { title: string; body: string[] }> = {
    privacy: { title: "Privacy", body: ["Resume Studio is local-first. Guest resumes are stored in this browser.", "Your resumes stay in the browser unless you explicitly export, copy, download, or share them.", "No account is required for the core workflow. No analytics are enabled by default in this static beta."] },
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
      <section className="public-copy">
        <h1>{page.title}</h1>
        {page.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        {view === "feedback" && <Button className="primary" onClick={openFeedback}>Open feedback form</Button>}
      </section>
      <PublicFooter setView={setView} />
    </main>
  );
};
