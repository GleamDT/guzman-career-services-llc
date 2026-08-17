import React from 'react';
import './WhyChooseUs.css';

function WhyChooseUs() {
    const reasons = [
        {
            icon: '🧑‍💼',
            title: 'Human Application Specialists',
            description: 'Real people manage the application process.'
        },
        {
            icon: '🎯',
            title: 'Targeted, Not Mass-Applied',
            description: "Opportunities are evaluated against the client's criteria."
        },
        {
            icon: '📋',
            title: 'Transparent Tracking',
            description: 'Clients can see where applications have been submitted.'
        },
        {
            icon: '🔄',
            title: 'Strategy That Can Adapt',
            description: 'If market response indicates a problem, targeting can be reassessed.'
        }
    ];

    return (
        <section id="why-choose-us" className="section section-alt">
            <div className="container">
                <div className="section-header text-center">
                    <h2 className="section-title">Why Choose Us</h2>
                </div>
                <div className="reasons-grid">
                    {reasons.map((reason, index) => (
                        <div
                            key={index}
                            className="reason-card"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div className="reason-icon-wrapper">
                                <div className="reason-icon">{reason.icon}</div>
                            </div>
                            <h3 className="reason-title">{reason.title}</h3>
                            <p className="reason-description">{reason.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default WhyChooseUs;
