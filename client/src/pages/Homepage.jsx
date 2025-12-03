import {
  faFacebookF,
  faInstagram,
  faLinkedinIn,
  faTwitter,
} from "@fortawesome/free-brands-svg-icons";
import {
  faBroom,
  faEnvelope,
  faHandHoldingDollar,
  faHome,
  faList,
  faMapMarkerAlt,
  faPaperPlane,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from '../services/axiosConfig';
import styles from "../assets/css/Homepage.module.css";
import { fetchProperties, fetchSliderProperties } from "../services/api";

import { useLoading } from '../context/useLoading';
import LoadingSpinner from "../components/LoadingSpinner";

const HomePage = () => {
  const [propertiesData, setPropertiesData] = useState([]);
  const [sliderPropertiesData, setSliderPropertiesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex1, setCurrentIndex1] = useState(0);
  const [currentIndex2, setCurrentIndex2] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [articlesPerPage, setArticlesPerPage] = useState(4);
  const [touchStartX1, setTouchStartX1] = useState(0);
  const [touchEndX1, setTouchEndX1] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [touchEndY, setTouchEndY] = useState(0);
  const [lastScrollTime1, setLastScrollTime1] = useState(0);
  const [dynamicLocations, setDynamicLocations] = useState([]);
  const [dynamicCategories, setDynamicCategories] = useState([]);
  const sliderRef = useRef(null);
  const articlesGridRef = useRef(null);
  const navigate = useNavigate();
  const { setIsLoading } = useLoading();

  // Fallback locations and categories
  const fallbackLocations = [
    "Chennai",
    "Kolkata",
    "Visakhapatnam",
    "Mumbai",
    "Hyderabad",
    "Bangalore",
    "Delhi",
  ];
  const fallbackCategories = [
    { value: "all", label: "All" },
    { value: "house", label: "House" },
    { value: "flat", label: "Flat" },
    { value: "apartment", label: "Apartment" },
    { value: "villa", label: "Villa" },
  ];

  const properties =
    propertiesData.length > 0
      ? propertiesData.map((property) => ({
          place: property.location || "Unknown Location",
          type: property.subtype || "N/A",
          image:
            property.images && property.images.length > 0 && property.images[0]
              ? (typeof property.images[0] === 'string' ? property.images[0] : property.images[0]?.url)
              : "/images/placeholder.jpg",
          price: property.price || 0,
          id: property._id || "",
        }))
      : [
          {
            place: "No Popular Properties",
            type: "N/A",
            image: "/images/placeholder.jpg",
            price: "0",
            id: "",
          },
        ];

  const swipeThreshold1 = 10;
  const scrollThreshold1 = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setIsLoading(true);
        
        const [properties, sliderProperties, locationsRes, propertyTypesRes] = await Promise.all([
          fetchProperties(),
          fetchSliderProperties(),
          axios.get('/locations', { withCredentials: true }).catch(err => {
            console.error("Error fetching locations:", err);
            return { data: [] };
          }),
          axios.get('/property-types', { withCredentials: true }).catch(err => {
            console.error("Error fetching property types:", err);
            return { data: [] };
          }),
        ]);
        
        const locationsData = locationsRes.data || [];
        const propertyTypesData = propertyTypesRes.data || [];
      
        setPropertiesData(properties || []);
        setSliderPropertiesData(sliderProperties || []);
        
        // Use locations from backend API (already deduplicated on backend)
        if (locationsData && locationsData.length > 0) {
          setDynamicLocations(locationsData);
        } else {
          setDynamicLocations(fallbackLocations);
        }
        
        // Map property types to select option format
        if (propertyTypesData && propertyTypesData.length > 0) {
          const categoryOptions = propertyTypesData.map((type) => ({
            value: type.toLowerCase(),
            label: type.charAt(0).toUpperCase() + type.slice(1),
          }));
          setDynamicCategories([{ value: "all", label: "All" }, ...categoryOptions]);
        } else {
          setDynamicCategories(fallbackCategories);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load properties. Please try again later.");
        // Use fallback values on error
        setDynamicLocations(fallbackLocations);
        setDynamicCategories(fallbackCategories);
      } finally {
        setLoading(false);
        setIsLoading(false);
      }
    };
    fetchData();

    // Cleanup: Reset loading state if component unmounts or user navigates away
    return () => {
      setIsLoading(false);
    };
  }, [setIsLoading]);

  useEffect(() => {
    const updateArticlesPerPage = () => {
      if (window.innerWidth <= 480) {
        setArticlesPerPage(1);
      } else if (window.innerWidth <= 768) {
        setArticlesPerPage(2);
      } else {
        setArticlesPerPage(4);
      }
    };

    const updateSlider = () => {
      if (sliderRef.current) {
        const cards = sliderRef.current.querySelectorAll(`.${styles.card}`);
        if (cards.length === 0) return;
        const card = cards[0];
        const cardStyle = window.getComputedStyle(card);
        const marginRight = parseInt(cardStyle.marginRight) || 0;
        const marginLeft = parseInt(cardStyle.marginLeft) || 0;
        const totalCardWidth = card.offsetWidth + marginRight + marginLeft;
        sliderRef.current.style.transform = `translateX(-${
          currentIndex2 * totalCardWidth
        }px)`;
      }
    };

    const observeSections = () => {
      const sections = document.querySelectorAll(`.${styles['hidden-section']}`);
      if (sections.length === 0) return;
      const options = {
        root: null,
        rootMargin: "0px",
        threshold: 0.09,
      };
      const callback = (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.show);
          }
        });
      };
      const observer = new IntersectionObserver(callback, options);
      sections.forEach((section) => observer.observe(section));
    };

    updateArticlesPerPage();
    updateSlider();
    observeSections();

    window.addEventListener("resize", () => {
      updateArticlesPerPage();
      updateSlider();
    });

    return () => {
      window.removeEventListener("resize", updateArticlesPerPage);
      window.removeEventListener("resize", updateSlider);
    };
  }, [currentIndex2]);

  const getVisibleCards = () => {
    const screenWidth = window.innerWidth;
    if (screenWidth >= 1024) return 2;
    if (screenWidth >= 768) return 1;
    return 1;
  };

  const nextProperty = () => {
    if (properties.length <= 1) return;
    setCurrentIndex1((prev) => (prev + 1) % properties.length);
  };

  const prevProperty = () => {
    if (properties.length <= 1) return;
    setCurrentIndex1(
      (prev) => (prev - 1 + properties.length) % properties.length
    );
  };

  const nextSlide1 = () => {
    const totalCards = sliderPropertiesData.length;
    const visibleCards = getVisibleCards();
    const maxIndex = Math.max(0, totalCards - visibleCards);
    if (totalCards <= 1) return;
    if (currentIndex2 < maxIndex) {
      setCurrentIndex2(currentIndex2 + 1);
    }
  };

  const prevSlide1 = () => {
    if (currentIndex2 > 0) {
      setCurrentIndex2(currentIndex2 - 1);
    }
  };

  const moveLeft = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const moveRight = () => {
    const totalArticles = 6;
    const maxIndex = Math.max(0, totalArticles - articlesPerPage);
    if (currentIndex < maxIndex) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  useEffect(() => {
    if (articlesGridRef.current) {
      const offset = -currentIndex * (100 / articlesPerPage);
      articlesGridRef.current.style.transform = `translateX(${offset}%)`;
    }
  }, [currentIndex, articlesPerPage]);

  const handleSwipe = () => {
    if (properties.length <= 1) return;
    if (touchStartX1 - touchEndX1 > swipeThreshold1) {
      nextProperty();
    } else if (touchEndX1 - touchStartX1 > swipeThreshold1) {
      prevProperty();
    }
  };

  const handleArticlesSwipe = () => {
    const xDiff = touchStartX - touchEndX;
    const yDiff = touchStartY - touchEndY;
    if (
      Math.abs(xDiff) > Math.abs(yDiff) &&
      Math.abs(xDiff) > swipeThreshold1
    ) {
      if (xDiff > 0) {
        moveRight();
      } else {
        moveLeft();
      }
    }
  };

  const handleSliderSwipe = () => {
    const swipeDistance = touchStartX - touchEndX;
    if (Math.abs(swipeDistance) > swipeThreshold1) {
      if (swipeDistance > 0) {
        nextSlide1();
      } else {
        prevSlide1();
      }
    }
  };

  const handleWheel = (e) => {
    if (properties.length <= 1) return;
    const currentTime = Date.now();
    if (
      Math.abs(e.deltaX) > Math.abs(e.deltaY) &&
      currentTime - lastScrollTime1 > 1
    ) {
      if (e.deltaX > scrollThreshold1) {
        prevProperty();
      } else if (e.deltaX < -scrollThreshold1) {
        nextProperty();
      }
      setLastScrollTime1(currentTime);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const location = formData.get("location")?.trim();
    const query = formData.get("query")?.trim();
    const category = formData.get("category")?.trim();
    
    // Build search params - only include non-empty values (optional fields)
    const params = new URLSearchParams();
    
    if (location && location !== "") {
      params.set("location", location.toLowerCase());
    }
    if (query && query !== "") {
      params.set("query", query);
    }
    if (category && category !== "" && category !== "all") {
      params.set("property-type", category);
    }
    
    // Navigate with optional parameters
    navigate(`/search?${params.toString()}`);
  };

  if (loading) return <LoadingSpinner />;
  if (error)
    return (
      <div
        style={{
          textAlign: "center",
          padding: "50px",
          fontFamily: '"Poppins", Arial, sans-serif',
          color: "#ef4444",
        }}
      >
        {error}
      </div>
    );

  return (
    <div className={styles['home-container']}>
      <div className={styles['background-container']}>
        <img src="/Login.jpg" alt="Background Image" />
        <main className={styles['main-section']}>
          <div className={styles['main-overlay']}>
            <h1>Welcome to RentEase</h1>
            <p>
              Your one-stop solution for managing rental properties and domestic
              services.
            </p>
          </div>
        </main>

        <section className={`${styles['hidden-section']} ${styles['search-section']}`}>
          <form onSubmit={handleSearch}>
            <div className={styles['search-container']}>
              <div className={styles['search-bar']}>
                <select
                  name="location"
                  id="location"
                  className={styles['location-select']}
                  defaultValue=""
                >
                  <option value="">Location</option>
                  {(dynamicLocations.length > 0 ? dynamicLocations : fallbackLocations).map((location) => (
                    <option key={location} value={location.toLowerCase()}>
                      {location}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  name="query"
                  placeholder="Search for places ..."
                />
              </div>
              <div className={styles.filters}>
                <select
                  name="category"
                  id="category"
                  className={styles['category-select']}
                  defaultValue="all"
                >
                  <option value="all">Property Type</option>
                  {(dynamicCategories.length > 0 ? dynamicCategories : fallbackCategories).map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
                <button type="submit">Search</button>
              </div>
            </div>
          </form>
        </section>
      </div>

      <section className={styles['features-section']}>
        <div className={styles.container}>
          <div className={styles['section-header']}>
            <h2>Comprehensive Home Solutions</h2>
          </div>
          <div className={styles['features-grid']}>
            <div className={styles['feature-card']}>
              <div className={styles['feature-icon']}>
                <FontAwesomeIcon icon={faHome} />
              </div>
              <h3>Rent Home</h3>
              <p>
                Find your perfect rental property from thousands of verified
                listings
              </p>
            </div>
            <div
              className={styles['feature-card']}
              
            >
              <div className={styles['feature-icon']}>
                <FontAwesomeIcon icon={faList} />
              </div>
              <h3>List Your Property</h3>
              <p>
                Reach thousands of potential tenants and manage your properties
                efficiently
              </p>
            </div>
            <div
              className={styles['feature-card']}
              
            >
              <div className={styles['feature-icon']}>
                <FontAwesomeIcon icon={faBroom} />
              </div>
              <h3>Domestic Services</h3>
              <p>
                Book reliable cleaning, repair, and maintenance services with
                verified professionals
              </p>
            </div>
            <div
              className={styles['feature-card']}
              
            >
              <div className={styles['feature-icon']}>
                <FontAwesomeIcon icon={faHandHoldingDollar} />
              </div>
              <h3>Pay Rent Online</h3>
              <p>
                Hassle-free online rent payments with instant confirmations and
                receipts
              </p>
            </div>
          </div>
        </div>
      </section>
      

      <div className={`${styles['hidden-section']} ${styles.listings}`}>
        <h2 className={styles['side-heading']}>Popular Listings</h2>
        <div
          className={styles['listing-container']}
          onWheel={handleWheel}
          onTouchStart={(e) => setTouchStartX1(e.touches[0].clientX)}
          onTouchEnd={(e) => {
            setTouchEndX1(e.changedTouches[0].clientX);
            handleSwipe();
          }}
        >
          <div className={styles.info}>
            <h2>
              {properties[currentIndex1]?.place || "No Popular Properties"}
            </h2>
            <p>{properties[currentIndex1]?.type || "Nothing to display"}</p>
          </div>
          <div className={styles.image}>
            <img
              id="property-image"
              src={
                properties[currentIndex1]?.image ? properties[currentIndex1].image : "/images/placeholder.jpg"
              }
              alt="Property Image"
              onError={(e) => {
                e.target.src = "/images/placeholder.jpg";
              }}
            />
          </div>
          <div className={styles['price-container']}>
            <div className={styles.price}>
              ₹{" "}
              {properties[currentIndex1]?.price?.toLocaleString("en-IN") || "0"}
            </div>
            <button
              className={styles['contact-btn']}
              disabled={!properties[currentIndex1]?.id}
              onClick={() =>
                properties[currentIndex1]?.id &&
                navigate(`/property?id=${properties[currentIndex1].id}`)
              }
            >
              Contact Now
            </button>
          </div>
          {properties.length > 1 && (
            <div className={styles.controls}>
              <button onClick={prevProperty}>&lsaquo;</button>
              <button onClick={nextProperty}>&rsaquo;</button>
            </div>
          )}
        </div>
      </div>

      <div
        className={`${styles['hidden-section']} ${styles['slider-container']}`}
        onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          setTouchEndX(e.changedTouches[0].clientX);
          handleSliderSwipe();
        }}
      >
        {sliderPropertiesData.length > 1 && (
          <button className={`${styles['nav-button']} ${styles.prev}`} onClick={prevSlide1}>
            &lsaquo;
          </button>
        )}
        <div className={styles.slider} ref={sliderRef}>
          {sliderPropertiesData.length > 0 ? (
            sliderPropertiesData.map((property) => (
              <div className={styles.card} key={property._id || Math.random()}>
                <div
                  className={styles['slider-image']}
                  style={{
                    backgroundImage: `url(${
                      property.images && property.images.length > 0
                        ? (typeof property.images[0] === 'string' ? property.images[0] : property.images[0].url)
                        : "/images/placeholder.jpg"
                    })`,
                  }}
                  onError={(e) => {
                    e.target.style.backgroundImage = "url('/images/placeholder.jpg')";
                  }}
                ></div>
                <div className={styles.content}>
                  <h2>{property.name || "No Name Available"}</h2>
                  <p>{property.description || "No description available"}</p>
                  <a
                    className={styles.button}
                    href={property._id ? `/property?id=${property._id}` : "#"}
                    {...(!property._id
                      ? { onClick: (e) => e.preventDefault() }
                      : {})}
                  >
                    View Details
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.card}>
              <div
                className={styles['slider-image']}
                style={{ backgroundImage: "url('/images/placeholder.jpg')" }}
              ></div>
              <div className={styles.content}>
                <h2>No Properties Available</h2>
                <p>Nothing to display</p>
                <a
                  className={styles.button}
                  href="#"
                  onClick={(e) => e.preventDefault()}
                >
                  View Details
                </a>
              </div>
            </div>
          )}
        </div>
        {sliderPropertiesData.length > 1 && (
          <button className={`${styles['nav-button']} ${styles.next}`} onClick={nextSlide1}>
            &rsaquo;
          </button>
        )}
      </div>

      <div className={`${styles['hidden-section']} ${styles['news-container']}`}>
        <div className={styles['news-heading']}>
          <h2>Latest News</h2>
        </div>
        <div className={styles['news-content']}>
          <div className={styles['scrolling-news']}>
            <span className={styles['news-item']}>
              🌟 New properties added in Hyderabad! Check them out now. 🌟
            </span>
            <span className={styles['news-item']}>
              🔥 Exclusive offer: Get 10% off on domestic services this week! 🔥
            </span>
            <span className={styles['news-item']}>
              🏡 RentEase now available in Mumbai! 🏡
            </span>
            <span className={styles['news-item']}>
              🎉 Pay your rent online and win exciting prizes! 🎉
            </span>
          </div>
        </div>
      </div>

      <div className={`${styles['hidden-section']} ${styles['articles-container']}`}>
        <div className={styles['articles-heading']}>
          <h2>Featured Articles</h2>
        </div>
        <div
          className={styles['articles-grid']}
          ref={articlesGridRef}
          onTouchStart={(e) => {
            setTouchStartX(e.touches[0].clientX);
            setTouchStartY(e.touches[0].clientY);
          }}
          onTouchMove={(e) => {
            setTouchEndX(e.touches[0].clientX);
            setTouchEndY(e.touches[0].clientY);
          }}
          onTouchEnd={handleArticlesSwipe}
        >

          <div className={styles['article-card']}>
            <div className={styles['article-image']}><img
                src="https://www.homebazaar.com/knowledge/wp-content/uploads/2022/06/Tips-For-Renting-A-House.jpg"
                alt="Article Image"
              /></div>
            <div className={styles['article-content']}>
              <h3>Top 10 Tips for Renting a Home</h3>
              <p>
                Discover the best tips and tricks to find your dream rental home
                without breaking the bank.
              </p>
               <a
                href="https://e-rockwell.com/top-10-renting-tips-for-tenants/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles['read-more']}
              >
                Read More
              </a>
            </div>
          </div>
          <div className={styles['article-card']}>
            <div className={styles['article-image']}><img
                src="https://unitedsettlement.com/wp-content/uploads/2022/06/How-to-Negotiate-a-Settlement-With-Your-Landlord-United-Settlement-scaled.jpg"
                alt="Article Image"
              /></div>
            <div className={styles['article-content']}>
              <h3>How to Negotiate Rent Like a Pro</h3>
              <p>
                Learn the art of negotiation and save money on your next rental
                agreement.
              </p>
              <a
                 href="https://timesproperty.com/news/post/once-abandoned-and-almost-forgotten-blid9331?offset=1"
                target="_blank"
                rel="noopener noreferrer"
                className={styles['read-more']}
              >
                Read More
              </a>
            </div>
          </div>
          <div className={styles['article-card']}>
            <div className={styles['article-image']}><img
                src="https://www.homebazaar.com/knowledge/wp-content/uploads/2022/06/Features-Of-Renting-A-House.jpg"
                alt="Article Image"
              /></div>
            <div className={styles['article-content']}>
              <h3>5 Must-Have Features in a Rental Home</h3>
              <p>
                Find out what features you should look for when renting a new
                home.
              </p>
               <a
                href="https://taylors.com.au/articles/5-must-have-features-in-a-rental-property"
                target="_blank"
                rel="noopener noreferrer"
                className={styles['read-more']}
              >
                Read More
              </a>
            </div>
          </div>
          <div className={styles['article-card']}>
            <div className={styles['article-image']}> <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQERWRE2zkiLeaEP0qFmkPrFrCccwR23Wq6pg&s"
                alt="Article Image"
              /></div>
            <div className={styles['article-content']}>
              <h3>Understanding Rental Agreements</h3>
              <p>
                A comprehensive guide to understanding rental agreements and
                avoiding common pitfalls.
              </p>
               <a
                href="https://legaleye.co.in/blog_news/know-about-rental-agreements/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles['read-more']}
              >
                Read More
              </a>
            </div>
          </div>
          <div className={styles['article-card']}>
            <div className={styles['article-image']}> <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSkNelc-rDqi-V0GtNokDY-rNQvQyu95_zGoQ&s"
                alt="Article Image"
              /></div>
            <div className={styles['article-content']}>
              <h3>Moving Checklist for Renters</h3>
              <p>
                Everything you need to know before moving into your new rental
                home.
              </p>
              <a
                href="https://homelet.co.uk/tenants/tips-for-tenants/moving-checklist"
                target="_blank"
                rel="noopener noreferrer"
                className={styles['read-more']}
              >
                Read More
              </a>

            </div>
          </div>
          <div className={styles['article-card']}>
            <div className={styles['article-image']}>
              <img
                src="data:image/jpeg;base64,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"
                alt="Article Image"
              />
              </div>

            <div className={styles['article-content']}>
              <h3>How to Save Money on Utilities</h3>
              <p>
                Practical tips to reduce your utility bills in your rental home.
              </p>
              <a
                href="https://www.incharge.org/financial-literacy/budgeting-saving/how-to-save-money-on-electric-gas-water-bill/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles['read-more']}
              >
                Read More
              </a>
            </div>
          </div>
        </div>
        <button className={`${styles['nav-button']} ${styles.left}`} onClick={moveLeft}>
          &lsaquo;
        </button>
        <button className={`${styles['nav-button']} ${styles.right}`} onClick={moveRight}>
          &rsaquo;
        </button>
      </div>

      <div className={`${styles['hidden-section']} ${styles.cta}`}>
        <section className={styles['cta-section']}>
          <h2>Ready to Find Your Perfect Home?</h2>
          <p>
            Join thousands of satisfied customers and start your journey today.
          </p>
          <button 
            onClick={() => navigate("/login")}
            className={styles['cta-button']}
          >
            Sign Up Now
          </button>
        </section>
      </div>

      <footer className={`${styles['hidden-section']} ${styles.footer}`}>
        <div className={styles.container}>
          <div className={styles['footer-main']}>
            <div className={`${styles['footer-column']} ${styles['footer-brand']}`}>
              <div className={styles['footer-logo']}>
                <span>
                  Rent<span className={styles.accent}>Ease</span>
                </span>
              </div>
              <p>
                RentEase is India's premier platform for finding and listing
                rental properties and domestic services, making the renting
                experience seamless and hassle-free.
              </p>
              <div className={styles['footer-social']}>
                <a href="#" aria-label="Facebook">
                  <FontAwesomeIcon icon={faFacebookF} />
                </a>
                <a href="#" aria-label="Twitter">
                  <FontAwesomeIcon icon={faTwitter} />
                </a>
                <a href="#" aria-label="Instagram">
                  <FontAwesomeIcon icon={faInstagram} />
                </a>
                <a href="#" aria-label="LinkedIn">
                  <FontAwesomeIcon icon={faLinkedinIn} />
                </a>
              </div>
            </div>
            <div className={styles['footer-column']}>
              <h3>Quick Links</h3>
              <ul className={styles['footer-links']}>
                <li>
                  <a href="/">Home</a>
                </li>
                <li>
                  <a href="/search">Properties</a>
                </li>
                <li>
                  <a href="/workerDetails">Services</a>
                </li>
                <li>
                  <a href="/about_us">About Us</a>
                </li>
                <li>
                  <a href="/contact_us">Contact</a>
                </li>
              </ul>
            </div>
            <div className={styles['footer-column']}>
              <h3>Services</h3>
              <ul className={styles['footer-links']}>
                <li>
                  <a href="/search">Rent a Home</a>
                </li>
                <li>
                  <a href="/property_listing_page">List Your Property</a>
                </li>
                <li>
                  <a href="/workerDetails">Domestic Services</a>
                </li>
                <li>
                  <a href="/tenant_dashboard">Online Rent Payment</a>
                </li>
                <li>
                  <a href="/property-management">Property Management</a>
                </li>
              </ul>
            </div>
            <div className={styles['footer-column']}>
              <h3>Contact Us</h3>
              <ul className={styles['footer-contact']}>
                <li>
                  <FontAwesomeIcon icon={faMapMarkerAlt} /> Sri City, Andhra
                  Pradesh, India
                </li>
                <li>
                  <FontAwesomeIcon icon={faPhone} /> +91 9949169887
                </li>
                <li>
                  <FontAwesomeIcon icon={faEnvelope} /> contact@rentease.com
                </li>
              </ul>
              <div className={styles['footer-newsletter']}>
                <h4>Subscribe to our newsletter</h4>
                <form
                  className={styles['newsletter-form']}
                  onSubmit={(e) => e.preventDefault()}
                >
                  <input type="email" placeholder="Enter your email" required />
                  <button type="submit" aria-label="Subscribe">
                    <FontAwesomeIcon icon={faPaperPlane} />
                  </button>
                </form>
              </div>
            </div>
          </div>
          <div className={styles['footer-bottom']}>
            <div className={styles.copyright}>
              <p>&copy; 2025 RentEase. All Rights Reserved.</p>
            </div>
            <div className={styles['footer-bottom-links']}>
              <a href="/privacy_policy">Privacy Policy</a>
              <a href="/termsofservice">Terms and Conditions</a>
              <a href="/cookie-policy">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
