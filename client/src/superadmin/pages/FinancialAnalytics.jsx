import React, { useState, useEffect } from 'react';
import styles from './FinancialAnalytics.module.css';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Calendar } from 'lucide-react';
import { getFinancialAnalytics } from '../../services/superadminService';

export default function FinancialAnalytics() {
  const [dateRange, setDateRange] = useState('12months');
  const [data, setData] = useState({
    monthlyRevenue: [],
    workerPayments: [],
    commission: [],
    distribution: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        const res = await getFinancialAnalytics(dateRange);
        setData({
          monthlyRevenue: res.monthlyRevenue || [],
          workerPayments: res.workerPayments || [],
          commission: res.commission || [],
          distribution: res.distribution || [],
        });
      } catch (err) {
        console.error('Financial data fetch error:', err);
        setError(err.message || 'Failed to load financial analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialData();
  }, [dateRange]);

  const COLORS = ['#28a745', '#ff6f00', '#ffc107'];

  if (loading) return <div className={styles.container}>Loading financial data...</div>;
  if (error) return <div className={styles.container} style={{ color: '#dc3545' }}>{error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Financial Analytics</h1>
        <div className={styles.filterGroup}>
          <Calendar size={20} className={styles.calendarIcon} />
          <select
            className={styles.dateFilter}
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="1month">Last Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="12months">Last 12 Months</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Monthly Rent Revenue</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="month" stroke="#6c757d" />
              <YAxis stroke="#6c757d" />
              <Tooltip formatter={(v) => `₹${v?.toLocaleString() || '0'}`} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#28a745" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Monthly Worker Payment Volume</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.workerPayments}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="month" stroke="#6c757d" />
              <YAxis stroke="#6c757d" />
              <Tooltip formatter={(v) => `₹${v?.toLocaleString() || '0'}`} />
              <Legend />
              <Bar dataKey="payments" fill="#ff6f00" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Platform Commission Growth</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.commission}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="month" stroke="#6c757d" />
              <YAxis stroke="#6c757d" />
              <Tooltip formatter={(v) => `₹${v?.toLocaleString() || '0'}`} />
              <Legend />
              <Line type="monotone" dataKey="commission" stroke="#ffc107" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Revenue Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.distribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                outerRadius={100}
                dataKey="value"
              >
                {data.distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `₹${v?.toLocaleString() || '0'}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}