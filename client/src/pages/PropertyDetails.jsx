import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import styles from "../assets/css/PropertyDetails.module.css";

const PropertyDetails = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const propertyId = searchParams.get("id");

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    query: "",
  });

  // FETCH PROPERTY
  useEffect(() => {
    const fetchProperty = async () => {
      if (!propertyId) return setLoading(false);
      try {
        const res = await fetch(
          `http://localhost:5000/api/property/${propertyId}`
        );
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setProperty(data.property || data);
      } catch (err) {
        console.error(err);
        alert("Failed to load property");
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [propertyId]);

  // IMAGE NAVIGATION
  const goPrev = () =>
    setCurrentImageIndex((prev) =>
      prev === 0 ? property.images.length - 1 : prev - 1
    );
  const goNext = () =>
    setCurrentImageIndex((prev) =>
      prev === property.images.length - 1 ? 0 : prev + 1
    );

  // TOUCH SWIPE
  useEffect(() => {
    if (!property?.images?.length) return;
    const container = document.querySelector(`.${styles.mainImageContainer}`);
    let startX = 0;

    const handleStart = (e) => (startX = e.touches[0].clientX);
    const handleEnd = (e) => {
      if (!startX) return;
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) diff > 0 ? goNext() : goPrev();
      startX = 0;
    };

    container?.addEventListener("touchstart", handleStart);
    container?.addEventListener("touchend", handleEnd);
    return () => {
      container?.removeEventListener("touchstart", handleStart);
      container?.removeEventListener("touchend", handleEnd);
    };
  }, [property, currentImageIndex]);

  // CONTACT FORM
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(
        `http://localhost:5000/api/property/${propertyId}/contact`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );
      if (res.ok) {
        alert("Your query has been sent successfully!");
        setFormData({ name: "", phone: "", email: "", query: "" });
      } else alert("Failed to send query");
    } catch {
      alert("Network error");
    }
  };

  // LAZY LOAD MAP
  useEffect(() => {
    if (!property?.map) return;
    const timer = setTimeout(() => {
      const container = document.getElementById("map-container");
      const placeholder = document.getElementById("map-placeholder");
      if (container?.querySelector("iframe")) return;

      const iframe = document.createElement("iframe");
      iframe.src = property.map;
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      iframe.style.border = "0";
      iframe.allowFullscreen = true;
      iframe.loading = "lazy";
      iframe.onload = () => placeholder && (placeholder.style.display = "none");
      container.appendChild(iframe);
    }, 400);
    return () => clearTimeout(timer);
  }, [property]);

  if (loading)
    return <div className={styles.loading}>Loading property details...</div>;
  if (!property)
    return <div className={styles.container}>Property not found</div>;

  return (
    <div className={styles.container}>
      {/* IMAGE GALLERY */}
      <div className={styles.propertyGallery}>
        <div className={styles.mainImageContainer}>
          <img
            src={property.images[currentImageIndex]}
            alt="Property"
            className={styles.mainImage}
          />

          {/* PERFECT ARROWS - NO JUMPING */}
          <button
            onClick={goPrev}
            className={styles.navButton}
            style={{ left: "15px" }}
            aria-label="Previous"
          >
            <svg viewBox="0 0 24 24" width="36" height="36">
              <path
                fill="white"
                d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z"
              />
            </svg>
          </button>

          <button
            onClick={goNext}
            className={styles.navButton}
            style={{ right: "15px" }}
            aria-label="Next"
          >
            <svg viewBox="0 0 24 24" width="36" height="36">
              <path
                fill="white"
                d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"
              />
            </svg>
          </button>
        </div>

        {/* THUMBNAILS */}
        <div className={styles.thumbnailGallery}>
          {property.images.map((img, i) => (
            <img
              key={i}
              src={img}
              alt=""
              className={`${styles.thumbnail} ${
                i === currentImageIndex ? styles.active : ""
              }`}
              onClick={() => setCurrentImageIndex(i)}
            />
          ))}
        </div>
      </div>

      {/* HEADER */}
      <div className={styles.propertyHeader}>
        <div className={styles.propertyTitleSection}>
          <h1 className={styles.propertyTitle}>{property.name}</h1>
          <p className={styles.propertyLocation}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="#666"
              viewBox="0 0 16 16"
            >
              <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
            </svg>
            {property.location}
          </p>
          <p className={styles.propertyAddress}>
            <strong>Address:</strong> {property.address}
          </p>
          <p className={styles.propertyRatingReviews}>
            <strong>Rating:</strong> {property.rating || 0}/5 (
            {property.reviews || 0} Reviews)
          </p>
          <p className={styles.propertyRatingReviews}>
            <strong>Owner:</strong> {property.owner || "Not specified"}
          </p>
        </div>

        <div className={styles.propertyPriceSection}>
          <p className={styles.price}>₹{property.price?.toLocaleString()}</p>
          <button
            className={styles.contactNow}
            onClick={() => navigate(`/book-property?id=${property._id}`)}
          >
            Book Now
          </button>
        </div>
      </div>

      {/* DETAILS */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Property Details</h2>
        <div className={styles.propertyInfo}>
          <div className={styles.infoItem}>
            <span className={styles.infoIcon}>House</span> Type: {property.type}{" "}
            ({property.subtype})
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoIcon}>Bed</span> Bedrooms:{" "}
            {property.beds}
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoIcon}>Bath</span> Bathrooms:{" "}
            {property.baths}
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoIcon}>Size</span> Size:{" "}
            {property.size || "N/A"}
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoIcon}>Floor</span> Floor:{" "}
            {property.floor || "N/A"}
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoIcon}>Sofa</span> Furnished:{" "}
            {property.furnished}
          </div>
        </div>
        <div className={styles.propertyDescription}>{property.description}</div>
      </section>

      {/* AMENITIES */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Property Amenities</h2>
        <ul className={styles.amenitiesList}>
          {property.amenities?.length ? (
            property.amenities.map((a, i) => <li key={i}>{a}</li>)
          ) : (
            <li>No amenities listed</li>
          )}
        </ul>
      </section>

      {/* MAP */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Property Location</h2>
        <div className={styles.mapContainer} id="map-container">
          <div id="map-placeholder" className={styles.mapPlaceholder}>
            Loading Map...
          </div>
        </div>
      </section>

      {/* CONTACT FORM */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Send Query to Owner</h2>
        <form className={styles.contactForm} onSubmit={handleSubmit}>
          <div className={styles.formField}>
            <input
              name="name"
              placeholder="Your Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>
          <div className={styles.formField}>
            <input
              name="phone"
              placeholder="Your Phone Number"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              required
            />
          </div>
          <div className={`${styles.formField} ${styles.fullWidth}`}>
            <input
              name="email"
              type="email"
              placeholder="Your Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>
          <div className={`${styles.formField} ${styles.fullWidth}`}>
            <textarea
              name="query"
              rows="4"
              placeholder="Your Query"
              value={formData.query}
              onChange={(e) =>
                setFormData({ ...formData, query: e.target.value })
              }
              required
            />
          </div>
          <div className={`${styles.formField} ${styles.fullWidth}`}>
            <button type="submit" className={styles.submitBtn}>
              Send Query
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default PropertyDetails;
