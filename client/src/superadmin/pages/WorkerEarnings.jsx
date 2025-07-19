import React, { useState, useEffect } from 'react';
import styles from './WorkerEarnings.module.css';
import { Search, Download, Filter, ChevronDown, ChevronRight } from 'lucide-react';
import { getWorkerEarnings } from '../../services/superadminService';

const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

export default function WorkerEarnings() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterService, setFilterService] = useState('all');
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const res = await getWorkerEarnings();
        setWorkers(res.workers || []);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to load worker earnings data');
      } finally {
        setLoading(false);
      }
    };
    fetchWorkers();
  }, []);

  const filteredWorkers = workers.filter(worker => {
    const matchesSearch = `${worker.firstName} ${worker.lastName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterService === 'all' || worker.serviceType === filterService;
    return matchesSearch && matchesFilter;
  });

  const serviceTypes = ['all', ...new Set(workers.map(w => w.serviceType).filter(Boolean))];
  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  if (loading) return <div className={styles.container}>Loading worker earnings...</div>;
  if (error) return <div className={styles.container} style={{ color: '#dc3545' }}>{error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Worker Earnings Summary</h1>
        <div className={styles.actions}>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search workers..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className={styles.filterBox}>
            <Filter size={18} className={styles.filterIcon} />
            <select
              className={styles.filterSelect}
              value={filterService}
              onChange={(e) => setFilterService(e.target.value)}
            >
              {serviceTypes.map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Services' : type}
                </option>
              ))}
            </select>
          </div>
          <button className={styles.exportBtn}>
            <Download size={18} />
            Export Data
          </button>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: 32 }}></th>
                <th>Worker Name</th>
                <th>Service Type</th>
                <th>Experience</th>
                <th>Status</th>
                <th>This Month</th>
                <th>Total Earnings</th>
                <th>Completed Services</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkers.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                    No workers found
                  </td>
                </tr>
              ) : (
                filteredWorkers.map(worker => {
                  const isOpen = !!expanded[worker._id];
                  const hasTenants = worker.tenants && worker.tenants.length > 0;
                  return (
                    <React.Fragment key={worker._id}>
                      <tr
                        className={`${styles.ownerRow} ${hasTenants ? styles.clickableRow : ''}`}
                        onClick={() => hasTenants && toggleExpand(worker._id)}
                      >
                        <td className={styles.expandCell}>
                          {hasTenants
                            ? (isOpen
                                ? <ChevronDown size={16} className={styles.chevron} />
                                : <ChevronRight size={16} className={styles.chevron} />)
                            : null}
                        </td>
                        <td className={styles.nameCell}>
                          {worker.firstName} {worker.lastName}
                        </td>
                        <td>
                          <span className={styles.serviceBadge}>
                            {worker.serviceType || 'N/A'}
                          </span>
                        </td>
                        <td>{worker.experience ? `${worker.experience} yrs` : '—'}</td>
                        <td>
                          <span className={worker.status === 'Active' ? styles.badgeActive : styles.badgeSuspended}>
                            {worker.status || 'Active'}
                          </span>
                        </td>
                        <td className={styles.currencyCell}>{fmt(worker.monthlyEarnings)}</td>
                        <td className={styles.currencyCell}>{fmt(worker.totalEarnings)}</td>
                        <td className={styles.serviceCount}>
                          {worker.completedServices || 0}
                        </td>
                      </tr>

                      {isOpen && hasTenants && (
                        <tr className={styles.expandedRow}>
                          <td colSpan="8" className={styles.expandedCell}>
                            <div className={styles.propBreakdown}>
                              <p className={styles.propBreakdownTitle}>
                                Active clients under {worker.firstName} {worker.lastName}
                              </p>
                              <table className={styles.propTable}>
                                <thead>
                                  <tr>
                                    <th>#</th>
                                    <th>Tenant Name</th>
                                    <th>Service</th>
                                    <th>Booked On</th>
                                    <th>Booking Status</th>
                                    <th>Payment Status</th>
                                    <th>Last Paid</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {worker.tenants.map((t, i) => (
                                    <tr key={t.tenantId}>
                                      <td>{i + 1}</td>
                                      <td>{t.tenantName}</td>
                                      <td>{t.serviceType || '—'}</td>
                                      <td>{t.bookingDate ? new Date(t.bookingDate).toLocaleDateString('en-IN') : '—'}</td>
                                      <td>
                                        <span className={t.bookingStatus === 'Approved' ? styles.badgeActive : styles.badgeSuspended}>
                                          {t.bookingStatus}
                                        </span>
                                      </td>
                                      <td>
                                        <span className={t.paymentStatus === 'Paid' ? styles.badgeRented : styles.badgeVacant}>
                                          {t.paymentStatus}
                                        </span>
                                      </td>
                                      <td>
                                        {t.lastPaymentDate
                                          ? new Date(t.lastPaymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                          : '—'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}