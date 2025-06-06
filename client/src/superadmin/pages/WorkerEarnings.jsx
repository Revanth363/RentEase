import React, { useState, useEffect } from 'react';
import styles from './WorkerEarnings.module.css';
import { Search, Download, Filter } from 'lucide-react';
import { getWorkerEarnings } from '../../services/superadminService';

export default function WorkerEarnings() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterService, setFilterService] = useState('all');
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const serviceTypes = ['all', ...new Set(workers.map(w => w.serviceType || ''))];

  const handleExport = () => {
    alert('Export functionality coming soon');
  };

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
                <th>Worker Name</th>
                <th>Service Type</th>
                <th>Monthly Earnings</th>
                <th>Total Earnings (All Time)</th>
                <th>Completed Services</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkers.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                    No workers found
                  </td>
                </tr>
              ) : (
                filteredWorkers.map(worker => (
                  <tr key={worker._id}>
                    <td className={styles.nameCell}>
                      {worker.firstName} {worker.lastName}
                    </td>
                    <td>
                      <span className={styles.serviceBadge}>
                        {worker.serviceType || 'N/A'}
                      </span>
                    </td>
                    <td className={styles.currencyCell}>
                      ₹{(worker.monthlyEarnings || 0).toLocaleString()}
                    </td>
                    <td className={styles.currencyCell}>
                      ₹{(worker.totalEarnings || 0).toLocaleString()}
                    </td>
                    <td className={styles.serviceCount}>
                      {worker.completedServices || 0}
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