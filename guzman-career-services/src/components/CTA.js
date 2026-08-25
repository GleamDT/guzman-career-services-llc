import React from 'react';
import './CTA.css';

function CTA() {
    return (
        <section id="consultation" className="cta-section">
            <div className="cta-background">
                <div className="cta-overlay"></div>
            </div>
            <div className="container cta-content">
                <div className="cta-text">
                    <h2 className="cta-title">Not Sure If Managed Job Applications Are Right for You?</h2>
                    <p className="cta-subtitle">
                        Start with a free consultation. We'll discuss your target positions, experience,
                        current job search and application goals, and determine whether our service is a good fit.
                    </p>
                    <div className="cta-buttons">
                        <a
                            href="https://calendly.com/clientservices-guzmancareerservices/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-accent btn-lg"
                        >
                            Book Your Free Consultation
                        </a>
                    </div>
                    <div className="cta-trust">
                        <div className="trust-item">
                            <span className="trust-icon">✓</span>
                            <span className="trust-text">No Obligation</span>
                        </div>
                        <div className="trust-item">
                            <span className="trust-icon">✓</span>
                            <span className="trust-text">No Unrealistic Promises</span>
                        </div>
                        <div className="trust-item">
                            <span className="trust-icon">✓</span>
                            <span className="trust-text">Just an Honest Conversation</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default CTA;
