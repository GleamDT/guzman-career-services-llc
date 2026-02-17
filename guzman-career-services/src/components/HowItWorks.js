import React from 'react';
import './HowItWorks.css';

function HowItWorks() {
    const steps = [
        {
            number: '01',
            title: 'Career Assessment',
            description: 'We begin with a comprehensive evaluation of your career goals, experience, and target opportunities to create a personalized strategy.'
        },
        {
            number: '02',
            title: 'Profile & Resume Optimization',
            description: 'Our experts craft and optimize your resume and CV to showcase your strengths and pass applicant tracking systems.'
        },
        {
            number: '03',
            title: 'Job Applications & Follow-ups',
            description: 'We assist with targeted job applications, ensuring each submission is professional, complete, and strategically followed up.'
        },
        {
            number: '04',
            title: 'Interview Preparation',
            description: 'Receive comprehensive coaching including mock interviews, answer strategies, and confidence-building techniques for success.'
        },
        {
            number: '05',
            title: 'Job Offer Support',
            description: 'Get expert guidance on evaluating offers, negotiating compensation, and making informed decisions about your career move.'
        }
    ];

    return (
        <section id="how-it-works" className="section section-alt">
            <div className="container">
                <div className="section-header text-center">
                    <h2 className="section-title">How It Works</h2>
                    <p className="section-subtitle">
                        Our proven 5-step process guides you from career assessment to job offer acceptance
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
                            {index < steps.length - 1 && <div className="step-connector"></div>}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default HowItWorks;
