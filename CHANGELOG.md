# Changelog

## v0.2.1 - PDF export and editor preview polish

### Added

- Direct PDF export generated from resume data with `@react-pdf/renderer`.

### Changed

- Replaced the old browser print-to-PDF flow with direct PDF export across app copy and documentation.
- Redesigned the resume preview toolbar with grouped page and zoom controls, icon-only fit-width, and a separate Design Center action.
- Simplified the resume readiness panel so it focuses on resume content and job targeting.

### Fixed

- Preview pagination now shows one page at a time, repeats the candidate header on later pages, and avoids cutting text at the page bottom.
- Duplicate resume title/header text is removed when imported or edited Markdown repeats frontmatter values.

## v0.2.0 - Launch prep

Release focused on launch readiness, open-source distribution, local-first storage, imports, exports, templates, and review tools.

### Added

- Direct PDF export generated from resume data with `@react-pdf/renderer`.
- Real feedback paths through GitHub Issues and Bractos Labs email.
- SEO metadata, favicon, app icon, and web manifest.
- Public Privacy, Terms, and Security pages.
- Local-storage warning and backup guidance.
- Browser support, known limitations, and public roadmap/backlog updates.
- ESLint, Prettier, and Dependabot configuration.
- Open-source status pill and subtle Bractos Labs attribution.

### Changed

- Export wording now uses direct PDF export across the product and documentation.
- Import copy now sets expectations for Markdown, TXT, DOCX, selectable-text PDFs, and scanned/image-only PDFs.
- README now links the root public roadmap/backlog.
- CI now runs lint, format check, unit tests, and build.

### Fixed

- Light-mode styling is more consistent across review and checklist surfaces.

### Security

- Markdown/HTML sanitizer tests cover scripts, inline event handlers, unsafe links, malformed HTML, SVG payloads, and safe Markdown formatting.
- README explains the static local-first security model and private reporting path.

### Documentation

- Community files, issue templates, pull request template, and root public roadmap/backlog are included.

### Known Limitations

- Browser storage is local to each browser/device.
- PDF export may not match the live browser preview pixel-for-pixel.
- DOCX export may not match visual templates perfectly.
- Complex imports may need cleanup.
- Resume Review and Keyword & Fit Check are guidance only.
- No new sample resumes or sample-resume feature were added.

## Earlier releases

See GitHub Releases for prior release notes.
