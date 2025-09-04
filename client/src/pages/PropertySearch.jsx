// src/pages/PropertySearch.jsx
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import "../assets/css/PropertyFilters.css";
import "../assets/css/PropertySearch.css";
import LoadingSpinner from "../components/LoadingSpinner";

const PropertySearch = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [sortBy, setSortBy] = useState("rating");

  const sidebarRef = useRef(null);
  const overlayRef = useRef(null);
  const filterIconRef = useRef(null);

  const [filters, setFilters] = useState({
    location: searchParams.get("location") || "",
    "property-type": searchParams.get("property-type") || "",
    price: parseInt(searchParams.get("price")) || 15000,
    "bedroom-no": searchParams.get("bedroom-no") || "",
    "bathroom-no": searchParams.get("bathroom-no") || "",
    furnishing: searchParams.get("furnishing") || "",
    amenities: searchParams.get("amenities")?.split(",").filter(Boolean) || [],
  });

  // Check session
  useEffect(() => {
    axios
      .get("/api/check-session", { withCredentials: true })
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null));
  }, []);

  // Fetch properties
  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams(searchParams);
        const res = await axios.get("/api/search", { params });
        const data = res.data?.properties || res.data || [];
        setProperties(Array.isArray(data) ? data : []);
        setFilteredProperties(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching properties:", err);
        setProperties([]);
        setFilteredProperties([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, [searchParams]);

  // Apply client-side filters after fetching
  useEffect(() => {
    let filtered = [...properties];

    // All filtering now happens on backend, just apply sorting/display logic here if needed

    setFilteredProperties(filtered);
  }, [filters, properties]);

  // Client-side sorting
  useEffect(() => {
    const sorted = [...filteredProperties].sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        case "price-low-to-high":
          return (a.price || 0) - (b.price || 0);
        case "price-high-to-low":
          return (b.price || 0) - (a.price || 0);
        case "availability-soon": {
          const dateA = a.availableFrom
            ? new Date(a.availableFrom)
            : new Date(9999, 0, 1);
          const dateB = b.availableFrom
            ? new Date(b.availableFrom)
            : new Date(9999, 0, 1);
          return dateA - dateB;
        }
        default:
          return 0;
      }
    });
    setFilteredProperties(sorted);
  }, [sortBy]);

  // Toggle Sidebar (exact EJS behavior)
  const toggleSidebar = () => {
    const isActive = sidebarRef.current?.classList.contains("active");
    if (isActive) {
      sidebarRef.current?.classList.remove("active");
      overlayRef.current?.classList.remove("active");
      if (filterIconRef.current) filterIconRef.current.style.display = "block";
      document.body.style.overflow = "auto";
    } else {
      sidebarRef.current?.classList.add("active");
      overlayRef.current?.classList.add("active");
      if (filterIconRef.current) filterIconRef.current.style.display = "none";
      document.body.style.overflow = "hidden";
    }
    setSidebarOpen(!isActive);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && sidebarOpen) toggleSidebar();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [sidebarOpen]);

  const handleAmenityChange = (e) => {
    const { value, checked } = e.target;
    setFilters((prev) => ({
      ...prev,
      amenities: checked
        ? [...prev.amenities, value]
        : prev.amenities.filter((a) => a !== value),
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && (Array.isArray(value) ? value.length > 0 : value !== "")) {
        params.set(key, Array.isArray(value) ? value.join(",") : value);
      }
    });
    toggleSidebar();
    // Refresh page with new filters
    window.location.href = `/search?${params.toString()}`;
  };

  const saveProperty = async (id) => {
    if (!user) {
      alert("Please log in to save properties.");
      navigate(`/login?redirect=${encodeURIComponent(window.location.href)}`);
      return;
    }
    if (user.userType !== "tenant") {
      alert("Only tenants can save properties.");
      return;
    }
    try {
      await axios.post(
        "/api/tenant/saved-property",
        { propertyId: id, action: "save" },
        { withCredentials: true }
      );
      alert("Property saved successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save property.");
    }
  };


  if (loading) {
    return <LoadingSpinner />;
  }

  

  return (
    <div className="property-search-page">
      {/* Overlay */}
      <div 
        className="sidebar-overlay" 
        ref={overlayRef}
        onClick={toggleSidebar}
        style={{ cursor: 'pointer' }}
      ></div>

      {/* Filter Sidebar */}
      <aside className="filter-sidebar" ref={sidebarRef}>
        <button className="close-sidebar" onClick={toggleSidebar}>
          ×
        </button>
        <h2>Apply Filters</h2>
        <form onSubmit={handleSearch} className="filters">
          {/* ALL YOUR FILTERS — UNCHANGED */}
          <div className="filter-group">
            <label>Location:</label>
            <select
              value={filters.location}
              onChange={(e) =>
                setFilters({ ...filters, location: e.target.value })
              }
            >
              <option value="">All Locations</option>
              {[
                "chennai",
                "kolkata",
                "visakhapatnam",
                "mumbai",
                "hyderabad",
                "bangalore",
                "delhi",
              ].map((l) => (
                <option key={l} value={l}>
                  {l.charAt(0).toUpperCase() + l.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Property Type:</label>
            <select
              value={filters["property-type"]}
              onChange={(e) =>
                setFilters({ ...filters, "property-type": e.target.value })
              }
            >
              <option value="">All Types</option>
              <option value="flat">Flat</option>
              <option value="house">House</option>
              <option value="apartment">Apartment</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Max Price: ₹{filters.price.toLocaleString()}</label>
            <input
              type="range"
              min="3500"
              max="100000"
              step="1000"
              value={filters.price}
              onChange={(e) =>
                setFilters({ ...filters, price: +e.target.value })
              }
            />
            <div id="priceValue">₹{filters.price.toLocaleString()}</div>
          </div>

          <div className="filter-group">
            <label>Bedrooms:</label>
            <select
              value={filters["bedroom-no"]}
              onChange={(e) =>
                setFilters({ ...filters, "bedroom-no": e.target.value })
              }
            >
              <option value="">Any</option>
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n}+
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Bathrooms:</label>
            <select
              value={filters["bathroom-no"]}
              onChange={(e) =>
                setFilters({ ...filters, "bathroom-no": e.target.value })
              }
            >
              <option value="">Any</option>
              {[1, 2, 3].map((n) => (
                <option key={n} value={n}>
                  {n}+
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Furnishing:</label>
            <select
              value={filters.furnishing}
              onChange={(e) =>
                setFilters({ ...filters, furnishing: e.target.value })
              }
            >
              <option value="">Any</option>
              <option value="furnished">Furnished</option>
              <option value="semi-furnished">Semi-Furnished</option>
              <option value="unfurnished">Unfurnished</option>
            </select>
          </div>

          <fieldset>
            <legend>Amenities</legend>
            <div className="amenities-group">
              {[
                "parking",
                "wifi",
                "pool",
                "gym",
                "security",
                "balcony",
                "water supply",
                "kids play area",
                "lift",
              ].map((a) => (
                <label key={a}>
                  <input
                    type="checkbox"
                    value={a}
                    checked={filters.amenities.includes(a)}
                    onChange={handleAmenityChange}
                  />
                  {a
                    .split(" ")
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ")}
                </label>
              ))}
            </div>
          </fieldset>

          <button type="submit">Search Homes</button>
        </form>
      </aside>

      {/* Main Content */}
      <section className="content">
        <h2>Search Results ({filteredProperties.length})</h2>

        <div className="sort-options">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="rating">Rating</option>
            <option value="price-low-to-high">Price: Low to High</option>
            <option value="price-high-to-low">Price: High to Low</option>
            <option value="availability-soon">Available Soon</option>
          </select>
        </div>

        <ul className="property-grid">
          {filteredProperties.length === 0 ? (
            <p
              style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                padding: "80px",
                fontSize: "18px",
                color: "#666",
              }}
            >
              No properties found matching your criteria.
            </p>
          ) : (
            filteredProperties.map((property) => (
              <li key={property._id} className="property-card">
                <div className="property-image">
                  <img
                    src={(typeof property.images?.[0] === 'string' ? property.images[0] : property.images?.[0]?.url) || "/placeholder.jpg"}
                    alt={property.name}
                  />
                  <div className="property-type">
                    {property.subtype || property.type}
                  </div>
                </div>

                <div className="property-info">
                  {/* EXACT MATCH TO YOUR ORIGINAL EJS CARD */}
                  <h3 className="property-name">
                    {(property.subtype || property.type || 'Property').charAt(0).toUpperCase() +
                      (property.subtype || property.type || 'Property').slice(1)}{" "}
                    in {property.location}
                  </h3>
                  <p className="property-address">{property.address}</p>

                  <div className="property-features">
                    <div className="feature">
                      Bed {property.bedrooms || property.beds || 0} Bed{(property.bedrooms || property.beds || 0) > 1 ? "s" : ""}
                    </div>
                    <div className="feature">
                      Bath {property.bathrooms || property.baths || 0} Bath{(property.bathrooms || property.baths || 0) > 1 ? "s" : ""}
                    </div>
                    <div className="feature">
                      {property.furnished || "Unfurnished"}
                    </div>
                  </div>

                  <div className="rating">
                    <div className="stars">
                      {"★".repeat(Math.floor(property.rating || 0))}
                      {"☆".repeat(5 - Math.floor(property.rating || 0))}
                    </div>
                    <div className="review-count">
                      ({property.reviews || 0} reviews)
                    </div>
                  </div>

                  <div className="property-price">
                    ₹{property.price?.toLocaleString()}
                  </div>

                  {/* Amenities — Beautifully formatted */}
                  {property.amenities && property.amenities.length > 0 && (
                    <p
                      style={{
                        margin: "12px 0 15px",
                        fontSize: "13px",
                        color: "#555",
                        lineHeight: "1.4",
                      }}
                    >
                      <strong>Amenities:</strong>{" "}
                      {property.amenities
                        .map((a) => a.replace(/-/g, " "))
                        .map((a) => a.charAt(0).toUpperCase() + a.slice(1))
                        .join(", ")}
                    </p>
                  )}

                  <div className="property-footer">
                    <Link to={`/property?id=${property._id}`} className="btn">
                      View Details
                    </Link>

                    <button
                      className="wishlist-btn"
                      onClick={() => saveProperty(property._id)}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>

        
      </section>
    </div>
  );
};

export default PropertySearch;
