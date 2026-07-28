import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setToken } from '../lib/auth';
import '../components/GetStartedModal.css';
import '../components/Login.css';

function SignupPage() {
    const [searchParams] = useSearchParams();
    const preselectedTrack = searchParams.get('track');
    const [track, setTrack] = useState(
        preselectedTrack === 'general' || preselectedTrack === 'tech2mate' ? preselectedTrack : null
    ); // null | 'general' | 'tech2mate'
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: formData.email, password: formData.password, intakeFormType: track }),
        });
        const data = await res.json();

        if (!res.ok) {
            setError(data.error || 'Signup failed. Please try again.');
            setLoading(false);
            return;
        }

        setToken(data.token);
        sessionStorage.setItem('auth', JSON.stringify({ role: data.role, email: data.email }));
        setLoading(false);
        navigate('/onboarding');
    };

    if (!track) {
        return (
            <div className="modal-overlay">
                <div className="modal-container">
                    <h2 className="modal-title">How would you like to get started?</h2>
                    <p className="modal-subtitle">Choose the option that best describes you</p>
                    <div className="modal-options">
                        <button className="modal-option" onClick={() => setTrack('general')}>
                            <span className="modal-option-icon">💼</span>
                            <h3>General Client</h3>
                            <p>Professionals seeking career support, resume optimization, and job placement help</p>
                        </button>
                        <button className="modal-option" onClick={() => setTrack('tech2mate')}>
                            <span className="modal-option-icon">🤝</span>
                            <h3>Tech2Mate Student</h3>
                            <p>Tech2mates students looking to take advantage of our Job Application service</p>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="login-overlay" role="dialog" aria-modal="true" aria-label="Sign up">
            <div className="login-modal">
                <div className="login-right" style={{ margin: '0 auto' }}>
                    <div className="login-heading">
                        <h2>Create Your Account</h2>
                        <p>{track === 'tech2mate' ? 'Tech2Mate Student' : 'General Client'} — you can complete your profile after signing up.</p>
                    </div>

                    <form className="login-form" onSubmit={handleSubmit}>
                        <div className="login-fields">
                            <div className="login-field">
                                <label htmlFor="signup-email">Email Address</label>
                                <div className="login-input-wrap">
                                    <span className="material-symbols-outlined login-input-icon">mail</span>
                                    <input
                                        type="email"
                                        id="signup-email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="name@example.com"
                                        autoComplete="email"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="login-field">
                                <label htmlFor="signup-password">Password</label>
                                <div className="login-input-wrap">
                                    <span className="material-symbols-outlined login-input-icon">lock</span>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="signup-password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="At least 8 characters"
                                        autoComplete="new-password"
                                        minLength={8}
                                        required
                                    />
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
                            </div>
                        </div>

                        {error && <p className="login-error">{error}</p>}

                        <button type="submit" className="login-submit" disabled={loading}>
                            {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
                        </button>

                        <button type="button" className="login-back-btn" onClick={() => setTrack(null)}>
                            ← Back
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default SignupPage;
