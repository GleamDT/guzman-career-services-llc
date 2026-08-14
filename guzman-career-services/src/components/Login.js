import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { setToken } from '../lib/auth';
import Logo from './Logo';
import './Login.css';

function Login({ isOpen, onClose, asPage = false }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const [mode, setMode] = useState(asPage && location.pathname === '/signup' ? 'signup' : 'login');
    const [forgotMode, setForgotMode] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Keep the active tab in sync with the URL (bookmarking, browser back/forward)
    useEffect(() => {
        if (!asPage) return;
        setMode(location.pathname === '/signup' ? 'signup' : 'login');
    }, [asPage, location.pathname]);

    const switchTab = (nextMode) => {
        setMode(nextMode);
        setForgotMode(false);
        setError('');
        navigate(nextMode === 'signup' ? '/signup' : '/login', { replace: true });
    };

    // ── Login form ──────────────────────────────────────────────────────────
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({ email: location.state?.email || '', password: '', remember: false });
    const [forgotEmail, setForgotEmail] = useState('');
    const [resetSent, setResetSent] = useState(false);
    const [justVerified] = useState(Boolean(location.state?.justVerified));

    const switchToForgot = () => { setForgotMode(true); setError(''); setResetSent(false); };
    const switchToLogin = () => { setForgotMode(false); setError(''); setResetSent(false); setForgotEmail(''); };

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: forgotEmail }),
        });
        setLoading(false);
        setResetSent(true);
    };

    useEffect(() => {
        if (!isOpen || asPage) return;
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose, asPage]);

    useEffect(() => {
        if (asPage) return;
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen, asPage]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: formData.email, password: formData.password }),
        });
        const data = await res.json();

        if (!res.ok) {
            if (data.code === 'EMAIL_NOT_VERIFIED') {
                setLoading(false);
                navigate('/verify-email', { state: { email: data.email } });
                return;
            }
            setError(data.error || 'Incorrect email or password. Please try again.');
            setLoading(false);
            return;
        }

        setToken(data.token);
        sessionStorage.setItem('auth', JSON.stringify({ role: data.role, email: data.email }));
        setLoading(false);
        onClose();
        const dest = data.role === 'admin' ? '/admin' : data.role === 'staff' ? '/staff' : '/dashboard';
        navigate(dest);
    };

    // ── Signup form ─────────────────────────────────────────────────────────
    const preselectedTrack = searchParams.get('track');
    const [showSignupPassword, setShowSignupPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [signupData, setSignupData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        track: preselectedTrack === 'tech2mate' ? 'tech2mate' : 'general',
    });

    const handleSignupChange = (e) => {
        const { name, value } = e.target;
        setSignupData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const selectTrack = (track) => {
        setSignupData(prev => ({ ...prev, track }));
        setError('');
    };

    const handleSignupSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (signupData.password !== signupData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);

        const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: signupData.email,
                password: signupData.password,
                intakeFormType: signupData.track,
            }),
        });
        const data = await res.json();

        if (!res.ok) {
            setError(data.error || 'Signup failed. Please try again.');
            setLoading(false);
            return;
        }

        setLoading(false);
        navigate('/verify-email', { state: { email: signupData.email } });
    };

    const heading = forgotMode
        ? { title: 'Reset Password', subtitle: "Enter your email and we'll send you a reset link if your account exists." }
        : mode === 'signup'
            ? { title: 'Create Your Account', subtitle: 'Just a few details to get started.' }
            : { title: 'Welcome Back', subtitle: 'Please enter your details to access your portal.' };

    const tagline = mode === 'signup'
        ? "Create an account to get started — you'll complete your profile right after signing up."
        : 'Log in to manage your applications, invoices, and career journey with Guzman Career Services.';

    if (!isOpen) return null;

    return (
        <div
            className={`login-overlay ${asPage ? 'login-overlay--page' : ''}`}
            onClick={asPage ? undefined : onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Login"
        >
            <div className="login-modal" onClick={e => e.stopPropagation()}>

                {!asPage && (
                    <button className="login-close" onClick={onClose} aria-label="Close login">
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                        </svg>
                    </button>
                )}

                {/* Left brand panel — desktop */}
                <div className="login-left">
                    <div className="login-left-content">
                        <Logo variant="white" className="login-brand-logo" />
                        <div className="login-left-tagline">
                            <h2>Your Career Portal</h2>
                            <p>{tagline}</p>
                        </div>
                    </div>
                </div>

                {/* Compact brand strip — mobile only */}
                <div className="login-left--mobile">
                    <img src="/logo.png" alt="Guzman Career Services" className="login-brand-logo" />
                </div>

                {/* Right panel */}
                <div className="login-right">
                    <div className="login-right-inner">
                        {asPage && !forgotMode && (
                            <div className="login-tabs">
                                <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => switchTab('login')}>
                                    Log In
                                </button>
                                <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => switchTab('signup')}>
                                    Sign Up
                                </button>
                            </div>
                        )}

                        <div className="login-heading">
                            <h2>{heading.title}</h2>
                            <p>{heading.subtitle}</p>
                        </div>

                        {forgotMode ? (
                            resetSent ? (
                                <div className="login-reset-sent">
                                    <span className="material-symbols-outlined">mark_email_read</span>
                                    <p>If <strong>{forgotEmail}</strong> is registered with us, a password reset link has been sent. Check your inbox.</p>
                                    <button type="button" className="login-back-btn" onClick={switchToLogin}>Back to Login</button>
                                </div>
                            ) : (
                                <form className="login-form" onSubmit={handleForgotSubmit}>
                                    <div className="login-fields">
                                        <div className="login-field">
                                            <div className="login-input-wrap">
                                                <span className="material-symbols-outlined login-input-icon">mail</span>
                                                <input
                                                    type="email"
                                                    id="forgot-email"
                                                    value={forgotEmail}
                                                    onChange={e => setForgotEmail(e.target.value)}
                                                    placeholder=" "
                                                    autoComplete="email"
                                                    required
                                                />
                                                <label htmlFor="forgot-email">Email Address</label>
                                            </div>
                                        </div>
                                    </div>

                                    {error && <p className="login-error">{error}</p>}

                                    <button type="submit" className="login-submit" disabled={loading}>
                                        <span className="material-symbols-outlined">send</span>
                                        {loading ? 'SENDING...' : 'SEND RESET LINK'}
                                    </button>

                                    <button type="button" className="login-back-btn" onClick={switchToLogin}>
                                        ← Back to Login
                                    </button>
                                </form>
                            )
                        ) : mode === 'signup' ? (
                            <>
                                <form className="login-form" onSubmit={handleSignupSubmit}>
                                    <div className="login-fields">
                                        <div className="login-field">
                                            <div className="login-input-wrap">
                                                <span className="material-symbols-outlined login-input-icon">mail</span>
                                                <input
                                                    type="email"
                                                    id="signup-email"
                                                    name="email"
                                                    value={signupData.email}
                                                    onChange={handleSignupChange}
                                                    placeholder=" "
                                                    autoComplete="email"
                                                    required
                                                />
                                                <label htmlFor="signup-email">Email Address</label>
                                            </div>
                                        </div>

                                        <div className="login-fields-row">
                                            <div className="login-field">
                                                <div className="login-input-wrap">
                                                    <span className="material-symbols-outlined login-input-icon">lock</span>
                                                    <input
                                                        type={showSignupPassword ? 'text' : 'password'}
                                                        id="signup-password"
                                                        name="password"
                                                        value={signupData.password}
                                                        onChange={handleSignupChange}
                                                        placeholder=" "
                                                        autoComplete="new-password"
                                                        minLength={8}
                                                        required
                                                    />
                                                    <label htmlFor="signup-password">Password</label>
                                                    <button
                                                        type="button"
                                                        className="login-pw-toggle"
                                                        onClick={() => setShowSignupPassword(v => !v)}
                                                        aria-label="Toggle password visibility"
                                                    >
                                                        <span className="material-symbols-outlined">
                                                            {showSignupPassword ? 'visibility_off' : 'visibility'}
                                                        </span>
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="login-field">
                                                <div className="login-input-wrap">
                                                    <span className="material-symbols-outlined login-input-icon">lock_reset</span>
                                                    <input
                                                        type={showConfirmPassword ? 'text' : 'password'}
                                                        id="signup-confirm-password"
                                                        name="confirmPassword"
                                                        value={signupData.confirmPassword}
                                                        onChange={handleSignupChange}
                                                        placeholder=" "
                                                        autoComplete="new-password"
                                                        minLength={8}
                                                        required
                                                    />
                                                    <label htmlFor="signup-confirm-password">Confirm Password</label>
                                                    <button
                                                        type="button"
                                                        className="login-pw-toggle"
                                                        onClick={() => setShowConfirmPassword(v => !v)}
                                                        aria-label="Toggle confirm password visibility"
                                                    >
                                                        <span className="material-symbols-outlined">
                                                            {showConfirmPassword ? 'visibility_off' : 'visibility'}
                                                        </span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="login-field">
                                            <span className="login-track-label">I'm signing up as</span>
                                            <div className="login-segmented" role="tablist" aria-label="Signup track">
                                                <button
                                                    type="button"
                                                    role="tab"
                                                    aria-selected={signupData.track === 'general'}
                                                    className={signupData.track === 'general' ? 'active' : ''}
                                                    onClick={() => selectTrack('general')}
                                                >
                                                    General
                                                </button>
                                                <button
                                                    type="button"
                                                    role="tab"
                                                    aria-selected={signupData.track === 'tech2mate'}
                                                    className={signupData.track === 'tech2mate' ? 'active' : ''}
                                                    onClick={() => selectTrack('tech2mate')}
                                                >
                                                    Tech2Mate
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {error && <p className="login-error">{error}</p>}

                                    <button type="submit" className="login-submit" disabled={loading}>
                                        {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
                                    </button>
                                </form>

                                <p className="login-disclaimer">
                                    By creating an account, you agree to Guzman Career Services' <Link to="/terms-of-service">Terms of Use</Link> and <Link to="/privacy-policy">Privacy Policy</Link>.
                                </p>
                            </>
                        ) : (
                            <>
                                {justVerified && (
                                    <p className="login-verified-banner">
                                        <span className="material-symbols-outlined">check_circle</span>
                                        Email verified — log in to continue.
                                    </p>
                                )}

                                <form className="login-form" onSubmit={handleSubmit}>
                                    <div className="login-fields">
                                        <div className="login-field">
                                            <div className="login-input-wrap">
                                                <span className="material-symbols-outlined login-input-icon">mail</span>
                                                <input
                                                    type="email"
                                                    id="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    placeholder=" "
                                                    autoComplete="email"
                                                    required
                                                />
                                                <label htmlFor="email">Email Address</label>
                                            </div>
                                        </div>

                                        <div className="login-field">
                                            <div className="login-input-wrap">
                                                <span className="material-symbols-outlined login-input-icon">lock</span>
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    id="password"
                                                    name="password"
                                                    value={formData.password}
                                                    onChange={handleChange}
                                                    placeholder=" "
                                                    autoComplete="current-password"
                                                    required
                                                />
                                                <label htmlFor="password">Password</label>
                                                <button
                                                    type="button"
                                                    className="login-pw-toggle"
                                                    onClick={() => setShowPassword(v => !v)}
                                                    aria-label="Toggle password visibility"
                                                >
                                                    <span className="material-symbols-outlined">
                                                        {showPassword ? 'visibility_off' : 'visibility'}
                                                    </span>
                                                </button>
                                            </div>
                                            <button type="button" className="login-forgot login-forgot--inline" onClick={switchToForgot}>
                                                Forgot Password?
                                            </button>
                                        </div>
                                    </div>

                                    <div className="login-remember">
                                        <input
                                            type="checkbox"
                                            id="remember"
                                            name="remember"
                                            checked={formData.remember}
                                            onChange={handleChange}
                                        />
                                        <label htmlFor="remember">Keep me logged in on this device</label>
                                    </div>

                                    {error && <p className="login-error">{error}</p>}

                                    <button type="submit" className="login-submit" disabled={loading}>
                                        <span className="material-symbols-outlined">login</span>
                                        {loading ? 'SIGNING IN...' : 'LOG IN TO PORTAL'}
                                    </button>
                                </form>

                                <p className="login-disclaimer">
                                    Unauthorized access is prohibited. By logging in, you agree to Guzman Career Services' <Link to="/terms-of-service">Terms of Use</Link> and <Link to="/privacy-policy">Privacy Policy</Link>.
                                </p>
                            </>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

export default Login;
