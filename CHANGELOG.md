# Changelog

## v0.2.0-beta - Public beta launch prep

Upcoming public beta release focused on launch readiness. Core features are usable, but imports, exports, templates, and review tools may continue to change.

### Added

- Real feedback paths through GitHub Issues and Bractos Labs email.
- SEO metadata, favicon, app icon, and web manifest.
- Public Privacy, Terms, and Security pages.
- Local-storage warning and backup guidance.
- Browser support, known limitations, testing, accessibility, roadmap, and starter issue docs.
- ESLint, Prettier, Playwright E2E smoke tests, Dependabot, and dependency review automation.
- Public beta pill and subtle Bractos Labs attribution.

### Changed

- Export wording now uses Print / Save as PDF for browser-print-based output.
- Import copy now sets expectations for Markdown, TXT, DOCX, selectable-text PDFs, and scanned/image-only PDFs.
- README now links public roadmap and contributor starter issue drafts.
- CI now runs lint, format check, unit tests, E2E smoke tests, and build.

### Fixed

- Light-mode review/checklist surfaces now use the app theme instead of dark public-page cards.
- Light-mode styling is more consistent across review and checklist surfaces.

### Security

- Markdown/HTML sanitizer tests cover scripts, inline event handlers, unsafe links, malformed HTML, SVG payloads, and safe Markdown formatting.
- Security model docs and SECURITY.md explain the static local-first public beta model.

### Documentation

- Community files, issue templates, pull request template, release checklist, accessibility docs, testing docs, and GitHub Discussions guidance are included.

### Known Limitations

- Browser storage is local to each browser/device.
- Print / Save as PDF depends on browser print behavior.
- DOCX export may not match visual templates perfectly.
- Complex imports may need cleanup.
- Resume Review and Keyword & Fit Check are guidance only.
- No new sample resumes or sample-resume feature were added.

## Earlier releases

See GitHub Releases for prior release notes.
