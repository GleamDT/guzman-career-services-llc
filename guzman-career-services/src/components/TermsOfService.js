import React from 'react';
import { Link } from 'react-router-dom';
import { TERMS_OF_SERVICE } from '../lib/legalContent';
import Logo from './Logo';
import './LegalPages.css';

function TermsOfService() {
    return (
        <div className="legal-page">
            <header className="legal-header">
                <div className="container">
                    <Link to="/" className="legal-logo">
                        <Logo />
                    </Link>
                </div>
            </header>

            <main className="legal-main">
                <div className="container">
                    <div className="legal-content">
                        <div className="legal-title-block">
                            <h1>{TERMS_OF_SERVICE.title}</h1>
                            <h2>{TERMS_OF_SERVICE.subtitle}</h2>
                            <p className="legal-effective-date">Effective Date: {TERMS_OF_SERVICE.effectiveDate}</p>
                        </div>

                        {TERMS_OF_SERVICE.sections.map((section) => (
                            <section key={section.number} className="legal-section">
                                <h3>
                                    <span className="section-number">{section.number}.</span> {section.title}
                                </h3>
                                {section.content && (
                                    <p className="section-content">{section.content}</p>
                                )}
                                {section.items && (
                                    <ul className="section-list">
                                        {section.items.map((item, idx) => (
                                            <li key={idx}>{item}</li>
                                        ))}
                                    </ul>
                                )}
                                {section.footer && (
                                    <p className="section-footer">{section.footer}</p>
                                )}
                            </section>
                        ))}

                        <section className="legal-section legal-final-acknowledgment">
                            <h3>{TERMS_OF_SERVICE.finalAcknowledgment.title}</h3>
                            <p className="section-content">{TERMS_OF_SERVICE.finalAcknowledgment.content}</p>
                            <ul className="section-list">
                                {TERMS_OF_SERVICE.finalAcknowledgment.items.map((item, idx) => (
                                    <li key={idx}>{item}</li>
                                ))}
                            </ul>
                            <p className="section-footer final-footer">{TERMS_OF_SERVICE.finalAcknowledgment.footer}</p>
                        </section>
                    </div>

                    <div className="legal-back-link">
                        <Link to="/">← Back to Home</Link>
                    </div>
                </div>
            </main>

            <footer className="legal-footer">
                <div className="container">
                    <p>© {new Date().getFullYear()} Guzman Career Services. All rights reserved.</p>
                    <div className="legal-footer-links">
                        <Link to="/privacy-policy">Privacy Policy</Link>
                        <span>•</span>
                        <Link to="/terms-of-service">Terms of Service</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default TermsOfService;
