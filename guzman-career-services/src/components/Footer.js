import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Clock, X } from 'lucide-react';
import Logo from './Logo';
import './Footer.css';

// Brand logos aren't part of lucide-react's icon set, so these two are small
// inline SVGs instead of pulling in a second icon library for just two marks.
function FacebookIcon(props) {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" {...props}>
            <path d="M22 12.06C22 6.51 17.52 2 12 2S2 6.51 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.89h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
        </svg>
    );
}

function InstagramIcon(props) {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
    );
}

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
                        <div className="footer-social">
                            <a
                                href="https://www.facebook.com/share/19Gfz1h8V5/"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Guzman Career Services on Facebook"
                                className="footer-social-link"
                            >
                                <FacebookIcon />
                            </a>
                            <a
                                href="https://www.instagram.com/guzmancareers"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Guzman Career Services on Instagram"
                                className="footer-social-link"
                            >
                                <InstagramIcon />
                            </a>
                            <a
                                href="https://x.com/guzmancareers"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Guzman Career Services on X"
                                className="footer-social-link"
                            >
                                <X size={20} strokeWidth={2} />
                            </a>
                        </div>
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
