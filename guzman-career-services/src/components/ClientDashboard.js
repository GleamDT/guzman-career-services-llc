import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { supabase } from '../lib/supabase';
import { authFetch } from '../lib/authFetch';
import { downloadInvoicePDF } from '../lib/invoicePDF';
import './ClientDashboard.css';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// ─── Invoices Tab ─────────────────────────────────────────────────────────────
function InvoicesTab({ invoices, client, loading }) {
    const [payingId, setPayingId] = useState(null);

    const totalPaid    = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + parseFloat(i.amount || 0), 0);
    const totalPending = invoices.filter(i => i.status === 'Pending').reduce((s, i) => s + parseFloat(i.amount || 0), 0);

    const handlePayNow = async (invoiceId) => {
        setPayingId(invoiceId);
        try {
            const res = await authFetch(`/api/invoices/${invoiceId}/checkout`, { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            window.location.href = data.url;
        } catch (err) {
            alert('Could not start payment: ' + err.message);
            setPayingId(null);
        }
    };

    return (
        <div className="cd-tab-content">
            <div className="cd-section-header">
                <div className="cd-section-header-text">
                    <h2>Invoices &amp; Payments</h2>
                    <p>Manage your billing history and settle outstanding balances.</p>
                </div>
                <div className="cd-invoice-stats">
                    <div className="cd-stat-card">
                        <span className="cd-stat-label">Total Paid</span>
                        <span className="cd-stat-value">${totalPaid.toFixed(2)}</span>
                    </div>
                    <div className="cd-stat-card">
                        <span className="cd-stat-label">Pending</span>
                        <span className="cd-stat-value cd-stat-value--pending">${totalPending.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="cd-invoice-table-wrap">
                <table className="cd-invoice-table">
                    <thead>
                        <tr>
                            <th>Invoice #</th>
                            <th>Service Description</th>
                            <th>Date Issued</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                                    Loading invoices…
                                </td>
                            </tr>
                        ) : invoices.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                                    No invoices yet.
                                </td>
                            </tr>
                        ) : (
                            invoices.map(inv => (
                                <tr key={inv.id}>
                                    <td className="cd-td-id">#{inv.invoice_number}</td>
                                    <td className="cd-td-desc">
                                        <div className="cd-td-desc-main">{inv.description}</div>
                                        {inv.subtitle && <div className="cd-td-desc-sub">{inv.subtitle}</div>}
                                    </td>
                                    <td className="cd-td-date">
                                        {new Date(inv.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </td>
                                    <td className="cd-td-amount">${parseFloat(inv.amount).toFixed(2)}</td>
                                    <td>
                                        <span className={`cd-invoice-status cd-invoice-status--${inv.status.toLowerCase()}`}>
                                            <span className="cd-status-dot" />
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="cd-invoice-actions">
                                            {inv.status === 'Pending' && (
                                                <button
                                                    className="cd-btn cd-btn--pay"
                                                    onClick={() => handlePayNow(inv.id)}
                                                    disabled={payingId === inv.id}
                                                >
                                                    {payingId === inv.id ? 'Redirecting…' : 'Pay Now'}
                                                </button>
                                            )}
                                            <button
                                                className="cd-btn cd-btn--receipt"
                                                onClick={async () => await downloadInvoicePDF(inv, client)}
                                                title="Download Invoice PDF"
                                            >
                                                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                                                </svg>
                                                {inv.status === 'Paid' ? 'Receipt' : 'Invoice'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                <div className="cd-table-footer">
                    <span className="cd-table-count">
                        {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            <div className="cd-payment-security">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="cd-security-icon">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
                <span>All payments are encrypted and processed securely via Stripe.</span>
            </div>
        </div>
    );
}

// ─── Resume Tab ───────────────────────────────────────────────────────────────
function ResumeTab({ client }) {
    const [resumes, setResumes]             = useState(null); // null = loading
    const [previewUrl, setPreviewUrl]       = useState(null);
    const [previewResumeId, setPreviewResumeId] = useState(null);
    const [numPages, setNumPages]           = useState(null);
    const [pageWidth, setPageWidth]         = useState(500);
    const [downloadingId, setDownloadingId] = useState(null);
    const previewRef                        = useRef(null);

    // Load resume list
    useEffect(() => {
        if (!client.id) return;
        authFetch(`/api/clients/${client.id}/resumes`)
            .then(r => r.json())
            .then(d => setResumes(d.resumes || []))
            .catch(() => setResumes([]));
    }, [client.id]);

    // Auto-preview the most recent resume
    useEffect(() => {
        if (!resumes || resumes.length === 0 || previewResumeId) return;
        const latest = resumes[0];
        setPreviewResumeId(latest.id);
        authFetch(`/api/clients/${client.id}/resume/download?resumeId=${latest.id}`)
            .then(r => r.json())
            .then(d => { if (d.url) setPreviewUrl(d.url); })
            .catch(() => {});
    }, [resumes, client.id, previewResumeId]);

    // Track container width so PDF page fills the card
    const measureWidth = useCallback(() => {
        if (previewRef.current) setPageWidth(previewRef.current.clientWidth - 2);
    }, []);

    useEffect(() => {
        measureWidth();
        window.addEventListener('resize', measureWidth);
        return () => window.removeEventListener('resize', measureWidth);
    }, [measureWidth]);

    const handleDownload = async (resumeId, filename) => {
        setDownloadingId(resumeId);
        try {
            const res  = await authFetch(`/api/clients/${client.id}/resume/download?resumeId=${resumeId}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            window.open(data.url, '_blank');
        } catch (err) {
            alert('Could not download resume: ' + err.message);
        } finally {
            setDownloadingId(null);
        }
    };

    const loading = resumes === null;
    const hasResumes = resumes && resumes.length > 0;
    const latestResume = hasResumes ? resumes[0] : null;

    return (
        <div className="cd-tab-content">
            <div className="cd-resume-page-header">
                <div>
                    <h2 className="cd-resume-page-title">My Professional Resume</h2>
                    <div className="cd-resume-timestamp">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                        </svg>
                        {hasResumes
                            ? <span>Last updated by your consultant on <strong>{new Date(latestResume.uploaded_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong></span>
                            : <span>Your resume will appear here once uploaded by your consultant.</span>
                        }
                    </div>
                </div>
                {hasResumes && (
                    <button className="cd-btn cd-btn--download" onClick={() => handleDownload(latestResume.id, latestResume.resume_filename)} disabled={downloadingId === latestResume.id}>
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                        </svg>
                        {downloadingId === latestResume.id ? 'Opening…' : 'Download Latest'}
                    </button>
                )}
            </div>

            {loading ? (
                <div className="cd-pdf-loading">
                    <div className="cd-preview-spinner" />
                    <p>Loading your resumes…</p>
                </div>
            ) : hasResumes ? (
                <div className="cd-resume-grid">
                    <aside className="cd-resume-sidebar">
                        {/* Resume history list */}
                        <div className="cd-resume-details-card">
                            <h3 className="cd-resume-details-title">Resume History</h3>
                            <div className="cd-resume-history-list">
                                {resumes.map((r, idx) => (
                                    <div key={r.id} className={`cd-resume-history-item ${previewResumeId === r.id ? 'cd-resume-history-item--active' : ''}`}>
                                        <div className="cd-resume-history-info">
                                            <span className="cd-resume-history-name">
                                                {idx === 0 && <span className="cd-resume-latest-badge">Latest</span>}
                                                {r.resume_filename || 'resume.pdf'}
                                            </span>
                                            <span className="cd-resume-history-date">
                                                {new Date(r.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                            {r.jd_link && (
                                                <span className="cd-resume-jd-link">
                                                    Please find the job description link here{' '}
                                                    <a href={r.jd_link} target="_blank" rel="noopener noreferrer">here</a>
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            className="cd-btn cd-btn--receipt"
                                            onClick={() => handleDownload(r.id, r.resume_filename)}
                                            disabled={downloadingId === r.id}
                                            title="Download this version"
                                        >
                                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="cd-resume-revision-card">
                            <h3>Need a revision?</h3>
                            <p>If you need updates or have questions about your resume, please contact your career consultant.</p>
                            <a href="mailto:info@guzmancareerservices.com" className="cd-revision-link">Contact Consultant</a>
                        </div>
                    </aside>
                    <section className="cd-resume-preview-wrap" ref={previewRef}>
                        {previewUrl ? (
                            <div className="cd-pdf-scroll">
                                <Document
                                    file={previewUrl}
                                    onLoadSuccess={({ numPages: n }) => setNumPages(n)}
                                    loading={<div className="cd-pdf-loading"><div className="cd-preview-spinner" /><p>Loading preview…</p></div>}
                                    error={<div className="cd-pdf-loading"><p>Preview unavailable.</p></div>}
                                >
                                    {Array.from({ length: numPages || 0 }, (_, i) => (
                                        <div key={i} className="cd-pdf-page-wrap">
                                            <Page
                                                pageNumber={i + 1}
                                                width={pageWidth}
                                                renderTextLayer={false}
                                                renderAnnotationLayer={false}
                                            />
                                        </div>
                                    ))}
                                </Document>
                            </div>
                        ) : (
                            <div className="cd-pdf-loading">
                                <div className="cd-preview-spinner" />
                                <p>Loading preview…</p>
                            </div>
                        )}
                    </section>
                </div>
            ) : (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ margin: '0 auto 1rem', display: 'block' }}>
                        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                    </svg>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>No resume uploaded yet. Your consultant will add it here.</p>
                    <a href="mailto:info@guzmancareerservices.com" style={{ display: 'inline-block', marginTop: '1rem', color: '#2563eb', fontWeight: 600, fontSize: '0.875rem' }}>
                        Contact Consultant
                    </a>
                </div>
            )}
        </div>
    );
}

// ─── Main Client Dashboard ────────────────────────────────────────────────────
function ClientDashboard() {
    const [activeTab, setActiveTab]     = useState('Invoices');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [invoices, setInvoices]       = useState([]);
    const [client, setClient]           = useState({});
    const [loading, setLoading]         = useState(true);
    const [paymentBanner, setPaymentBanner] = useState(null); // 'success' | 'cancelled' | null
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const payment = params.get('payment');
        const sessionId = params.get('session_id');

        if (payment === 'success' && sessionId) {
            window.history.replaceState({}, '', window.location.pathname);
            authFetch('/api/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId }),
            })
                .then(() => loadData())
                .catch(() => loadData());
            setPaymentBanner('success');
        } else if (payment === 'cancelled') {
            window.history.replaceState({}, '', window.location.pathname);
            setPaymentBanner('cancelled');
        }

        loadData();
    }, []);

    const loadData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch client profile + invoices in parallel
            const [profileRes, invoicesRes] = await Promise.all([
                supabase.from('clients').select('*').eq('id', user.id).single(),
                supabase.from('invoices').select('*').eq('client_id', user.id).order('created_at', { ascending: false }),
            ]);

            if (profileRes.data)  setClient(profileRes.data);
            if (invoicesRes.data) setInvoices(invoicesRes.data);

            if (profileRes.data && !profileRes.data.has_logged_in) {
                authFetch(`/api/clients/${user.id}/mark-logged-in`, { method: 'PATCH' }).catch(() => {});
            }
        } catch (err) {
            console.error('Dashboard load error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut({ scope: 'global' });
        sessionStorage.removeItem('auth');
        navigate('/');
    };

    const tabs = ['Invoices', 'My Resume'];
    const displayName = client.full_name || 'Client';
    const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <div className="cd-layout">
            {sidebarOpen && <div className="cd-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

            {/* Sidebar */}
            <aside className={`cd-sidebar ${sidebarOpen ? 'cd-sidebar--open' : ''}`}>
                <div className="cd-sidebar-logo">
                    <img src="/logo.png" alt="Guzman Career Services" className="cd-sidebar-logo-img" />
                </div>
                <nav className="cd-nav">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            className={`cd-nav-link ${activeTab === tab ? 'cd-nav-link--active' : ''}`}
                            onClick={() => { setActiveTab(tab); setSidebarOpen(false); }}
                        >
                            {tab === 'Invoices' ? (
                                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                                </svg>
                            ) : (
                                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                                </svg>
                            )}
                            {tab}
                        </button>
                    ))}
                </nav>
                <div className="cd-sidebar-footer">
                    <button onClick={handleLogout} className="cd-logout-btn">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                        </svg>
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main */}
            <div className="cd-main">
                <header className="cd-topbar">
                    <button className="cd-hamburger" onClick={() => setSidebarOpen(v => !v)} aria-label="Toggle menu">
                        <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                        </svg>
                    </button>
                    <h1 className="cd-topbar-title">Client Portal</h1>
                    <div className="cd-topbar-user">
                        <div className="cd-user-text">
                            <p className="cd-user-name">{displayName}</p>
                            <p className="cd-user-role">{client.intake_form_type === 'tech2mate' ? 'Tech2Mate' : 'General'} Client</p>
                        </div>
                        <div className="cd-user-avatar">{initials}</div>
                    </div>
                </header>

                {paymentBanner === 'success' && (
                    <div className="cd-payment-banner cd-payment-banner--success">
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                        </svg>
                        Payment successful! Your invoice has been marked as paid.
                        <button className="cd-banner-close" onClick={() => setPaymentBanner(null)}>✕</button>
                    </div>
                )}
                {paymentBanner === 'cancelled' && (
                    <div className="cd-payment-banner cd-payment-banner--cancelled">
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                        </svg>
                        Payment cancelled. No charge was made.
                        <button className="cd-banner-close" onClick={() => setPaymentBanner(null)}>✕</button>
                    </div>
                )}

                <section className="cd-content">
                    <div className="cd-mobile-tabs">
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                className={`cd-mobile-tab ${activeTab === tab ? 'cd-mobile-tab--active' : ''}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'Invoices' && (
                        <InvoicesTab invoices={invoices} client={client} loading={loading} />
                    )}
                    {activeTab === 'My Resume' && <ResumeTab client={client} />}
                </section>
            </div>
        </div>
    );
}

export default ClientDashboard;
