import { Download } from "lucide-react";
import { Button } from "./Button";

export const LocalStorageWarningBanner = ({ onBackup, onDismiss, onLearnMore }: { onBackup: () => void; onDismiss: () => void; onLearnMore: () => void }) => (
  <section className="local-storage-warning" aria-label="Local browser storage warning">
    <div>
      <strong>Saved locally in this browser</strong>
      <p>Your resumes are saved only in this browser. They are not synced to an account. Download a backup before clearing browser data, switching devices, or relying on Resume Studio for active applications.</p>
      <button className="link-button" onClick={onLearnMore}>Learn how local storage works</button>
    </div>
    <div className="inline-actions">
      <Button className="primary" onClick={onBackup}><Download size={15} /> Download backup</Button>
      <Button onClick={onDismiss}>Got it</Button>
    </div>
  </section>
);

export const BackupReminderBanner = ({ onBackup, onLater }: { onBackup: () => void; onLater: () => void }) => (
  <section className="backup-reminder" aria-label="Backup reminder">
    <div>
      <strong>You have work saved locally</strong>
      <p>Download a backup file so you can restore your resumes later if browser site data is cleared or you switch devices.</p>
    </div>
    <div className="inline-actions">
      <Button className="primary" onClick={onBackup}><Download size={15} /> Download backup</Button>
      <Button onClick={onLater}>Remind me later</Button>
    </div>
  </section>
);
