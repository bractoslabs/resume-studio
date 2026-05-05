import { describe, expect, it } from "vitest";
import { parseFrontmatter, renderMarkdown } from "./markdown";

describe("markdown engine", () => {
  it("parses frontmatter and sanitizes scripts", () => {
    const result = renderMarkdown("---\nname: Test User\nemail: test@example.com\n---\n# Hello\n<script>alert(1)</script>");
    expect(result.frontmatter.name).toBe("Test User");
    expect(result.html).not.toContain("script");
  });

  it("supports page break directives", () => {
    expect(renderMarkdown("A\n\\newpage\nB").html).toContain("page-break");
  });

  it("renders contact header from frontmatter without leaking yaml", () => {
    const result = renderMarkdown("---\nname: Test User\nemail: test@example.com\n---\n## Experience\n- Built tools");
    expect(result.html).toContain("Test User");
    expect(result.html).toContain("mailto:test@example.com");
    expect(result.html).not.toContain("name:");
  });

  it("warns about invalid frontmatter", () => {
    const parsed = parseFrontmatter("---\nemail: nope\n---\nBody");
    expect(parsed.warnings.length).toBeGreaterThan(0);
  });

  it("does not treat body horizontal rules as frontmatter", () => {
    const parsed = parseFrontmatter("Summary\n\n---\n\n## Experience");
    expect(parsed.hasFrontmatter).toBe(false);
    expect(parsed.content).toContain("Summary");
  });

  it("sanitizes unsafe links", () => {
    const result = renderMarkdown("[bad](javascript:alert(1))\n\n<a href=\"data:text/html,boom\">bad</a>");
    expect(result.html).not.toContain("javascript:");
    expect(result.html).not.toContain("data:text");
  });
});
