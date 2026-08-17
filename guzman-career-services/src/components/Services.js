import React from 'react';
import './Services.css';

const ITEMS = [
    {
        icon: '🔍',
        title: 'We Find Opportunities',
        description: 'Human specialists source roles that match your target positions, locations, and criteria.',
    },
    {
        icon: '📨',
        title: 'We Submit Applications',
        description: 'Targeted, complete applications, submitted on your behalf, not mass-applied to everything available.',
    },
    {
        icon: '📊',
        title: 'We Track Your Search',
        description: 'Every application is recorded, so you always have visibility into where things stand.',
    },
];

function Services() {
    return (
        <section id="services" className="section">
            <div className="container">
                <div className="section-header text-center">
                    <h2 className="section-title">What Guzman Actually Handles</h2>
                    <p className="section-subtitle">
                        A managed job-application service, not a tool you have to operate yourself
                    </p>
                </div>

                <div className="service-items-grid">
                    {ITEMS.map((item, i) => (
                        <div className="service-item-card" key={i}>
                            <div className="service-item-icon">{item.icon}</div>
                            <h3 className="service-item-title">{item.title}</h3>
                            <p className="service-item-description">{item.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default Services;
