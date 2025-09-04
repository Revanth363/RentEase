// src/pages/admin/Messages.jsx
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLoading } from '../LoadingContext';
import LoadingSpinner from '../components/LoadingSpinner';
import styles from '../assets/css/AdminDashboard.module.css';
import AdminNavbar from '../components/AdminNavbar';

const Messages = () => {
  const { setIsLoading } = useLoading();
  const [searchParams, setSearchParams] = useSearchParams();

  const [messages, setMessages] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [localFilters, setLocalFilters] = useState({
    fromDate: searchParams.get('fromDate') || '',
    toDate: searchParams.get('toDate') || '',
    page: Number(searchParams.get('page')) || 1,
    limit: Number(searchParams.get('limit')) || 25,
  });

  const [appliedFilters, setAppliedFilters] = useState({ ...localFilters });

 const fetchData = useCallback(async () => {
  setLoading(true);
  setIsLoading(true);
  try {
    // Build query params for date filter
    const params = new URLSearchParams();
    if (appliedFilters.fromDate) params.set('fromDate', appliedFilters.fromDate);
    if (appliedFilters.toDate) params.set('toDate', appliedFilters.toDate);

    const url = params.toString() ? `/api/admin/messages?${params.toString()}` : '/api/admin/messages';

    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch');

    const data = await res.json();
    const allMessages = data.contactSubmissions || [];

    // Client-side pagination only
    setTotal(allMessages.length);
    const start = (appliedFilters.page - 1) * appliedFilters.limit;
    const paginated = allMessages.slice(start, start + appliedFilters.limit);

    setMessages(paginated);
  } catch (err) {
    console.error(err);
    alert('Failed to load contact messages');
    setMessages([]);
    setTotal(0);
  } finally {
    setLoading(false);
    setIsLoading(false);
  }
}, [appliedFilters, setIsLoading]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const applyFilters = () => {
    const newFilters = { ...localFilters, page: 1 };
    setAppliedFilters(newFilters);

    const params = new URLSearchParams();
    if (newFilters.fromDate) params.set('fromDate', newFilters.fromDate);
    if (newFilters.toDate) params.set('toDate', newFilters.toDate);
    setSearchParams(params, { replace: true });
  };

  const resetFilters = () => {
    const reset = { fromDate: '', toDate: '', page: 1, limit: 25 };
    setLocalFilters(reset);
    setAppliedFilters(reset);
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const handlePageChange = (newPage) => {
    setAppliedFilters(prev => ({ ...prev, page: newPage }));
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage);
    setSearchParams(params, { replace: true });
  };


  if (loading) {
    return <LoadingSpinner />;
  }
  

  return (
    <div className={styles.container}>
      <h1 className={styles.h1}>Contact Us Messages</h1>
      <AdminNavbar />

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* LEFT: Filter Panel */}
        <aside style={{
          width: '250px',
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
          <h3 style={{ margin: '0 0 20px', color: '#232f3e', fontSize: '18px' }}>Date Filter</h3>

          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>From Date</label>
              <input
                type="date"
                value={localFilters.fromDate}
                onChange={e => setLocalFilters(prev => ({ ...prev, fromDate: e.target.value }))}
                style={{ width: '260px', padding: '10px', borderRadius: '8px', border: '1px solid #d5d9d9' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>To Date</label>
              <input
                type="date"
                value={localFilters.toDate}
                onChange={e => setLocalFilters(prev => ({ ...prev, toDate: e.target.value }))}
                style={{ width: '260px', padding: '10px', borderRadius: '8px', border: '1px solid #d5d9d9' }}
              />
            </div>

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
                Contact Messages ({total})
              </h2>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '1000px' }}>
                <thead style={{ background: '#232f3e', color: 'white' }}>
                  <tr>
                    <th style={{ padding: '14px 12px', width: '120px' }}>ID</th>
                    <th style={{ padding: '14px 12px' }}>Name</th>
                    <th style={{ padding: '14px 12px' }}>Email</th>
                    <th style={{ padding: '14px 12px', width: '130px' }}>Phone</th>
                    <th style={{ padding: '14px 12px' }}>Subject</th>
                    <th style={{ padding: '14px 12px', width: '140px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '60px', color: '#555' }}>
                        No contact messages found.
                      </td>
                    </tr>
                  ) : (
                    messages.map(m => (
                      <tr key={m.id} style={{ borderBottom: '1px solid #eaeded' }}>
                        <td style={{ padding: '14px 12px', fontSize: '13px', fontWeight: '500' }}>
                          {m.id.slice(-8).toUpperCase()}
                        </td>
                        <td>
                          {m.userId ? (
                            <a href={`/admin/user/${m.userId}`} style={{ color: '#0066cc', fontWeight: '500' }}>
                              {m.name}
                            </a>
                          ) : (
                            <span>{m.name}</span>
                          )}
                        </td>
                        <td style={{ color: '#0066cc' }}>{m.email}</td>
                        <td>{m.phone}</td>
                        <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {m.subject}
                        </td>
                        <td>
                          <a
                            href={`/admin/message/${m.id}`}
                            style={{
                              padding: '8px 16px',
                              background: '#0066cc',
                              color: 'white',
                              borderRadius: '6px',
                              textDecoration: 'none',
                              fontSize: '13px',
                              fontWeight: '500'
                            }}
                          >
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
                Showing {(appliedFilters.page - 1) * appliedFilters.limit + 1} to {Math.min(appliedFilters.page * appliedFilters.limit, total)} of {total}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => handlePageChange(appliedFilters.page - 1)}
                  disabled={appliedFilters.page === 1}
                  style={{ padding: '8px 12px', border: '1px solid #d5d9d9', background: 'white', borderRadius: '6px' }}
                >Previous</button>
                <span style={{ padding: '8px 16px', background: '#232f3e', color: 'white', borderRadius: '6px' }}>
                  Page {appliedFilters.page}
                </span>
                <button
                  onClick={() => handlePageChange(appliedFilters.page + 1)}
                  disabled={appliedFilters.page * appliedFilters.limit >= total}
                  style={{ padding: '8px 12px', border: '1px solid #d5d9d9', background: 'white', borderRadius: '6px' }}
                >Next</button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Messages;