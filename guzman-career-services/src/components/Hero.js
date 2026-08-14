import React, { useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import './Hero.css';
import { API_BASE } from '../lib/apiBase';

const SLIDES = [
  {
    number: '01',
    badge: 'Career Assessment',
    titleBefore: 'Know Exactly ',
    titleHighlight: 'Where You Stand',
    subtitle: "A deep-dive into your goals, experience, and target opportunities, so every step after this one is the right one.",
  },
  {
    number: '02',
    badge: 'Resume Optimization',
    titleBefore: 'A Resume That ',
    titleHighlight: 'Gets You Noticed',
    subtitle: 'Professionally crafted resumes and profiles built to pass applicant tracking systems and catch a recruiter’s eye.',
  },
  {
    number: '03',
    badge: 'Job Applications',
    titleBefore: 'Applications, ',
    titleHighlight: 'Handled For You',
    subtitle: 'Targeted job applications and strategic follow-ups, managed end to end, so you spend your time preparing, not searching.',
  },
  {
    number: '04',
    badge: 'Interview Preparation',
    titleBefore: 'Walk Into ',
    titleHighlight: 'Every Interview Ready',
    subtitle: 'Mock interviews, answer strategies, and confidence coaching tailored to your target roles.',
  },
  {
    number: '05',
    badge: 'Job Offer Support',
    titleBefore: 'From ',
    titleHighlight: 'Offer to Onboarding',
    subtitle: 'Expert guidance on evaluating offers and negotiating compensation, all the way through to your first day.',
  },
];

function Hero() {
  const progressRef = useRef(null);

  const handleAutoplayTimeLeft = (_swiper, _timeLeft, percentage) => {
    if (progressRef.current) {
      progressRef.current.style.setProperty('--progress', 1 - percentage);
    }
  };

  return (
    <section id="home" className="hero">
      <div className="hero-background">
        <div className="hero-overlay"></div>
      </div>

      <div className="hero-carousel-wrap">
        <Swiper
          modules={[Autoplay, Pagination, Navigation]}
          autoplay={{ delay: 6000, disableOnInteraction: false }}
          pagination={{ el: '.hero-pagination', clickable: true }}
          navigation={{ prevEl: '.hero-arrow--prev', nextEl: '.hero-arrow--next' }}
          loop
          onAutoplayTimeLeft={handleAutoplayTimeLeft}
          className="hero-swiper"
        >
          {SLIDES.map((slide, i) => (
            <SwiperSlide key={i}>
              <div className="container hero-content">
                <div className="hero-text">
                  <div className="hero-kicker">
                    <span className="hero-kicker-number">{slide.number}</span>
                    <span className="hero-kicker-line"></span>
                    <span className="hero-kicker-label">{slide.badge}</span>
                  </div>
                  <h1 className="hero-title">
                    {slide.titleBefore}
                    <span className="hero-highlight">{slide.titleHighlight}</span>
                  </h1>
                  <p className="hero-subtitle">{slide.subtitle}</p>
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
            </SwiperSlide>
          ))}
        </Swiper>

        <button className="hero-arrow hero-arrow--prev" aria-label="Previous slide">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
        </button>
        <button className="hero-arrow hero-arrow--next" aria-label="Next slide">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
        </button>
      </div>

      <div className="container hero-stats-wrap">
        <div className="hero-stats">
          <div className="stat-item">
            <div className="stat-number">500+</div>
            <div className="stat-label">Successful Placements</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">95%</div>
            <div className="stat-label">Client Satisfaction</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">10+</div>
            <div className="stat-label">Years Experience</div>
          </div>
        </div>
      </div>

      <div className="hero-pagination-wrap">
        <div className="hero-pagination"></div>
        <div className="hero-autoplay-progress" ref={progressRef}>
          <div className="hero-autoplay-progress-bar"></div>
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
