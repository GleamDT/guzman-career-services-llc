import { useState } from 'react';
import { authFetch } from '../lib/authFetch';
import './CreateClientModal.css';

function CreateStaffModal({ isOpen, onClose, onStaffCreated }) {
    const [formData, setFormData] = useState({ fullName: '', email: '', password: '', confirm: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (error) setError('');
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
        setError('');

        try {
            const res = await authFetch('/api/staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName: formData.fullName,
                    email: formData.email,
                    password: formData.password,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create staff account.');

            onStaffCreated(data.user);
            handleClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({ fullName: '', email: '', password: '', confirm: '' });
        setError('');
        onClose();
    };

    return (
        <div className="ccm-overlay" onClick={handleClose}>
            <div className="ccm-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="ccm-header">
                    <div>
                        <h2>Create Staff Account</h2>
                        <p>Grant portal access to a new team member.</p>
                    </div>
                    <button className="ccm-close" onClick={handleClose} aria-label="Close">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form className="ccm-form" onSubmit={handleSubmit}>
                    <div className="ccm-grid">
                        <div className="ccm-field ccm-field--full">
                            <label htmlFor="csm-fullName">Full Name</label>
                            <input
                                id="csm-fullName"
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                placeholder="e.g. Jane Smith"
                                required
                            />
                        </div>

                        <div className="ccm-field ccm-field--full">
                            <label htmlFor="csm-email">Email Address</label>
                            <input
                                id="csm-email"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="staff@domain.com"
                                required
                            />
                        </div>

                        <div className="ccm-field ccm-field--full">
                            <label htmlFor="csm-password">Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="csm-password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="At least 8 characters"
                                    autoComplete="new-password"
                                    required
                                    style={{ paddingRight: '2.5rem' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    aria-label="Toggle password visibility"
                                    style={{
                                        position: 'absolute', right: '0.6rem', top: '50%',
                                        transform: 'translateY(-50%)', background: 'none',
                                        border: 'none', cursor: 'pointer', color: '#64748b',
                                        display: 'flex', alignItems: 'center',
                                    }}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                                        {showPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        <div className="ccm-field ccm-field--full">
                            <label htmlFor="csm-confirm">Confirm Password</label>
                            <input
                                id="csm-confirm"
                                type={showPassword ? 'text' : 'password'}
                                name="confirm"
                                value={formData.confirm}
                                onChange={handleChange}
                                placeholder="Repeat the password"
                                autoComplete="new-password"
                                required
                            />
                        </div>
                    </div>

                    {/* Info note */}
                    <div className="ccm-email-note">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                        </svg>
                        <span>Staff can view clients and upload resumes but cannot create invoices. Share these credentials with the staff member securely.</span>
                    </div>

                    {error && <p className="ccm-error">{error}</p>}

                    <div className="ccm-actions">
                        <button type="button" className="ccm-btn ccm-btn--cancel" onClick={handleClose}>
                            Cancel
                        </button>
                        <button type="submit" className="ccm-btn ccm-btn--submit" disabled={loading}>
                            {loading ? (
                                <><span className="ccm-spinner" /> Creating...</>
                            ) : 'Create Staff Account'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateStaffModal;
