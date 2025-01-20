import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome,
  faList,
  faBroom,
  faHandHoldingDollar,
  faMapMarkerAlt,
  faPhone,
  faEnvelope,
  faPaperPlane,
} from '@fortawesome/free-solid-svg-icons';
import { faFacebookF, faTwitter, faInstagram, faLinkedinIn } from '@fortawesome/free-brands-svg-icons';
import { fetchProperties, fetchSliderProperties } from '../services/api';
import '../assets/css/index.css';

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
  const sliderRef = useRef(null);
  const articlesGridRef = useRef(null);
  const navigate = useNavigate();

  const locations = ['Chennai', 'Kolkata', 'Visakhapatnam', 'Mumbai', 'Hyderabad', 'Bangalore', 'Delhi'];
  const categories = [
    { value: 'all', label: 'All' },
    { value: 'house', label: 'House' },
    { value: 'flat', label: 'Flat' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'villa', label: 'Villa' },
  ];

  const properties = propertiesData.length > 0
    ? propertiesData.map((property) => ({
        place: property.location || 'Unknown Location',
        type: property.subtype || 'N/A',
        image: property.images && property.images.length > 0 && property.images[0]
          ? property.images[0]
          : '/images/placeholder.jpg',
        price: property.price || 0,
        id: property._id || '',
      }))
    : [{
        place: 'No Popular Properties',
        type: 'N/A',
        image: '/images/placeholder.jpg',
        price: '0',
        id: '',
      }];

  const swipeThreshold1 = 10;
  const throttleTime1 = 500;
  const scrollThreshold1 = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [properties, sliderProperties] = await Promise.all([
          fetchProperties(),
          fetchSliderProperties(),
        ]);
        console.log('Properties:', properties);
        console.log('Slider Properties:', sliderProperties);
        setPropertiesData(properties || []);
        setSliderPropertiesData(sliderProperties || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load properties. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
        const cards = sliderRef.current.querySelectorAll('.card');
        if (cards.length === 0) return;
        const card = cards[0];
        const cardStyle = window.getComputedStyle(card);
        const marginRight = parseInt(cardStyle.marginRight) || 0;
        const marginLeft = parseInt(cardStyle.marginLeft) || 0;
        const totalCardWidth = card.offsetWidth + marginRight + marginLeft;
        sliderRef.current.style.transform = `translateX(-${currentIndex2 * totalCardWidth}px)`;
      }
    };

    const observeSections = () => {
      const sections = document.querySelectorAll('.hidden-section');
      if (sections.length === 0) return;
      const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0.09,
      };
      const callback = (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('show');
          }
        });
      };
      const observer = new IntersectionObserver(callback, options);
      sections.forEach((section) => observer.observe(section));
    };

    updateArticlesPerPage();
    updateSlider();
    observeSections();

    window.addEventListener('resize', () => {
      updateArticlesPerPage();
      updateSlider();
    });

    return () => {
      window.removeEventListener('resize', updateArticlesPerPage);
      window.removeEventListener('resize', updateSlider);
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
    setCurrentIndex1((prev) => (prev - 1 + properties.length) % properties.length);
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
    const maxIndex = Math.ceil(6 / articlesPerPage) - 1;
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
    if (Math.abs(xDiff) > Math.abs(yDiff) && Math.abs(xDiff) > swipeThreshold1) {
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
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && currentTime - lastScrollTime1 > throttleTime1) {
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
    const location = formData.get('location');
    const query = formData.get('query');
    const category = formData.get('category');
    const params = new URLSearchParams({ location, query, 'property-type': category });
    navigate(`/search?${params.toString()}`);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '50px', fontFamily: '"Poppins", Arial, sans-serif' }}>Loading...</div>;
  if (error) return <div style={{ textAlign: 'center', padding: '50px', fontFamily: '"Poppins", Arial, sans-serif', color: '#ef4444' }}>{error}</div>;

  return (
    <div>
      <div className="background-container">
        <img src="/public/login.jpg" alt="Background Image" />
        <main className="main-section">
          <div className="main-overlay">
            <h1>Welcome to RentEase</h1>
            <p>Your one-stop solution for managing rental properties and domestic services.</p>
          </div>
        </main>

        <section className="hidden-section search-section">
          <form onSubmit={handleSearch}>
            <div className="search-container">
              <div className="search-bar">
                <select name="location" id="location" className="location-select" required>
                  <option value="" disabled selected hidden>Location ▼</option>
                  <option value="" disabled>Top Cities</option>
                  {locations.map((location) => (
                    <option key={location} value={location.toLowerCase()}>
                      {location}
                    </option>
                  ))}
                </select>
                <input type="text" name="query" placeholder="Search for places..." required />
              </div>
              <div className="filters">
                <select name="category" id="category" className="category-select" required>
                  <option value="" disabled selected>Select Category</option>
                  {categories.map((category) => (
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

      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>Comprehensive Home Solutions</h2>
          </div>
          <div className="features-grid">
            <div className="feature-card" onClick={() => navigate('/search')}>
              <div className="feature-icon">
                <FontAwesomeIcon icon={faHome} />
              </div>
              <h3>Rent Home</h3>
              <p>Find your perfect rental property from thousands of verified listings</p>
            </div>
            <div className="feature-card" onClick={() => navigate('/property_listing_page')}>
              <div className="feature-icon">
                <FontAwesomeIcon icon={faList} />
              </div>
              <h3>List Your Property</h3>
              <p>Reach thousands of potential tenants and manage your properties efficiently</p>
            </div>
            <div className="feature-card" onClick={() => navigate('/workerDetails')}>
              <div className="feature-icon">
                <FontAwesomeIcon icon={faBroom} />
              </div>
              <h3>Domestic Services</h3>
              <p>Book reliable cleaning, repair, and maintenance services with verified professionals</p>
            </div>
            <div className="feature-card" onClick={() => navigate('/tenant_dashboard')}>
              <div className="feature-icon">
                <FontAwesomeIcon icon={faHandHoldingDollar} />
              </div>
              <h3>Pay Rent Online</h3>
              <p>Hassle-free online rent payments with instant confirmations and receipts</p>
            </div>
          </div>
        </div>
      </section>

      <div className="hidden-section listings">
        <h2 className="side-heading">Popular Listings</h2>
        <div
          className="listing-container"
          onWheel={handleWheel}
          onTouchStart={(e) => setTouchStartX1(e.touches[0].clientX)}
          onTouchEnd={(e) => {
            setTouchEndX1(e.changedTouches[0].clientX);
            handleSwipe();
          }}
        >
          <div className="info">
            <h2>{properties[currentIndex1]?.place || 'No Popular Properties'}</h2>
            <p>{properties[currentIndex1]?.type || 'Nothing to display'}</p>
          </div>
          <div className="image">
            <img
              id="property-image"
              src={properties[currentIndex1]?.image || '/images/placeholder.jpg'}
              alt="Property Image"
            />
          </div>
          <div className="price-container">
            <div className="price">₹ {properties[currentIndex1]?.price?.toLocaleString('en-IN') || '0'}</div>
            <button
              className="contact-btn"
              disabled={!properties[currentIndex1]?.id}
              onClick={() => properties[currentIndex1]?.id && navigate(`/property?id=${properties[currentIndex1].id}`)}
            >
              Contact Now
            </button>
          </div>
          {properties.length > 1 && (
            <div className="controls">
              <button onClick={prevProperty}>&lsaquo;</button>
              <button onClick={nextProperty}>&rsaquo;</button>
            </div>
          )}
        </div>
      </div>

      <div
        className="hidden-section slider-container"
        onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          setTouchEndX(e.changedTouches[0].clientX);
          handleSliderSwipe();
        }}
      >
        {sliderPropertiesData.length > 1 && (
          <button className="nav-button prev" onClick={prevSlide1}>&lsaquo;</button>
        )}
        <div className="slider" ref={sliderRef}>
          {sliderPropertiesData.length > 0 ? (
            sliderPropertiesData.map((property) => (
              <div className="card" key={property._id || Math.random()}>
                <div
                  className="slider-image"
                  style={{
                    backgroundImage: `url(${property.images && property.images.length > 0 ? property.images[0] : '/images/placeholder.jpg'})`,
                  }}
                ></div>
                <div className="content">
                  <h2>{property.name || 'No Name Available'}</h2>
                  <p>{property.description || 'No description available'}</p>
                  <button
                    className="button"
                    onClick={() => property._id && navigate(`/property?id=${property._id}`)}
                    disabled={!property._id}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="card">
              <div
                className="slider-image"
                style={{ backgroundImage: "url('/images/placeholder.jpg')" }}
              ></div>
              <div className="content">
                <h2>No Properties Available</h2>
                <p>Nothing to display</p>
                <button className="button" disabled>View Details</button>
              </div>
            </div>
          )}
        </div>
        {sliderPropertiesData.length > 1 && (
          <button className="nav-button next" onClick={nextSlide1}>&rsaquo;</button>
        )}
      </div>

      <div className="hidden-section news-container">
        <div className="news-heading">
          <h2>Latest News</h2>
        </div>
        <div className="news-content">
          <marquee behavior="scroll" direction="left" scrollamount="5">
            <span className="news-item">🌟 New properties added in Hyderabad! Check them out now. 🌟</span>
            <span className="news-item">🔥 Exclusive offer: Get 10% off on domestic services this week! 🔥</span>
            <span className="news-item">🏡 RentEase now available in Mumbai! 🏡</span>
            <span className="news-item">🎉 Pay your rent online and win exciting prizes! 🎉</span>
          </marquee>
        </div>
      </div>

      <div className="hidden-section articles-container">
        <div className="articles-heading">
          <h2>Featured Articles</h2>
        </div>
        <div
          className="articles-grid"
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
          <div className="article-card">
            <div className="article-image">
              <img src="https://www.homebazaar.com/knowledge/wp-content/uploads/2022/06/Tips-For-Renting-A-House.jpg" alt="Article Image" />
            </div>
            <div className="article-content">
              <h3>Top 10 Tips for Renting a Home</h3>
              <p>Discover the best tips and tricks to find your dream rental home without breaking the bank.</p>
              <a href="https://e-rockwell.com/top-10-renting-tips-for-tenants/" target="_blank" rel="noopener noreferrer" className="read-more">Read More</a>
            </div>
          </div>
          <div className="article-card">
            <div className="article-image">
              <img src="https://unitedsettlement.com/wp-content/uploads/2022/06/How-to-Negotiate-a-Settlement-With-Your-Landlord-United-Settlement-scaled.jpg" alt="Article Image" />
            </div>
            <div className="article-content">
              <h3>How to Negotiate Rent Like a Pro</h3>
              <p>Learn the art of negotiation and save money on your next rental agreement.</p>
              <a href="https://timesproperty.com/news/post/once-abandoned-and-almost-forgotten-blid9331?offset=1" target="_blank" rel="noopener noreferrer" className="read-more">Read More</a>
            </div>
          </div>
          <div className="article-card">
            <div className="article-image">
              <img src="https://www.homebazaar.com/knowledge/wp-content/uploads/2022/06/Features-Of-Renting-A-House.jpg" alt="Article Image" />
            </div>
            <div className="article-content">
              <h3>5 Must-Have Features in a Rental Home</h3>
              <p>Find out what features you should look for when renting a new home.</p>
              <a href="https://taylors.com.au/articles/5-must-have-features-in-a-rental-property" target="_blank" rel="noopener noreferrer" className="read-more">Read More</a>
            </div>
          </div>
          <div className="article-card">
            <div className="article-image">
              <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQERWRE2zkiLeaEP0qFmkPrFrCccwR23Wq6pg&s" alt="Article Image" />
            </div>
            <div className="article-content">
              <h3>Understanding Rental Agreements</h3>
              <p>A comprehensive guide to understanding rental agreements and avoiding common pitfalls.</p>
              <a href="https://legaleye.co.in/blog_news/know-about-rental-agreements/" target="_blank" rel="noopener noreferrer" className="read-more">Read More</a>
            </div>
          </div>
          <div className="article-card">
            <div className="article-image">
              <img src="https://encrypted-tbn0.gstatic.com/images?q=SkNelc-rDqi-V0GtNokDY-rNQvQyu95_zGoQ&s" alt="Article Image" />
            </div>
            <div className="article-content">
              <h3>Moving Checklist for Renters</h3>
              <p>Everything you need to know before moving into your new rental home.</p>
              <a href="https://homelet.co.uk/tenants/tips-for-tenants/moving-checklist" target="_blank" rel="noopener noreferrer" className="read-more">Read More</a>
            </div>
          </div>
          <div className="article-card">
            <div className="article-image"></div>
            <div className="article-content">
              <h3>How to Save Money on Utilities</h3>
              <p>Practical tips to reduce your utility bills in your rental home.</p>
              <a href="https://www.incharge.org/financial-literacy/budgeting-saving/how-to-save-money-on-electric-gas-water-bill/" target="_blank" rel="noopener noreferrer" className="read-more">Read More</a>
            </div>
          </div>
        </div>
        <button className="nav-button left" onClick={moveLeft}>&lsaquo;</button>
        <button className="nav-button right" onClick={moveRight}>&rsaquo;</button>
      </div>

      <div className="hidden-section cta">
        <section className="cta-section">
          <h2>Ready to Find Your Perfect Home?</h2>
          <p>Join thousands of satisfied customers and start your journey today.</p>
          <button onClick={() => navigate('/register')} className="cta-button">Sign Up Now</button>
        </section>
      </div>

      <footer className="hidden-section footer">
        <div className="container">
          <div className="footer-main">
            <div className="footer-column footer-brand">
              <div className="footer-logo">
                <span>Rent<span className="accent">Ease</span></span>
              </div>
              <p>
                RentEase is India's premier platform for finding and listing rental properties and domestic services, making the renting experience seamless and hassle-free.
              </p>
              <div className="footer-social">
                <a href="#" aria-label="Facebook"><FontAwesomeIcon icon={faFacebookF} /></a>
                <a href="#" aria-label="Twitter"><FontAwesomeIcon icon={faTwitter} /></a>
                <a href="#" aria-label="Instagram"><FontAwesomeIcon icon={faInstagram} /></a>
                <a href="#" aria-label="LinkedIn"><FontAwesomeIcon icon={faLinkedinIn} /></a>
              </div>
            </div>
            <div className="footer-column">
              <h3>Quick Links</h3>
              <ul className="footer-links">
                <li><button onClick={() => navigate('/')}>Home</button></li>
                <li><button onClick={() => navigate('/search')}>Properties</button></li>
                <li><button onClick={() => navigate('/workerDetails')}>Services</button></li>
                <li><button onClick={() => navigate('/about_us')}>About Us</button></li>
                <li><button onClick={() => navigate('/contact_us')}>Contact</button></li>
              </ul>
            </div>
            <div className="footer-column">
              <h3>Services</h3>
              <ul className="footer-links">
                <li><button onClick={() => navigate('/search')}>Rent a Home</button></li>
                <li><button onClick={() => navigate('/property_listing_page')}>List Your Property</button></li>
                <li><button onClick={() => navigate('/workerDetails')}>Domestic Services</button></li>
                <li><button onClick={() => navigate('/tenant_dashboard')}>Online Rent Payment</button></li>
                <li><button onClick={() => navigate('/property-management')}>Property Management</button></li>
              </ul>
            </div>
            <div className="footer-column">
              <h3>Contact Us</h3>
              <ul className="footer-contact">
                <li><FontAwesomeIcon icon={faMapMarkerAlt} /> Sri City, Andhra Pradesh, India</li>
                <li><FontAwesomeIcon icon={faPhone} /> +91 9949169887</li>
                <li><FontAwesomeIcon icon={faEnvelope} /> contact@rentease.com</li>
              </ul>
              <div className="footer-newsletter">
                <h4>Subscribe to our newsletter</h4>
                <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
                  <input type="email" placeholder="Enter your email" required />
                  <button type="submit" aria-label="Subscribe">
                    <FontAwesomeIcon icon={faPaperPlane} />
                  </button>
                </form>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="copyright">
              <p>&copy; 2025 RentEase. All Rights Reserved.</p>
            </div>
            <div className="footer-bottom-links">
              <button onClick={() => navigate('/privacy_policy')}>Privacy Policy</button>
              <button onClick={() => navigate('/termsofservice')}>Terms and Conditions</button>
              <button onClick={() => navigate('/cookie-policy')}>Cookie Policy</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;