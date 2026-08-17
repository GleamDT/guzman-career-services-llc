import React from 'react';
import './Hero.css';
import { API_BASE } from '../lib/apiBase';

function Hero() {
  return (
    <section id="home" className="hero">
      <div className="hero-background">
        <div className="hero-overlay"></div>
      </div>

      <div className="container hero-content">
        <div className="hero-text">
          <h1 className="hero-title">
            We Apply to <span className="hero-highlight">Jobs for You.</span>
          </h1>
          <p className="hero-subtitle hero-subtitle--lead">
            Human-managed job applications for busy professionals across the US &amp; Canada.
          </p>
          <p className="hero-subtitle">
            We find relevant opportunities, submit targeted applications and track your job search,
            so you can focus on interviews.
          </p>
          <div className="hero-cta">
            <a href={`${API_BASE}/signup`} className="btn btn-accent btn-lg">
              Get Started Today
            </a>
            <a href="#how-it-works" className="btn btn-outline btn-lg hero-btn-outline">
              See How It Works
            </a>
          </div>
        </div>
      </div>

      <div className="hero-scroll">
        <a href="#trust-bar" className="scroll-indicator">
          <span></span>
        </a>
      </div>
    </section>
  );
}

export default Hero;
