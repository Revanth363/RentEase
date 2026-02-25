// src/pages/WorkerServices.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { FiFilter } from 'react-icons/fi';
import styles from '../assets/css/WorkerServices.module.css';
import WorkerCard from '../pages/WorkerCard';
import { useSearchParams } from 'react-router-dom';
import { fetchWorkers, fetchWorkerFilters, filterWorkers } from '../services/api';
import { useLoading } from '../context/useLoading'; // Added

export default function WorkerServices() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtersActive, setFiltersActive] = useState(false);
  const sidebarRef = React.useRef(null);
  const overlayRef = React.useRef(null);
  const filterIconRef = React.useRef(null);

  const { setIsLoading } = useLoading(); // Using global loading

  const [filters, setFilters] = useState({
    location: searchParams.get('location') || '',
    area: searchParams.get('area') || '',
    serviceType: searchParams.get('serviceType') || '',
    price: searchParams.get('price') || '',
    rating: searchParams.get('rating') || ''
  });

  const [locations, setLocations] = useState([]);
  const [areas, setAreas] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);

  const loadFilterOptions = useCallback(async () => {
    try {
      const data = await fetchWorkerFilters();
      setLocations(data.locations || []);
      setAreas(data.areas || []);
      setServiceTypes(data.serviceTypes || []);
    } catch (err) {
      console.error('Failed to load filter options:', err);
    }
  }, []);

  const loadWorkers = useCallback(async (currentFilters) => {
    setLoading(true);
    setIsLoading(true); // Global loading ON
    setError('');
    try {
      const hasFilters = Object.values(currentFilters).some(v => v);
      const data = hasFilters ? await filterWorkers(currentFilters) : await fetchWorkers();
      setWorkers(data || []);
    } catch (err) {
      setError(err.message || 'Error fetching workers');
    } finally {
      setLoading(false);
      setIsLoading(false); // Global loading OFF
    }
  }, [setIsLoading]);

  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  useEffect(() => {
    const currentFilters = {
      location: searchParams.get('location') || '',
      area: searchParams.get('area') || '',
      serviceType: searchParams.get('serviceType') || '',
      price: searchParams.get('price') || '',
      rating: searchParams.get('rating') || ''
    };
    setFilters(currentFilters);
    loadWorkers(currentFilters);
  }, [searchParams, loadWorkers]);

  function handleLocationChange(e) {
    const location = e.target.value;
    setFilters((s) => ({ ...s, location, area: '' }));
  }

  function handleFilterApply() {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    setSearchParams(params);
    setFiltersActive(false);
  }

  function clearFilters() {
    setFilters({ location: '', area: '', serviceType: '', price: '', rating: '' });
    setSearchParams({});
  }

  function toggleSidebar() {
    const isActive = sidebarRef.current?.classList.contains('active');
    if (isActive) {
      sidebarRef.current?.classList.remove('active');
      overlayRef.current?.classList.remove('active');
      if (filterIconRef.current) filterIconRef.current.style.display = 'block';
      document.body.style.overflow = 'auto';
    } else {
      sidebarRef.current?.classList.add('active');
      overlayRef.current?.classList.add('active');
      if (filterIconRef.current) filterIconRef.current.style.display = 'none';
      document.body.style.overflow = 'hidden';
    }
    setFiltersActive(!isActive);
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', paddingTop: '90px' }}>
      <div className={styles.root}>
        
        <button 
          className={styles.filterToggle} 
          onClick={toggleSidebar}
          ref={filterIconRef}
        >
          <FiFilter size={18} />
        </button>

        <div 
          className={styles.overlay} 
          ref={overlayRef}
          onClick={toggleSidebar}
          style={{ cursor: 'pointer' }}
        ></div>

        <h1 className={styles.title}>Find Domestic Workers</h1>

        <div className={styles.layout}>
          <aside className={`${styles.sidebar} ${filtersActive ? styles.active : ''}`} ref={sidebarRef}>
            <button className={styles.closeSidebar} onClick={toggleSidebar}>
              ×
            </button>
            <div className={styles.filterCard}>
              <h3 className={styles.filterTitle}>Search Location</h3>
              <div className={styles.group}>
                <label>City</label>
                <select name="location" value={filters.location} onChange={handleLocationChange}>
                  <option value="">Select City</option>
                  {locations.map(loc => (
                    <option key={loc} value={loc}>{loc.charAt(0).toUpperCase() + loc.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className={styles.group}>
                <label>Area</label>
                <select name="area" value={filters.area} onChange={(e) => setFilters(s => ({ ...s, area: e.target.value }))} disabled={!filters.location}>
                  <option value="">Select Area</option>
                  {areas.map(a => (
                    <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className={styles.actions}>
                <button className={styles.apply} onClick={handleFilterApply}>Search</button>
              </div>
            </div>

            <div className={styles.filterCard}>
              <h3 className={styles.filterTitle}>Filters</h3>
              <div className={styles.groupRow}>
                <div>
                  <label>Service Type</label>
                  <select name="serviceType" value={filters.serviceType} onChange={(e) => setFilters(s => ({ ...s, serviceType: e.target.value }))}>
                    <option value="">All Services</option>
                    {serviceTypes.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
                <div>
                  <label>Price Range</label>
                  <select name="price" value={filters.price} onChange={(e) => setFilters(s => ({ ...s, price: e.target.value }))}>
                    <option value="">All Prices</option>
                    <option value="0-5000">₹0 - ₹5,000</option>
                    <option value="5001-10000">₹5,001 - ₹10,000</option>
                    <option value="10001-15000">₹10,001 - ₹15,000</option>
                    <option value="15001+">₹15,001+</option>
                  </select>
                </div>
                <div>
                  <label>Min Rating</label>
                  <select name="rating" value={filters.rating} onChange={(e) => setFilters(s => ({ ...s, rating: e.target.value }))}>
                    <option value="">Any Rating</option>
                    <option value="4">4+ Stars</option>
                    <option value="3">3+ Stars</option>
                    <option value="2">2+ Stars</option>
                  </select>
                </div>
              </div>
              <div className={styles.actions}>
                <button className={styles.clear} onClick={clearFilters}>Clear</button>
                <button className={styles.apply} onClick={handleFilterApply}>Apply</button>
              </div>
            </div>
          </aside>

          <section className={styles.main}>
            {loading && <p className={styles.message}>Loading workers...</p>}
            {error && <p className={styles.error}>{error}</p>}

            <div 
              className={styles.grid}
              style={{
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '2rem',
                maxWidth: '1400px',
                margin: '0 auto'
              }}
            >
              {workers.length === 0 && !loading && (
                <p className={styles.message}>No workers found matching your criteria</p>
              )}

              {workers.map((worker) => (
                <WorkerCard key={worker._id} worker={worker} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
