# Starter Issue Drafts

These are ready-to-copy issue drafts for maintainers. Do not create GitHub issues automatically from this file.

Do not include private resume data in issue examples, screenshots, fixtures, or tests. Use minimal fictional data only.

## 1. Improve Mobile Editor Layout

Type/labels: `enhancement`, `help wanted`, `mobile`

Context: Mobile works for review and light edits, but full resume editing is better on desktop.

Proposed work: Improve the editor layout at 375px, 390px, and 430px widths without redesigning the desktop experience.

Acceptance criteria:

- Editor controls do not overflow horizontally.
- Preview and editor sections remain reachable.
- Mobile note stays visible but not noisy.

Notes for contributors: Do not add a new mobile app or sample resume content.

## 2. Add Browser-Specific Print / Save as PDF Tips

Type/labels: `documentation`, `export`, `good first issue`

Context: Browser print engines vary.

Proposed work: Add concise tips for Chrome, Edge, Safari, and Firefox print settings.

Acceptance criteria:

- Tips mention page size, margins, scale, and page breaks.
- README or docs link to the tips.
- UI copy remains short.

Notes for contributors: Do not add a PDF generation backend.

## 3. Add More Import Parser Tests

Type/labels: `tests`, `import`, `help wanted`

Context: Import support is public beta and needs regression coverage.

Proposed work: Add tests for Markdown, TXT, DOCX text extraction, JSON, YAML, and malformed input.

Acceptance criteria:

- Tests use fictional data only.
- Complex or unsupported files produce clear limitations or errors.
- Existing import behavior is not weakened.

## 4. Add Accessibility Checks for Dialogs

Type/labels: `accessibility`, `tests`, `help wanted`

Context: Dialogs should be keyboard-friendly and understandable to assistive technology.

Proposed work: Add unit or integration coverage for dialog labels, Escape behavior, and focus behavior.

Acceptance criteria:

- Feedback and Import dialogs are covered.
- Tests do not rely on private data.
- Any failures produce actionable fixes.

## 5. Add Markdown Resume Syntax Docs

Type/labels: `documentation`, `good first issue`

Context: Users can write Markdown with Resume Studio frontmatter and directives.

Proposed work: Create docs for supported frontmatter fields, page breaks, section directives, and safe Markdown usage.

Acceptance criteria:

- Docs link from README.
- Security note mentions sanitized HTML and safe links.
- Examples use fictional content only.

## 6. Add Firefox Export QA Notes

Type/labels: `documentation`, `export`, `help wanted`

Context: Firefox print output may vary.

Proposed work: Test Print / Save as PDF in Firefox and document differences.

Acceptance criteria:

- Notes cover margins, page size, selectable text, and page breaks.
- Known issues are added to docs or README if relevant.

## 7. Add Backup and Restore Regression Tests

Type/labels: `tests`, `local-first`, `help wanted`

Context: Backup and restore are important for local-first storage.

Proposed work: Add regression coverage that exports a backup, clears local data in test state, restores it, and confirms the resume returns.

Acceptance criteria:

- Test uses fictional data only.
- Restore behavior is clear in assertions.
- Test is reliable in local and CI test runs.

## 8. Improve Dashboard Empty States

Type/labels: `enhancement`, `good first issue`

Context: Empty states should help users start without adding noise.

Proposed work: Improve dashboard empty-copy and actions for create/import flows.

Acceptance criteria:

- Copy stays plainspoken.
- No sample-resume library is added.
- Buttons have clear labels.

## 9. Improve Import Cleanup Messaging

Type/labels: `import`, `documentation`, `good first issue`

Context: Imports may need cleanup, especially complex PDFs and DOCX files.

Proposed work: Refine import review messages so users know what was detected, repaired, ignored, or needs review.

Acceptance criteria:

- Messaging is honest about limitations.
- Scanned PDFs are clearly described as unsupported unless selectable text is available.
- No guarantee or perfect-import language is introduced.

## 10. Polish Release Checklist

Type/labels: `documentation`, `good first issue`

Context: The release checklist should stay useful without growing into a long maintenance burden.

Proposed work: Review the checklist, remove stale launch-only steps, and keep release checks focused on app quality.

Acceptance criteria:

- Checklist items are actionable.
- Stale launch-only tasks are removed.
- App quality, privacy, security, and local-first checks remain covered.
