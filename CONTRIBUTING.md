# Contributing to Resume Studio

Thanks for your interest in Resume Studio. This is an open-source Bractos Labs app for building private, local-first resumes in the browser.

Resume Studio is in public beta. Contributions are welcome, but maintainers may be selective while the product direction settles. A small, focused change with clear reasoning is much easier to review than a broad rewrite.

## Reporting Bugs

Use GitHub Issues for non-sensitive bugs. Please include:

- What happened
- What you expected
- Steps to reproduce
- Browser and operating system
- Screenshots only if they do not contain private resume details

Do not include private resume content, personal contact information, job application details, or sensitive data in public issues.

## Requesting Features

Use GitHub Issues for feature requests. Describe the problem first, then the solution you would like to see. Resume Studio is early, so maintainers may defer or decline ideas that do not fit the current public beta direction.

## Working on Issues

Before opening a larger pull request, check whether there is an issue or start a short discussion in the issue tracker. This helps avoid duplicated work and keeps changes aligned with the product.

GitHub Discussions may be enabled later for broader community feedback. Until then, use Issues for actionable work and labs@bractos.com for private context.

Good first contributions include:

- Clear bug fixes
- Accessibility improvements
- Documentation fixes
- Small UI copy improvements
- Focused tests for existing behavior

Maintainers can copy starter issue drafts from [docs/starter-issues.md](docs/starter-issues.md).

## Local Setup

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

Useful commands:

```bash
npm run lint
npm run format:check
npm test
npm run build
```

Run tests and the production build before opening a pull request.

## Branches and Pull Requests

- Create a branch with a short descriptive name.
- Keep pull requests focused on one concern.
- Explain what changed and why.
- Include screenshots for UI changes.
- Mention any privacy, storage, export, or accessibility impact.
- Link related issues when possible.

## Coding Expectations

- Follow the existing React, TypeScript, and CSS patterns in the repo.
- Keep changes small and readable.
- Avoid adding dependencies unless they are clearly necessary.
- Do not add analytics, tracking, cloud sync, account systems, or backend services without prior maintainer agreement.
- Preserve existing comments and commented-out code unless the change directly needs to update them.

## Accessibility

Resume Studio handles important job-search workflows. UI contributions should be keyboard-accessible, readable at small widths, and clear without relying only on color or icons.

Current accessibility expectations include visible focus states, meaningful button labels, dialog semantics, Escape-key handling where dialogs support it, and warnings that do not rely only on color.

## Privacy

Never include private resume content, personal contact information, job application details, or sensitive data in issues, pull requests, tests, screenshots, fixtures, or sample files.

Use fictional or sanitized examples only.

## Documentation

Documentation contributions are welcome. Keep the tone plainspoken and direct. If you change behavior, update relevant README, changelog, help text, privacy, security, or support docs.

## License

By contributing, you agree that your contributions will be licensed under the MIT License used by this repository.

## Maintainer Discretion

Bractos Labs maintains the product direction for Resume Studio. Maintainers may edit, defer, close, or decline contributions to keep the public beta coherent and maintainable.
