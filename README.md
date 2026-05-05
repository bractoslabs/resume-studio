# Resume Studio

[![CI](https://github.com/bractoslabs/resume-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/bractoslabs/resume-studio/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Status: Public Beta](https://img.shields.io/badge/status-public%20beta-436a6b.svg)](https://resume.bractos.com)
[![No account required](https://img.shields.io/badge/no%20account-required-436a6b.svg)](https://resume.bractos.com)

Free, private, Markdown-first resume builder from Bractos Labs.

[Try the app](https://resume.bractos.com) · [Report a bug](https://github.com/bractoslabs/resume-studio/issues/new?template=bug_report.yml) · [Request a feature](https://github.com/bractoslabs/resume-studio/issues/new?template=feature_request.yml)

Resume Studio helps you write, review, tailor, and export resumes without creating an account. It is built for people who want control over their resume source, a clean live preview, and local-first privacy.

Resume Studio is an open-source Bractos Labs project.

## Public Beta Note

Resume Studio is in public beta. Core features are usable, but imports, exports, templates, and review tools may continue to change. Your resume data is saved locally in your browser, not synced to an account. Download a backup before clearing browser data, switching devices, or relying on the app for active applications.

## What It Does

- Write resumes in Markdown with a live preview
- Start from guided setup or Markdown templates
- Run Resume Review and Keyword & Fit Check
- Import common resume formats where browser parsing allows
- Export Markdown, DOCX, backups, and browser Print / Save as PDF
- Keep work local in the browser by default

## What It Is Not

- Not a hiring guarantee
- Not a signal of employer or ATS decisions
- Not a cloud resume database
- Not a replacement for reviewing your resume before sending
- Not currently an AI resume writer unless that feature is explicitly added later

Resume Studio does not guarantee ATS results, employer ranking, interviews, or job offers.

The review tools are local, rule-based checks for formatting, readability, keyword overlap, and export readiness.

## More Features

- Markdown is the source of truth.
- Structured guided editing syncs back to Markdown.
- Live preview renders sanitized Markdown with page boundaries, print CSS, page breaks, and ATS-safe preview mode.
- Dashboard supports create, duplicate, rename, delete, search, tags, sorting, quick exports, backup, and restore.
- ATS scanner explains parseability, formatting, contact, section, bullet, keyword, and length issues.
- Job description matcher extracts skills/tools/keywords and creates job-specific versions.
- Version history supports named/autosaved versions, restore, duplicate, and Markdown diff.
- Exports Markdown, HTML, plain text, JSON Resume, YAML, DOCX, backup JSON, and browser-based Print / Save as PDF with selectable text.
- Guest mode stores data locally in this browser using IndexedDB, with a localStorage fallback for older/unavailable browser storage; no analytics or account is required.

## Setup

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

## Commands

```bash
npm run dev      # start local development server
npm run lint     # run ESLint
npm run format:check # check Prettier formatting
npm run build    # type-check and build production assets
npm run test     # run unit tests
npm run preview  # preview built assets
```

## Contributing

Contributions are welcome. Resume Studio is in public beta, so maintainers may be selective while the product direction settles. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

Never include private resume content, personal contact information, job application details, or other sensitive data in public issues, PRs, screenshots, or fixtures.

See [docs/roadmap.md](docs/roadmap.md) for the public roadmap and [docs/starter-issues.md](docs/starter-issues.md) for ready-to-copy contributor issue drafts.

GitHub Discussions may be enabled later for broader community feedback. Until then, use Issues for actionable bugs, feature requests, accessibility problems, import/export issues, and documentation improvements.

## Environment Variables

No environment variables are required for the current static local-first app.

## Architecture

- `src/App.tsx` contains the main product shell and workflows.
- `src/lib/markdown.ts` parses YAML frontmatter, normalizes common technical terms, processes resume directives, sanitizes HTML, and syncs structured data.
- `src/lib/templates.ts` defines ATS-safe and visual templates.
- `src/lib/ats.ts` implements explainable local ATS scoring and bullet quality checks.
- `src/lib/jobMatcher.ts` extracts job description signals and compares them to resume text.
- `src/lib/exporters.ts` handles Markdown, HTML, text, JSON Resume, YAML, DOCX, backup, and print export helpers.
- `src/lib/storage.ts` provides local-first persistence and backup/restore.
- `src/lib/defaultDraft.ts` provides the default draft content used when a user creates a resume.

## Markdown Features

Frontmatter fields:

- `name`
- `title`
- `email`
- `phone`
- `location`
- `links`
- `targetRole`
- `pageSize`
- `template`
- `theme`
- `font`
- `accentColor`

Directives:

- `\newpage`
- `{{pagebreak}}`
- `{{icon:github}}`
- `{{atsOnly}}...{{/atsOnly}}`
- `{{hideForAts}}...{{/hideForAts}}`
- `{{section:experience}}`

Tables render, but the ATS scanner warns because many parsers read tables and columns poorly.

## Export Limitations

Resume Studio supports browser-based Print / Save as PDF. It opens your browser's print dialog so you can choose "Save as PDF." Browser print engines can vary, so check page size, margins, and page breaks before sending.

DOCX export produces a clean text document from Markdown source. Rich template-perfect DOCX styling is a roadmap item.

ZIP export is represented as a portable package JSON in this static pass.

## Import Support

Best import results come from Markdown, TXT, and DOCX. Selectable-text PDFs may work. Scanned or image-only PDFs are not supported yet.

Import results may need cleanup, especially complex PDFs and DOCX files. Review imported content before saving or exporting it.

## Known Limitations

- Browser storage only. There is no cloud sync or account backup in the current public beta.
- Clearing browser data may remove saved resumes.
- Print / Save as PDF depends on browser print behavior.
- DOCX export may not perfectly match visual templates.
- Scanned or image-only PDFs are not supported unless selectable text is available.
- Import results may need cleanup, especially complex PDFs and DOCX files.
- Resume Review and Keyword & Fit Check are guidance only.
- Resume Studio does not guarantee ATS results, employer ranking, interviews, job offers, or hiring outcomes.
- No AI or cloud rewriting is included in the current static beta unless added later and disclosed.
- Mobile editing is limited compared to desktop.

## Browser Support

Best tested on current Chrome, Edge, and Safari desktop. Firefox should work, but browser Print / Save as PDF output may vary. Mobile works for review and light edits, but full resume editing is best on desktop.

Browser storage is per browser and device. Work saved in one browser profile may not appear in another browser, profile, or device.

## Markdown Security

Markdown is rendered client-side. Resume Studio allows Markdown and limited HTML, then sanitizes rendered HTML and links before inserting content into the preview.

Do not paste untrusted complex HTML unless you understand the risk. Review resume content before export, and report security issues privately to labs@bractos.com.

See [SECURITY.md](SECURITY.md) for the full security model and vulnerability reporting path.

## Project Docs

- [Release checklist](docs/release-checklist.md)
- [Public roadmap](docs/roadmap.md)
- [Starter issue drafts](docs/starter-issues.md)

## Privacy and Storage

Resume Studio defaults to guest/local-first mode:

- Data stays in this browser. Resume Studio uses IndexedDB for local autosave and keeps a localStorage fallback when needed.
- No analytics are included.
- Backup and restore are explicit JSON actions.
- Clear data requires confirmation.
- Sharing UI and data-model placeholders exist, but backend share links are not enabled yet.

## License

Resume Studio is open source under the [MIT License](LICENSE).
