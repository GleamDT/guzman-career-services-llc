import React from 'react';
import './Testimonials.css';

function Testimonials() {
    const testimonials = [
        {
            name: 'Sarah Johnson',
            role: 'Marketing Manager',
            company: 'Tech Solutions Inc.',
            text: 'Guzman Career Service transformed my job search. Their resume optimization and interview coaching helped me land my dream role in just 6 weeks. The team is professional, responsive, and truly invested in your success.',
            rating: 5
        },
        {
            name: 'Michael Chen',
            role: 'Software Engineer',
            company: 'Innovation Labs',
            text: 'I was struggling to get interviews despite having strong qualifications. Their LinkedIn optimization and application strategy made all the difference. Within a month, I had multiple offers to choose from.',
            rating: 5
        },
        {
            name: 'Emily Rodriguez',
            role: 'Financial Analyst',
            company: 'Capital Advisors',
            text: 'The personalized approach and attention to detail set Guzman Career Service apart. They helped me negotiate a 25% salary increase and transition into a role that aligns perfectly with my career goals.',
            rating: 5
        }
    ];

    return (
        <section id="testimonials" className="section">
            <div className="container">
                <div className="section-header text-center">
                    <h2 className="section-title">Client Success Stories</h2>
                    <p className="section-subtitle">
                        Hear from professionals who achieved their career goals with our support
                    </p>
                </div>
                <div className="testimonials-grid">
                    {testimonials.map((testimonial, index) => (
                        <div
                            key={index}
                            className="testimonial-card"
                            style={{ animationDelay: `${index * 0.15}s` }}
                        >
                            <div className="testimonial-rating">
                                {[...Array(testimonial.rating)].map((_, i) => (
                                    <span key={i} className="star">⭐</span>
                                ))}
                            </div>
                            <p className="testimonial-text">"{testimonial.text}"</p>
                            <div className="testimonial-author">
                                <div className="author-avatar">
                                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div className="author-info">
                                    <div className="author-name">{testimonial.name}</div>
                                    <div className="author-role">{testimonial.role}</div>
                                    <div className="author-company">{testimonial.company}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default Testimonials;
