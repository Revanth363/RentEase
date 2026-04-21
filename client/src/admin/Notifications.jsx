// src/pages/admin/Notifications.jsx
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLoading } from '../context/useLoading';
import LoadingSpinner from '../components/LoadingSpinner';
import styles from '../assets/css/AdminDashboard.module.css';
import { fetchAdminNotifications } from '../services/api';


const Notifications = () => {
  const { setIsLoading } = useLoading();
  const [searchParams, setSearchParams] = useSearchParams();

  const [notifications, setNotifications] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [localFilters, setLocalFilters] = useState({
    type: searchParams.get('type') || '',
    fromDate: searchParams.get('fromDate') || '',
    toDate: searchParams.get('toDate') || '',
    page: Number(searchParams.get('page')) || 1,
    limit: Number(searchParams.get('limit')) || 25,
  });

  const [appliedFilters, setAppliedFilters] = useState({ ...localFilters });

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setIsLoading(true);
    try {
      const data = await fetchAdminNotifications();
      let list = data.notifications || data || [];

      // Exclude OTP notifications from admin view
      list = list.filter(n => n.type !== 'Work-OTP');

      if (appliedFilters.type) {
        list = list.filter(n => n.type === appliedFilters.type);
      }
      if (appliedFilters.fromDate) {
        const from = new Date(appliedFilters.fromDate);
        list = list.filter(n => new Date(n.createdDate || n.createdAt) >= from);
      }
      if (appliedFilters.toDate) {
        const to = new Date(appliedFilters.toDate);
        to.setHours(23, 59, 59, 999);
        list = list.filter(n => new Date(n.createdDate || n.createdAt) <= to);
      }

      list.sort((a, b) => new Date(b.createdDate || b.createdAt) - new Date(a.createdDate || a.createdAt));

      const totalCount = list.length;
      const start = (appliedFilters.page - 1) * appliedFilters.limit;
      const paginated = list.slice(start, start + appliedFilters.limit);

      setNotifications(paginated);
      setTotal(totalCount);
    } catch (err) {
      console.error(err);
      alert('Failed to load notifications');
      setNotifications([]);
      setTotal(0);
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  }, [appliedFilters, setIsLoading]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const applyFilters = () => {
    const newFilters = { ...localFilters, page: 1 };
    setAppliedFilters(newFilters);
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => v && params.set(k, v));
    setSearchParams(params, { replace: true });
  };

  const resetFilters = () => {
    const reset = { type: '', fromDate: '', toDate: '', page: 1, limit: 25 };
    setLocalFilters(reset);
    setAppliedFilters(reset);
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const handleFilterChange = (key, value) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handlePageChange = (page) => {
    setAppliedFilters(prev => ({ ...prev, page }));
    setLocalFilters(prev => ({ ...prev, page }));
    const params = new URLSearchParams(searchParams);
    params.set('page', page);
    setSearchParams(params, { replace: true });
  };

  if (loading) {
    return <LoadingSpinner />;
  }
  

  return (
    <div className={styles.container}>
      <h1 className={styles.h1}>Notifications</h1>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* Filters */}
        <aside style={{
          width: '350px',
          minWidth: '350px',
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          position: 'sticky',
          top: '20px',
          height: 'fit-content',
          alignSelf: 'flex-start'
        }}>
          <h3 style={{ margin: '0 0 20px', color: '#232f3e', fontSize: '18px' }}>Filters</h3>

          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Notification Type</label>
              <select
                value={localFilters.type}
                onChange={e => handleFilterChange('type', e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d5d9d9' }}
              >
                <option value="">All Types</option>
                <option value="Booking Request">Booking Request</option>
                <option value="Booking Approved">Booking Approved</option>
                <option value="Booking Update">Booking Update</option>
                <option value="Unrent Request">Unrent Request</option>
                <option value="Debooking">Debooking</option>
                <option value="Query">Query</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>From Date</label>
              <input type="date" value={localFilters.fromDate} onChange={e => handleFilterChange('fromDate', e.target.value)}
                style={{ width: '260px', padding: '10px', borderRadius: '8px', border: '1px solid #d5d9d9' }} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>To Date</label>
              <input type="date" value={localFilters.toDate} onChange={e => handleFilterChange('toDate', e.target.value)}
                style={{ width: '260px', padding: '10px', borderRadius: '8px', border: '1px solid #d5d9d9' }} />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={applyFilters}
                style={{ flex: 1, padding: '12px', background: '#ff9900', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                Apply Filters
              </button>
              <button onClick={resetFilters}
                style={{ padding: '12px 16px', background: '#fff', color: '#555', border: '1px solid #d5d9d9', borderRadius: '8px', cursor: 'pointer' }}>
                Reset
              </button>
            </div>
          </div>
        </aside>

        {/* Table */}
        <section style={{ flex: 1, minWidth: '0' }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #eaeded', background: '#fafafa' }}>
              <h2 style={{ margin: 0, color: '#232f3e' }}>
                Notifications ({total.toLocaleString()})
              </h2>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '1250px', tableLayout: 'fixed' }}>
                <thead style={{ background: '#232f3e', color: 'white' }}>
                  <tr>
                    <th style={{ width: '80px', padding: '14px 12px' }}>ID</th>
                    <th style={{ width: '200px' }}>Type</th>
                    <th style={{ width: '160px' }}>Related To</th>
                    <th style={{ width: '130px' }}>Date</th>
                    <th style={{ width: '110px' }}>Status</th>
                    <th style={{ width: '450px' }}>Message</th>
                    <th style={{ width: '100px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '80px', color: '#777' }}>
                        No notifications found.
                      </td>
                    </tr>
                  ) : (
                    notifications.map(n => (
                      <tr key={n._id || n.id} style={{ borderBottom: '1px solid #eaeded' }}>
                        <td style={{ padding: '14px 12px', fontFamily: 'monospace', fontSize: '13px' }}>
                          {(n._id || n.id)?.slice(-8)}
                        </td>
                        <td>
                          <span style={{
                            padding: '6px 12px',
                            background: '#e6f7ff',
                            color: '#0066cc',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {n.type}
                          </span>
                        </td>
                        <td>
                          {n.propertyId ? (
                            <a href={`/admin/property/${n.propertyId}`} style={{ color: '#0066cc' }}>Property</a>
                          ) : n.bookingId ? (
                            <a href={`/admin/booking/${n.bookingId}`} style={{ color: '#0066cc' }}>Booking</a>
                          ) : n.tenantId ? (
                            <a href={`/admin/user/${n.tenantId}/tenant`} style={{ color: '#0066cc' }}>Tenant</a>
                          ) : n.workerId ? (
                            <a href={`/admin/user/${n.workerId}/worker`} style={{ color: '#0066cc' }}>Worker</a>
                          ) : '—'}
                        </td>
                        <td>{new Date(n.createdDate || n.createdAt).toLocaleDateString()}</td>
                        <td>
                          <span style={{
                            padding: '6px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            background:
                              ['Completed', 'Approved'].includes(n.status) ? '#d4edda' :
                              n.status === 'Pending' ? '#fff3cd' :
                              n.status === 'Rejected' ? '#f8d7da' :
                              n.status === 'Info' ? '#d1ecf1' : '#fff3cd',
                            color:
                              ['Completed', 'Approved'].includes(n.status) ? '#155724' :
                              n.status === 'Pending' ? '#856404' :
                              n.status === 'Rejected' ? '#721c24' :
                              '#0c5460'
                          }}>
                            {n.status || 'Pending'}
                          </span>
                        </td>
                        <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {n.message || '—'}
                        </td>
                        <td>
                          <a href={`/admin/notification/${n._id || n.id}`}
                            style={{ color: '#007bff', fontWeight: '500' }}>
                            View
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{
              padding: '16px 20px',
              background: '#fafafa',
              borderTop: '1px solid #eaeded',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ color: '#555' }}>
                Showing {(appliedFilters.page - 1) * appliedFilters.limit + 1} to{' '}
                {Math.min(appliedFilters.page * appliedFilters.limit, total)} of {total}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button onClick={() => handlePageChange(appliedFilters.page - 1)} disabled={appliedFilters.page === 1}
                  style={{ padding: '8px 12px', border: '1px solid #d5d9d9', background: 'white', borderRadius: '6px' }}>
                  Previous
                </button>
                <span style={{ padding: '8px 16px', background: '#232f3e', color: 'white', borderRadius: '6px' }}>
                  Page {appliedFilters.page}
                </span>
                <button onClick={() => handlePageChange(appliedFilters.page + 1)} disabled={appliedFilters.page * appliedFilters.limit >= total}
                  style={{ padding: '8px 12px', border: '1px solid #d5d9d9', background: 'white', borderRadius: '6px' }}>
                  Next
                </button>
              </div>
              <select value={appliedFilters.limit} onChange={e => {
                const limit = Number(e.target.value);
                setAppliedFilters(prev => ({ ...prev, limit, page: 1 }));
                setLocalFilters(prev => ({ ...prev, limit, page: 1 }));
              }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d5d9d9' }}>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Notifications;
