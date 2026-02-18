import React from 'react';
import './CTA.css';

function CTA() {
    return (
        <section id="cta" className="cta-section">
            <div className="cta-background">
                <div className="cta-overlay"></div>
            </div>
            <div className="container cta-content">
                <div className="cta-text">
                    <h2 className="cta-title">Start Your Career Journey Today</h2>
                    <p className="cta-subtitle">
                        Don't let another opportunity pass you by. Partner with Guzman Career Service
                        and take the first step toward landing your dream job with confidence.
                    </p>
                    <div className="cta-buttons">
                        <a href="#contact" className="btn btn-accent btn-lg">
                            Get Started Now
                        </a>
                        <a href="tel:+1234567890" className="btn btn-outline btn-lg cta-btn-outline">
                            Call Us Today
                        </a>
                    </div>
                    <div className="cta-trust">
                        <div className="trust-item">
                            <span className="trust-icon">✓</span>
                            <span className="trust-text">No Long-Term Contracts</span>
                        </div>
                        <div className="trust-item">
                            <span className="trust-icon">✓</span>
                            <span className="trust-text">100% Confidential</span>
                        </div>
                        <div className="trust-item">
                            <span className="trust-icon">✓</span>
                            <span className="trust-text">Satisfaction Guaranteed</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default CTA;
