import React, { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('http://localhost:5000/api/admin', { credentials: 'include' });
        if (!res.ok) {
          if (res.status === 401) {
            window.location.href = '/login';
            return;
          }
          const txt = await res.text();
          try { const json = JSON.parse(txt); setError(json.error || txt); } catch { setError(txt); }
          setLoading(false);
          return;
        }
        const json = await res.json();
        if (!mounted) return;
        setData(json);
      } catch (err) {
        setError('Network error: ' + (err.message || err));
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div style={{ padding: 20 }}>Loading admin dashboard...</div>;
  if (error) return <div style={{ padding: 20, color: 'crimson' }}>Error: {error}</div>;
  if (!data) return null;

  const { stats = {}, properties = [], users = [], bookings = [] } = data;

  return (
    <div style={{ padding: 20 }}>
      <h1>Admin Dashboard</h1>
      <section style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Card title="Total Properties" value={stats.totalProperties} />
        <Card title="Total Renters" value={stats.totalRenters} />
        <Card title="Total Owners" value={stats.totalOwners} />
        <Card title="Total Workers" value={stats.totalWorkers} />
        <Card title="Active Rentals" value={stats.activeRentals} />
        <Card title="Total Revenue" value={stats.totalRevenue} />
      </section>

      <h2 style={{ marginTop: 20 }}>Recent Properties ({properties.length})</h2>
      <div style={{ display: 'grid', gap: 8 }}>
        {properties.slice(0, 6).map(p => (
          <div key={p.id} style={{ padding: 8, border: '1px solid #ddd', borderRadius: 6 }}>
            <strong>{p.name || p.title || 'Property'}</strong>
            <div>Owner: {p.ownerName || 'N/A'}</div>
            <div>Price: {p.price || 'N/A'}</div>
            <div>Status: {p.isRented ? 'Rented' : 'Available'}</div>
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: 20 }}>Recent Users ({users.length})</h2>
      <div style={{ display: 'grid', gap: 8 }}>
        {users.slice(0, 8).map(u => (
          <div key={u.id} style={{ padding: 8, border: '1px solid #eee', borderRadius: 6 }}>
            <strong>{u.firstName} {u.lastName}</strong> — {u.userType}
            <div>{u.email}</div>
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: 20 }}>Recent Bookings ({bookings.length})</h2>
      <div style={{ display: 'grid', gap: 8 }}>
        {bookings.slice(0, 8).map(b => (
          <div key={b.id} style={{ padding: 8, border: '1px solid #eee', borderRadius: 6 }}>
            <strong>{b.userName}</strong> — {b.propertyName}
            <div>Status: {b.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div style={{ minWidth: 160, padding: 12, borderRadius: 8, background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <div style={{ fontSize: 12, color: '#666' }}>{title}</div>
      <div style={{ fontSize: 20, fontWeight: 700 }}>{value ?? '—'}</div>
    </div>
  );
}
