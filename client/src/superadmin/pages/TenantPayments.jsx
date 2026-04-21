import React, { useState, useEffect, useCallback } from 'react';
import styles from './TenantPayments.module.css';
import { Search, Filter, TrendingUp, Calendar, DollarSign, AlertCircle, Clock } from 'lucide-react';
import { getTenantPayments } from '../../services/superadminService';

const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const STATUS_COLORS = {
  Paid: styles.badgePaid,
  Pending: styles.badgePending,
  Overdue: styles.badgeOverdue,
  Cancelled: styles.badgeCancelled,
};

export default function TenantPayments() {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTenantPayments({
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page,
        limit: 50,
      });
      setStats(res.stats || {});
      setPayments(res.payments || []);
      setPagination(res.pagination || {});
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load tenant payments');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // debounce search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleStatusChange = (val) => {
    setStatusFilter(val);
    setPage(1);
  };

  return (
    <div className={styles.container}>
      {/* ─── PAGE HEADER ──────────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Tenant Payments</h1>
        <p className={styles.pageSubtitle}>All rent payments collected across the platform</p>
      </div>

      {/* ─── STAT CARDS ───────────────────────────────────────────────── */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#d4edda', color: '#155724' }}>
            <TrendingUp size={22} />
          </div>
          <div>
            <p className={styles.statLabel}>Total Revenue (All Time)</p>
            <p className={styles.statValue}>{fmt(stats.totalRevenue)}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#cce5ff', color: '#004085' }}>
            <Calendar size={22} />
          </div>
          <div>
            <p className={styles.statLabel}>This Month's Revenue</p>
            <p className={styles.statValue}>{fmt(stats.monthlyRevenue)}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fff3cd', color: '#856404' }}>
            <DollarSign size={22} />
          </div>
          <div>
            <p className={styles.statLabel}>Platform Commission ({stats.commissionPercent ?? 20}%)</p>
            <p className={styles.statValue}>{fmt(stats.totalCommission)}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#f8d7da', color: '#721c24' }}>
            <AlertCircle size={22} />
          </div>
          <div>
            <p className={styles.statLabel}>Overdue Payments</p>
            <p className={styles.statValue} style={{ color: '#dc3545' }}>{stats.overdueCount ?? 0}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fce8b2', color: '#7e5700' }}>
            <Clock size={22} />
          </div>
          <div>
            <p className={styles.statLabel}>Pending Payments</p>
            <p className={styles.statValue} style={{ color: '#e65100' }}>{stats.pendingCount ?? 0}</p>
          </div>
        </div>
      </div>

      {/* ─── FILTERS ──────────────────────────────────────────────────── */}
      <div className={styles.filterBar}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search tenant, property or owner..."
            className={styles.searchInput}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <Filter size={16} className={styles.filterIcon} />
          {['all', 'Paid', 'Pending', 'Overdue', 'Cancelled'].map((s) => (
            <button
              key={s}
              className={`${styles.filterBtn} ${statusFilter === s ? styles.filterBtnActive : ''}`}
              onClick={() => handleStatusChange(s)}
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>

      {/* ─── TABLE ────────────────────────────────────────────────────── */}
      {error ? (
        <div className={styles.errorMsg}>{error}</div>
      ) : loading ? (
        <div className={styles.loadingMsg}>Loading payments...</div>
      ) : (
        <>
          <div className={styles.tableCard}>
            <div className={styles.tableInfo}>
              Showing {payments.length} of {pagination.total ?? 0} payments
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Tenant</th>
                    <th>Property</th>
                    <th>Owner (Receiver)</th>
                    <th>Amount</th>
                    <th>Commission</th>
                    <th>Payment Date</th>
                    <th>Due Date</th>
                    <th>Method</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan="10" className={styles.emptyRow}>
                        No payments found
                      </td>
                    </tr>
                  ) : (
                    payments.map((p, i) => (
                      <tr key={p._id} className={p.status === 'Overdue' ? styles.rowOverdue : ''}>
                        <td className={styles.indexCell}>
                          {(page - 1) * 50 + i + 1}
                        </td>
                        <td>
                          <div className={styles.personName}>{p.tenant?.name || '—'}</div>
                          {p.tenant?.email && (
                            <div className={styles.personSub}>{p.tenant.email}</div>
                          )}
                        </td>
                        <td>
                          <div className={styles.propName}>{p.property?.name || '—'}</div>
                          {p.property?.location && (
                            <div className={styles.personSub}>{p.property.location}</div>
                          )}
                        </td>
                        <td>
                          <div className={styles.personName}>{p.owner?.name || '—'}</div>
                          {p.owner?.email && (
                            <div className={styles.personSub}>{p.owner.email}</div>
                          )}
                        </td>
                        <td className={styles.amount}>{fmt(p.amount)}</td>
                        <td className={styles.commission}>
                          <span className={styles.commTag}>
                            {p.commissionPercent}% = {fmt(p.commissionAmount)}
                          </span>
                        </td>
                        <td>{fmtDate(p.paymentDate)}</td>
                        <td className={p.status === 'Overdue' ? styles.overdueDate : ''}>
                          {fmtDate(p.dueDate)}
                        </td>
                        <td>{p.paymentMethod || '—'}</td>
                        <td>
                          <span className={`${styles.badge} ${STATUS_COLORS[p.status] || styles.badgePending}`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Prev
              </button>
              <span className={styles.pageInfo}>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                className={styles.pageBtn}
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
