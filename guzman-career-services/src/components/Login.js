import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './Login.css';

const BG_IMAGE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlS2U5YOmfaEXB3S-f2PexiqM6jAAuNUdaDWS12VDdXnj1WztSPF6k_e6vYOe603W6XTnqbFOiL844KUwOZAGJWa7rwOfnEusljxVVTkQg4TdQzH2kUF1LLU25NYnU9h7Wn9IfCU4OB5B1dkm0uFjPCt9YNRiYWW7Cbfm5J1p2dJTMEn9vJ2X9OIN5LLCpq3LrQX-pU0UI6VLnxxyVuEVl-HQDO0d6dqqbqzZipRYeBOpsNtEaUJsdSOuncBg86tzQM3OYcTaoG7Ml';

const AVATARS = [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDGGqmtF-ivC4Jdn7PqY1s4g_rfex_pF1fo5XzJ631MslH0cZSmErGfCuOc7gBTVsxrlUcMl07rc1_syJrsqTA1IEJDta_BBDqCbIkoswO_l8bL8jNMWwGScenHuwMyQoX1bT3u6BEKKGifMtvPBiLTLYVXk-lennJ9e9oWAm4ahhR6c8pH9P_kjYGrovXq09M0KQ50E3QQP3zWS_ZrQDE_OSHtMhuQmZ0ndKKLsX8k2IOFZ8N-ockdwBVH6ncEcE-KgSivfefzCa3l',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBq3ZoKRuxtS_l5h4G3LbeuVT3m1G0HmnT8erGoW8a-AZikosvW__8SvYSZE-_WxBIW0w2wSr03lpO5PSaMx_4xKh_QHyr35ynGKpKPihYSPuP0ft0ptdhhRpD2q3x_LQ9K-BtHkxHd4NaCRqN-y20Gg0zV1JiJHULiLqMsKxpjK3RHkymnyv53xfBK7x7zu1P_HvAJiaWo310aJdPSGA44FuzR0jtXGrDkOeaJyLCku-9Ex2v78xN2KvSClFkWVoNAp0_cfD4thXFa',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuArX11BkWn4vk0dXA3W5IPGTOOanHjqLuGN9ZZTaQE6jm4exyToaL-p_fF6kb4oZ5FWiNNfOTwGwTOJfi5FHYAXCEjntdNETyF2YK1vikw8vTcW0G6OBN2rBwLq8AcuyQEb3bffS1PgifshpExUFRi2yg7ll0DWRbUyOyu2H_b2LtAAmGMZD847qbSRlj01HYhX-F4_ELD5--H_IOFJaY43UOUJXtwhP_N5NW6seWUO1XAsfl427Cpgk8L02ddsPXkdFMOUOqj02jtR',
];

function Login({ isOpen, onClose }) {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '', remember: false });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { data, error: authError } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
        });

        if (authError) {
            setError('Incorrect email or password. Please try again.');
            setLoading(false);
            return;
        }

        const role = data.user?.user_metadata?.role || 'client';
        sessionStorage.setItem('auth', JSON.stringify({ role, email: data.user.email }));
        setLoading(false);
        onClose();
        navigate(role === 'admin' ? '/admin' : '/dashboard');
    };

    return (
        <div className="login-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Login">
            <div className="login-modal" onClick={e => e.stopPropagation()}>

                {/* Close button */}
                <button className="login-close" onClick={onClose} aria-label="Close login">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                    </svg>
                </button>

                {/* Left panel */}
                <div className="login-left" style={{ backgroundImage: `url('${BG_IMAGE}')` }}>
                    <div className="login-left-overlay" />
                    <div className="login-left-content">
                        <div className="login-brand">
                            <img src="/logo.png" alt="Guzman Career Services" className="login-brand-logo" />
                        </div>
                        <div className="login-left-tagline">
                            <h2>Empowering Professionals, Transforming Careers.</h2>
                            <p>Join thousands of professionals who have accelerated their career growth through our specialized placement and consulting services.</p>
                        </div>
                        <div className="login-social-proof">
                            <div className="login-avatars">
                                {AVATARS.map((src, i) => (
                                    <img key={i} src={src} alt="Client" className="login-avatar" />
                                ))}
                            </div>
                            <span className="login-trust-text">Trusted by 10,000+ candidates</span>
                        </div>
                    </div>
                </div>

                {/* Right panel */}
                <div className="login-right">
                    <div className="login-heading">
                        <h2>Welcome Back</h2>
                        <p>Please enter your details to access your portal.</p>
                    </div>

                    <form className="login-form" onSubmit={handleSubmit}>
                        <div className="login-fields">
                            <div className="login-field">
                                <label htmlFor="email">Email Address</label>
                                <div className="login-input-wrap">
                                    <span className="material-symbols-outlined login-input-icon">mail</span>
                                    <input
                                        type="email"
                                        id="email"
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
                                <div className="login-field-header">
                                    <label htmlFor="password">Password</label>
                                    <a href="#forgot" className="login-forgot">Forgot Password?</a>
                                </div>
                                <div className="login-input-wrap">
                                    <span className="material-symbols-outlined login-input-icon">lock</span>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        autoComplete="current-password"
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

                    <div className="login-badges">
                        <div className="login-badge">
                            <span className="material-symbols-outlined login-badge-icon login-badge-icon--green">verified_user</span>
                            <span>Secure Access</span>
                        </div>
                        <div className="login-badge">
                            <span className="material-symbols-outlined login-badge-icon">encrypted</span>
                            <span>AES-256 SSL</span>
                        </div>
                    </div>

                    <p className="login-disclaimer">
                        Unauthorized access is prohibited. By logging in, you agree to Guzman Career Services' <a href="#terms">Terms of Use</a> and <a href="#privacy">Privacy Policy</a>.
                    </p>
                </div>

            </div>
        </div>
    );
}

export default Login;
