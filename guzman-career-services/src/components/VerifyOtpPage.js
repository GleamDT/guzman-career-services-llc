import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import Logo from './Logo';
import './Login.css';

function VerifyOtpPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email;

    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resent, setResent] = useState(false);
    const [resending, setResending] = useState(false);

    if (!email) return <Navigate to="/signup" replace />;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const res = await fetch('/api/auth/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code }),
        });
        const data = await res.json();

        if (!res.ok) {
            setError(data.error || 'Verification failed. Please try again.');
            setLoading(false);
            return;
        }

        setLoading(false);
        navigate('/login', { state: { justVerified: true, email: data.email } });
    };

    const handleResend = async () => {
        setResending(true);
        setError('');
        await fetch('/api/auth/resend-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        setResending(false);
        setResent(true);
        setTimeout(() => setResent(false), 5000);
    };

    return (
        <div className="login-overlay login-overlay--page" role="dialog" aria-label="Verify your email">
            <div className="login-modal">
                <div className="login-left">
                    <div className="login-left-content">
                        <Logo variant="white" className="login-brand-logo" />
                        <div className="login-left-tagline">
                            <h2>Your Career Portal</h2>
                            <p>Almost there — verify your email to activate your account.</p>
                        </div>
                    </div>
                </div>

                <div className="login-left--mobile">
                    <Logo variant="white" className="login-brand-logo" />
                </div>

                <div className="login-right">
                    <div className="login-right-inner">
                        <div className="login-heading">
                            <h2>Check Your Email</h2>
                            <p>We sent a 6-digit code to <strong>{email}</strong>.</p>
                        </div>

                        <form className="login-form" onSubmit={handleSubmit}>
                            <div className="login-fields">
                                <div className="login-field">
                                    <label htmlFor="otp-code">Verification Code</label>
                                    <div className="login-input-wrap">
                                        <span className="material-symbols-outlined login-input-icon">password</span>
                                        <input
                                            type="text"
                                            id="otp-code"
                                            inputMode="numeric"
                                            autoComplete="one-time-code"
                                            maxLength={6}
                                            value={code}
                                            onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                                            placeholder="000000"
                                            style={{ letterSpacing: '0.4em', fontWeight: 700 }}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {error && <p className="login-error">{error}</p>}
                            {resent && !error && <p className="login-reset-sent" style={{ padding: '0.7rem 1rem' }}>A new code has been sent.</p>}

                            <button type="submit" className="login-submit" disabled={loading || code.length !== 6}>
                                {loading ? 'VERIFYING...' : 'VERIFY & CONTINUE'}
                            </button>

                            <button type="button" className="login-back-btn" onClick={handleResend} disabled={resending}>
                                {resending ? 'Sending...' : "Didn't get a code? Resend"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default VerifyOtpPage;
