import { Download } from "lucide-react";
import { Button } from "./Button";

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
