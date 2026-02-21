import React, { useState } from 'react';
import './CTA.css';
import GetStartedModal from './GetStartedModal';

function CTA() {
    const [modalOpen, setModalOpen] = useState(false);

    return (
        <section id="cta" className="cta-section">
            <div className="cta-background">
                <div className="cta-overlay"></div>
            </div>
            <div className="container cta-content">
                <div className="cta-text">
                    <h2 className="cta-title">Start Your Career Journey Today</h2>
                    <p className="cta-subtitle">
                        Don't let another opportunity pass you by. Partner with Guzman Career Services
                        and take the first step toward landing your dream job with confidence.
                    </p>
                    <div className="cta-buttons">
                        <button onClick={() => setModalOpen(true)} className="btn btn-accent btn-lg">
                            Get Started Now
                        </button>
                        <a href="#contact" className="btn btn-outline btn-lg cta-btn-outline">
                            Contact Us
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
            <GetStartedModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
        </section>
    );
}

export default CTA;
