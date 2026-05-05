# Public Release Checklist

Use this checklist before each public Resume Studio release.

## Pre-Release Basics

- [ ] Package version matches the intended release.
- [ ] CHANGELOG and release notes are updated.
- [ ] `npm test` passes.
- [ ] `npm run build` passes.
- [ ] CI passes on GitHub.
- [ ] README links checked.
- [ ] Privacy, Terms, and Security links checked.

## Landing Page

- [ ] Loads at https://resume.bractos.com/.
- [ ] Social preview metadata exists.
- [ ] Favicon and app icon exist.
- [ ] Public beta language is visible but not overwhelming.
- [ ] Mobile landing page sanity check completed.

## Create and Edit Flows

- [ ] Create resume from guided setup.
- [ ] Create resume from Markdown or sample template.
- [ ] Edit Markdown.
- [ ] Edit guided form if present.
- [ ] Live preview updates.
- [ ] Save state survives refresh.

## Import Flows

- [ ] Import Markdown.
- [ ] Import TXT.
- [ ] Import DOCX.
- [ ] Import selectable-text PDF.
- [ ] Import JSON.
- [ ] Import YAML.
- [ ] Scanned or image-only PDF gives a helpful limitation message.
- [ ] Import errors do not crash the app.

## Review Flows

- [ ] Resume Review runs.
- [ ] Keyword & Fit Check runs.
- [ ] Guidance-only and no-guarantee copy is visible.
- [ ] Job description input handles empty and long text.

## Export Flows

- [ ] Markdown export.
- [ ] DOCX export.
- [ ] Backup export.
- [ ] Backup restore.
- [ ] Print / Save as PDF on Chrome.
- [ ] Print / Save as PDF on Safari.
- [ ] Print / Save as PDF on Edge.
- [ ] Letter and A4 checked if supported.
- [ ] Margins and page breaks reviewed.

## Local Data Flows

- [ ] Data-loss warning visible.
- [ ] Backup button works.
- [ ] Delete resume confirmation is clear.
- [ ] Clear local data confirmation is clear.
- [ ] Restore backup behavior is clear.

## Public Pages

- [ ] Privacy page.
- [ ] Terms page.
- [ ] Security page.
- [ ] FAQ or help if present.
- [ ] Footer links.

## Accessibility Smoke Check

- [ ] Keyboard navigation.
- [ ] Visible focus states.
- [ ] Modal focus behavior.
- [ ] Button labels.
- [ ] Color contrast spot check.

## Mobile Sanity Check

- [ ] Landing page.
- [ ] Editor layout does not break.
- [ ] Export guidance readable.
- [ ] Modals usable.

## Final Release

- [ ] Git tag prepared manually.
- [ ] GitHub release notes drafted.
- [ ] Social links tested.
- [ ] Known limitations reviewed.
