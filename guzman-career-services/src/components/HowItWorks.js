import React from 'react';
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
            description: 'Human specialists research and evaluate jobs against your criteria.'
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
        <section id="how-it-works" className="section section-alt">
            <div className="container">
                <div className="section-header text-center">
                    <h2 className="section-title">How It Works</h2>
                    <p className="section-subtitle">
                        A managed 5-step process, from your first brief to ongoing strategy adjustments
                    </p>
                </div>
                <div className="steps-container">
                    {steps.map((step, index) => (
                        <div
                            key={index}
                            className="step-item"
                            style={{ animationDelay: `${index * 0.15}s` }}
                        >
                            <div className="step-number">{step.number}</div>
                            <div className="step-content">
                                <h3 className="step-title">{step.title}</h3>
                                <p className="step-description">{step.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default HowItWorks;
