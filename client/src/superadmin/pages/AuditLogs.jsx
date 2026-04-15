import React, { useState, useEffect } from 'react';
import styles from './AuditLogs.module.css';
import { Search, Filter, Download, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAuditLogs, exportAuditLogs } from '../../services/superadminService';

export default function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, pages: 0, limit: 20, skip: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const actionOptions = [
    'all',
    'LOGIN',
    'LOGOUT',
    'CREATE_PROPERTY',
    'UPDATE_PROPERTY',
    'DELETE_PROPERTY',
    'CREATE_BOOKING',
    'UPDATE_BOOKING',
    'CANCEL_BOOKING',
    'CREATE_USER',
    'UPDATE_USER',
    'SUSPEND_USER',
    'ACTIVATE_USER',
    'VERIFY_USER',
    'PROCESS_PAYMENT',
    'REFUND_PAYMENT',
    'CREATE_COMPLAINT',
    'RESOLVE_COMPLAINT',
    'COMPLETE_MAINTENANCE',
  ];

  const roleOptions = ['all', 'admin', 'superadmin', 'owner', 'tenant', 'worker'];
  const statusOptions = ['all', 'success', 'failed', 'partial'];

  useEffect(() => {
    fetchLogs();
  }, [filterAction, filterRole, filterStatus, searchTerm, startDate, endDate, currentPage]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters = {
        limit: pagination.limit,
        skip: (currentPage - 1) * pagination.limit,
      };

      if (filterAction !== 'all') filters.action = filterAction;
      if (filterRole !== 'all') filters.role = filterRole;
      if (filterStatus !== 'all') filters.status = filterStatus;
      if (searchTerm.trim()) filters.search = searchTerm.trim();
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const res = await getAuditLogs(filters);
      setLogs(res.logs || []);
      setPagination(res.pagination || { total: 0, pages: 0, limit: 20, skip: 0 });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const filters = {};
      if (filterAction !== 'all') filters.action = filterAction;
      if (filterRole !== 'all') filters.role = filterRole;
      if (filterStatus !== 'all') filters.status = filterStatus;
      if (searchTerm.trim()) filters.search = searchTerm.trim();
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      await exportAuditLogs(filters);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export audit logs');
    } finally {
      setExporting(false);
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
        <h1 className={styles.pageTitle}>Audit Logs</h1>
        <div className={styles.actions}>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search user, action..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filtersSection}>
        <div className={styles.filterGroup}>
          <label>Action</label>
          <select value={filterAction} onChange={(e) => {
            setFilterAction(e.target.value);
            setCurrentPage(1);
          }} className={styles.filterSelect}>
            {actionOptions.map(action => (
              <option key={action} value={action}>
                {action === 'all' ? 'All Actions' : action.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Role</label>
          <select value={filterRole} onChange={(e) => {
            setFilterRole(e.target.value);
            setCurrentPage(1);
          }} className={styles.filterSelect}>
            {roleOptions.map(role => (
              <option key={role} value={role}>
                {role === 'all' ? 'All Roles' : role}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Status</label>
          <select value={filterStatus} onChange={(e) => {
            setFilterStatus(e.target.value);
            setCurrentPage(1);
          }} className={styles.filterSelect}>
            {statusOptions.map(status => (
              <option key={status} value={status}>
                {status === 'all' ? 'All Status' : status}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setCurrentPage(1);
            }}
            className={styles.filterSelect}
          />
        </div>

        <div className={styles.filterGroup}>
          <label>End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setCurrentPage(1);
            }}
            className={styles.filterSelect}
          />
        </div>

        <button 
          className={styles.exportBtn} 
          onClick={handleExport}
          disabled={exporting || loading}
        >
          <Download size={18} />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
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
                    <th>Resource</th>
                    <th>Status</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
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
                          <div>{log.resource?.type || 'N/A'}</div>
                          <small style={{ color: '#999' }}>{log.resource?.name}</small>
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

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className={styles.pagination}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className={styles.paginationBtn}
                >
                  <ChevronLeft size={18} /> Previous
                </button>

                <div className={styles.pageInfo}>
                  Page {currentPage} of {pagination.pages} ({pagination.total} total)
                </div>

                <button
                  disabled={currentPage === pagination.pages}
                  onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                  className={styles.paginationBtn}
                >
                  Next <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}