export const atsRiskPatterns = {
  emoji: /[\u{1f300}-\u{1faff}]/u,
  decorativeSymbols: /[★✓✔◆◇●◦→⇒]/,
  table: /^\s*\|.+\|\s*$/m,
  image: /!\[[^\]]*]\([^)]+\)/,
  htmlBlock: /<([a-z][\w-]*)(\s|>|\/)/i,
  styleBlock: /<style[\s\S]*?>|style\s*=/i,
  script: /<script|javascript:/i,
  hiddenAts: /\{\{hideForAts\}\}|\{\{atsOnly\}\}/i,
  iconDirective: /\{\{icon:/i,
  columnHint: /\b(two-column|columns?|sidebar|left column|right column)\b/i,
};
