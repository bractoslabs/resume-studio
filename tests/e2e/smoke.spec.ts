import { expect, test, type Page } from "@playwright/test";

const now = "2026-05-01T12:00:00.000Z";

const demoMarkdown = `---
name: Jordan Rivera
title: Operations Manager
email: jordan.rivera@example.com
phone: 555-0100
location: Houston, TX
targetRole: Operations Manager
pageSize: letter
template: ats-classic
accentColor: "#436a6b"
---

Operations manager focused on service delivery, process improvement, and clear team communication.

## Experience

### Operations Manager - Harbor Demo Logistics
_Houston, TX | 2021 - Present_
- Improved weekly dispatch planning for 48 team members by standardizing shift handoffs and issue tracking.
- Reduced recurring fulfillment delays by 18% through root-cause reviews and vendor escalation routines.

## Skills

- Operations planning
- Process improvement
- Customer communication

## Education

- BBA Operations Management, Example State University
`;

const seededState = {
  resumes: [
    {
      id: "resume-e2e-jordan-rivera",
      title: "Jordan Rivera Operations Resume",
      targetRole: "Operations Manager",
      tags: ["e2e"],
      markdown: demoMarkdown,
      templateId: "ats-classic",
      pageSize: "letter",
      createdAt: now,
      updatedAt: now,
      versions: [{ id: "version-e2e", name: "Initial version", markdown: demoMarkdown, createdAt: now, isDefault: true }],
      jobTargets: [],
      applications: [],
      privateNotes: "",
      ownerType: "user",
    },
  ],
  activeResumeId: "resume-e2e-jordan-rivera",
  themeMode: "light",
  onboardingDone: [],
  storageMeta: {
    schemaVersion: 2,
    storageMode: "localstorage",
    lastSavedAt: now,
    significantChangesSinceBackup: false,
  },
};

const seedState = async (page: Page, dismissLocalWarning = true) => {
  await page.addInitScript(
    ({ state, dismiss }: { state: typeof seededState; dismiss: boolean }) => {
      localStorage.setItem(
        "resume-studio-state-v1",
        JSON.stringify({
          ...state,
          storageMeta: {
            ...state.storageMeta,
            ...(dismiss ? { localStorageWarningDismissedAt: state.storageMeta.lastSavedAt } : {}),
          },
        }),
      );
    },
    { state: seededState, dismiss: dismissLocalWarning },
  );
};

test("landing page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Free, private, Markdown-first/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Resume Studio Public beta" })).toBeVisible();
});

test("creates a fictional resume and preserves it after refresh", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start building" }).first().click();
  await page
    .getByRole("button", { name: /New resume/i })
    .first()
    .click();
  await page.getByRole("button", { name: /Guided setup/i }).click();
  await page.getByLabel("Resume name").fill("Jordan Rivera Operations Resume");
  await page.getByLabel("Your name").fill("Jordan Rivera");
  await page.getByLabel("Target role").fill("Operations Manager");
  await page.getByRole("button", { name: /Create resume/i }).click();

  await expect(page.getByRole("heading", { name: "Edit resume" })).toBeVisible();
  await expect(page.locator(".document-status strong", { hasText: "Jordan Rivera Operations Resume" })).toBeVisible();
  await expect(page.locator(".save-status")).toContainText("Saved locally at");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Edit resume" })).toBeVisible();
  await expect(page.locator(".document-status strong", { hasText: "Jordan Rivera Operations Resume" })).toBeVisible();
});

test("editor review tailor and export smoke flow renders", async ({ page }) => {
  await seedState(page);
  await page.goto("/editor");
  await expect(page.getByRole("heading", { name: "Edit resume" })).toBeVisible();

  await page.getByLabel("Resume workflow").getByRole("button", { name: "Review", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Resume Review" })).toBeVisible();

  await page.getByLabel("Resume workflow").getByRole("button", { name: "Tailor", exact: true }).click();
  await page
    .locator("textarea.job-input")
    .fill("Operations manager role requiring process improvement, onboarding, reporting, and customer communication.");
  await page.getByRole("button", { name: "Analyze job description" }).click();
  await expect(page.getByText("Keyword overlap:", { exact: false })).toBeVisible();

  await page.getByLabel("Resume workflow").getByRole("button", { name: "Export", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Print / Save as PDF" })).toBeVisible();
  await expect(page.getByText("Browser output may vary", { exact: false })).toBeVisible();
});

test("public routes render", async ({ page }) => {
  for (const route of ["/privacy", "/terms", "/security"] as const) {
    await page.goto(route);
    await expect(page.getByRole("heading").first()).toBeVisible();
  }
});

test("feedback and import dialogs expose public beta paths and limitations", async ({ page }) => {
  await seedState(page);
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Feedback" }).click();
  await expect(page.getByRole("dialog", { name: "Send feedback" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Report a bug" })).toHaveAttribute("href", /bug_report\.yml/);
  await expect(page.getByRole("link", { name: "Email Bractos Labs" })).toHaveAttribute("href", /labs@bractos\.com/);
  await page.keyboard.press("Escape");

  await page
    .getByRole("button", { name: /New resume/i })
    .first()
    .click();
  await page.getByRole("button", { name: /Import existing resume/i }).click();
  await expect(page.getByRole("dialog", { name: "Import resume" })).toBeVisible();
  await expect(page.getByText("Best import results: Markdown, TXT, and DOCX")).toBeVisible();
  await expect(page.getByText("Scanned or image-only PDFs are not supported yet.")).toBeVisible();
});

test("local data warning appears when saved work has not dismissed it", async ({ page }) => {
  await seedState(page, false);
  await page.goto("/editor");
  await expect(page.getByText("Saved locally in this browser")).toBeVisible();
});
