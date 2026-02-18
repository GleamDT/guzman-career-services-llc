import React from 'react';
import './Services.css';

function Services() {
    const serviceCategories = [
        {
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
            formUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSd0r-Oqtumv--5uwbrTpRnhK7eR8vhk6j0svQVyMLUxEqwdGg/viewform',
            buttonText: 'Get Started Today',
            gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
        },
        {
            id: 'tech2mates',
            icon: '🤝',
            title: 'Tech2mates Students Apply Here',
            tagline: 'Student Applications',
            description: 'Tech2mates students can apply here to access exclusive career support and opportunities. We provide comprehensive career guidance tailored for tech students to help launch your professional journey.',
            features: [
                'Professional resume & CV optimization',
                'Career profile enhancement',
                'Job application strategy & support'
            ],
            formUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSdvjvE3MfW9VrPgMeWrfTepbpbFNqZxr4NIdWBBE_JSsmmAwg/viewform',
            buttonText: 'Apply Here',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }
    ];

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
                    {serviceCategories.map((category, index) => (
                        <div
                            key={category.id}
                            className="service-category-card"
                            style={{ animationDelay: `${index * 0.2}s` }}
                        >
                            <div className="category-header" style={{ background: category.gradient }}>
                                <div className="category-icon">{category.icon}</div>
                                <div className="category-title-group">
                                    <span className="category-tagline">{category.tagline}</span>
                                    <h3 className="category-title">{category.title}</h3>
                                </div>
                            </div>

                            <div className="category-content">
                                <p className="category-description">{category.description}</p>

                                <ul className="category-features">
                                    {category.features.map((feature, idx) => (
                                        <li key={idx} className="feature-item">
                                            <span className="feature-icon">✓</span>
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <a
                                    href={category.formUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="category-button"
                                    style={{ background: category.gradient }}
                                >
                                    {category.buttonText}
                                    <span className="button-arrow">→</span>
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default Services;
