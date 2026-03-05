import React, { useState, useEffect } from 'react';
import './Header.css';
import Login from './Login';

function Header() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [loginOpen, setLoginOpen] = useState(false);

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
        <>
        <header className={`header ${scrolled ? 'header-scrolled' : ''}`}>
            <div className="container header-container">
                <a href="#home" className="logo" onClick={closeMobileMenu}>
                    <img src="/logo.png" alt="Guzman Career Services" className="logo-image" />
                    <span className="logo-text">Guzman Career Services</span>
                </a>

                <nav className={`nav ${mobileMenuOpen ? 'nav-open' : ''}`}>
                    <a href="#home" className="nav-link" onClick={closeMobileMenu}>Home</a>
                    <a href="#services" className="nav-link" onClick={closeMobileMenu}>Services</a>
                    <a href="#how-it-works" className="nav-link" onClick={closeMobileMenu}>How It Works</a>
                    <a href="#about" className="nav-link" onClick={closeMobileMenu}>About</a>
                    <a href="#contact" className="nav-link nav-link-cta" onClick={closeMobileMenu}>
                        Contact Us
                    </a>
                    <button
                        className="nav-link nav-link-login"
                        onClick={() => { closeMobileMenu(); setLoginOpen(true); }}
                    >
                        Login
                    </button>
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

        <Login isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
        </>
    );
}

export default Header;
