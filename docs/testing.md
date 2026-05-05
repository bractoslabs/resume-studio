# Testing

Use these commands before opening pull requests or preparing a public release:

```bash
npm run lint
npm run format:check
npm test
npm run test:e2e
npm run build
```

## Unit Tests

```bash
npm test
```

Unit tests cover Markdown rendering, storage, imports, exporters, keyword matching, ATS checks, career tools, and Resume Review behavior.

## E2E Smoke Tests

```bash
npm run test:e2e
```

The E2E smoke suite uses fictional data only and covers:

- Landing page load
- Creating a fictional resume through the UI
- Editor, Review, Keyword & Fit Check, and Export areas
- Privacy, Terms, and Security routes
- Feedback and Import dialogs
- Local browser-storage warning

If Playwright cannot find a local browser, run:

```bash
npx playwright install chromium
```

CI installs Chromium before running the E2E smoke suite.

## Formatting and Linting

```bash
npm run lint
npm run format:check
```

Use `npm run format` to apply Prettier formatting.
