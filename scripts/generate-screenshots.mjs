import { spawn } from "node:child_process";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const screenshotDir = path.join(repoRoot, "public", "screenshots");
const port = Number(process.env.SCREENSHOT_PORT ?? 4173);
const baseUrl = `http://127.0.0.1:${port}`;
const viewport = { width: 1440, height: 1000 };

const now = "2026-05-01T12:00:00.000Z";
const demoMarkdown = `---
name: Jordan Rivera
title: Operations Manager
email: jordan.rivera@example.com
phone: 555-0100
location: Houston, TX
links:
  - linkedin.com/in/jordan-rivera-demo
targetRole: Operations Manager
pageSize: letter
template: ats-classic
accentColor: "#436a6b"
---

Operations manager focused on service delivery, process improvement, and clear team communication across distributed field operations.

## Experience

### Operations Manager - Harbor Demo Logistics
_Houston, TX | 2021 - Present_
- Improved weekly dispatch planning for 48 team members by standardizing shift handoffs and issue tracking.
- Reduced recurring fulfillment delays by 18% through root-cause reviews, dashboard follow-up, and vendor escalation routines.
- Built onboarding checklists that helped new coordinators reach independent coverage within 30 days.

### Operations Coordinator - Northstar Sample Services
_Austin, TX | 2018 - 2021_
- Coordinated daily service schedules across three regional teams while keeping customer updates timely and accurate.
- Created a simple inventory audit process that reduced missing equipment reports by 22%.
- Partnered with finance and support teams to reconcile billing questions before month-end close.

## Skills

- Operations planning
- Process improvement
- Vendor coordination
- Team onboarding
- KPI reporting
- Customer communication

## Education

- BBA Operations Management, Example State University
`;

const demoJobDescription = `Operations Manager

DemoCo is looking for an operations manager to improve dispatch planning, vendor coordination, KPI reporting, onboarding, and customer communication. The role partners with finance, support, and field teams to reduce delays and improve service quality.

Required skills: operations planning, process improvement, stakeholder communication, reporting dashboards, vendor management.
Preferred skills: onboarding programs, root-cause analysis, logistics, service delivery.`;

const demoState = {
  resumes: [{
    id: "resume-demo-jordan-rivera",
    title: "Jordan Rivera Operations Resume",
    targetRole: "Operations Manager",
    tags: ["demo", "public-screenshot"],
    markdown: demoMarkdown,
    templateId: "ats-classic",
    pageSize: "letter",
    createdAt: now,
    updatedAt: now,
    versions: [{
      id: "version-demo-initial",
      name: "Initial demo version",
      markdown: demoMarkdown,
      createdAt: now,
      isDefault: true,
    }],
    jobTargets: [],
    applications: [],
    privateNotes: "",
    ownerType: "user",
    reviewMeta: {
      openedAt: now,
      lastReviewedAt: now,
      currentMustFixCount: 0,
      noMustFixIssues: true,
    },
  }],
  activeResumeId: "resume-demo-jordan-rivera",
  themeMode: "light",
  onboardingDone: [],
  storageMeta: {
    schemaVersion: 2,
    storageMode: "localstorage",
    lastSavedAt: now,
    lastBackupAt: now,
    localStorageWarningDismissedAt: now,
    significantChangesSinceBackup: false,
  },
};

const waitForServer = async () => {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // Wait for Vite preview to finish starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${baseUrl}`);
};

const startServer = () => {
  const child = spawn("npm", ["run", "preview", "--", "--host", "127.0.0.1", "--port", String(port)], {
    cwd: repoRoot,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, BROWSER: "none" },
  });
  child.stdout.on("data", (chunk) => process.stdout.write(chunk));
  child.stderr.on("data", (chunk) => process.stderr.write(chunk));
  return child;
};

const launchBrowser = async () => {
  try {
    return await chromium.launch();
  } catch (error) {
    const chromePath = process.platform === "darwin" ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" : undefined;
    if (chromePath) {
      try {
        await stat(chromePath);
        return await chromium.launch({ executablePath: chromePath });
      } catch {
        // Fall through to the helpful error below.
      }
    }
    throw new Error(`${error instanceof Error ? error.message : String(error)}

Playwright could not launch a browser. Run "npx playwright install chromium" and retry npm run screenshots.`);
  }
};

const seedDemoState = async (page) => {
  await page.addInitScript((state) => {
    localStorage.setItem("resume-studio-state-v1", JSON.stringify(state));
    localStorage.setItem("resume-studio-storage-meta-v1", JSON.stringify({
      appName: "Resume Studio",
      schemaVersion: 2,
      storageMode: "localstorage",
      lastSavedAt: state.storageMeta.lastSavedAt,
      resumeCount: state.resumes.length,
      activeResumeId: state.activeResumeId,
    }));
  }, demoState);
};

const capture = async (page, fileName, fullPage = false) => {
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: path.join(screenshotDir, fileName), fullPage });
};

const clickWorkflowTab = async (page, name) => {
  await page.getByLabel("Resume workflow").getByRole("button", { name, exact: true }).click();
  await page.waitForTimeout(250);
};

const main = async () => {
  await mkdir(screenshotDir, { recursive: true });
  const server = startServer();
  try {
    await waitForServer();
    const browser = await launchBrowser();
    try {
      const landingContext = await browser.newContext({ viewport, deviceScaleFactor: 1, colorScheme: "light" });
      const landing = await landingContext.newPage();
      await landing.goto(baseUrl);
      await capture(landing, "landing.png", true);
      await landingContext.close();

      const context = await browser.newContext({ viewport, deviceScaleFactor: 1, colorScheme: "light" });
      const page = await context.newPage();
      await seedDemoState(page);
      await page.goto(`${baseUrl}/editor`);
      await page.getByRole("heading", { name: "Jordan Rivera Operations Resume" }).waitFor({ timeout: 10_000 }).catch(() => page.locator(".editor-layout").waitFor({ timeout: 10_000 }));
      await capture(page, "editor.png");
      await capture(page, "resume-studio-editor.png");

      await clickWorkflowTab(page, "Review");
      await page.getByRole("heading", { name: "Resume Review" }).waitFor({ timeout: 10_000 });
      await capture(page, "resume-review.png");

      await clickWorkflowTab(page, "Tailor");
      await page.getByLabel("Resume workflow").getByRole("button", { name: "Tailor" }).waitFor({ timeout: 10_000 });
      await page.locator("textarea.job-input").fill(demoJobDescription);
      await page.getByRole("button", { name: "Analyze job description" }).click();
      await page.getByText("Keyword overlap:", { exact: false }).waitFor({ timeout: 10_000 });
      await capture(page, "keyword-fit-check.png");

      await clickWorkflowTab(page, "Export");
      await page.getByRole("heading", { name: "Print / Save as PDF" }).waitFor({ timeout: 10_000 });
      await capture(page, "export-center.png");
      await context.close();
    } finally {
      await browser.close();
    }
  } finally {
    server.kill("SIGTERM");
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
