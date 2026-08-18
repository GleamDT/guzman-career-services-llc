import React from 'react';
import { Search, Send, BarChart3 } from 'lucide-react';
import IconBadge from './IconBadge';
import './Services.css';

const ITEMS = [
    {
        icon: Search,
        title: 'We Find Opportunities',
        description: 'Human specialists source roles that match your target positions, locations, and criteria.',
    },
    {
        icon: Send,
        title: 'We Submit Applications',
        description: 'Targeted, complete applications, submitted on your behalf, not mass-applied to everything available.',
    },
    {
        icon: BarChart3,
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
                            <IconBadge icon={item.icon} variant="navy" />
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
