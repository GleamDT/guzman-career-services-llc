import React from 'react';
import './Hero.css';

function Hero() {
  return (
    <section id="home" className="hero">
      <div className="hero-background">
        <div className="hero-overlay"></div>
      </div>
      <div className="container hero-content">
        <div className="hero-text animate-fadeInUp">
          <h1 className="hero-title">
            Land Your Dream Job with
            <span className="hero-highlight"> Professional Career Support</span>
          </h1>
          <p className="hero-subtitle">
            Expert job application assistance, resume optimization, and career consulting
            to help you stand out and succeed in today's competitive job market.
          </p>
          <div className="hero-cta">
            <a href="#contact" className="btn btn-accent btn-lg">
              Get Started Today
            </a>
            <a href="#services" className="btn btn-outline btn-lg">
              Explore Services
            </a>
          </div>
        </div>
        <div className="hero-stats">
          <div className="stat-item animate-fadeInUp" style={{animationDelay: '0.2s'}}>
            <div className="stat-number">500+</div>
            <div className="stat-label">Successful Placements</div>
          </div>
          <div className="stat-item animate-fadeInUp" style={{animationDelay: '0.3s'}}>
            <div className="stat-number">95%</div>
            <div className="stat-label">Client Satisfaction</div>
          </div>
          <div className="stat-item animate-fadeInUp" style={{animationDelay: '0.4s'}}>
            <div className="stat-number">10+</div>
            <div className="stat-label">Years Experience</div>
          </div>
        </div>
      </div>
      <div className="hero-scroll">
        <a href="#services" className="scroll-indicator">
          <span></span>
        </a>
      </div>
    </section>
  );
}

export default Hero;
