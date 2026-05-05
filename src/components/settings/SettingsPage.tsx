import { Download, Monitor, RotateCcw, Trash2, Upload } from "lucide-react";
import type { AppState, ThemeMode } from "../../lib/types";
import { formatDate } from "../../lib/utils";
import { timeOnly } from "../../app/resumeTransforms";
import { Button } from "../common/Button";

export const SettingsPage = ({
  state,
  setState,
  openClear,
  downloadBackup,
  openRestorePreview,
  lastSavedAt,
  saveFailed,
}: {
  state: AppState;
  setState: (state: AppState) => void;
  openClear: () => void;
  downloadBackup: () => void;
  openRestorePreview: (file: File) => Promise<void>;
  lastSavedAt: string;
  saveFailed: string;
}) => (
  <div className="content-page settings-page">
    <header className="page-header">
      <div>
        <h1>Settings</h1>
        <p>Preferences, backups, and browser storage for this workspace.</p>
      </div>
    </header>
    <section className="settings-grid">
      <article className="settings-card">
        <div className="settings-card-header">
          <span>
            <Monitor size={18} />
          </span>
          <div>
            <h2>Appearance</h2>
            <p>Choose how Resume Studio should look on this device.</p>
          </div>
        </div>
        <label>
          Theme
          <select value={state.themeMode} onChange={(event) => setState({ ...state, themeMode: event.target.value as ThemeMode })}>
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
      </article>
      <article className="settings-card">
        <div className="settings-card-header">
          <span>
            <Download size={18} />
          </span>
          <div>
            <h2>Data and backup</h2>
            <p>Your resumes are saved in this browser. Download a backup before clearing site data or switching devices.</p>
          </div>
        </div>
        <p className="settings-local-note">Resume Studio does not sync your data to an account. Keep a backup if this resume matters.</p>
        <dl className="restore-preview">
          <div>
            <dt>Save status</dt>
            <dd>{saveFailed ? "Save failed" : "Saved locally"}</dd>
          </div>
          <div>
            <dt>Last local save</dt>
            <dd>{lastSavedAt ? `${formatDate(lastSavedAt)} at ${timeOnly(lastSavedAt)}` : "Not saved yet"}</dd>
          </div>
          <div>
            <dt>Last backup</dt>
            <dd>{state.storageMeta?.lastBackupAt ? formatDate(state.storageMeta.lastBackupAt) : "No backup downloaded yet"}</dd>
          </div>
          <div>
            <dt>Resumes saved</dt>
            <dd>{state.resumes.length}</dd>
          </div>
        </dl>
        {saveFailed && <p className="status-note error">Couldn’t save. Download a backup before closing.</p>}
        <div className="settings-actions">
          <Button onClick={() => downloadBackup()}>
            <Download size={16} /> Download backup
          </Button>
          <label className="btn">
            <Upload size={16} /> Restore from backup
            <input
              type="file"
              accept="application/json"
              hidden
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                await openRestorePreview(file);
              }}
            />
          </label>
        </div>
      </article>
      <article className="settings-card">
        <div className="settings-card-header">
          <span>
            <RotateCcw size={18} />
          </span>
          <div>
            <h2>Backup reminders</h2>
            <p>Show a prompt after meaningful changes so you remember to keep a backup copy.</p>
          </div>
        </div>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={!state.storageMeta?.backupReminderDisabled}
            onChange={(event) =>
              setState({ ...state, storageMeta: { ...state.storageMeta, backupReminderDisabled: !event.target.checked } })
            }
          />{" "}
          Show backup reminders
        </label>
      </article>
      <article className="settings-card danger-zone">
        <div className="settings-card-header">
          <span>
            <Trash2 size={18} />
          </span>
          <div>
            <h2>Clear local data</h2>
            <p>
              Remove resumes, versions, applications, and preferences stored in this browser. Download a backup first if you want to keep
              your work.
            </p>
          </div>
        </div>
        <Button className="danger" onClick={openClear}>
          <Trash2 size={16} /> Clear local data
        </Button>
      </article>
    </section>
  </div>
);
