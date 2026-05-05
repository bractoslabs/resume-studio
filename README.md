# Resume Studio

Resume Studio is a Markdown-first, local-first resume builder inspired by the architecture and feature ideas in `junian/markdown-resume`, but implemented as a fuller React + TypeScript product.

## What It Does

- Markdown is the source of truth.
- Structured guided editing syncs back to Markdown.
- Live preview renders sanitized Markdown with page boundaries, print CSS, page breaks, and ATS-safe preview mode.
- Dashboard supports create, duplicate, rename, delete, search, tags, sorting, quick exports, backup, and restore.
- ATS scanner explains parseability, formatting, contact, section, bullet, keyword, and length issues.
- Job description matcher extracts skills/tools/keywords and creates job-specific versions.
- Version history supports named/autosaved versions, restore, duplicate, and Markdown diff.
- Exports Markdown, HTML, plain text, JSON Resume, YAML, DOCX, backup JSON, and browser-print PDF with selectable text.
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
npm run build    # type-check and build production assets
npm run test     # run unit tests
npm run preview  # preview built assets
```

## Environment Variables

No environment variables are required for the current static local-first app.

Future AI/server routes should use:

```bash
OPENAI_API_KEY=...
```

AI features must preserve facts, show before/after changes, ask for missing metrics, and never invent employers, dates, credentials, or achievements.

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

PDF export uses browser print CSS in this pass. This preserves selectable text and clickable links, but browser print engines may differ slightly in page breaking. A backend Playwright/Puppeteer export route is a future improvement for exact server-side PDF output.

DOCX export produces a clean text document from Markdown source. Rich template-perfect DOCX styling is a roadmap item.

ZIP export is represented as a portable package JSON in this static pass.

## Privacy and Storage

Resume Studio defaults to guest/local-first mode:

- Data stays in this browser. Resume Studio uses IndexedDB for local autosave and keeps a localStorage fallback when needed.
- No analytics are included.
- Backup and restore are explicit JSON actions.
- Clear data requires confirmation.
- Sharing UI and data-model placeholders exist, but backend share links are not enabled yet.

## Roadmap

- IndexedDB storage for larger histories and imported source files.
- Server-side PDF export with Playwright.
- Rich DOCX styling parity with preview templates.
- Backend persistence with private, expiring, password-protected recruiter links.
- Optional encrypted local backup through WebCrypto.
- Drag-and-drop section and bullet ordering.
- DOCX/PDF import parsing with confidence review.
- Optional AI assistant route when `OPENAI_API_KEY` is configured.
