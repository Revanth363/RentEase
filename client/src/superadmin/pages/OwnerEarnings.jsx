import React, { useState, useEffect } from 'react';
import styles from './OwnerEarnings.module.css';
import { Search, Download } from 'lucide-react';
import { getOwnerEarnings } from '../../services/superadminService';

export default function OwnerEarnings() {
  const [searchTerm, setSearchTerm] = useState('');
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const handleExport = () => {
    alert('Export functionality coming soon');
  };

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
          <button className={styles.exportBtn} onClick={handleExport}>
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
                <th>Owner Name</th>
                <th>Properties</th>
                <th>Monthly Rent</th>
                <th>Total Rent (All Time)</th>
                <th>Last Payment Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredOwners.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                    No owners found
                  </td>
                </tr>
              ) : (
                filteredOwners.map((owner) => (
                  <tr key={owner._id}>
                    <td className={styles.nameCell}>
                      {owner.firstName} {owner.lastName}
                    </td>
                    <td>{owner.numProperties || owner.propertyIds?.length || 0}</td>
                    <td className={styles.currencyCell}>
                      ₹{(owner.monthlyRent || 0).toLocaleString()}
                    </td>
                    <td className={styles.currencyCell}>
                      ₹{(owner.totalRent || 0).toLocaleString()}
                    </td>
                    <td>
                      {owner.lastPayment
                        ? new Date(owner.lastPayment).toLocaleDateString()
                        : '—'}
                    </td>
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