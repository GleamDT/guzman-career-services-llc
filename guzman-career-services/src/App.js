import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
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
import './App.css';

function getAuth() {
  try { return JSON.parse(sessionStorage.getItem('auth')); } catch { return null; }
}

function ProtectedRoute({ requiredRole, children }) {
  const auth = getAuth();
  if (!auth) return <Navigate to="/" replace />;
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

// Handles the invite/magic-link callback — Supabase redirects here with a token
// in the URL hash. We read the session and redirect to the right dashboard.
function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const role = session.user?.user_metadata?.role || 'client';
        sessionStorage.setItem('auth', JSON.stringify({ role, email: session.user.email }));
        navigate(role === 'admin' ? '/admin' : '/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    });
  }, [navigate]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Inter, sans-serif', color: '#64748b' }}>
      Setting up your account…
    </div>
  );
}

function App() {
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    // Restore session on page load (handles returning users and invite links)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const role = session.user?.user_metadata?.role || 'client';
        sessionStorage.setItem('auth', JSON.stringify({ role, email: session.user.email }));
      }
      setAuthReady(true);
    });

    // Keep sessionStorage in sync with Supabase auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        const role = session.user?.user_metadata?.role || 'client';
        sessionStorage.setItem('auth', JSON.stringify({ role, email: session.user.email }));
      } else if (event === 'SIGNED_OUT') {
        sessionStorage.removeItem('auth');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Wait until we've checked session before rendering routes
  // This prevents a flash-redirect when a client clicks their invite link
  if (!authReady) return null;

  return (
    <Routes>
      <Route path="/" element={<MainSite />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/admin" element={
        <ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute requiredRole="client"><ClientDashboard /></ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;
