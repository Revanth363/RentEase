// src/pages/admin/WorkerPayments.jsx
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLoading } from '../context/useLoading';
import LoadingSpinner from '../components/LoadingSpinner';
import styles from '../assets/css/AdminDashboard.module.css';
import { fetchAdminWorkerPayments } from '../services/api';


const WorkerPayments = () => {
  const { setIsLoading } = useLoading();
  const [searchParams, setSearchParams] = useSearchParams();

  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [localFilters, setLocalFilters] = useState({
    paidByName: searchParams.get('paidByName') || '',
    receivedByName: searchParams.get('receivedByName') || '',
    status: searchParams.get('status') || '',
    paymentMethod: searchParams.get('paymentMethod') || '',
    transactionId: searchParams.get('transactionId') || '',
    fromDate: searchParams.get('fromDate') || '',
    toDate: searchParams.get('toDate') || '',
    page: Number(searchParams.get('page')) || 1,
    limit: Number(searchParams.get('limit')) || 25,
  });

  const [appliedFilters, setAppliedFilters] = useState({ ...localFilters });

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setIsLoading(true);
    try {
      const data = await fetchAdminWorkerPayments();

      let filtered = data.workerPayments || data;

      if (appliedFilters.paidByName) {
        const term = appliedFilters.paidByName.toLowerCase();
        filtered = filtered.filter(p => p.paidByName?.toLowerCase().includes(term));
      }
      if (appliedFilters.receivedByName) {
        const term = appliedFilters.receivedByName.toLowerCase();
        filtered = filtered.filter(p => p.receivedByName?.toLowerCase().includes(term));
      }
      if (appliedFilters.status) {
        filtered = filtered.filter(p => p.status === appliedFilters.status);
      }
      if (appliedFilters.paymentMethod) {
        filtered = filtered.filter(p => p.paymentMethod === appliedFilters.paymentMethod);
      }
      if (appliedFilters.transactionId) {
        const term = appliedFilters.transactionId.toLowerCase();
        filtered = filtered.filter(p => p.transactionId?.toLowerCase().includes(term));
      }
      if (appliedFilters.fromDate) {
        const from = new Date(appliedFilters.fromDate);
        filtered = filtered.filter(p => new Date(p.paymentDate) >= from);
      }
      if (appliedFilters.toDate) {
        const to = new Date(appliedFilters.toDate);
        to.setHours(23, 59, 59, 999);
        filtered = filtered.filter(p => new Date(p.paymentDate) <= to);
      }

      const totalCount = filtered.length;
      const start = (appliedFilters.page - 1) * appliedFilters.limit;
      const paginated = filtered.slice(start, start + appliedFilters.limit);

      setPayments(paginated);
      setTotal(totalCount);
    } catch (err) {
      console.error(err);
      alert('Failed to load worker payments');
      setPayments([]);
      setTotal(0);
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  }, [appliedFilters, setIsLoading]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const applyFilters = () => {
    const newFilters = { ...localFilters, page: 1 };
    setAppliedFilters(newFilters);

    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    if (newFilters.page === 1) params.delete('page');
    if (newFilters.limit === 25) params.delete('limit');
    setSearchParams(params, { replace: true });
  };

  const resetFilters = () => {
    const reset = {
      paidByName: '', receivedByName: '', status: '', paymentMethod: '',
      transactionId: '', fromDate: '', toDate: '', page: 1, limit: 25
    };
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
      <h1 className={styles.h1}>Worker Payments</h1>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* LEFT: Filter Panel */}
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
            {/* Paid By (Tenant Name) */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                Paid By (Tenant Name)
              </label>
              <input
                type="text"
                placeholder="Search tenant name..."
                value={localFilters.paidByName}
                onChange={e => handleFilterChange('paidByName', e.target.value)}
                style={{ width: '260px', padding: '10px', borderRadius: '8px', border: '1px solid #d5d9d9' }}
              />
            </div>

            {/* Received By (Worker Name) */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                Received By (Worker Name)
              </label>
              <input
                type="text"
                placeholder="Search worker name..."
                value={localFilters.receivedByName}
                onChange={e => handleFilterChange('receivedByName', e.target.value)}
                style={{ width: '260px', padding: '10px', borderRadius: '8px', border: '1px solid #d5d9d9' }}
              />
            </div>

            {/* Status */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Status</label>
              <select
                value={localFilters.status}
                onChange={e => handleFilterChange('status', e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d5d9d9' }}
              >
                <option value="">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Method</label>
              <select
                value={localFilters.paymentMethod}
                onChange={e => handleFilterChange('paymentMethod', e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d5d9d9' }}
              >
                <option value="">All Methods</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
              </select>
            </div>

            {/* Transaction ID */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Transaction ID</label>
              <input
                type="text"
                placeholder="Search transaction..."
                value={localFilters.transactionId}
                onChange={e => handleFilterChange('transactionId', e.target.value)}
                style={{ width: '260px', padding: '10px', borderRadius: '8px', border: '1px solid #d5d9d9' }}
              />
            </div>

            {/* Date Range */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>From Date</label>
              <input
                type="date"
                value={localFilters.fromDate}
                onChange={e => handleFilterChange('fromDate', e.target.value)}
                style={{ width: '260px', padding: '10px', borderRadius: '8px', border: '1px solid #d5d9d9' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>To Date</label>
              <input
                type="date"
                value={localFilters.toDate}
                onChange={e => handleFilterChange('toDate', e.target.value)}
                style={{ width: '260px', padding: '10px', borderRadius: '8px', border: '1px solid #d5d9d9' }}
              />
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
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

        {/* RIGHT: Table */}
        <section style={{ flex: 1, minWidth: '0' }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #eaeded', background: '#fafafa' }}>
              <h2 style={{ margin: 0, color: '#232f3e' }}>
                Worker Payments ({total.toLocaleString()})
              </h2>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '1200px', tableLayout: 'fixed' }}>
                <thead style={{ background: '#232f3e', color: 'white' }}>
                  <tr>
                    <th style={{ width: '80px', padding: '14px 12px' }}>ID</th>
                    <th style={{ width: '180px' }}>Paid By (Tenant)</th>
                    <th style={{ width: '180px' }}>Received By (Worker)</th>
                    <th style={{ width: '110px' }}>Status</th>
                    <th style={{ width: '120px' }}>Date</th>
                    <th style={{ width: '130px' }}>Method</th>
                    <th style={{ width: '180px' }}>Transaction ID</th>
                    <th style={{ width: '100px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr><td colSpan="8" style={{ textAlign: 'center', padding: '60px', color: '#555' }}>No worker payments found.</td></tr>
                  ) : (
                    payments.map(p => (
                      <tr key={p._id} style={{ borderBottom: '1px solid #eaeded' }}>
                        <td style={{ padding: '14px 12px' }}>{p.id.slice(-6)}</td>
                        <td><a href={`/admin/user/${p.paidById}/tenant`} style={{ color: '#0066cc' }}>{p.paidByName}</a></td>
                        <td><a href={`/admin/user/${p.receivedById}/worker`} style={{ color: '#0066cc' }}>{p.receivedByName}</a></td>
                        <td>
                          <span style={{
                            padding: '6px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600',
                            background: p.status === 'Paid' ? '#d4edda' : p.status === 'Pending' ? '#fff3cd' : '#f8d7da',
                            color: p.status === 'Paid' ? '#155724' : p.status === 'Pending' ? '#856404' : '#721c24'
                          }}>
                            {p.status}
                          </span>
                        </td>
                        <td>{new Date(p.paymentDate).toLocaleDateString()}</td>
                        <td>{p.paymentMethod}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{p.transactionId}</td>
                        <td>
                          <a href={`/admin/worker-payment/${p.id}`} style={{ color: '#007bff', fontSize: '14px' }}>View</a>
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
                Showing {(appliedFilters.page - 1) * appliedFilters.limit + 1} to {Math.min(appliedFilters.page * appliedFilters.limit, total)} of {total}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button onClick={() => handlePageChange(appliedFilters.page - 1)} disabled={appliedFilters.page === 1}
                  style={{ padding: '8px 12px', border: '1px solid #d5d9d9', background: 'white', borderRadius: '6px' }}>Previous</button>
                <span style={{ padding: '8px 16px', background: '#232f3e', color: 'white', borderRadius: '6px' }}>Page {appliedFilters.page}</span>
                <button onClick={() => handlePageChange(appliedFilters.page + 1)} disabled={appliedFilters.page * appliedFilters.limit >= total}
                  style={{ padding: '8px 12px', border: '1px solid #d5d9d9', background: 'white', borderRadius: '6px' }}>Next</button>
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

export default WorkerPayments;
