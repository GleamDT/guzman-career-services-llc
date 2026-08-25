import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Header.css';
import Logo from './Logo';
import { SITE_MODE } from '../lib/siteMode';
import { API_BASE } from '../lib/apiBase';

function Header() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
    };

    return (
        <header className={`header ${scrolled ? 'header-scrolled' : ''}`}>
            <div className="container header-container">
                <a href="#home" className="logo" onClick={closeMobileMenu}>
                    <Logo variant={scrolled ? 'color' : 'white'} className="logo-image" />
                </a>

                <nav className={`nav ${mobileMenuOpen ? 'nav-open' : ''}`}>
                    <a href="#home" className="nav-link" onClick={closeMobileMenu}>Home</a>
                    <a href="#services" className="nav-link" onClick={closeMobileMenu}>Services</a>
                    <a href="#how-it-works" className="nav-link" onClick={closeMobileMenu}>How It Works</a>
                    <a href="#who-its-for" className="nav-link" onClick={closeMobileMenu}>Who It's For</a>
                    <a href="#contact" className="nav-link" onClick={closeMobileMenu}>
                        Contact Us
                    </a>
                    <a
                        href="https://calendly.com/clientservices-guzmancareerservices/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="nav-link nav-link-cta"
                        onClick={closeMobileMenu}
                    >
                        Book Consultation
                    </a>
                    {SITE_MODE === 'marketing' ? (
                        <a
                            className="nav-link nav-link-login"
                            href={`${API_BASE}/login`}
                            onClick={closeMobileMenu}
                        >
                            Client Login
                        </a>
                    ) : (
                        <Link
                            className="nav-link nav-link-login"
                            to="/login"
                            onClick={closeMobileMenu}
                        >
                            Login
                        </Link>
                    )}
                </nav>

                <button
                    className={`mobile-menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
                    onClick={toggleMobileMenu}
                    aria-label="Toggle menu"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
        </header>
    );
}

export default Header;
