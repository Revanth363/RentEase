import React, { useEffect, useState, useCallback } from 'react';
import styles from '../assets/css/WorkerCard.module.css';
import servicesStyles from '../assets/css/WorkerServices.module.css';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchWorkers, fetchWorkerFilters, filterWorkers } from '../services/api';

export default function WorkerServices() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtersActive, setFiltersActive] = useState(false);
  
  // Initialize filters from URL params
  const [filters, setFilters] = useState({
    location: searchParams.get('location') || '',
    area: searchParams.get('area') || '',
    serviceType: searchParams.get('serviceType') || '',
    price: searchParams.get('price') || '',
    rating: searchParams.get('rating') || ''
  });

  // Dynamic filter options from backend
  const [locations, setLocations] = useState([]);
  const [areas, setAreas] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);

  // Load filter options from backend
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

  // Load workers from backend with current filters
  const loadWorkers = useCallback(async (currentFilters) => {
    setLoading(true);
    setError('');
    try {
      // Use filterWorkers API when any filter is applied
      const hasFilters = Object.values(currentFilters).some(v => v);
      const data = hasFilters 
        ? await filterWorkers(currentFilters)
        : await fetchWorkers();
      setWorkers(data || []);
    } catch (err) {
      setError(err.message || 'Error fetching workers');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch filters and workers on mount
  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  // Load workers when filters change (from URL params)
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

  // Handle location change - reset area when location changes
  function handleLocationChange(e) {
    const location = e.target.value;
    setFilters((s) => ({ ...s, location, area: '' }));
  }

  // Handle generic filter change
  function handleFilterChange(e) {
    const { name, value } = e.target;
    setFilters((s) => ({ ...s, [name]: value }));
  }

  // Apply filters - update URL params which triggers data fetch
  function applyFilters() {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    setSearchParams(params);
    setFiltersActive(false);
  }

  // Clear all filters and reset URL
  function clearFilters() {
    setFilters({ location: '', area: '', serviceType: '', price: '', rating: '' });
    setSearchParams({});
  }

  return (
    <main className={servicesStyles.root}>
      <button className={servicesStyles.filterToggle} onClick={() => setFiltersActive((s) => !s)}>Filters</button>
      <h1 className={servicesStyles.pageTitle}></h1>
      <div className={servicesStyles.layout}>
        <aside className={`${servicesStyles.sidebar} ${filtersActive ? servicesStyles.active : ''}`}>
          <div className={servicesStyles.filterCard}>
            <h3 className={servicesStyles.filterTitle}>Search Location</h3>
            <div className={servicesStyles.group}>
              <label>City</label>
              <select name="location" value={filters.location} onChange={handleLocationChange}>
                <option value="">Select City</option>
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc.charAt(0).toUpperCase() + loc.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className={servicesStyles.group}>
              <label>Area</label>
              <select name="area" value={filters.area} onChange={handleFilterChange} disabled={!filters.location}>
                <option value="">Select Area</option>
                {areas.map(a => (
                  <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className={servicesStyles.actions}><button className={servicesStyles.apply} onClick={applyFilters}>Search</button></div>
          </div>

          <div className={servicesStyles.filterCard}>
            <h3 className={servicesStyles.filterTitle}>Filters</h3>
            <div className={servicesStyles.groupRow}>
              <div>
                <label>Service Type</label>
                <select name="serviceType" value={filters.serviceType} onChange={handleFilterChange}>
                  <option value="">All Services</option>
                  {serviceTypes.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Price Range</label>
                <select name="price" value={filters.price} onChange={handleFilterChange}>
                  <option value="">All Prices</option>
                  <option value="0-5000">₹0 - ₹5,000</option>
                  <option value="5001-10000">₹5,001 - ₹10,000</option>
                  <option value="10001-15000">₹10,001 - ₹15,000</option>
                  <option value="15001+">₹15,001+</option>
                </select>
              </div>

              <div>
                <label>Min Rating</label>
                <select name="rating" value={filters.rating} onChange={handleFilterChange}>
                  <option value="">Any Rating</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="2">2+ Stars</option>
                </select>
              </div>
            </div>
            <div className={servicesStyles.actions}>
              <button className={servicesStyles.clear} onClick={clearFilters}>Clear</button>
              <button className={servicesStyles.apply} onClick={applyFilters}>Apply</button>
            </div>
          </div>
        </aside>

        <section className={servicesStyles.main}>
          {loading ? <p className={servicesStyles.message}>Loading workers...</p> : null}
          {error ? <p className={servicesStyles.error}>{error}</p> : null}

          <div className={servicesStyles.grid}>
            {workers.length === 0 && !loading && (
              <p className={servicesStyles.message}>No workers found matching your criteria</p>
            )}
            {workers.map((worker) => {
              // Extract worker data from Worker model fields
              const id = worker._id || worker.id;
              const firstName = worker.firstName || '';
              const lastName = worker.lastName || '';
              const fullName = `${firstName} ${lastName}`.trim() || 'Worker';
              
              // Image from Worker model
              const image = worker.image || '/images/default-worker.jpg';
              
              // Location and area from Worker model
              const workerLocation = worker.location || '';
              const workerArea = worker.area || '';
              const displayLocation = workerArea ? `${workerLocation}, ${workerArea}` : workerLocation;
              
              // Service details from Worker model
              const serviceType = worker.serviceType || '';
              const price = worker.price || 0;
              const rateUnit = worker.rateUnit || 'monthly';
              const experience = worker.experience || 0;
              const availability = worker.availability || '';
              const serviceStatus = worker.serviceStatus || 'Available';
              
              // Rating from Worker model (populated ratingId or embedded)
              const rating = worker.ratingId?.average ?? 'N/A';
              
              // Availability status
              const isAvailable = serviceStatus === 'Available' && !worker.isBooked;

              return (
                <div key={id} className={servicesStyles.card}>
                  <div className={servicesStyles.cardImage}>
                    <img 
                      src={image} 
                      alt={fullName} 
                      onError={(e) => { e.currentTarget.src = '/images/default-worker.jpg'; }} 
                    />
                    {serviceType && (
                      <div className={servicesStyles.serviceBadge}>
                        {serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}
                      </div>
                    )}
                    <div className={servicesStyles.ratingBadge}>★ {rating}</div>
                    {!isAvailable && (
                      <div className={servicesStyles.unavailableBadge}>Booked</div>
                    )}
                  </div>

                  <div className={servicesStyles.cardContent}>
                    <div className={servicesStyles.workerName}>{fullName}</div>
                    {displayLocation && (
                      <div className={servicesStyles.workerLocation}>
                        <i className="fa fa-map-marker" style={{marginRight: '5px'}}></i>
                        {displayLocation}
                      </div>
                    )}
                    
                    <div className={servicesStyles.workerDetails}>
                      <div className={servicesStyles.workerPrice}>
                        {price ? `₹${Number(price).toLocaleString()}` : 'Contact'}
                        <span className={servicesStyles.rateUnit}>/{rateUnit}</span>
                      </div>
                      <div className={servicesStyles.workerExp}>
                        <i className="fa fa-briefcase" style={{marginRight: '4px'}}></i>
                        {experience} {experience === 1 ? 'year' : 'years'}
                      </div>
                    </div>

                    {availability && (
                      <div className={servicesStyles.availabilityTag}>
                        {availability.charAt(0).toUpperCase() + availability.slice(1)}
                      </div>
                    )}

                    <Link 
                      to={`/worker/${id}`} 
                      className={servicesStyles.viewButton}
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}