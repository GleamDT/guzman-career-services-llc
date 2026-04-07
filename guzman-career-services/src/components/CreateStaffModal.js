import React, { useState } from 'react';
import { authFetch } from '../lib/authFetch';
import './CreateClientModal.css';

function CreateStaffModal({ isOpen, onClose, onStaffCreated }) {
    const [formData, setFormData] = useState({ fullName: '', email: '' });
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
        setLoading(true);
        setError('');

        try {
            const res = await authFetch('/api/staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName: formData.fullName, email: formData.email }),
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
        setFormData({ fullName: '', email: '' });
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
                    </div>

                    {/* Info note */}
                    <div className="ccm-email-note">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                        </svg>
                        <span>A login setup link will be sent to this email. Staff can view clients and upload resumes but cannot create invoices.</span>
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
