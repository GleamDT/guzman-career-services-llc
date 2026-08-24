import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { Star, Quote } from 'lucide-react';
import Reveal from './Reveal';
import './Testimonials.css';

const TESTIMONIALS = [
    {
        quote: "Thank you so much for the kind message and congratulations. I truly appreciate the support throughout this process. I'm very grateful for the work we did together and for being part of this journey. Thanks again for everything, and I look forward to staying in touch.",
        name: 'Chuka',
    },
    {
        quote: "Thank you so much for your kind message and support. I truly appreciate it. I'm grateful for all the effort and guidance your team provided throughout this process, and I'm glad we were able to achieve this outcome together.",
        name: 'Adedayo',
    },
    {
        quote: 'Thank you so much for the kind message and congratulations. I truly appreciate it. Thank you as well for the great work and consistent support throughout this process. It has genuinely been a pleasure working with you and your team.',
        name: 'Claude',
    },
    {
        quote: 'Thank you very much team, it was a pleasure working with you guys. Thank you once more.',
        name: 'Jane',
    },
    {
        quote: 'Thank you so much for the assistance so far. You guys have been wonderful and truly appreciated. I have already referred two of my people. More to come.',
        name: 'Tomisin',
    },
];

function Testimonials() {
    return (
        <section id="testimonials" className="section testimonials-section">
            <div className="testimonials-glow" />
            <div className="container">
                <Reveal>
                    <div className="section-header text-center">
                        <h2 className="section-title">What Clients Say</h2>
                        <p className="section-subtitle">
                            Real feedback from professionals who let us manage their job search
                        </p>
                    </div>
                </Reveal>

                <Reveal delay={120}>
                    <Swiper
                        modules={[Autoplay, Pagination]}
                        autoplay={{ delay: 5000, disableOnInteraction: false }}
                        pagination={{ clickable: true }}
                        loop
                        spaceBetween={28}
                        slidesPerView={1}
                        breakpoints={{
                            720: { slidesPerView: 2 },
                            1080: { slidesPerView: 3 },
                        }}
                        className="testimonials-swiper"
                    >
                        {TESTIMONIALS.map((t, i) => (
                            <SwiperSlide key={i}>
                                <div className="testimonial-card">
                                    <Quote className="testimonial-quote-icon" strokeWidth={1.5} />
                                    <div className="testimonial-stars">
                                        {Array.from({ length: 5 }).map((_, s) => (
                                            <Star key={s} size={16} fill="#00d4c4" stroke="#00d4c4" />
                                        ))}
                                    </div>
                                    <p className="testimonial-text">&ldquo;{t.quote}&rdquo;</p>
                                    <div className="testimonial-author">
                                        <span className="testimonial-name">{t.name}</span>
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </Reveal>
            </div>
        </section>
    );
}

export default Testimonials;
