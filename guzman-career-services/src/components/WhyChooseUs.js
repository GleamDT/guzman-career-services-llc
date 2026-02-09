import React from 'react';
import './WhyChooseUs.css';

function WhyChooseUs() {
    const reasons = [
        {
            icon: '👨‍💼',
            title: 'Experienced Career Specialists',
            description: 'Our team consists of certified career coaches with extensive industry experience and proven track records of success.'
        },
        {
            icon: '📊',
            title: 'Personalized Job Strategies',
            description: 'Every client receives a customized approach tailored to their unique goals, experience, and target industry.'
        },
        {
            icon: '🔐',
            title: 'Confidential & Ethical Service',
            description: 'We maintain the highest standards of confidentiality and professional ethics in all our client relationships.'
        },
        {
            icon: '✅',
            title: 'Proven Success Rate',
            description: 'With a 95% client satisfaction rate and hundreds of successful placements, our results speak for themselves.'
        }
    ];

    return (
        <section id="why-choose-us" className="section section-alt">
            <div className="container">
                <div className="section-header text-center">
                    <h2 className="section-title">Why Choose Us</h2>
                    <p className="section-subtitle">
                        Partner with a trusted career services provider committed to your success
                    </p>
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
