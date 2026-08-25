import React from 'react';
import { Link } from 'react-router-dom';
import { PRIVACY_POLICY } from '../lib/legalContent';
import Logo from './Logo';
import './LegalPages.css';

function PrivacyPolicy() {
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
                            <h1>{PRIVACY_POLICY.title}</h1>
                            <h2>{PRIVACY_POLICY.subtitle}</h2>
                            <p className="legal-effective-date">Effective Date: {PRIVACY_POLICY.effectiveDate}</p>
                        </div>

                        {PRIVACY_POLICY.sections.map((section) => (
                            <section key={section.number} className="legal-section">
                                <h3>
                                    <span className="section-number">{section.number}.</span> {section.title}
                                </h3>
                                {section.content && (
                                    <p className="section-content">{section.content}</p>
                                )}
                                {section.subsections && section.subsections.map((sub, subIdx) => (
                                    <div key={subIdx} className="subsection">
                                        <h4>{sub.subtitle}</h4>
                                        <ul className="section-list">
                                            {sub.items.map((item, idx) => (
                                                <li key={idx}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
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
                            <h3>{PRIVACY_POLICY.acknowledgment.title}</h3>
                            <p className="section-content">{PRIVACY_POLICY.acknowledgment.content}</p>
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

export default PrivacyPolicy;
