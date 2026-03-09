import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './SetPassword.css';

function SetPassword() {
    const [formData, setFormData] = useState({ password: '', confirm: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        if (formData.password !== formData.confirm) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        const { error: updateError } = await supabase.auth.updateUser({
            password: formData.password,
            data: { password_set: true },
        });

        if (updateError) {
            setError(updateError.message);
            setLoading(false);
            return;
        }

        navigate('/dashboard', { replace: true });
    };

    return (
        <div className="sp-page">
            <div className="sp-card">
                <div className="sp-logo">
                    <img src="/logo.png" alt="Guzman Career Services" />
                </div>
                <h2 className="sp-title">Welcome! Set Your Password</h2>
                <p className="sp-subtitle">
                    Create a password so you can log in anytime from the main page.
                </p>

                <form className="sp-form" onSubmit={handleSubmit}>
                    <div className="sp-field">
                        <label htmlFor="sp-password">New Password</label>
                        <div className="sp-input-wrap">
                            <span className="material-symbols-outlined sp-input-icon">lock</span>
                            <input
                                id="sp-password"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="At least 8 characters"
                                autoComplete="new-password"
                                required
                            />
                            <button
                                type="button"
                                className="sp-pw-toggle"
                                onClick={() => setShowPassword(v => !v)}
                                aria-label="Toggle password visibility"
                            >
                                <span className="material-symbols-outlined">
                                    {showPassword ? 'visibility_off' : 'visibility'}
                                </span>
                            </button>
                        </div>
                    </div>

                    <div className="sp-field">
                        <label htmlFor="sp-confirm">Confirm Password</label>
                        <div className="sp-input-wrap">
                            <span className="material-symbols-outlined sp-input-icon">lock_check</span>
                            <input
                                id="sp-confirm"
                                type={showPassword ? 'text' : 'password'}
                                name="confirm"
                                value={formData.confirm}
                                onChange={handleChange}
                                placeholder="Repeat your password"
                                autoComplete="new-password"
                                required
                            />
                        </div>
                    </div>

                    {error && <p className="sp-error">{error}</p>}

                    <button type="submit" className="sp-submit" disabled={loading}>
                        <span className="material-symbols-outlined">check_circle</span>
                        {loading ? 'Saving...' : 'Set Password & Go to Dashboard'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default SetPassword;
