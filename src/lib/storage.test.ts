import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createBackupFile,
  createInitialState,
  createSnapshotVersion,
  loadStateAsync,
  mergeBackupState,
  pruneSnapshots,
  restoreBackup,
  saveState,
  serializeBackup,
  validateBackup,
} from "./storage";
import { createResume } from "../app/resumeTransforms";

const originalLocalStorage = globalThis.localStorage;
const originalIndexedDb = globalThis.indexedDB;

afterEach(() => {
  vi.restoreAllMocks();
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: originalLocalStorage });
  Object.defineProperty(globalThis, "indexedDB", { configurable: true, value: originalIndexedDb });
});

describe("storage backup and restore utilities", () => {
  it("creates a friendly full backup with metadata", () => {
    const state = createInitialState();
    const backup = createBackupFile(state);
    expect(backup.appName).toBe("Resume Studio");
    expect(backup.schemaVersion).toBeGreaterThan(0);
    expect(backup.data.resumes).toEqual([]);
  });

  it("validates generated backup files", () => {
    const preview = validateBackup(serializeBackup(createInitialState()));
    expect(preview.valid).toBe(true);
    expect(preview.resumeCount).toBe(0);
    expect(preview.versionCount).toBe(0);
  });

  it("rejects invalid backup files without partial restore", () => {
    const preview = validateBackup("{ nope");
    expect(preview.valid).toBe(false);
    expect(() => restoreBackup("{ nope")).toThrow();
  });

  it("merge restore duplicates incoming resumes instead of overwriting current IDs", () => {
    const currentResume = createResume("blank");
    const incomingResume = { ...currentResume, versions: [...currentResume.versions] };
    const current = { ...createInitialState(), resumes: [currentResume], activeResumeId: currentResume.id };
    const incoming = { ...createInitialState(), resumes: [incomingResume], activeResumeId: incomingResume.id };
    const merged = mergeBackupState(current, incoming);
    expect(merged.resumes.length).toBe(current.resumes.length + incoming.resumes.length);
    expect(new Set(merged.resumes.map((resume) => resume.id)).size).toBe(merged.resumes.length);
    expect(merged.resumes.some((resume) => resume.title.includes("(restored)"))).toBe(true);
  });

  it("prunes autosaved snapshots but keeps named versions", () => {
    const named = createSnapshotVersion("named", "Named version", "", "named");
    const autosaves = Array.from({ length: 55 }, (_, index) =>
      createSnapshotVersion(`auto-${index}`, "Autosaved snapshot", "", "autosave"),
    );
    const pruned = pruneSnapshots([named, ...autosaves], 50);
    expect(pruned.filter((version) => version.kind === "autosave")).toHaveLength(50);
    expect(pruned).toContain(named);
  });

  it("falls back to localStorage when IndexedDB is unavailable", async () => {
    const values = new Map<string, string>();
    Object.defineProperty(globalThis, "indexedDB", { configurable: true, value: undefined });
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
      },
    });
    const result = await saveState(createInitialState());
    expect(result.ok).toBe(false);
    expect(result.state.storageMeta?.storageMode).toBe("localstorage");
    expect([...values.keys()]).toContain("resume-studio-state-v1");
  });

  it("loads the localStorage fallback when IndexedDB is unavailable", async () => {
    const values = new Map<string, string>();
    const localState = { ...createInitialState(), storageMeta: { schemaVersion: 2, storageMode: "localstorage" as const } };
    values.set("resume-studio-state-v1", JSON.stringify(localState));
    Object.defineProperty(globalThis, "indexedDB", { configurable: true, value: undefined });
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
      },
    });

    const loaded = await loadStateAsync();
    expect(loaded.resumes).toHaveLength(localState.resumes.length);
    expect(loaded.storageMeta?.storageMode).toBe("localstorage");
  });

  it("returns a user-facing error when browser storage is unavailable", async () => {
    Object.defineProperty(globalThis, "indexedDB", { configurable: true, value: undefined });
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: () => null,
        setItem: () => {
          throw new Error("QuotaExceededError");
        },
        removeItem: () => undefined,
      },
    });

    const result = await saveState(createInitialState());
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Download a backup file before closing");
  });
});
