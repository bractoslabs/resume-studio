# Security Policy

## Supported Versions

Resume Studio is currently in public beta. Security reports should target the latest `main` branch and the currently deployed public beta.

## Reporting a Vulnerability

Please email security reports to labs@bractos.com.

Do not open a public GitHub issue for security vulnerabilities.

Include as much of the following as you can:

- A clear description of the issue
- Steps to reproduce
- Browser and operating system, if relevant
- Potential impact
- Proof-of-concept details if safe to share privately
- Whether private resume data, local browser storage, imports, exports, or rendered Markdown are involved

We will review reports and respond as we are able. Because Resume Studio is an early public beta, we do not promise a specific response timeline, but we do take credible security reports seriously.

## Security Model

Resume Studio is a static, local-first public beta. Resume content is intended to remain in browser storage on the user's device. The current beta does not require an account, does not include cloud sync, and does not include cloud resume storage.

Core features are usable, but imports, exports, templates, and review tools may continue to change during the public beta.

Browser storage and local files are user-controlled. Clearing browser data, changing devices, or importing and exporting files can affect what data remains available.

Markdown and rendered content should be sanitized before display. Import, export, backup, restore, and browser storage behavior are important parts of the app's security and privacy model.

## Recommended Repository Settings

Maintainers should enable GitHub security features in repository settings where available:

- Dependabot alerts
- Dependabot security updates
- Secret scanning
- Code scanning or default setup, if available

The repo includes Dependabot and dependency review workflow files, but some GitHub security features still require repository settings.

## Responsible Disclosure

Please give maintainers a reasonable opportunity to investigate and address vulnerabilities before sharing details publicly.

Do not include private resume content, personal contact information, job application details, or sensitive data in public reports, screenshots, tests, or proof-of-concept files.
