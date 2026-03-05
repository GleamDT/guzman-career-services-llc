import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainSite />} />
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
