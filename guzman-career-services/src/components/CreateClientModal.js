import React, { useState } from 'react';
import './CreateClientModal.css';

function CreateClientModal({ isOpen, onClose, onClientCreated }) {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        intakeFormType: 'general',
        initialService: '',
    });
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
            const res = await fetch('/api/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName: formData.fullName,
                    email: formData.email,
                    phone: formData.phone,
                    intakeFormType: formData.intakeFormType,
                    initialService: formData.initialService,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create client.');

            onClientCreated(data.client);
            handleClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({ fullName: '', email: '', phone: '', intakeFormType: 'general', initialService: '' });
        setError('');
        onClose();
    };

    return (
        <div className="ccm-overlay" onClick={handleClose}>
            <div className="ccm-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="ccm-header">
                    <div>
                        <h2>Create New Client Account</h2>
                        <p>Register a new client and send them login access.</p>
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
                            <label htmlFor="ccm-fullName">Full Name</label>
                            <input
                                id="ccm-fullName"
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                placeholder="e.g. Michael Guzman"
                                required
                            />
                        </div>

                        <div className="ccm-field">
                            <label htmlFor="ccm-email">Email Address</label>
                            <input
                                id="ccm-email"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="client@domain.com"
                                required
                            />
                        </div>

                        <div className="ccm-field">
                            <label htmlFor="ccm-phone">Phone Number</label>
                            <input
                                id="ccm-phone"
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="(555) 000-0000"
                            />
                        </div>

                        <div className="ccm-field">
                            <label htmlFor="ccm-intakeFormType">Intake Form Type</label>
                            <select
                                id="ccm-intakeFormType"
                                name="intakeFormType"
                                value={formData.intakeFormType}
                                onChange={handleChange}
                            >
                                <option value="general">General Career Coaching</option>
                                <option value="tech2mate">Tech2Mate Program</option>
                            </select>
                        </div>

                        <div className="ccm-field">
                            <label htmlFor="ccm-initialService">Initial Service</label>
                            <select
                                id="ccm-initialService"
                                name="initialService"
                                value={formData.initialService}
                                onChange={handleChange}
                            >
                                <option value="">Select Service...</option>
                                <option value="resume">Resume Review</option>
                                <option value="interview">Interview Prep</option>
                                <option value="strategy">Career Strategy</option>
                            </select>
                        </div>
                    </div>

                    {/* Email notice */}
                    <div className="ccm-email-note">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                        </svg>
                        <span>A welcome email with a login setup link will be sent to the client automatically.</span>
                    </div>

                    {error && <p className="ccm-error">{error}</p>}

                    <div className="ccm-actions">
                        <button type="button" className="ccm-btn ccm-btn--cancel" onClick={handleClose}>
                            Cancel
                        </button>
                        <button type="submit" className="ccm-btn ccm-btn--submit" disabled={loading}>
                            {loading ? (
                                <><span className="ccm-spinner" /> Creating...</>
                            ) : 'Create & Send Login'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateClientModal;
