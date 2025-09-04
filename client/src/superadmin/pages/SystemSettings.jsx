import React, { useState, useEffect } from 'react';
import styles from './SystemSettings.module.css';
import { Save, Settings as SettingsIcon } from 'lucide-react';
import { getSystemSettings, updateSystemSettings } from '../../services/superadminService';

export default function SystemSettings() {
  const [commission, setCommission] = useState(20);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await getSystemSettings();
        setCommission(res.settings?.commission || 20);
        setMaintenanceMode(res.settings?.maintenanceMode || false);
        setMaintenanceMessage(res.settings?.maintenanceMessage || '');
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await updateSystemSettings({ commission, maintenanceMode, maintenanceMessage });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError(err.message || 'Failed to save settings');
    }
  };

  if (loading) return <div className={styles.container}>Loading settings...</div>;
  if (error) return <div className={styles.container} style={{ color: '#dc3545' }}>{error}</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>System Settings</h1>

      <div className={styles.settingsCard}>
        <div className={styles.cardHeader}>
          <SettingsIcon size={24} />
          <h2>Platform Configuration</h2>
        </div>

        <form className={styles.form} onSubmit={handleSave}>
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <label className={styles.settingLabel}>Commission Percentage</label>
              <p className={styles.settingDescription}>
                Default commission rate applied to all transactions on the platform
              </p>
            </div>
            <div className={styles.inputGroup}>
              <input
                type="number"
                min="0"
                max="100"
                value={commission}
                onChange={(e) => setCommission(Number(e.target.value))}
                className={styles.commissionInput}
              />
              <span className={styles.percentSign}>%</span>
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <label className={styles.settingLabel}>Maintenance Mode</label>
              <p className={styles.settingDescription}>
                Enable this to temporarily disable user access for system maintenance
              </p>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
              />
              <span className={styles.slider}></span>
            </label>
          </div>

          <div className={styles.divider} />

          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <label className={styles.settingLabel}>Maintenance Message</label>
              <p className={styles.settingDescription}>
                Text shown to users when the site is in maintenance mode
              </p>
            </div>
            <textarea
              className={styles.messageInput}
              value={maintenanceMessage}
              onChange={(e) => setMaintenanceMessage(e.target.value)}
              rows={3}
            />
          </div>

          <div className={styles.divider} />

          <div className={styles.formActions}>
            {saved && (
              <span className={styles.savedMessage}>
                ✓ Settings saved successfully!
              </span>
            )}
            <button type="submit" className={styles.saveBtn}>
              <Save size={18} />
              Save Changes
            </button>
          </div>
        </form>
      </div>

      <div className={styles.infoCard}>
        <h3>Important Notes</h3>
        <ul>
          <li>Commission changes will apply to all new transactions immediately</li>
          <li>Maintenance mode will display a notice to all users attempting to access the platform</li>
          <li>Existing transactions will not be affected by commission changes</li>
          <li>System administrators will still have access during maintenance mode</li>
        </ul>
      </div>
    </div>
  );
}