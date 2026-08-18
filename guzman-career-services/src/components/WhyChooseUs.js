import React from 'react';
import { UserCheck, Target, ClipboardList, RefreshCw } from 'lucide-react';
import IconBadge from './IconBadge';
import './WhyChooseUs.css';

function WhyChooseUs() {
    const reasons = [
        {
            icon: UserCheck,
            title: 'Human Application Specialists',
            description: 'Real people manage the application process.'
        },
        {
            icon: Target,
            title: 'Targeted, Not Mass-Applied',
            description: "Opportunities are evaluated against the client's criteria."
        },
        {
            icon: ClipboardList,
            title: 'Transparent Tracking',
            description: 'Clients can see where applications have been submitted.'
        },
        {
            icon: RefreshCw,
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
                                <IconBadge icon={reason.icon} variant="teal" />
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
