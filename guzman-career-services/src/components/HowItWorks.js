import React from 'react';
import Reveal from './Reveal';
import './HowItWorks.css';

function HowItWorks() {
    const steps = [
        {
            number: '01',
            title: "Tell Us What You're Looking For",
            description: 'Target roles, locations, salary preferences, work arrangement and other criteria.'
        },
        {
            number: '02',
            title: 'We Build Your Application Strategy',
            description: 'Your specialist establishes the search criteria and application parameters.'
        },
        {
            number: '03',
            title: 'We Find Relevant Opportunities',
            description: 'Your application specialist researches openings based on your approved roles, locations, work preferences and other search criteria. Opportunities are evaluated before moving into the application process.'
        },
        {
            number: '04',
            title: 'We Apply & Track Everything',
            description: 'Applications are completed and recorded in your application tracker.'
        },
        {
            number: '05',
            title: "We Review What's Working",
            description: 'Application performance informs adjustments to targeting and strategy.'
        }
    ];

    return (
        <section id="how-it-works" className="section section-alt how-it-works-section">
            <div className="how-it-works-glow" />
            <div className="container">
                <Reveal>
                    <div className="section-header text-center">
                        <h2 className="section-title">How It Works</h2>
                        <p className="section-subtitle">
                            A managed 5-step process, from your first brief to ongoing strategy adjustments
                        </p>
                    </div>
                </Reveal>
                <div className="steps-container">
                    {steps.map((step, index) => (
                        <Reveal delay={index * 100} key={index}>
                            <div className="step-item">
                                <div className="step-number">{step.number}</div>
                                <div className="step-content">
                                    <h3 className="step-title">{step.title}</h3>
                                    <p className="step-description">{step.description}</p>
                                </div>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default HowItWorks;
