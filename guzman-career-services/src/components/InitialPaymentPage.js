import React, { useState } from 'react';
import { authFetch } from '../lib/authFetch';
import Logo from './Logo';
import OnboardingProgress from './OnboardingProgress';
import './Login.css';
import './IntakeForm.css';
import './InitialPaymentPage.css';

const PRICING = {
    general: { lump: 1250, split: [650, 600], label: 'Guzman Client' },
    tech2mate: { lump: 1200, split: [600, 600], label: 'Tech2Mate Student' },
};

// mandatory=true removes the "finish later" close button — used to hard-gate the
// dashboard until the client has paid. invoices lets us detect a plan that was
// already chosen (invoice_kind set) but not yet paid, so we don't re-show the
// lump/split picker and instead offer a direct "Pay Now" on the outstanding invoice.
function InitialPaymentPage({ client, invoices = [], onClose, mandatory = false }) {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const chosenInvoices = invoices.filter(inv => inv.invoice_kind);
    const nextUnpaid = chosenInvoices.find(inv => inv.status === 'Pending');
    const planAlreadyChosen = chosenInvoices.length > 0;

    const startCheckout = async (invoiceId) => {
        setSubmitting(true);
        setError('');
        try {
            const checkoutRes = await authFetch(`/api/invoices/${invoiceId}/checkout`, { method: 'POST' });
            const checkoutData = await checkoutRes.json();
            if (!checkoutRes.ok) throw new Error(checkoutData.error || 'Could not start payment.');
            window.location.href = checkoutData.url;
        } catch (err) {
            setError(err.message);
            setSubmitting(false);
        }
    };

    const handleChoose = async (plan) => {
        setSubmitting(true);
        setError('');
        try {
            const res = await authFetch('/api/clients/me/initial-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Could not start payment.');

            const firstUnpaid = data.invoices.find(inv => inv.status === 'Pending') || data.invoices[0];
            await startCheckout(firstUnpaid.id);
        } catch (err) {
            setError(err.message);
            setSubmitting(false);
        }
    };

    const track = client?.intake_form_type === 'tech2mate' ? 'tech2mate' : 'general';
    const pricing = PRICING[track];

    return (
        <div className="login-overlay">
            <div className="payplan-card">
                {onClose && !mandatory && (
                    <button className="intake-close" onClick={onClose} aria-label="Close and finish later">✕</button>
                )}
                <Logo className="payplan-logo" />
                <OnboardingProgress currentStage={5} />
                <div className="payplan-heading">
                    <h2>Your Initial Program Payment</h2>
                    <p>{pricing.label} — {planAlreadyChosen ? 'complete your outstanding payment to unlock your dashboard.' : "choose how you'd like to pay."}</p>
                </div>

                {error && <p className="payplan-error">{error}</p>}

                {submitting ? (
                    <p className="payplan-loading">Redirecting to secure checkout…</p>
                ) : planAlreadyChosen ? (
                    <div className="payplan-options">
                        {nextUnpaid ? (
                            <button className="payplan-option" onClick={() => startCheckout(nextUnpaid.id)} disabled={submitting}>
                                <span className="payplan-option-label">{nextUnpaid.description}</span>
                                <span className="payplan-option-amount">${parseFloat(nextUnpaid.amount).toFixed(2)}</span>
                                <span className="payplan-option-detail">Pay Now</span>
                            </button>
                        ) : (
                            <p className="payplan-loading">Finalizing your payment…</p>
                        )}
                    </div>
                ) : (
                    <div className="payplan-options">
                        <button className="payplan-option" onClick={() => handleChoose('lump')} disabled={submitting}>
                            <span className="payplan-option-label">Pay in Full</span>
                            <span className="payplan-option-amount">${pricing.lump}</span>
                            <span className="payplan-option-detail">One payment, paid today.</span>
                        </button>
                        <button className="payplan-option" onClick={() => handleChoose('split')} disabled={submitting}>
                            <span className="payplan-option-label">Split into 2 Payments</span>
                            <span className="payplan-option-amount">${pricing.split[0]} <span style={{ fontSize: '1rem', fontWeight: 600, color: '#64748b' }}>now</span></span>
                            <span className="payplan-option-detail">Then ${pricing.split[1]} due in 2 weeks. We'll email you a reminder before it's due.</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default InitialPaymentPage;
