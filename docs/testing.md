# Testing

Use these commands before opening pull requests or preparing a public release:

```bash
npm run lint
npm run format:check
npm test
npm run build
```

## Unit Tests

```bash
npm test
```

Unit tests cover Markdown rendering, storage, imports, exporters, keyword matching, ATS checks, career tools, and Resume Review behavior.

## Formatting and Linting

```bash
npm run lint
npm run format:check
```

Use `npm run format` to apply Prettier formatting.
