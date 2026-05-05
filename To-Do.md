# Resume Studio To-Do

Public roadmap and backlog for improving Resume Studio's usability, usefulness, UI/UX, and long-term product quality.

This roadmap is not a promise. Priorities may change during public beta based on user feedback, maintenance cost, security needs, and product direction.

## Product Flow and Onboarding

1. ~~Add a first-run setup flow that guides users through contact details, target role, import or template selection, review, and first export.~~
2. ~~Make the existing job seeker checklist actionable by linking each checklist item to the relevant screen or section.~~
3. ~~Delay backup reminders until meaningful edits or first export so new users are not interrupted immediately after creating a draft.~~
4. ~~Add placeholder detection for starter content such as "Your Name", "Target Role", and "[add metric]" and group those issues into a clear pre-export warning.~~
5. ~~Add an import review screen that shows detected sections, contact details, bullets, parsing confidence, and ignored or repaired fields before creating a resume.~~

## Editor and Resume Building

6. Add layout controls for the editor workspace: edit only, split view, and preview only.
7. Make review actions such as "Edit section" jump to and highlight the relevant Markdown or guided form section.
8. Add guided-mode controls for reordering, duplicating, deleting, and moving experience, projects, skills, and custom entries.
9. Support guided custom sections for Board or Advisory, Speaking, Publications, Patents, Open Source, Selected Clients, Earlier Experience, and similar resume content.
10. Support page-aware section planning for longer resumes, including Earlier Experience and Additional Projects sections.
11. Improve Markdown snippet buttons with clearer labels, tooltips, and richer inserted scaffolds.
12. Add visible version and snapshot reassurance near major editing actions.

## Review and Quality

13. Add a "Fix these first" review queue that prioritizes the highest-impact issues by severity, effort, and export risk.
14. Add a pre-export quality gate covering unresolved placeholders, missing contact fields, must-fix review items, page count, and ATS-safe status.
15. Improve Resume Review explanations for score labels and make terms such as "Review score" explicit in the UI.
16. Warn when advanced design changes or custom CSS may reduce ATS readability or export safety.
17. Add a resume-to-job evidence map that connects each job requirement to matching resume evidence or a clear gap.

## Keyword and Tailoring

18. Tighten keyword extraction so short terms such as "Go" are not matched inside phrases like "go-to-market".
19. Reduce noisy multi-word keyword fragments and keep only useful, human-readable job signals.
20. Show empty keyword coverage categories as "Not detected" instead of 100% coverage.
21. Persist job-tailoring decisions such as important, not relevant, I have this, and I do not have this with each saved job target.
22. Add a diff preview before creating or applying a job-specific resume copy.
23. Add next-step actions after saving a job target, such as track application, generate cover letter, or export a PDF for a tailored resume.

## Career Tools and Job Tracking

24. Prevent cover letter, LinkedIn, recruiter, and interview drafts from generating polished output when the selected resume still contains obvious placeholders.
25. Add a send-readiness check for career tool drafts covering placeholders, unsupported claims, missing company, and missing role.
26. Link job targets and applications back to the exact resume, version, tailored copy, and export used.
27. Expand Job Targets into a workflow hub with next actions for tailoring, exporting, applying, following up, and interview prep.
28. Improve CSV export fields and validation for application tracking.

## Design and Export

29. Add undo or before-and-after preview for design changes made in the Design drawer.
30. Add a visual page layout manager for non-ATS templates with page-level placement, sidebar width, and full-width section controls.
31. Add advanced scoped custom CSS controls with safe starter snippets for headings, dividers, dense skills, and link styling.
32. Improve PDF export guidance with clearer page break, margin, and final review checks.
33. Improve DOCX export styling parity with the selected resume template.
34. ~~Add direct PDF export generated from resume data.~~

## Navigation and Interface Polish

35. Add tooltips or persistent labels for icon-only navigation states.
36. Reduce visual density in long workflow screens by using more compact lists or tables where users perform repeated review tasks.
37. Improve landing page responsiveness so the resume preview crop feels intentional across desktop and mobile viewports.
38. Add clearer disabled-state messaging for buttons such as Analyze job description and Save job target.

## Sharing, Privacy, and Collaboration

39. Add optional public read-only resume links after backend and storage architecture are ready.
40. Add optional password protection and one-click disable controls for public resume links.
41. Add basic private view and download statistics for shared links.
42. Add optional encrypted local backups using WebCrypto.

## Optional AI

43. Add optional local AI provider settings with user-supplied API key, provider, model, and base URL.
44. Keep deterministic local review as the default path even when optional AI features are enabled.
45. Show optional AI output as Markdown diffs and require explicit user approval before applying changes.
46. Use strict AI prompts and validation rules that never invent employers, dates, credentials, skills, or metrics.

## Interoperability and Reliability

47. Add a visible schema documentation page for Resume Studio JSON.
48. Add migrations and validation for future Resume Studio JSON schema versions.
49. Add import validation details for fields that were accepted, ignored, repaired, or could not be parsed.
50. Add end-to-end tests for creating, importing, editing, reviewing, tailoring, exporting, backing up, and restoring resumes.
51. Add keyword extraction regression tests for edge cases such as go-to-market, R, R&D, C-suite, C#, Node, and empty coverage categories.
52. Add storage quota and storage failure tests for the local-first save, backup, and restore flows.
