import { Routes, Route } from 'react-router-dom';
import { LoadingProvider } from './LoadingContext';
import Header from './components/Header';
import HomePage from './pages/Homepage';
import Auth from './pages/Auth';

import WorkerServices from './pages/WorkerServices';
import WorkerCard from './pages/WorkerCard';

const App = () => {
  return (
    <LoadingProvider>
      <div>
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<div>Search Page</div>} />
          <Route path="/workerDetails" element={<WorkerServices />} />
          <Route path="/worker/:id" element={<WorkerCard detailed />} />
          <Route path="/about_us" element={<div>About Us</div>} />
          <Route path="/contact_us" element={<div>Contact Us</div>} />
          <Route path="/faq" element={<div>FAQs</div>} />
          <Route path="/register" element={<Auth initial="register" />} />
          <Route path="/login" element={<Auth initial="login" />} />
          <Route path="/privacy_policy" element={<div>Privacy Policy Page</div>} />
          <Route path="/termsofservice" element={<div>Terms of Service Page</div>} />
          <Route path="/property-management" element={<div>Property Management Page</div>} />
          <Route path="/tenant/tenant_dashboard" element={<div>Tenant Dashboard</div>} />
          <Route path="/owner_dashboard" element={<div>Owner Dashboard</div>} />
          <Route path="/worker_dashboard" element={<div>Worker Dashboard</div>} />
          
          <Route path="/property" element={<div>Property Details Page</div>} />
        </Routes>
      </div>
    </LoadingProvider>
  );
};

export default App;