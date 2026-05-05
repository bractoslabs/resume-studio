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

  it("removes dangerous inline HTML and event handlers", () => {
    const result = renderMarkdown([
      "<script>alert(1)</script>",
      "<img src=x onerror=alert(1)>",
      "<button onclick=\"alert(1)\">bad</button>",
      "<svg onload=\"alert(1)\"><circle /></svg>",
    ].join("\n"));

    expect(result.html).not.toContain("<script");
    expect(result.html).not.toContain("onerror");
    expect(result.html).not.toContain("onclick");
    expect(result.html).not.toContain("onload");
    expect(result.html).not.toContain("<svg");
  });

  it("strips unsafe href values from raw html links", () => {
    const result = renderMarkdown('<a href="javascript:alert(1)">bad</a>\n<a href="data:text/html,boom">data</a>');

    expect(result.html).not.toContain("javascript:");
    expect(result.html).not.toContain("data:text/html");
    expect(result.html).toContain(">bad</a>");
    expect(result.html).toContain(">data</a>");
  });

  it("handles malformed html without preserving scriptable attributes", () => {
    const result = renderMarkdown('<div><img src="x" onerror="alert(1)"><span>Still visible');

    expect(result.html).toContain("Still visible");
    expect(result.html).not.toContain("onerror");
  });

  it("keeps safe markdown links and formatting", () => {
    const result = renderMarkdown("## Experience\n\n- Built **safe** _tools_ with [GitHub](https://github.com/bractoslabs/resume-studio).");

    expect(result.html).toContain("<h2>Experience</h2>");
    expect(result.html).toContain("<strong>safe</strong>");
    expect(result.html).toContain("<em>tools</em>");
    expect(result.html).toMatch(/href="https:\/\/github\.com\/bractoslabs\/resume-studio"/i);
  });

  it("keeps safe html tags while stripping unsafe attributes", () => {
    const result = renderMarkdown('<span class="resume-highlight" onclick="alert(1)">Safe label</span>');

    expect(result.html).toContain('class="resume-highlight"');
    expect(result.html).toContain("Safe label");
    expect(result.html).not.toContain("onclick");
  });
});
