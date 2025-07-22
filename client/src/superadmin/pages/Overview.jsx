import React, { useState, useEffect } from 'react';
import styles from './Overview.module.css';
import StatCard from '../components/StatCard';
import { TrendingUp, DollarSign, Users, Home, CreditCard, Activity } from 'lucide-react';
import { getPlatformStats } from '../../services/superadminService';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';

export default function Overview() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const location = useLocation();
  const user = useSelector(selectUser);

  useEffect(() => {
    const fetchStats = async () => {
      // Skip if not on superadmin route or not superadmin user
      if (!location.pathname.startsWith('/superadmin') || user?.userType !== 'superadmin') {
        setLoading(false);
        setStats({});
        return;
      }

      try {
        setLoading(true);
        const data = await getPlatformStats(); // silent null on 401

        if (!data) {
          setStats({});
          return;
        }

        setStats(data.stats || {});
      } catch (err) {
        console.error('Failed to load stats:', err);
        setError(err.message || 'Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [location.pathname, user]);

  if (loading) return <div className={styles.container}>Loading platform overview...</div>;
  if (error) return <div className={styles.container} style={{ color: '#dc3545' }}>{error}</div>;

  // combine original "displayStats" (with icons/colors) plus the new detailed items
  const statsItems = [
    // --- original overview cards ---
    {
      title: 'Total Rent Collected',
      value: `₹${(stats.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: '#28a745',
    },
    {
      title: 'Total Worker Payments',
      value: `₹${(stats.totalWorkerPayments || 0).toLocaleString()}`,
      icon: CreditCard,
      color: '#ff6f00',
    },
    {
      title: 'Platform Commission Earned',
      value: `₹${(stats.platformCommission || 0).toLocaleString()}`,
      icon: TrendingUp,
      color: '#ffc107',
    },
    
    {
      title: 'Total Registered Users',
      value:
        (stats.totalTenants || 0) +
        (stats.totalOwners || 0) +
        (stats.totalWorkers || 0) || '—',
      icon: Users,
      color: '#6f42c1',
    },
    {
      title: 'Total Transactions',
      value: `${stats.totalBookings || stats.totalPayments || 0}`,
      icon: Activity,
      color: '#6c757d',
    },

    // --- new requested stats ---
    { title: 'Total Properties', value: stats.totalProperties || 0 },
    { title: 'Total Renters', value: stats.totalRenters || 0 },
    { title: 'Total Owners', value: stats.totalOwners || 0 },
    { title: 'Total Workers', value: stats.totalWorkers || 0 },
    { title: 'Active Rentals', value: stats.activeRentals || 0 },
    { title: 'Active Users', value: stats.activeUsers || 0 },
    { title: 'Total Revenue', value: `₹${stats.totalRevenue?.toFixed(2) || '0.00'}` },
    { title: 'Daily Revenue', value: `₹${stats.revenueDaily?.toFixed(2) || '0.00'}` },
    { title: 'Weekly Revenue', value: `₹${stats.revenueWeekly?.toFixed(2) || '0.00'}` },
    { title: 'Monthly Revenue', value: `₹${stats.revenueMonthly?.toFixed(2) || '0.00'}` },
    { title: 'Active Properties', value: stats.propertiesActive || 0 },
    { title: 'Pending Properties', value: stats.propertiesPending || 0 },
    { title: 'Available Properties', value: stats.propertiesAvailable || 0 },
    { title: 'Available Workers', value: stats.workersAvailable || 0 },
  ];

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Dashboard Overview</h1>
      <div className={styles.statsGrid}>
        {statsItems.map((stat, index) => (
          <StatCard key={index} title={stat.title} value={stat.value} />
        ))}
      </div>
      {/* revenue by area table */}
      {stats.revenueByArea && stats.revenueByArea.length > 0 && (
        <section className={styles.areaSection}>
          <h2>Revenue by Area</h2>
          <div className={styles.areaTableWrapper}>
            <table className={styles.areaTable}>
              <thead>
                <tr>
                  <th>Area / Location</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {stats.revenueByArea.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.area || 'Unknown'}</td>
                    <td>₹{row.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}