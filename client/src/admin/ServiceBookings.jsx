// src/pages/admin/ServiceBookings.jsx
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLoading } from '../context/useLoading';
import LoadingSpinner from '../components/LoadingSpinner';
import styles from '../assets/css/AdminDashboard.module.css';
import { fetchAdminWorkerBookings } from '../services/api';


const ServiceBookings = () => {
  const { setIsLoading } = useLoading();
  const [searchParams, setSearchParams] = useSearchParams();

  const [bookings, setBookings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Local filters (what user types/selects)
  const [localFilters, setLocalFilters] = useState({
    status: searchParams.get('status') || '',
    tenantName: searchParams.get('tenantName') || '',
    workerName: searchParams.get('workerName') || '',
    fromDate: searchParams.get('fromDate') || '',
    toDate: searchParams.get('toDate') || '',
    minAmount: searchParams.get('minAmount') || '',
    maxAmount: searchParams.get('maxAmount') || '',
    page: Number(searchParams.get('page')) || 1,
    limit: Number(searchParams.get('limit')) || 25,
  });

  // Applied filters (what's actually sent to backend)
  const [appliedFilters, setAppliedFilters] = useState({ ...localFilters });

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      Object.keys(appliedFilters).forEach(key => {
        if (appliedFilters[key]) params.append(key, appliedFilters[key]);
      });

      const res = await fetchAdminWorkerBookings(`?${params.toString()}`);
      setBookings(res.bookings || res);
      setTotal(res.total || res.length);
    } catch (err) {
      console.error('Failed to load bookings:', err);
      alert('Failed to load bookings');
      setBookings([]);
      setTotal(0);
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  }, [appliedFilters, setIsLoading]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const applyFilters = () => {
    const newApplied = { ...localFilters, page: 1 };
    setAppliedFilters(newApplied);

    const params = new URLSearchParams();
    Object.keys(newApplied).forEach(key => {
      if (newApplied[key]) params.set(key, newApplied[key]);
    });
    if (newApplied.page === 1) params.delete('page');
    if (newApplied.limit === 25) params.delete('limit');
    setSearchParams(params, { replace: true });
  };

  const resetFilters = () => {
    const reset = {
      status: '', tenantName: '', workerName: '', fromDate: '', toDate: '',
      minAmount: '', maxAmount: '', page: 1, limit: 25
    };
    setLocalFilters(reset);
    setAppliedFilters(reset);
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const handleFilterChange = (key, value) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handlePageChange = (newPage) => {
    setAppliedFilters(prev => ({ ...prev, page: newPage }));
    setLocalFilters(prev => ({ ...prev, page: newPage }));
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage);
    setSearchParams(params, { replace: true });
  };

  const handleLimitChange = (newLimit) => {
    const limit = Number(newLimit);
    setAppliedFilters(prev => ({ ...prev, limit, page: 1 }));
    setLocalFilters(prev => ({ ...prev, limit, page: 1 }));
    const params = new URLSearchParams(searchParams);
    params.set('limit', limit);
    params.set('page', '1');
    setSearchParams(params, { replace: true });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  

  return (
    <div className={styles.container}>
      <h1 className={styles.h1}>Service Bookings</h1>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* LEFT: Filter Panel */}
        <aside style={{
          width: '380px',
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
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Tenant Name</label>
              <input
                type="text"
                placeholder="Search by tenant name"
                value={localFilters.tenantName}
                onChange={e => handleFilterChange('tenantName', e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d5d9d9' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Worker Name</label>
              <input
                type="text"
                placeholder="Search by worker name"
                value={localFilters.workerName}
                onChange={e => handleFilterChange('workerName', e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d5d9d9' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Status</label>
              <select
                value={localFilters.status}
                onChange={e => handleFilterChange('status', e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d5d9d9' }}
              >
                <option value="">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Active">Active</option>
                <option value="Approved">Approved</option>
                <option value="Completed">Completed</option>
                <option value="Terminated">Terminated</option>
                <option value="Declined">Declined</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Booked From</label>
              <input
                type="date"
                value={localFilters.fromDate}
                onChange={e => handleFilterChange('fromDate', e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d5d9d9' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Booked To</label>
              <input
                type="date"
                value={localFilters.toDate}
                onChange={e => handleFilterChange('toDate', e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d5d9d9' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Min Amount (₹)</label>
              <input
                type="number"
                placeholder="Min price"
                value={localFilters.minAmount}
                onChange={e => handleFilterChange('minAmount', e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d5d9d9' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Max Amount (₹)</label>
              <input
                type="number"
                placeholder="Max price"
                value={localFilters.maxAmount}
                onChange={e => handleFilterChange('maxAmount', e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d5d9d9' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                onClick={applyFilters}
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
                Service Bookings ({total.toLocaleString()})
              </h2>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '1400px', tableLayout: 'fixed' }}>
                <thead style={{ background: '#232f3e', color: 'white' }}>
                  <tr>
                    <th style={{ width: '80px', padding: '14px 12px' }}>ID</th>
                    <th style={{ width: '140px' }}>Tenant</th>
                    <th style={{ width: '160px' }}>Property</th>
                    <th style={{ width: '140px' }}>Worker</th>
                    <th style={{ width: '130px' }}>Service Type</th>
                    <th style={{ width: '100px' }}>Status</th>
                    <th style={{ width: '120px' }}>Booking Date</th>
                    <th style={{ width: '110px' }}>Amount</th>
                    <th style={{ width: '200px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '60px', color: '#555' }}>
                        No service bookings found.
                      </td>
                    </tr>
                  ) : (
                    bookings.map(b => (
                      <tr key={b.id} style={{ borderBottom: '1px solid #eaeded' }}>
                        <td style={{ padding: '14px 12px', fontWeight: '500', fontSize: '13px' }}>{b.id.substring(0, 8)}...</td>
                        <td>
                          {b.tenantId ? (
                            <a href={`/admin/user/${b.tenantId}/tenant`} style={{ color: '#0066cc' }}>
                              {b.tenantName || 'N/A'}
                            </a>
                          ) : (
                            <span>{b.tenantName || 'N/A'}</span>
                          )}
                        </td>
                        <td>
                          {b.propertyId ? (
                            <a href={`/admin/property/${b.propertyId}`} style={{ color: '#0066cc' }}>
                              {b.propertyName}
                            </a>
                          ) : (
                            <span style={{ color: '#999', fontStyle: 'italic' }}>N/A</span>
                          )}
                        </td>
                        <td>
                          {b.workerId && b.workerName !== 'Not Available' ? (
                            <a href={`/admin/user/${b.workerId}/worker`} style={{ color: '#0066cc' }}>
                              {b.workerName}
                            </a>
                          ) : (
                            <span style={{ color: '#999', fontStyle: 'italic' }}>Not Available</span>
                          )}
                        </td>
                        <td>{b.serviceType || 'N/A'}</td>
                        <td>
                          <span style={{
                            padding: '6px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            background: 
                              b.status === 'Active' || b.status === 'Approved' ? '#d4edda' :
                              b.status === 'Pending' ? '#fff3cd' :
                              b.status === 'Completed' ? '#d1ecf1' :
                              '#f8d7da',
                            color:
                              b.status === 'Active' || b.status === 'Approved' ? '#155724' :
                              b.status === 'Pending' ? '#856404' :
                              b.status === 'Completed' ? '#0c5460' :
                              '#721c24'
                          }}>
                            {b.status}
                          </span>
                        </td>
                        <td>{b.bookingDate ? new Date(b.bookingDate).toLocaleDateString() : 'N/A'}</td>
                        <td style={{ fontWeight: '600' }}>
                          {b.price > 0 ? `₹${b.price.toLocaleString()}` : <span style={{ color: '#999', fontStyle: 'italic' }}>Not Available</span>}
                        </td>
                        <td>
                          <div className={styles['action-buttons']}>
                            <a href={b.type === 'property' ? `/admin/booking/${b.id}` : `/admin/worker-booking/${b.id}`}>
                              View
                            </a>
                            
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
                Showing {(appliedFilters.page - 1) * appliedFilters.limit + 1} to {Math.min(appliedFilters.page * appliedFilters.limit, total)} of {total} bookings
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => handlePageChange(appliedFilters.page - 1)}
                  disabled={appliedFilters.page === 1}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #d5d9d9',
                    background: 'white',
                    borderRadius: '6px',
                    cursor: appliedFilters.page === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Previous
                </button>
                <span style={{ padding: '8px 16px', background: '#232f3e', color: 'white', borderRadius: '6px' }}>
                  Page {appliedFilters.page}
                </span>
                <button
                  onClick={() => handlePageChange(appliedFilters.page + 1)}
                  disabled={appliedFilters.page * appliedFilters.limit >= total}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #d5d9d9',
                    background: 'white',
                    borderRadius: '6px',
                    cursor: appliedFilters.page * appliedFilters.limit >= total ? 'not-allowed' : 'pointer'
                  }}
                >
                  Next
                </button>
              </div>
              <select
                value={appliedFilters.limit}
                onChange={e => handleLimitChange(e.target.value)}
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
