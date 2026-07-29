import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { getAuthUser } from './lib/auth';
import Header from './components/Header';
import Hero from './components/Hero';
import Services from './components/Services';
import HowItWorks from './components/HowItWorks';
import About from './components/About';
import WhyChooseUs from './components/WhyChooseUs';
import CTA from './components/CTA';
import Contact from './components/Contact';
import Footer from './components/Footer';
import AdminDashboard from './components/AdminDashboard';
import ClientDashboard from './components/ClientDashboard';
import SetPassword from './components/SetPassword';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';
import PortalHome from './components/PortalHome';
import Login from './components/Login';
import VerifyOtpPage from './components/VerifyOtpPage';
import { SITE_MODE } from './lib/siteMode';
import './App.css';

function getAuth() {
  try { return JSON.parse(sessionStorage.getItem('auth')); } catch { return null; }
}

function ProtectedRoute({ requiredRole, allowedRoles, children }) {
  const auth = getAuth();
  if (!auth) return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(auth.role)) return <Navigate to="/" replace />;
  if (requiredRole && auth.role !== requiredRole) return <Navigate to="/" replace />;
  return children;
}

function MainSite() {
  return (
    <div className="App">
      <Header />
      <main>
        <Hero />
        <Services />
        <HowItWorks />
        <About />
        <WhyChooseUs />
        <CTA />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    // Restore session on page load from JWT stored in localStorage
    const user = getAuthUser();
    if (user) {
      sessionStorage.setItem('auth', JSON.stringify({ role: user.role, email: user.email }));
    }
    setAuthReady(true);
  }, []);

  // Wait until we've checked session before rendering routes
  // This prevents a flash-redirect when a client clicks their invite link
  if (!authReady) return null;

  if (SITE_MODE === 'marketing') {
    return (
      <Routes>
        <Route path="/" element={<MainSite />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  const portalOnlyRoutes = (
    <>
      <Route path="/login" element={<Login isOpen={true} onClose={() => {}} asPage />} />
      <Route path="/signup" element={<Login isOpen={true} onClose={() => {}} asPage />} />
      <Route path="/verify-email" element={<VerifyOtpPage />} />
      <Route path="/onboarding" element={<Navigate to="/dashboard" replace />} />
      <Route path="/payment" element={<Navigate to="/dashboard" replace />} />
      <Route path="/admin" element={
        <ProtectedRoute requiredRole="admin"><AdminDashboard userRole="admin" /></ProtectedRoute>
      } />
      <Route path="/staff" element={
        <ProtectedRoute requiredRole="staff"><AdminDashboard userRole="staff" /></ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute requiredRole="client"><ClientDashboard /></ProtectedRoute>
      } />
      <Route path="/set-password" element={<SetPassword />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
    </>
  );

  if (SITE_MODE === 'portal') {
    return (
      <Routes>
        <Route path="/" element={<PortalHome />} />
        <Route path="/auth/callback" element={<Navigate to="/" replace />} />
        {portalOnlyRoutes}
      </Routes>
    );
  }

  // unified — today's exact existing behavior, plus the new signup/onboarding routes
  return (
    <Routes>
      <Route path="/" element={<MainSite />} />
      <Route path="/auth/callback" element={<Navigate to="/" replace />} />
      {portalOnlyRoutes}
    </Routes>
  );
}

export default App;
