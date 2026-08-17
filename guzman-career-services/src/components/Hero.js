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
    titleBefore: 'Tell Us ',
    titleHighlight: "What You're Looking For",
    subtitle: 'Target roles, locations, salary preferences, work arrangement and other criteria.',
  },
  {
    number: '02',
    titleBefore: 'We Build Your ',
    titleHighlight: 'Application Strategy',
    subtitle: 'Your specialist establishes the search criteria and application parameters.',
  },
  {
    number: '03',
    titleBefore: 'We Find ',
    titleHighlight: 'Relevant Opportunities',
    subtitle: 'Human specialists research and evaluate jobs against your criteria.',
  },
  {
    number: '04',
    titleBefore: 'We Apply & ',
    titleHighlight: 'Track Everything',
    subtitle: 'Applications are completed and recorded in your application tracker.',
  },
  {
    number: '05',
    titleBefore: 'We Review ',
    titleHighlight: "What's Working",
    subtitle: 'Application performance informs adjustments to targeting and strategy.',
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

      <div className="hero-pagination-wrap">
        <div className="hero-pagination"></div>
        <div className="hero-autoplay-progress" ref={progressRef}>
          <div className="hero-autoplay-progress-bar"></div>
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
