import React, { useState, useEffect } from 'react';
import styles from './OwnerEarnings.module.css';
import { Search, Download, ChevronDown, ChevronRight } from 'lucide-react';
import { getOwnerEarnings } from '../../services/superadminService';

const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

export default function OwnerEarnings() {
  const [searchTerm, setSearchTerm] = useState('');
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    const fetchOwners = async () => {
      try {
        const res = await getOwnerEarnings();
        setOwners(res.owners || []);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to load owner earnings data');
      } finally {
        setLoading(false);
      }
    };
    fetchOwners();
  }, []);

  const filteredOwners = owners.filter(owner =>
    `${owner.firstName} ${owner.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleExpand = (id) =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  if (loading) return <div className={styles.container}>Loading owner earnings...</div>;
  if (error) return <div className={styles.container} style={{ color: '#dc3545' }}>{error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Owner Earnings Summary</h1>
        <div className={styles.actions}>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search owners..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
                <th>Owner Name</th>
                <th>Status</th>
                <th>Properties</th>
                <th>Monthly Rent (Total)</th>
                <th>Total Rent (All Time)</th>
                <th>Last Payment Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredOwners.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                    No owners found
                  </td>
                </tr>
              ) : (
                filteredOwners.map((owner) => {
                  const isOpen = !!expanded[owner._id];
                  const hasProps = owner.properties && owner.properties.length > 0;
                  return (
                    <React.Fragment key={owner._id}>
                      <tr
                        className={`${styles.ownerRow} ${hasProps ? styles.clickableRow : ''}`}
                        onClick={() => hasProps && toggleExpand(owner._id)}
                      >
                        <td className={styles.expandCell}>
                          {hasProps
                            ? (isOpen
                                ? <ChevronDown size={16} className={styles.chevron} />
                                : <ChevronRight size={16} className={styles.chevron} />)
                            : null}
                        </td>
                        <td className={styles.nameCell}>
                          {owner.firstName} {owner.lastName}
                        </td>
                        <td>
                          <span className={owner.status === 'Active' ? styles.badgeActive : styles.badgeSuspended}>
                            {owner.status || 'Active'}
                          </span>
                        </td>
                        <td className={styles.countCell}>{owner.numProperties || 0}</td>
                        <td className={styles.currencyCell}>{fmt(owner.monthlyRent)}</td>
                        <td className={styles.currencyCell}>{fmt(owner.totalRent)}</td>
                        <td>
                          {owner.lastPayment
                            ? new Date(owner.lastPayment).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '—'}
                        </td>
                      </tr>

                      {isOpen && hasProps && (
                        <tr className={styles.expandedRow}>
                          <td colSpan="7" className={styles.expandedCell}>
                            <div className={styles.propBreakdown}>
                              <p className={styles.propBreakdownTitle}>Properties under {owner.firstName} {owner.lastName}</p>
                              <table className={styles.propTable}>
                                <thead>
                                  <tr>
                                    <th>#</th>
                                    <th>Property Name</th>
                                    <th>Location</th>
                                    <th>Monthly Rent</th>
                                    <th>Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {owner.properties.map((p, i) => (
                                    <tr key={p._id}>
                                      <td>{i + 1}</td>
                                      <td>{p.name}</td>
                                      <td>{p.location}</td>
                                      <td className={styles.currencyCell}>{fmt(p.price)}</td>
                                      <td>
                                        <span className={p.isRented ? styles.badgeRented : styles.badgeVacant}>
                                          {p.isRented ? 'Rented' : 'Vacant'}
                                        </span>
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