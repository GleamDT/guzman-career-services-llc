import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import './Footer.css';

function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-content">
                    <div className="footer-section">
                        <div className="footer-logo">
                            <Logo variant="white" className="footer-logo-img" />
                        </div>
                        <p className="footer-description">
                            Professional career services helping you land your dream job with confidence and success.
                        </p>
                    </div>

                    <div className="footer-section">
                        <h4 className="footer-title">Our Service</h4>
                        <ul className="footer-links">
                            <li><a href="#services">What We Handle</a></li>
                            <li><a href="#how-it-works">How It Works</a></li>
                            <li><a href="#who-its-for">Who It's For</a></li>
                            <li><a href="#fit-check">Is This Right for You</a></li>
                        </ul>
                    </div>

                    <div className="footer-section">
                        <h4 className="footer-title">Company</h4>
                        <ul className="footer-links">
                            <li><a href="#problem">About Us</a></li>
                            <li><a href="#testimonials">Testimonials</a></li>
                            <li><a href="#consultation">Contact</a></li>
                        </ul>
                    </div>

                    <div className="footer-section">
                        <h4 className="footer-title">Contact</h4>
                        <ul className="footer-contact">
                            <li>
                                <span className="footer-contact-icon">📧</span>
                                <a href="mailto:clientservices@guzmancareerservices.com">clientservices@guzmancareerservices.com</a>
                            </li>
                            <li>
                                <span className="footer-contact-icon">🕒</span>
                                <span>Mon-Fri: 9AM-3PM CST</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="footer-bottom">
                    <div className="footer-copyright">
                        © {currentYear} Guzman Career Services. All rights reserved.
                    </div>
                    <div className="footer-legal">
                        <Link to="/privacy-policy">Privacy Policy</Link>
                        <span className="footer-separator">•</span>
                        <Link to="/terms-of-service">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
