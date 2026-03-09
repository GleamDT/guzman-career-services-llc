import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateClientModal from './CreateClientModal';
import CreateInvoiceModal from './CreateInvoiceModal';
import { downloadInvoicePDF } from '../lib/invoicePDF';
import './AdminDashboard.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}
function getAvatarColor(name) {
    const p = ['#2563eb','#7c3aed','#db2777','#059669','#d97706','#0891b2'];
    return p[(name || '').charCodeAt(0) % p.length];
}
function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtMoney(n) {
    return `$${parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

const NAV_ITEMS = [
    {
        key: 'dashboard', label: 'Dashboard',
        icon: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>,
    },
    {
        key: 'clients', label: 'Clients',
        icon: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>,
    },
    {
        key: 'invoices', label: 'Invoices',
        icon: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>,
    },
    {
        key: 'resumes', label: 'Resumes',
        icon: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>,
    },
];

// ─── Dashboard Section ────────────────────────────────────────────────────────
function DashboardSection({ stats, onCreateClient, onNavigate }) {
    const [activity, setActivity] = useState({ recentClients: [], recentInvoices: [] });

    useEffect(() => {
        fetch('/api/activity')
            .then(r => r.json())
            .then(d => setActivity(d))
            .catch(() => {});
    }, []);

    const statCards = [
        { label: 'Total Clients',     value: stats.totalClients,              icon: '👥', color: '#2563eb', bg: '#eff6ff' },
        { label: 'Active Clients',    value: stats.activeClients,             icon: '✅', color: '#059669', bg: '#ecfdf5' },
        { label: 'Pending Invoices',  value: fmtMoney(stats.pendingRevenue),  icon: '⏳', color: '#d97706', bg: '#fffbeb' },
        { label: 'Total Revenue',     value: fmtMoney(stats.totalRevenue),    icon: '💰', color: '#7c3aed', bg: '#f5f3ff' },
    ];

    return (
        <div className="ads-section">
            {/* Welcome */}
            <div className="ads-welcome">
                <div>
                    <h1>Welcome back, Admin</h1>
                    <p>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <button className="admin-create-btn" onClick={onCreateClient}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                    </svg>
                    New Client
                </button>
            </div>

            {/* Stat cards */}
            <div className="ads-stat-grid">
                {statCards.map(s => (
                    <div key={s.label} className="ads-stat-card">
                        <div className="ads-stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                        <div>
                            <p className="ads-stat-label">{s.label}</p>
                            <h3 className="ads-stat-value">{s.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Activity grid */}
            <div className="ads-activity-grid">
                {/* Recent clients */}
                <div className="ads-activity-card">
                    <div className="ads-activity-card-header">
                        <h3>Recently Added Clients</h3>
                        <button className="ads-view-all" onClick={() => onNavigate('clients')}>View all</button>
                    </div>
                    {activity.recentClients.length === 0
                        ? <p className="ads-empty">No clients yet.</p>
                        : activity.recentClients.map(c => (
                            <div key={c.id} className="ads-activity-item">
                                <div className="ads-activity-avatar" style={{ background: getAvatarColor(c.full_name) }}>
                                    {getInitials(c.full_name)}
                                </div>
                                <div className="ads-activity-info">
                                    <span className="ads-activity-name">{c.full_name}</span>
                                    <span className="ads-activity-sub">{c.email}</span>
                                </div>
                                <span className={`admin-status admin-status--${(c.status || 'pending').toLowerCase()}`}>
                                    {c.status}
                                </span>
                            </div>
                        ))
                    }
                </div>

                {/* Recent invoices */}
                <div className="ads-activity-card">
                    <div className="ads-activity-card-header">
                        <h3>Recent Invoices</h3>
                        <button className="ads-view-all" onClick={() => onNavigate('invoices')}>View all</button>
                    </div>
                    {activity.recentInvoices.length === 0
                        ? <p className="ads-empty">No invoices yet.</p>
                        : activity.recentInvoices.map(inv => (
                            <div key={inv.id} className="ads-activity-item">
                                <div className="ads-inv-num">#{inv.invoice_number}</div>
                                <div className="ads-activity-info">
                                    <span className="ads-activity-name">{inv.clients?.full_name || '—'}</span>
                                    <span className="ads-activity-sub">{inv.description}</span>
                                </div>
                                <div className="ads-inv-right">
                                    <span className="ads-inv-amount">{fmtMoney(inv.amount)}</span>
                                    <span className={`ads-inv-status ads-inv-status--${(inv.status || '').toLowerCase()}`}>
                                        {inv.status}
                                    </span>
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    );
}

// ─── Clients Section ──────────────────────────────────────────────────────────
function ClientsSection({ clients, loading, onCreateClient, onCreateInvoice }) {
    const [filter, setFilter] = useState('All');

    const filtered = filter === 'All' ? clients : clients.filter(c => c.status === filter);

    return (
        <div className="ads-section">
            <div className="admin-page-header">
                <div>
                    <h1>Client Management</h1>
                    <p>All registered client accounts and their onboarding status.</p>
                </div>
                <button className="admin-create-btn" onClick={onCreateClient}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                    </svg>
                    Create Client Account
                </button>
            </div>

            <div className="admin-table-card">
                <div className="admin-table-header">
                    <h2>All Clients ({clients.length})</h2>
                    <div className="admin-table-tabs">
                        {['All', 'Active', 'Pending'].map(t => (
                            <button key={t} className={`admin-tab ${filter === t ? 'admin-tab--active' : ''}`} onClick={() => setFilter(t)}>{t}</button>
                        ))}
                    </div>
                </div>
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Client Name</th>
                                <th>Status</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Date Joined</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="ads-table-msg">Loading clients…</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="6" className="ads-table-msg">No clients found.</td></tr>
                            ) : filtered.map(client => (
                                <tr key={client.id}>
                                    <td>
                                        <div className="admin-client-name">
                                            <div className="ads-avatar" style={{ background: getAvatarColor(client.full_name) }}>
                                                {getInitials(client.full_name)}
                                            </div>
                                            <span>{client.full_name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`admin-status admin-status--${(client.status || 'pending').toLowerCase()}`}>
                                            {client.status || 'Pending'}
                                        </span>
                                    </td>
                                    <td className="admin-cell-muted">{client.email}</td>
                                    <td className="admin-cell-muted">{client.phone || '—'}</td>
                                    <td className="admin-cell-muted">{fmtDate(client.created_at)}</td>
                                    <td>
                                        <div className="admin-actions">
                                            <button title="Create Invoice" onClick={() => onCreateInvoice(client)}>
                                                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="admin-pagination">
                    <span>Showing {filtered.length} of {clients.length} clients</span>
                </div>
            </div>
        </div>
    );
}

// ─── Invoices Section ─────────────────────────────────────────────────────────
function InvoicesSection({ onShowToast }) {
    const [invoices, setInvoices]   = useState([]);
    const [loading, setLoading]     = useState(true);
    const [filter, setFilter]       = useState('All');
    const [markingId, setMarkingId] = useState(null);

    const fetchInvoices = useCallback(async () => {
        try {
            const res  = await fetch('/api/invoices');
            const data = await res.json();
            setInvoices(data.invoices || []);
        } catch { /* ignore */ } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

    const markPaid = async (invoiceId) => {
        setMarkingId(invoiceId);
        try {
            const res  = await fetch(`/api/invoices/${invoiceId}/mark-paid`, { method: 'PATCH' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setInvoices(prev => prev.map(i => i.id === invoiceId ? { ...i, ...data.invoice } : i));
            onShowToast('✓ Invoice marked as paid.');
        } catch (err) {
            onShowToast(`Error: ${err.message}`);
        } finally { setMarkingId(null); }
    };

    const filtered = filter === 'All' ? invoices : invoices.filter(i => i.status === filter);
    const totalAll     = invoices.reduce((s, i) => s + parseFloat(i.amount || 0), 0);
    const totalPaid    = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + parseFloat(i.amount || 0), 0);
    const totalPending = invoices.filter(i => i.status === 'Pending').reduce((s, i) => s + parseFloat(i.amount || 0), 0);

    return (
        <div className="ads-section">
            <div className="admin-page-header">
                <div>
                    <h1>Invoices</h1>
                    <p>All billing records across every client account.</p>
                </div>
            </div>

            {/* Summary strip */}
            <div className="ads-inv-summary">
                {[
                    { label: 'Total Invoiced', value: fmtMoney(totalAll),     color: '#0f172a' },
                    { label: 'Collected',       value: fmtMoney(totalPaid),    color: '#059669' },
                    { label: 'Outstanding',     value: fmtMoney(totalPending), color: '#d97706' },
                ].map(s => (
                    <div key={s.label} className="ads-inv-summary-card">
                        <span className="ads-inv-summary-label">{s.label}</span>
                        <span className="ads-inv-summary-value" style={{ color: s.color }}>{s.value}</span>
                    </div>
                ))}
            </div>

            <div className="admin-table-card">
                <div className="admin-table-header">
                    <h2>Invoice History ({invoices.length})</h2>
                    <div className="admin-table-tabs">
                        {['All', 'Pending', 'Paid'].map(t => (
                            <button key={t} className={`admin-tab ${filter === t ? 'admin-tab--active' : ''}`} onClick={() => setFilter(t)}>{t}</button>
                        ))}
                    </div>
                </div>
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Invoice #</th>
                                <th>Client</th>
                                <th>Service</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" className="ads-table-msg">Loading invoices…</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="7" className="ads-table-msg">No invoices found.</td></tr>
                            ) : filtered.map(inv => (
                                <tr key={inv.id}>
                                    <td className="ads-inv-id">#{inv.invoice_number}</td>
                                    <td>
                                        <div className="admin-client-name">
                                            <div className="ads-avatar" style={{ background: getAvatarColor(inv.clients?.full_name) }}>
                                                {getInitials(inv.clients?.full_name)}
                                            </div>
                                            <span>{inv.clients?.full_name || '—'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="ads-service-name">{inv.description}</div>
                                        {inv.subtitle && <div className="ads-service-sub">{inv.subtitle}</div>}
                                    </td>
                                    <td className="ads-amount">{fmtMoney(inv.amount)}</td>
                                    <td>
                                        <span className={`ads-status-badge ads-status-badge--${(inv.status || '').toLowerCase()}`}>
                                            <span className="ads-status-dot" />
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td className="admin-cell-muted">{fmtDate(inv.created_at)}</td>
                                    <td>
                                        <div className="admin-actions">
                                            {inv.status === 'Pending' && (
                                                <button
                                                    className="ads-action-btn ads-action-btn--paid"
                                                    onClick={() => markPaid(inv.id)}
                                                    disabled={markingId === inv.id}
                                                    title="Mark as Paid"
                                                >
                                                    {markingId === inv.id ? '…' : 'Mark Paid'}
                                                </button>
                                            )}
                                            <button
                                                className="ads-action-btn ads-action-btn--dl"
                                                onClick={async () => await downloadInvoicePDF(inv, inv.clients)}
                                                title="Download Invoice PDF"
                                            >
                                                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                                                </svg>
                                                PDF
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="admin-pagination">
                    <span>Showing {filtered.length} of {invoices.length} invoices</span>
                </div>
            </div>
        </div>
    );
}

// ─── Resumes Section ──────────────────────────────────────────────────────────
function ResumesSection({ clients, onResumeUploaded, onShowToast }) {
    const [uploadingId, setUploadingId]     = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [pendingClientId, setPendingClientId] = useState(null);
    const fileInputRef = useRef(null);

    const triggerUpload = (clientId) => {
        setPendingClientId(clientId);
        fileInputRef.current.value = '';
        fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file || !pendingClientId) return;

        if (file.type !== 'application/pdf') {
            onShowToast('Error: Only PDF files are allowed.');
            return;
        }

        const clientId = pendingClientId;
        setUploadingId(clientId);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('resume', file);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `/api/clients/${clientId}/resume`);

        xhr.upload.onprogress = (ev) => {
            if (ev.lengthComputable) {
                setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
            }
        };

        xhr.onload = () => {
            try {
                const data = JSON.parse(xhr.responseText);
                if (xhr.status >= 200 && xhr.status < 300) {
                    onResumeUploaded(data.client);
                    onShowToast(`✓ Resume uploaded for ${data.client.full_name}.`);
                } else {
                    onShowToast(`Error: ${data.error || 'Upload failed'}`);
                }
            } catch {
                onShowToast('Error: Unexpected server response.');
            } finally {
                setUploadingId(null);
                setPendingClientId(null);
                setUploadProgress(0);
            }
        };

        xhr.onerror = () => {
            onShowToast('Error: Network error during upload.');
            setUploadingId(null);
            setPendingClientId(null);
            setUploadProgress(0);
        };

        xhr.send(formData);
        setPendingClientId(null);
    };

    const handleDownload = async (clientId) => {
        try {
            const res  = await fetch(`/api/clients/${clientId}/resume/download`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            window.open(data.url, '_blank');
        } catch (err) {
            onShowToast(`Error: ${err.message}`);
        }
    };

    return (
        <div className="ads-section">
            <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" style={{ display: 'none' }} onChange={handleFileChange} />

            <div className="admin-page-header">
                <div>
                    <h1>Resume Management</h1>
                    <p>Upload and manage client resumes. Clients can download their resume from their portal.</p>
                </div>
            </div>

            <div className="admin-table-card">
                <div className="admin-table-header">
                    <h2>Client Resumes</h2>
                </div>
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Client</th>
                                <th>Email</th>
                                <th>Resume Status</th>
                                <th>File Name</th>
                                <th>Uploaded</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients.length === 0 ? (
                                <tr><td colSpan="6" className="ads-table-msg">No clients yet.</td></tr>
                            ) : clients.map(client => {
                                const hasResume = !!client.resume_path;
                                const isUploading = uploadingId === client.id;
                                return (
                                    <tr key={client.id}>
                                        <td>
                                            <div className="admin-client-name">
                                                <div className="ads-avatar" style={{ background: getAvatarColor(client.full_name) }}>
                                                    {getInitials(client.full_name)}
                                                </div>
                                                <span>{client.full_name}</span>
                                            </div>
                                        </td>
                                        <td className="admin-cell-muted">{client.email}</td>
                                        <td>
                                            <span className={`ads-resume-badge ${hasResume ? 'ads-resume-badge--uploaded' : 'ads-resume-badge--missing'}`}>
                                                {hasResume ? '✓ Uploaded' : 'Not uploaded'}
                                            </span>
                                        </td>
                                        <td className="admin-cell-muted ads-filename">
                                            {client.resume_filename || '—'}
                                        </td>
                                        <td className="admin-cell-muted">
                                            {fmtDate(client.resume_uploaded_at)}
                                        </td>
                                        <td>
                                            <div className="admin-actions">
                                                {hasResume && (
                                                    <button
                                                        className="ads-action-btn ads-action-btn--dl"
                                                        onClick={() => handleDownload(client.id)}
                                                        title="Download Resume"
                                                    >
                                                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                                                        </svg>
                                                        Download
                                                    </button>
                                                )}
                                                <div className="ads-upload-wrap">
                                                    <button
                                                        className="ads-action-btn ads-action-btn--upload"
                                                        onClick={() => triggerUpload(client.id)}
                                                        disabled={isUploading}
                                                        title={hasResume ? 'Replace Resume' : 'Upload Resume'}
                                                    >
                                                        {isUploading ? (
                                                            <>
                                                                <span className="ads-upload-spinner" />
                                                                {uploadProgress > 0 ? `${uploadProgress}%` : 'Uploading…'}
                                                            </>
                                                        ) : (hasResume ? 'Replace' : 'Upload PDF')}
                                                    </button>
                                                    {isUploading && (
                                                        <div className="ads-progress-bar">
                                                            <div className="ads-progress-fill" style={{ width: `${uploadProgress}%` }} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ─── Main AdminDashboard ──────────────────────────────────────────────────────
function AdminDashboard() {
    const [activeSection, setActiveSection] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen]     = useState(false);
    const [clients, setClients]             = useState([]);
    const [stats, setStats]                 = useState({ totalClients: 0, activeClients: 0, pendingClients: 0, totalRevenue: '0.00', pendingRevenue: '0.00' });
    const [loadingClients, setLoadingClients] = useState(true);
    const [showCreateClient, setShowCreateClient]   = useState(false);
    const [showCreateInvoice, setShowCreateInvoice] = useState(false);
    const [selectedClient, setSelectedClient]       = useState(null);
    const [toast, setToast] = useState('');
    const navigate = useNavigate();

    useEffect(() => { fetchClients(); fetchStats(); }, []);

    const fetchClients = async () => {
        try {
            const res  = await fetch('/api/clients');
            const data = await res.json();
            setClients(data.clients || []);
        } catch { /* ignore */ } finally { setLoadingClients(false); }
    };

    const fetchStats = async () => {
        try {
            const res  = await fetch('/api/stats');
            const data = await res.json();
            setStats(data);
        } catch { /* ignore */ }
    };

    const handleLogout = async () => {
        const { supabase } = await import('../lib/supabase');
        await supabase.auth.signOut();
        sessionStorage.removeItem('auth');
        navigate('/');
    };

    const showToast = useCallback((msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 4000);
    }, []);

    const handleClientCreated = (newClient) => {
        setClients(prev => [newClient, ...prev]);
        setStats(prev => ({ ...prev, totalClients: prev.totalClients + 1, pendingClients: prev.pendingClients + 1 }));
        showToast(`✓ Account created and invite sent to ${newClient.email}`);
    };

    const handleInvoiceCreated = () => {
        showToast('✓ Invoice created successfully.');
        fetchStats();
    };

    const handleResumeUploaded = (updatedClient) => {
        setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
    };

    const openInvoiceModal = (client) => {
        setSelectedClient(client);
        setShowCreateInvoice(true);
    };

    return (
        <div className="admin-layout">
            {sidebarOpen && <div className="admin-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

            {/* Sidebar */}
            <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar--open' : ''}`}>
                <div className="admin-sidebar-logo">
                    <img src="/logo.png" alt="Guzman Career Services" className="admin-sidebar-logo-img" />
                </div>
                <nav className="admin-nav">
                    {NAV_ITEMS.map(item => (
                        <button
                            key={item.key}
                            className={`admin-nav-link ${activeSection === item.key ? 'admin-nav-link--active' : ''}`}
                            onClick={() => { setActiveSection(item.key); setSidebarOpen(false); }}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </nav>
                <div className="admin-sidebar-footer">
                    <button onClick={handleLogout} className="admin-logout-btn">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                        </svg>
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main */}
            <div className="admin-main">
                {/* Top bar */}
                <header className="admin-topbar">
                    <button className="admin-hamburger" onClick={() => setSidebarOpen(v => !v)} aria-label="Toggle menu">
                        <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                        </svg>
                    </button>
                    <div className="admin-search">
                        <svg className="admin-search-icon" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                        </svg>
                        <input type="text" placeholder="Search…" />
                    </div>
                    <div className="admin-topbar-right">
                        <button className="admin-notif-btn">
                            <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                            </svg>
                        </button>
                        <div className="admin-user-info">
                            <div className="admin-user-text">
                                <p className="admin-user-name">Admin</p>
                                <p className="admin-user-role">Operations Manager</p>
                            </div>
                            <div className="ads-topbar-avatar">A</div>
                        </div>
                    </div>
                </header>

                {/* Section content */}
                <section className="admin-content">
                    {activeSection === 'dashboard' && (
                        <DashboardSection
                            stats={stats}
                            onCreateClient={() => setShowCreateClient(true)}
                            onNavigate={setActiveSection}
                        />
                    )}
                    {activeSection === 'clients' && (
                        <ClientsSection
                            clients={clients}
                            loading={loadingClients}
                            onCreateClient={() => setShowCreateClient(true)}
                            onCreateInvoice={openInvoiceModal}
                        />
                    )}
                    {activeSection === 'invoices' && (
                        <InvoicesSection onShowToast={showToast} />
                    )}
                    {activeSection === 'resumes' && (
                        <ResumesSection
                            clients={clients}
                            onResumeUploaded={handleResumeUploaded}
                            onShowToast={showToast}
                        />
                    )}
                </section>
            </div>

            {/* Modals */}
            <CreateClientModal
                isOpen={showCreateClient}
                onClose={() => setShowCreateClient(false)}
                onClientCreated={handleClientCreated}
            />
            <CreateInvoiceModal
                isOpen={showCreateInvoice}
                onClose={() => { setShowCreateInvoice(false); setSelectedClient(null); }}
                client={selectedClient}
                onInvoiceCreated={handleInvoiceCreated}
            />

            {/* Toast */}
            {toast && (
                <div className="ads-toast">{toast}</div>
            )}
        </div>
    );
}

export default AdminDashboard;
