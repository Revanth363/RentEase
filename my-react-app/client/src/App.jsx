import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/Homepage';


const App = () => {
  return (
    <div>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<div>Search Page</div>} />
        <Route path="/workerDetails" element={<div>Worker Details</div>} />
        <Route path="/about_us" element={<div>About Us</div>} />
        <Route path="/contact_us" element={<div>Contact Us</div>} />
        <Route path="/faq" element={<div>FAQs</div>} />
        {/* <Route path="/login" element={<Login />} /> */}
        <Route path="/register" element={<div>Register Page</div>} />
        <Route path="/forgot-password" element={<div>Forgot Password Page</div>} />
        <Route path="/worker_register" element={<div>Worker Register Page</div>} />
        <Route path="/privacy_policy" element={<div>Privacy Policy Page</div>} />
        <Route path="/termsofservice" element={<div>Terms of Service Page</div>} />
        <Route path="/property-management" element={<div>Property Management Page</div>} />
        <Route path="/tenant/tenant_dashboard" element={<div>Tenant Dashboard</div>} />
        <Route path="/owner_dashboard" element={<div>Owner Dashboard</div>} />
        <Route path="/worker_dashboard" element={<div>Worker Dashboard</div>} />
        <Route path="/property" element={<div>Property Details Page</div>} />
      </Routes>
    </div>
  );
};

export default App;