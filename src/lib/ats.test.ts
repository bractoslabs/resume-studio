import { describe, expect, it } from "vitest";
import { analyzeAts, improveBulletLocal } from "./ats";

describe("ats scanner", () => {
  it("flags missing contact information", () => {
    const report = analyzeAts("---\nname: A\n---\n## Experience\n- Built systems\n");
    expect(report.issues.some((issue) => issue.category === "Contact")).toBe(true);
  });

  it("does not fabricate metrics in bullet suggestions", () => {
    const result = improveBulletLocal("Helped improve onboarding", "concise");
    expect(result.after).toContain("[add metric");
  });
});
