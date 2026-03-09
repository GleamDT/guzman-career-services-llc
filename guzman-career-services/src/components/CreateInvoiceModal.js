import React, { useState } from 'react';
import './CreateInvoiceModal.css';

function CreateInvoiceModal({ isOpen, onClose, client, onInvoiceCreated }) {
    const [formData, setFormData] = useState({ description: '', subtitle: '', amount: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen || !client) return null;

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
            const res = await fetch('/api/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId: client.id,
                    description: formData.description,
                    subtitle: formData.subtitle,
                    amount: formData.amount,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create invoice.');

            onInvoiceCreated(data.invoice);
            handleClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({ description: '', subtitle: '', amount: '' });
        setError('');
        onClose();
    };

    return (
        <div className="cim-overlay" onClick={handleClose}>
            <div className="cim-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="cim-header">
                    <div>
                        <h2>Create Invoice</h2>
                        <p>Billing for <strong>{client.full_name}</strong> &middot; {client.email}</p>
                    </div>
                    <button className="cim-close" onClick={handleClose} aria-label="Close">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form className="cim-form" onSubmit={handleSubmit}>
                    <div className="cim-field">
                        <label htmlFor="cim-description">Service Description</label>
                        <input
                            id="cim-description"
                            type="text"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="e.g. Executive Resume Writing"
                            required
                        />
                    </div>

                    <div className="cim-field">
                        <label htmlFor="cim-subtitle">
                            Subtitle / Notes <span className="cim-optional">(optional)</span>
                        </label>
                        <input
                            id="cim-subtitle"
                            type="text"
                            name="subtitle"
                            value={formData.subtitle}
                            onChange={handleChange}
                            placeholder="e.g. Initial Draft & Revisions"
                        />
                    </div>

                    <div className="cim-field">
                        <label htmlFor="cim-amount">Amount (USD)</label>
                        <div className="cim-amount-wrap">
                            <span className="cim-dollar">$</span>
                            <input
                                id="cim-amount"
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>
                    </div>

                    {error && <p className="cim-error">{error}</p>}

                    <div className="cim-actions">
                        <button type="button" className="cim-btn cim-btn--cancel" onClick={handleClose}>
                            Cancel
                        </button>
                        <button type="submit" className="cim-btn cim-btn--submit" disabled={loading}>
                            {loading ? (
                                <><span className="cim-spinner" /> Creating...</>
                            ) : (
                                <>
                                    <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                                    </svg>
                                    Create Invoice
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateInvoiceModal;
