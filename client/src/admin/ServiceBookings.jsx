// src/pages/admin/ServiceBookings.jsx
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLoading } from '../LoadingContext';
import LoadingSpinner from '../components/LoadingSpinner';
import styles from '../assets/css/AdminDashboard.module.css';
import { fetchAdminBookings } from '../services/api';
import AdminNavbar from '../components/AdminNavbar';

const ServiceBookings = () => {
  const { setIsLoading } = useLoading();
  const [searchParams, setSearchParams] = useSearchParams();

  const [bookings, setBookings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    propertyId: searchParams.get('propertyId') || '',
    workerId: searchParams.get('workerId') || '',
    fromDate: searchParams.get('fromDate') || '',
    toDate: searchParams.get('toDate') || '',
    page: Number(searchParams.get('page')) || 1,
    limit: Number(searchParams.get('limit')) || 25,
  });

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });

      const res = await fetchAdminBookings(`?${params.toString()}`);
      setBookings(res.bookings || res);
      setTotal(res.total || res.length);
    } catch (err) {
      alert('Failed to load bookings');
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  }, [filters, setIsLoading]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    const newParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) newParams.set(key, filters[key]);
    });
    setSearchParams(newParams, { replace: true });
  }, [filters, setSearchParams]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const resetFilters = () => {
    setFilters({
      status: '', propertyId: '', workerId: '', fromDate: '', toDate: '',
      page: 1, limit: 25
    });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className={styles.container}>
      <h1 className={styles.h1}>Service Bookings</h1>
      <AdminNavbar />

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* LEFT: Filter Panel */}
        <aside style={{
          width: '320px',
          minWidth: '280px',
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
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Status</label>
              <select
                value={filters.status}
                onChange={e => handleFilterChange('status', e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d5d9d9' }}
              >
                <option value="">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Terminated">Terminated</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Property ID</label>
              <input
                type="text"
                placeholder="e.g. PROP123"
                value={filters.propertyId}
                onChange={e => handleFilterChange('propertyId', e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d5d9d9' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Worker ID</label>
              <input
                type="text"
                placeholder="e.g. WORK456"
                value={filters.workerId}
                onChange={e => handleFilterChange('workerId', e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d5d9d9' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>From Date</label>
              <input
                type="date"
                value={filters.fromDate}
                onChange={e => handleFilterChange('fromDate', e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d5d9d9' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>To Date</label>
              <input
                type="date"
                value={filters.toDate}
                onChange={e => handleFilterChange('toDate', e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d5d9d9' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                onClick={fetchBookings}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#ff9900',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Apply Filters
              </button>
              <button
                onClick={resetFilters}
                style={{
                  padding: '12px 16px',
                  background: '#fff',
                  color: '#555',
                  border: '1px solid #d5d9d9',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </aside>

        {/* RIGHT: Table + Pagination */}
        <section style={{ flex: 1, minWidth: '0' }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #eaeded', background: '#fafafa' }}>
              <h2 style={{ margin: 0, color: '#232f3e' }}>
                Bookings ({total.toLocaleString()})
              </h2>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '1500px', tableLayout: 'fixed' }}>
                <thead style={{ background: '#232f3e', color: 'white' }}>
                  <tr>
                    <th style={{ width: '90px', padding: '14px 12px' }}>ID</th>
                    <th style={{ width: '140px' }}>Tenant</th>
                    <th style={{ width: '160px' }}>Property</th>
                    <th style={{ width: '140px' }}>Worker</th>
                    <th style={{ width: '100px' }}>Status</th>
                    <th style={{ width: '110px' }}>Booked</th>
                    <th style={{ width: '110px' }}>Start</th>
                    <th style={{ width: '110px' }}>End</th>
                    <th style={{ width: '110px' }}>Amount</th>
                    <th style={{ width: '220px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center', padding: '60px', color: '#555' }}>
                        No bookings found.
                      </td>
                    </tr>
                  ) : (
                    bookings.map(b => (
                      <tr key={b.id} style={{ borderBottom: '1px solid #eaeded' }}>
                        <td style={{ padding: '14px 12px', fontWeight: '500' }}>{b.id}</td>
                        <td><a href={`/admin/user/${b.userId}/tenant`} style={{ color: '#0066cc' }}>{b.userName}</a></td>
                        <td><a href={`/admin/property/${b.propertyIdStr}`} style={{ color: '#0066cc' }}>{b.propertyName}</a></td>
                        <td>
                          {b.workerId ? (
                            <a href={`/admin/user/${b.workerId}/worker`} style={{ color: '#0066cc' }}>{b.workerName}</a>
                          ) : (
                            <span style={{ color: '#999' }}>Not Assigned</span>
                          )}
                        </td>
                        <td>
                          <span style={{
                            padding: '6px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            background: 
                              b.status === 'Active' ? '#d4edda' :
                              b.status === 'Pending' ? '#fff3cd' :
                              b.status === 'Completed' ? '#d1ecf1' :
                              '#f8d7da',
                            color:
                              b.status === 'Active' ? '#155724' :
                              b.status === 'Pending' ? '#856404' :
                              b.status === 'Completed' ? '#0c5460' :
                              '#721c24'
                          }}>
                            {b.status}
                          </span>
                        </td>
                        <td>{b.bookingDate ? new Date(b.bookingDate).toLocaleDateString() : 'N/A'}</td>
                        <td>{b.startDate ? new Date(b.startDate).toLocaleDateString() : 'N/A'}</td>
                        <td>{b.endDate ? new Date(b.endDate).toLocaleDateString() : 'N/A'}</td>
                        <td style={{ fontWeight: '600' }}>₹{b.price?.toLocaleString()}</td>
                        <td>
                          <div className={styles['action-buttons']}>
                            <a href={`/admin/booking/${b.id}`}>View</a>
                            {b.status === 'Pending' && (
                              <>
                                <button className={styles.success}>Approve</button>
                                <button className={styles.danger}>Reject</button>
                              </>
                            )}
                          </div>
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
                Showing {(filters.page - 1) * filters.limit + 1} to {Math.min(filters.page * filters.limit, total)} of {total} bookings
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={filters.page === 1}
                  style={{ padding: '8px 12px', border: '1px solid #d5d9d9', background: 'white', borderRadius: '6px' }}
                >Previous</button>
                <span style={{ padding: '8px 16px', background: '#232f3e', color: 'white', borderRadius: '6px' }}>
                  Page {filters.page}
                </span>
                <button
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={filters.page * filters.limit >= total}
                  style={{ padding: '8px 12px', border: '1px solid #d5d9d9', background: 'white', borderRadius: '6px' }}
                >Next</button>
              </div>
              <select
                value={filters.limit}
                onChange={e => setFilters(prev => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
                style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d5d9d9' }}
              >
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

export default ServiceBookings;