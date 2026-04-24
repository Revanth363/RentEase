import React, { useState, useEffect } from 'react';
import styles from './AuditLogs.module.css';
import { getAuditLogs } from '../../services/superadminService';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAuditLogs({ action: 'LOGIN', role: 'admin' });
      setLogs(res.logs || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    if (action.includes('CREATE') || action.includes('LOGIN')) return '#10b981';
    if (action.includes('UPDATE') || action.includes('VERIFY')) return '#3b82f6';
    if (action.includes('DELETE') || action.includes('SUSPEND')) return '#ef4444';
    if (action.includes('PROCESS') || action.includes('APPROVE')) return '#f59e0b';
    return '#6b7280';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return '#10b981';
      case 'failed':
        return '#ef4444';
      case 'partial':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (error) return <div className={styles.container} style={{ color: '#dc3545' }}>{error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Admin Last Login</h1>
      </div>

      {/* Logs Table */}
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.loadingState}>Loading audit logs...</div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>Performed By</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                        No audit logs found
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log._id} className={styles.logRow}>
                        <td className={styles.dateCell}>{formatTimestamp(log.timestamp)}</td>
                        <td>
                          <span 
                            className={styles.actionBadge}
                            style={{ backgroundColor: getActionColor(log.action), color: '#fff' }}
                          >
                            {log.action.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className={styles.userCell}>
                          <div>{log.performedBy || 'System'}</div>
                          <small style={{ color: '#999' }}>{log.email}</small>
                        </td>
                        <td>
                          <span className={styles.roleBadge}>
                            {log.role || 'N/A'}
                          </span>
                        </td>
                        <td>
                          <span 
                            className={styles.statusBadge}
                            style={{ 
                              backgroundColor: getStatusColor(log.status),
                              color: '#fff'
                            }}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className={styles.detailsCell}>{log.description || 'N/A'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}