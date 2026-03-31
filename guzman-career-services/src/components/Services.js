import React, { useState } from 'react';
import './Services.css';
import IntakeForm from './IntakeForm';

function Services() {
    const [showIntakeForm, setShowIntakeForm] = useState(false);

    const generalService = {
        id: 'general',
        icon: '💼',
        title: 'General Client Services',
        tagline: 'Comprehensive Career Support',
        description: 'Our full-service career support is designed for professionals at every stage. From resume optimization to interview coaching, we provide personalized guidance to help you land your dream job and advance your career.',
        features: [
            'Professional resume & CV optimization',
            'Career profile enhancement',
            'Job application strategy & support'
        ],
        buttonText: 'Get Started Today',
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    };

    // Tech2mates temporarily hidden — uncomment to re-enable
    // const tech2matesService = { ... }

    return (
        <section id="services" className="section">
            <div className="container">
                <div className="section-header text-center">
                    <h2 className="section-title">Our Professional Services</h2>
                    <p className="section-subtitle">
                        Choose the service path that best fits your career goals
                    </p>
                </div>

                <div className="service-categories">
                    <div
                        key={generalService.id}
                        className="service-category-card"
                    >
                        <div className="category-header" style={{ background: generalService.gradient }}>
                            <div className="category-icon">{generalService.icon}</div>
                            <div className="category-title-group">
                                <span className="category-tagline">{generalService.tagline}</span>
                                <h3 className="category-title">{generalService.title}</h3>
                            </div>
                        </div>

                        <div className="category-content">
                            <p className="category-description">{generalService.description}</p>

                            <ul className="category-features">
                                {generalService.features.map((feature, idx) => (
                                    <li key={idx} className="feature-item">
                                        <span className="feature-icon">✓</span>
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                className="category-button"
                                style={{ background: generalService.gradient }}
                                onClick={() => setShowIntakeForm(true)}
                            >
                                {generalService.buttonText}
                                <span className="button-arrow">→</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {showIntakeForm && <IntakeForm onClose={() => setShowIntakeForm(false)} />}
        </section>
    );
}

export default Services;
