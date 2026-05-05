import type { AppState, ResumeDocument, ResumeVersion } from "./types";
import { nowIso, uid } from "./utils";

const storageKey = "resume-studio-state-v1";
const storageMetaKey = "resume-studio-storage-meta-v1";
const dbName = "resume-studio-workspace";
const legacyStorageKey = "resume-forge-state-v1";
const legacyStorageMetaKey = "resume-forge-storage-meta-v1";
const legacyDbName = "resume-forge-workspace";
const dbVersion = 1;
const stateStore = "workspace";
const stateId = "active";
export const appSchemaVersion = 2;
type BackupAppName = "Resume Studio" | "Resume Forge";

export interface BackupFile {
  appName: BackupAppName;
  schemaVersion: number;
  exportedAt: string;
  data: AppState;
}

interface CompactFallback {
  appName: BackupAppName;
  schemaVersion: number;
  storageMode: "indexeddb";
  lastSavedAt?: string;
  resumeCount: number;
  activeResumeId?: string;
}

export interface RestorePreview {
  valid: boolean;
  backup?: BackupFile;
  resumeCount: number;
  jobCount: number;
  versionCount: number;
  exportedAt?: string;
  schemaVersion?: number;
  error?: string;
}

const isBundledExample = (resume: ResumeDocument) =>
  (resume.ownerType as string | undefined) === "sample" || (resume.tags ?? []).includes("sample");

const normalizeState = (state: AppState): AppState => {
  if (!Array.isArray(state.resumes) || !state.resumes.length) {
    const initial = createInitialState();
    return { ...initial, storageMeta: { ...initial.storageMeta, ...state.storageMeta } };
  }
  const repaired = state.resumes
    .filter((resume) => !isBundledExample(resume))
    .map((resume) => ({ ...resume, ownerType: "user" as const, tags: resume.tags ?? [], privateNotes: resume.privateNotes ?? "", versions: resume.versions ?? [], jobTargets: resume.jobTargets ?? [], applications: resume.applications ?? [] }));
  if (!repaired.length) return createInitialState();
  return {
    ...state,
    resumes: repaired,
    activeResumeId: repaired.some((resume) => resume.id === state.activeResumeId) ? state.activeResumeId : repaired[0].id,
    themeMode: state.themeMode ?? "system",
    onboardingDone: state.onboardingDone ?? [],
    storageMeta: {
      schemaVersion: appSchemaVersion,
      storageMode: state.storageMeta?.storageMode,
      ...state.storageMeta,
    },
  };
};

export const createInitialState = (): AppState => {
  return {
    resumes: [],
    activeResumeId: "",
    themeMode: "system",
    onboardingDone: [],
    storageMeta: { schemaVersion: appSchemaVersion, storageMode: "localstorage" },
  };
};

const openDb = (name = dbName) =>
  new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available in this browser."));
      return;
    }
    const request = indexedDB.open(name, dbVersion);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(stateStore)) db.createObjectStore(stateStore);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open browser storage."));
  });

const idbGet = async (name = dbName): Promise<AppState | null> => {
  const db = await openDb(name);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(stateStore, "readonly");
    const request = tx.objectStore(stateStore).get(stateId);
    request.onsuccess = () => resolve(request.result ? normalizeState(request.result as AppState) : null);
    request.onerror = () => reject(request.error ?? new Error("Could not read saved browser data."));
    tx.oncomplete = () => db.close();
  });
};

const idbSet = async (state: AppState) => {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(stateStore, "readwrite");
    tx.objectStore(stateStore).put(state, stateId);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error("Could not save to browser storage."));
    };
  });
};

export const loadState = (): AppState => {
  try {
    const raw = localStorage.getItem(storageKey) ?? localStorage.getItem(legacyStorageKey);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as AppState;
    return normalizeState(parsed);
  } catch {
    return createInitialState();
  }
};

export const loadStateAsync = async (): Promise<AppState> => {
  try {
    const indexed = await idbGet();
    if (indexed) return { ...indexed, storageMeta: { ...indexed.storageMeta, storageMode: "indexeddb" } };
  } catch {
    // Synchronous local startup remains the safe fallback.
  }
  try {
    const legacyIndexed = await idbGet(legacyDbName);
    if (legacyIndexed) {
      await saveState({ ...legacyIndexed, storageMeta: { ...legacyIndexed.storageMeta, storageMode: "indexeddb" } });
      return { ...legacyIndexed, storageMeta: { ...legacyIndexed.storageMeta, storageMode: "indexeddb" } };
    }
  } catch {
    // Older Resume Forge data is best-effort migration only.
  }
  const local = loadState();
  try {
    await saveState({ ...local, storageMeta: { ...local.storageMeta, storageMode: "indexeddb" } });
  } catch {
    // Keep local fallback if IndexedDB migration fails.
  }
  return local;
};

export const saveState = async (state: AppState) => {
  const savedAt = nowIso();
  const next = normalizeState({
    ...state,
    storageMeta: { ...state.storageMeta, schemaVersion: appSchemaVersion, lastSavedAt: savedAt },
  });
  const compact: CompactFallback = {
    appName: "Resume Studio",
    schemaVersion: appSchemaVersion,
    storageMode: "indexeddb",
    lastSavedAt: savedAt,
    resumeCount: next.resumes.length,
    activeResumeId: next.activeResumeId,
  };
  try {
    await idbSet({ ...next, storageMeta: { ...next.storageMeta, storageMode: "indexeddb", lastSaveError: undefined } });
    try {
      localStorage.setItem(storageMetaKey, JSON.stringify(compact));
      localStorage.removeItem(storageKey);
      localStorage.removeItem(legacyStorageKey);
      localStorage.removeItem(legacyStorageMetaKey);
    } catch {
      // IndexedDB is authoritative; compact metadata is best effort.
    }
    return { ok: true as const, state: { ...next, storageMeta: { ...next.storageMeta, storageMode: "indexeddb" as const } } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save to browser storage.";
    const fallback = { ...next, storageMeta: { ...next.storageMeta, storageMode: "localstorage" as const, lastSaveError: message } };
    try {
      localStorage.setItem(storageKey, JSON.stringify(fallback));
      return { ok: false as const, state: fallback, error: `${message} Saved a local fallback copy in this browser.` };
    } catch {
      try {
        localStorage.setItem(storageMetaKey, JSON.stringify({ ...compact, storageMode: "indexeddb", lastSaveError: message }));
      } catch {
        // Nothing else to do; caller will show the error.
      }
      return { ok: false as const, state: fallback, error: `${message} Browser storage may be full. Download a backup file before closing.` };
    }
  }
};

export const clearState = async () => {
  localStorage.removeItem(storageKey);
  localStorage.removeItem(storageMetaKey);
  localStorage.removeItem(legacyStorageKey);
  localStorage.removeItem(legacyStorageMetaKey);
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(stateStore, "readwrite");
      tx.objectStore(stateStore).delete(stateId);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error ?? new Error("Could not clear browser storage."));
      };
    });
  } catch {
    // localStorage removal still clears the fallback.
  }
  try {
    const db = await openDb(legacyDbName);
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(stateStore, "readwrite");
      tx.objectStore(stateStore).delete(stateId);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error ?? new Error("Could not clear legacy browser storage."));
      };
    });
  } catch {
    // Legacy storage cleanup is best effort.
  }
};

export const createBackupFile = (state: AppState): BackupFile => ({
  appName: "Resume Studio",
  schemaVersion: appSchemaVersion,
  exportedAt: nowIso(),
  data: normalizeState(state),
});

export const serializeBackup = (state: AppState) => JSON.stringify(createBackupFile(state), null, 2);

export const backupFilename = (date = new Date()) => `resume-studio-backup-${date.toISOString().slice(0, 10)}.json`;

export const validateBackup = (json: string): RestorePreview => {
  try {
    const parsed = JSON.parse(json);
    const backup: BackupFile =
      (parsed?.appName === "Resume Studio" || parsed?.appName === "Resume Forge") && parsed?.data
        ? parsed
        : parsed?.schema === "resume-studio-state-v1" || parsed?.schema === "resume-forge-state-v1"
          ? { appName: "Resume Studio", schemaVersion: 1, exportedAt: parsed.exportedAt ?? nowIso(), data: parsed.state }
          : Array.isArray(parsed?.resumes)
            ? { appName: "Resume Studio", schemaVersion: 1, exportedAt: nowIso(), data: parsed as AppState }
            : Array.isArray(parsed)
              ? { appName: "Resume Studio", schemaVersion: 1, exportedAt: nowIso(), data: { ...createInitialState(), resumes: parsed as ResumeDocument[], activeResumeId: parsed[0]?.id ?? "" } }
              : parsed;
    if ((backup.appName !== "Resume Studio" && backup.appName !== "Resume Forge") || !backup.data || !Array.isArray(backup.data.resumes)) {
      return { valid: false, resumeCount: 0, jobCount: 0, versionCount: 0, error: "We couldn't recognize this as a Resume Studio backup file." };
    }
    const data = normalizeState(backup.data);
    const versionCount = data.resumes.reduce((count, resume) => count + (resume.versions?.length ?? 0), 0);
    const jobCount = data.resumes.reduce((count, resume) => count + (resume.jobTargets?.length ?? 0) + (resume.applications?.length ?? 0), 0);
    return { valid: true, backup: { ...backup, data }, resumeCount: data.resumes.length, jobCount, versionCount, exportedAt: backup.exportedAt, schemaVersion: backup.schemaVersion };
  } catch {
    return { valid: false, resumeCount: 0, jobCount: 0, versionCount: 0, error: "We couldn't restore this backup file. Make sure it came from Resume Studio and has not been edited." };
  }
};

const cloneResumeForMerge = (resume: ResumeDocument, existingTitles: Set<string>): ResumeDocument => {
  const title = existingTitles.has(resume.title) ? `${resume.title} (restored)` : resume.title;
  existingTitles.add(title);
  return {
    ...resume,
    id: uid("resume"),
    title,
    versions: (resume.versions ?? []).map((version) => ({ ...version, id: uid("version") })),
    jobTargets: (resume.jobTargets ?? []).map((job) => ({ ...job, id: uid("job") })),
    applications: (resume.applications ?? []).map((app) => ({ ...app, id: uid("app") })),
  };
};

export const mergeBackupState = (current: AppState, incoming: AppState): AppState => {
  const existingIds = new Set(current.resumes.map((resume) => resume.id));
  const existingTitles = new Set(current.resumes.map((resume) => resume.title));
  const restored = incoming.resumes.map((resume) => existingIds.has(resume.id) ? cloneResumeForMerge(resume, existingTitles) : cloneResumeForMerge({ ...resume, id: uid("resume") }, existingTitles));
  return normalizeState({
    ...current,
    resumes: [...current.resumes, ...restored],
    activeResumeId: restored[0]?.id ?? current.activeResumeId,
    storageMeta: { ...current.storageMeta, significantChangesSinceBackup: true },
  });
};

export const restoreBackup = (json: string, current?: AppState, mode: "merge" | "replace" = "replace"): AppState => {
  const preview = validateBackup(json);
  if (!preview.valid || !preview.backup) throw new Error(preview.error ?? "We couldn't restore this backup file.");
  return mode === "merge" && current ? mergeBackupState(current, preview.backup.data) : normalizeState(preview.backup.data);
};

export const createSnapshotVersion = (markdown: string, name: string, notes = "", kind: ResumeVersion["kind"] = "autosave"): ResumeVersion => ({
  id: uid("version"),
  name,
  markdown,
  notes,
  createdAt: nowIso(),
  kind,
});

export const pruneSnapshots = (versions: ResumeVersion[], limit = 50) => {
  const autosaves = versions.filter((version) => version.kind === "autosave");
  const keepAutosaveIds = new Set(autosaves.slice(0, limit).map((version) => version.id));
  return versions.filter((version) => version.kind !== "autosave" || keepAutosaveIds.has(version.id));
};
