import React, { useState, useEffect } from 'react';
import styles from './AuditLogs.module.css';
import { Search, Filter, Download, Calendar } from 'lucide-react';
import { getAuditLogs } from '../../services/superadminService';

export default function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await getAuditLogs();
        setLogs(res.logs || []);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to load audit logs');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.performedBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || log.role === filterRole;
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    return matchesSearch && matchesRole && matchesAction;
  });

  const roles = ['all', ...new Set(logs.map(log => log.role || ''))];
  const actions = ['all', ...new Set(logs.map(log => log.action || ''))];

  const handleExport = () => {
    alert('Export logs - backend integration needed');
  };

  if (loading) return <div className={styles.container}>Loading audit logs...</div>;
  if (error) return <div className={styles.container} style={{ color: '#dc3545' }}>{error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Audit Logs</h1>
        <div className={styles.actions}>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search logs..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className={styles.filterBox}>
            <Filter size={18} className={styles.filterIcon} />
            <select
              className={styles.filterSelect}
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              {roles.map(role => (
                <option key={role} value={role}>
                  {role === 'all' ? 'All Roles' : role}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.filterBox}>
            <Calendar size={18} className={styles.filterIcon} />
            <select
              className={styles.filterSelect}
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
            >
              {actions.map(action => (
                <option key={action} value={action}>
                  {action === 'all' ? 'All Actions' : action}
                </option>
              ))}
            </select>
          </div>
          <button className={styles.exportBtn} onClick={handleExport}>
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Action</th>
                <th>Performed By</th>
                <th>Role</th>
                <th>Date & Time</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                    No audit logs found
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log._id || Math.random()}>
                    <td>
                      <span className={styles.actionBadge}>{log.action || 'N/A'}</span>
                    </td>
                    <td className={styles.userCell}>{log.performedBy || 'N/A'}</td>
                    <td>
                      <span
                        className={`${styles.roleBadge} ${
                          log.role === 'Admin' ? styles.roleAdmin : styles.roleExecutive
                        }`}
                      >
                        {log.role || 'N/A'}
                      </span>
                    </td>
                    <td className={styles.dateCell}>
                      {log.date ? new Date(log.date).toLocaleString() : 'N/A'}
                    </td>
                    <td className={styles.detailsCell}>{log.details || 'N/A'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}