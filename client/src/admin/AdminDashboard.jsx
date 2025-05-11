import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLoading } from '../LoadingContext';
import LoadingSpinner from '../components/LoadingSpinner';
import styles from '../assets/css/AdminDashboard.module.css'; // Updated import
import Chart from 'chart.js/auto';
import { fetchAdminDashboard } from '../services/api';
import AdminNavbar from '../components/AdminNavbar';

const AdminDashboard = () => {
  const { setIsLoading } = useLoading();
  const [stats, setStats] = useState({});
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('monthly');
  const chartsInitialized = useRef(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setIsLoading(true);
        const data = await fetchAdminDashboard(filter);
        if (data.error) {
          throw new Error(data.error);
        }
        setStats(data.stats || {});
        setAnalyticsData(data.analyticsData || {});
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(`Failed to load dashboard data: ${err.message}. Please check if the backend server is running and the /api/admin endpoint is accessible.`);
      } finally {
        setLoading(false);
        setIsLoading(false);
      }
    };
    fetchData();
  }, [setIsLoading, filter]);

  useEffect(() => {
    if (!loading && analyticsData && !chartsInitialized.current) {
      chartsInitialized.current = true;
      initAllCharts(analyticsData);
    }
  }, [loading, analyticsData]);

  const initAllCharts = (analytics) => {
    if (!analytics || !analytics.quarters || analytics.quarters.length === 0) {
      console.error('❌ No analytics data!');
      return;
    }
    initBarChart('propertiesChart', analytics.quarters, analytics.newProperties, 'New Properties', '#28a745');
    initBarChart('tenantsChart', analytics.quarters, analytics.newTenants, 'New Tenants', '#007bff');
    initBarChart('workersChart', analytics.quarters, analytics.newWorkers, 'New Workers', '#ffc107');
    initBarChart('ownersChart', analytics.quarters, analytics.newOwners, 'New Owners', '#6f42c1');
    initBarChart('servicesChart', analytics.quarters, analytics.newServices, 'New Services', '#fd7e14');
    initRevenueChart('revenueChart', analytics.quarters, analytics.totalRevenue);
    initPieChart('userTypeChart', ['Tenants', 'Owners', 'Workers'], [
      analytics.userTypeDistribution?.tenants || 0,
      analytics.userTypeDistribution?.owners || 0,
      analytics.userTypeDistribution?.workers || 0,
    ]);
    initPieChart('propertyStatusChart', ['Rented', 'Available', 'Pending'], [
      analytics.propertyStatusDistribution?.rented || 0,
      analytics.propertyStatusDistribution?.available || 0,
      analytics.propertyStatusDistribution?.pending || 0,
    ]);
    console.log('✅ ALL 8 CHARTS LOADED!');
  };

  const initBarChart = (canvasId, labels, data, title, color) => {
    try {
      const canvas = document.getElementById(canvasId);
      if (!canvas) {
        console.error(`❌ Canvas ${canvasId} not found!`);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (window[`chart_${canvasId}`]) {
        window[`chart_${canvasId}`].destroy();
      }
      window[`chart_${canvasId}`] = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels || [],
          datasets: [{
            label: title,
            data: data || [],
            backgroundColor: color + '30',
            borderColor: color,
            borderWidth: 2,
            borderRadius: 6,
            maxBarThickness: 40,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => `${context.dataset.label}: ${context.parsed.y}`,
              },
            },
          },
          scales: {
            y: { beginAtZero: true, ticks: { font: { size: 11 } } },
            x: { ticks: { font: { size: 10 }, maxRotation: 45 } },
          },
        },
      });
      console.log(`✅ ${canvasId} LOADED`);
    } catch (err) {
      console.error(`❌ ${canvasId} ERROR:`, err);
    }
  };

  const initRevenueChart = (canvasId, labels, data) => {
    try {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (window[`chart_${canvasId}`]) {
        window[`chart_${canvasId}`].destroy();
      }
      window[`chart_${canvasId}`] = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels || [],
          datasets: [{
            label: 'Revenue',
            data: data || [],
            backgroundColor: '#dc354530',
            borderColor: '#dc3545',
            borderWidth: 3,
            borderRadius: 6,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => `₹${context.parsed.y.toLocaleString()}`,
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                font: { size: 11 },
                callback: (value) => `₹${value.toLocaleString()}`,
              },
            },
            x: { ticks: { font: { size: 10 }, maxRotation: 45 } },
          },
        },
      });
      console.log(`✅ ${canvasId} LOADED`);
    } catch (err) {
      console.error(`❌ ${canvasId} ERROR:`, err);
    }
  };

  const initPieChart = (canvasId, labels, data) => {
    try {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (window[`chart_${canvasId}`]) {
        window[`chart_${canvasId}`].destroy();
      }
      const colors = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1'];
      window[`chart_${canvasId}`] = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: labels || [],
          datasets: [{
            data: data || [],
            backgroundColor: colors.slice(0, labels.length),
            borderWidth: 2,
            borderColor: '#fff',
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { font: { size: 11 } },
            },
          },
        },
      });
      console.log(`✅ ${canvasId} LOADED`);
    } catch (err) {
      console.error(`❌ ${canvasId} ERROR:`, err);
    }
  };

  
  if (error) return <div className={styles.error} style={{ textAlign: 'center', padding: '50px', color: '#ef4444' }}>{error}</div>;

  const statsItems = [
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
      <h1 className={styles.h1}>Admin Dashboard</h1>
      <AdminNavbar />
      <section id="overview" className={styles.section}>
        <h2 className={styles.h2}>Dashboard Overview</h2>
        <div className={styles['stats-grid']}>
          {statsItems.map((stat, index) => (
            <div key={index} className={styles['stat-card']}>
              <h3 className={styles.h3}>{stat.title}</h3>
              <p className={styles['stat-card-p']}>{stat.value}</p>
            </div>
          ))}
        </div>
      </section>
      <section id="reports" className={styles.section}>
        <h2 className={styles.h2}>📊 Reports & Analytics (2025)</h2>
        <div className={styles.charts} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '25px', maxHeight: '800px', overflowY: 'auto' }}>
          <div className={styles['chart-container']}>
            <h3 className={styles.h3}>🏠 New Properties</h3>
            <canvas id="propertiesChart" height="250"></canvas>
          </div>
          <div className={styles['chart-container']}>
            <h3 className={styles.h3}>👥 New Tenants</h3>
            <canvas id="tenantsChart" height="250"></canvas>
          </div>
          <div className={styles['chart-container']}>
            <h3 className={styles.h3}>🔧 New Workers</h3>
            <canvas id="workersChart" height="250"></canvas>
          </div>
          <div className={styles['chart-container']}>
            <h3 className={styles.h3}>👨‍💼 New Owners</h3>
            <canvas id="ownersChart" height="250"></canvas>
          </div>
          <div className={styles['chart-container']}>
            <h3 className={styles.h3}>🛠️ New Services</h3>
            <canvas id="servicesChart" height="250"></canvas>
          </div>
          <div className={styles['chart-container']}>
            <h3 className={styles.h3}>🥧 User Types</h3>
            <canvas id="userTypeChart" height="250"></canvas>
          </div>
          <div className={styles['chart-container']}>
            <h3 className={styles.h3}>🥧 Property Status</h3>
            <canvas id="propertyStatusChart" height="250"></canvas>
          </div>
          <div className={styles['chart-container']} style={{ gridColumn: '1 / -1' }}>
            <h3 className={styles.h3}>💰 Total Revenue (₹)</h3>
            <canvas id="revenueChart" height="300"></canvas>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;