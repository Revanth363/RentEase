import styles from '../pages/Overview.module.css';

export default function StatCard({ title, value, icon: Icon, trend, color }) {
  return (
    <div className={styles.statCard}>
      {Icon && (
        <div className={styles.statIcon} style={{ backgroundColor: color + '15', color }}>
          <Icon size={24} />
        </div>
      )}
      <div className={styles.statContent}>
        <h3 className={styles.statTitle}>{title}</h3>
        <p className={styles.statValue}>{value || '—'}</p>
        {trend && (
          <span
            className={styles.statTrend}
            style={{ color: trend.type === 'up' ? '#28a745' : '#dc3545' }}
          >
            {trend.type === 'up' ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}