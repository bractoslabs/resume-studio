# Resume Studio Security Model

Resume Studio is a static, local-first public beta. The current app runs in the browser, does not require an account, and does not include cloud resume storage or cloud sync.

## Markdown Rendering

Resume Studio renders Markdown client-side. Markdown and limited HTML are processed with the local Markdown renderer, then sanitized before the rendered content is inserted into the resume preview.

The sanitizer is expected to remove unsafe script content, inline event handlers, unsafe links such as `javascript:` URLs, and other scriptable payloads. Safe Markdown formatting such as headings, lists, bold, italic, and normal `https:` links should continue to work.

## User Content

Resume content should still be reviewed before export. Sanitization reduces rendering risk, but it does not verify whether resume content is accurate, lawful, or appropriate to send.

Avoid pasting untrusted complex HTML unless you understand the risk. If imported or pasted content looks unusual, review the Markdown before exporting or sharing files.

## Local Storage

Resume drafts, versions, settings, job targets, and related app data may be stored in browser storage. This is local to the browser and device. It is not cloud backup.

Users should download backups before clearing browser data, switching devices, or relying on the app for active applications.

## Public Reports

Do not post private resume content, personal contact information, job application details, or sensitive data in public GitHub Issues.

Security issues should be reported privately to labs@bractos.com.
