import React from 'react';
import './Footer.css';

function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-content">
                    <div className="footer-section">
                        <div className="footer-logo">
                            <span className="footer-logo-icon">💼</span>
                            <span className="footer-logo-text">Guzman Career Service LLC</span>
                        </div>
                        <p className="footer-description">
                            Professional career services helping you land your dream job with confidence and success.
                        </p>
                        <div className="footer-social">
                            <a href="#facebook" className="footer-social-link" aria-label="Facebook">
                                <span>f</span>
                            </a>
                            <a href="#twitter" className="footer-social-link" aria-label="Twitter">
                                <span>𝕏</span>
                            </a>
                        </div>
                    </div>

                    <div className="footer-section">
                        <h4 className="footer-title">Services</h4>
                        <ul className="footer-links">
                            <li><a href="#services">Job Application Assistance</a></li>
                            <li><a href="#services">Resume Optimization</a></li>

                            <li><a href="#services">Cover Letter Writing</a></li>
                            <li><a href="#services">Interview Coaching</a></li>
                            <li><a href="#services">Career Consulting</a></li>
                        </ul>
                    </div>

                    <div className="footer-section">
                        <h4 className="footer-title">Company</h4>
                        <ul className="footer-links">
                            <li><a href="#about">About Us</a></li>
                            <li><a href="#how-it-works">How It Works</a></li>
                            <li><a href="#testimonials">Testimonials</a></li>
                            <li><a href="#contact">Contact</a></li>
                        </ul>
                    </div>

                    <div className="footer-section">
                        <h4 className="footer-title">Contact</h4>
                        <ul className="footer-contact">
                            <li>
                                <span className="footer-contact-icon">📧</span>
                                <a href="mailto:info@guzmancareerservice.com">info@guzmancareerservice.com</a>
                            </li>
                            <li>
                                <span className="footer-contact-icon">🕒</span>
                                <span>Mon-Fri: 9AM-2PM CST</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="footer-bottom">
                    <div className="footer-copyright">
                        © {currentYear} Guzman Career Service LLC. All rights reserved.
                    </div>
                    <div className="footer-legal">
                        <a href="#privacy">Privacy Policy</a>
                        <span className="footer-separator">•</span>
                        <a href="#terms">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
