import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Clock } from 'lucide-react';
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
                            Human-managed job applications for professionals across the US & Canada.
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
                            <li><a href="#contact">Contact</a></li>
                        </ul>
                    </div>

                    <div className="footer-section">
                        <h4 className="footer-title">Contact</h4>
                        <ul className="footer-contact">
                            <li>
                                <Mail className="footer-contact-icon" size={18} strokeWidth={2} />
                                <a href="mailto:clientservices@guzmancareerservices.com">clientservices@guzmancareerservices.com</a>
                            </li>
                            <li>
                                <Clock className="footer-contact-icon" size={18} strokeWidth={2} />
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
