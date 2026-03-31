import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateClientModal from './CreateClientModal';
import CreateInvoiceModal from './CreateInvoiceModal';
import { downloadInvoicePDF } from '../lib/invoicePDF';
import { authFetch, getAuthToken } from '../lib/authFetch';
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
        key: 'intake', label: 'Intake Forms',
        icon: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>,
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
        authFetch('/api/activity')
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
                                <th>Login</th>
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
                                    <td>
                                        <span className={`admin-status admin-status--${client.has_logged_in ? 'active' : 'pending'}`}>
                                            {client.has_logged_in ? 'Logged In' : 'Awaiting'}
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
            const res  = await authFetch('/api/invoices');
            const data = await res.json();
            setInvoices(data.invoices || []);
        } catch { /* ignore */ } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

    const markPaid = async (invoiceId) => {
        setMarkingId(invoiceId);
        try {
            const res  = await authFetch(`/api/invoices/${invoiceId}/mark-paid`, { method: 'PATCH' });
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
    const [uploadingId, setUploadingId]   = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadModal, setUploadModal]   = useState(null); // { clientId, clientName }
    const [selectedFile, setSelectedFile] = useState(null);
    const [jdLink, setJdLink]             = useState('');
    const fileInputRef = useRef(null);

    const openUploadModal = (client) => {
        setUploadModal({ clientId: client.id, clientName: client.full_name });
        setSelectedFile(null);
        setJdLink('');
    };

    const closeUploadModal = () => {
        if (uploadingId) return; // don't close while uploading
        setUploadModal(null);
        setSelectedFile(null);
        setJdLink('');
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.type !== 'application/pdf') {
            onShowToast('Error: Only PDF files are allowed.');
            return;
        }
        setSelectedFile(file);
    };

    const handleUploadSubmit = () => {
        if (!selectedFile || !uploadModal) return;
        const { clientId } = uploadModal;
        setUploadingId(clientId);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('resume', selectedFile);
        if (jdLink.trim()) formData.append('jd_link', jdLink.trim());

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `/api/clients/${clientId}/resume`);
        getAuthToken().then(token => { if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`); });

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
                    setUploadModal(null);
                    setSelectedFile(null);
                    setJdLink('');
                } else {
                    onShowToast(`Error: ${data.error || 'Upload failed'}`);
                }
            } catch {
                onShowToast('Error: Unexpected server response.');
            } finally {
                setUploadingId(null);
                setUploadProgress(0);
            }
        };

        xhr.onerror = () => {
            onShowToast('Error: Network error during upload.');
            setUploadingId(null);
            setUploadProgress(0);
        };

        xhr.send(formData);
    };

    const handleDownload = async (clientId) => {
        try {
            const res  = await authFetch(`/api/clients/${clientId}/resume/download`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            window.open(data.url, '_blank');
        } catch (err) {
            onShowToast(`Error: ${err.message}`);
        }
    };

    return (
        <div className="ads-section">
            <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" style={{ display: 'none' }} onChange={handleFileSelect} />

            {/* Upload Modal */}
            {uploadModal && (
                <div className="ads-modal-overlay" onClick={closeUploadModal}>
                    <div className="ads-modal" onClick={e => e.stopPropagation()}>
                        <div className="ads-modal-header">
                            <h3>Upload Resume</h3>
                            <button className="ads-modal-close" onClick={closeUploadModal} disabled={!!uploadingId}>✕</button>
                        </div>
                        <p className="ads-modal-client">Client: <strong>{uploadModal.clientName}</strong></p>

                        <div className="ads-modal-field">
                            <label>PDF File</label>
                            <div className="ads-modal-file-row">
                                <span className="ads-modal-filename">{selectedFile ? selectedFile.name : 'No file selected'}</span>
                                <button className="ads-action-btn ads-action-btn--upload" onClick={() => { fileInputRef.current.value = ''; fileInputRef.current.click(); }}>
                                    Browse
                                </button>
                            </div>
                        </div>

                        <div className="ads-modal-field">
                            <label>Job Description Link <span className="ads-modal-optional">(optional)</span></label>
                            <input
                                className="ads-modal-input"
                                type="url"
                                placeholder="https://..."
                                value={jdLink}
                                onChange={e => setJdLink(e.target.value)}
                                disabled={!!uploadingId}
                            />
                        </div>

                        {uploadingId && (
                            <div className="ads-progress-bar" style={{ margin: '0.5rem 0' }}>
                                <div className="ads-progress-fill" style={{ width: `${uploadProgress}%` }} />
                            </div>
                        )}

                        <div className="ads-modal-actions">
                            <button className="ads-action-btn" onClick={closeUploadModal} disabled={!!uploadingId}>Cancel</button>
                            <button
                                className="ads-action-btn ads-action-btn--paid"
                                onClick={handleUploadSubmit}
                                disabled={!selectedFile || !!uploadingId}
                            >
                                {uploadingId ? `Uploading… ${uploadProgress}%` : 'Upload'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="admin-page-header">
                <div>
                    <h1>Resume Management</h1>
                    <p>Upload resumes and job description links for clients. Clients see their full history in the portal.</p>
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
                                <th>Latest File</th>
                                <th>Last Uploaded</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients.length === 0 ? (
                                <tr><td colSpan="6" className="ads-table-msg">No clients yet.</td></tr>
                            ) : clients.map(client => {
                                const hasResume = !!client.resume_path;
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
                                                        title="Download Latest Resume"
                                                    >
                                                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                                                        </svg>
                                                        Download
                                                    </button>
                                                )}
                                                <button
                                                    className="ads-action-btn ads-action-btn--upload"
                                                    onClick={() => openUploadModal(client)}
                                                    title="Upload New Resume"
                                                >
                                                    Upload PDF
                                                </button>
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

// ─── Intake Details Modal ─────────────────────────────────────────────────────
function IntakeDetailsModal({ submission, onClose, onCreateAccount }) {
    const [resumeLoading, setResumeLoading] = useState(false);

    if (!submission) return null;

    const row = (label, value) => value ? (
        <div className="idm-row">
            <span className="idm-label">{label}</span>
            <span className="idm-value">{value}</span>
        </div>
    ) : null;

    const handleViewResume = async () => {
        setResumeLoading(true);
        try {
            const res = await authFetch(`/api/intake/${submission.id}/resume`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            window.open(data.url, '_blank');
        } catch (err) {
            alert('Could not load resume: ' + err.message);
        } finally {
            setResumeLoading(false);
        }
    };

    return (
        <div className="idm-overlay" onClick={onClose}>
            <div className="idm-modal" onClick={e => e.stopPropagation()}>
                <div className="idm-header">
                    <div>
                        <h2>Intake Submission</h2>
                        <p>Submitted {fmtDate(submission.created_at)}</p>
                    </div>
                    <div className="idm-header-right">
                        <span className={`idm-status-badge idm-status--${submission.status}`}>
                            {submission.status === 'converted' ? 'Converted' : 'Pending'}
                        </span>
                        <button className="idm-close" onClick={onClose}>✕</button>
                    </div>
                </div>

                <div className="idm-body">
                    <div className="idm-section-title">Personal Information</div>
                    {row('Full Name', submission.full_name)}
                    {row('Email', submission.email)}
                    {row('Phone', submission.phone)}
                    {row('Address', submission.full_address)}
                    {row('Sex', submission.sex)}
                    {row('Referred By', submission.referred_by)}

                    <div className="idm-section-title">Identity & Status</div>
                    {row('Veteran Status', submission.veteran_status)}
                    {row('Disability Status', submission.disability_status)}
                    {row('Race / Ethnicity', submission.race_identity)}
                    {row('Work Authorization', submission.work_authorization)}

                    <div className="idm-section-title">Professional Details</div>
                    {row('Form Type', submission.intake_form_type === 'tech2mate' ? 'Tech2Mate Student' : 'General Client')}
                    {row('Job Title(s)', submission.job_titles)}
                    {row('LinkedIn Profile', submission.linkedin_profile)}
                    {row('Shared Email', submission.shared_email)}
                    {submission.shared_password && (
                        <div className="idm-row">
                            <span className="idm-label">Shared Password</span>
                            <span className="idm-value idm-password">{submission.shared_password}</span>
                        </div>
                    )}

                    <div className="idm-section-title">Legal Agreement</div>
                    {row('Legal Name (Signature)', submission.legal_name)}
                    {row('Signature Date', fmtDate(submission.signature_date))}
                    {row('T&C Agreed', submission.tc_agreed ? 'Yes' : 'No')}

                    {submission.additional_notes && (
                        <>
                            <div className="idm-section-title">Additional Notes</div>
                            <div className="idm-row">
                                <span className="idm-value" style={{ whiteSpace: 'pre-wrap' }}>{submission.additional_notes}</span>
                            </div>
                        </>
                    )}

                    {submission.resume_path && (
                        <>
                            <div className="idm-section-title">Resume</div>
                            <div className="idm-resume-row">
                                <span className="idm-value">{submission.resume_filename || 'resume.pdf'}</span>
                                <button
                                    className="idm-btn-secondary"
                                    onClick={handleViewResume}
                                    disabled={resumeLoading}
                                >
                                    {resumeLoading ? 'Loading…' : '↓ View / Download'}
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {submission.status === 'pending' && (
                    <div className="idm-footer">
                        <button className="idm-btn-primary" onClick={() => { onClose(); onCreateAccount(submission); }}>
                            Create Client Account
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Intake Section ───────────────────────────────────────────────────────────
function IntakeSection({ onCreateAccount }) {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading]         = useState(true);
    const [filter, setFilter]           = useState('All');
    const [selected, setSelected]       = useState(null);

    useEffect(() => {
        authFetch('/api/intakes')
            .then(r => r.json())
            .then(d => setSubmissions(d.submissions || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const filtered = filter === 'All'
        ? submissions
        : submissions.filter(s => s.status === filter.toLowerCase());

    return (
        <div className="ads-section">
            <div className="admin-page-header">
                <div>
                    <h1>Intake Forms</h1>
                    <p>All general client intake submissions from the website.</p>
                </div>
            </div>

            <div className="admin-table-card">
                <div className="admin-table-header">
                    <h2>Submissions ({submissions.length})</h2>
                    <div className="admin-table-tabs">
                        {['All', 'Pending', 'Converted'].map(t => (
                            <button
                                key={t}
                                className={`admin-tab ${filter === t ? 'admin-tab--active' : ''}`}
                                onClick={() => setFilter(t)}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Full Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Submitted</th>
                                <th>Status</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="ads-table-msg">Loading submissions…</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="6" className="ads-table-msg">No submissions found.</td></tr>
                            ) : filtered.map(s => (
                                <tr key={s.id}>
                                    <td>
                                        <div className="admin-client-name">
                                            <div className="ads-avatar" style={{ background: getAvatarColor(s.full_name) }}>
                                                {getInitials(s.full_name)}
                                            </div>
                                            <span>{s.full_name}</span>
                                        </div>
                                    </td>
                                    <td className="admin-cell-muted">{s.email}</td>
                                    <td className="admin-cell-muted">{s.phone || '—'}</td>
                                    <td className="admin-cell-muted">{fmtDate(s.created_at)}</td>
                                    <td>
                                        <span className={`idm-status-badge idm-status--${s.status}`}>
                                            {s.status === 'converted' ? 'Converted' : 'Pending'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="admin-actions">
                                            <button
                                                className="ads-action-btn ads-action-btn--dl"
                                                onClick={() => setSelected(s)}
                                                title="View Full Details"
                                            >
                                                View Details
                                            </button>
                                            {s.status === 'pending' && (
                                                <button
                                                    className="ads-action-btn ads-action-btn--paid"
                                                    onClick={() => onCreateAccount(s)}
                                                    title="Create Client Account"
                                                >
                                                    Create Account
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="admin-pagination">
                    <span>Showing {filtered.length} of {submissions.length} submissions</span>
                </div>
            </div>

            <IntakeDetailsModal
                submission={selected}
                onClose={() => setSelected(null)}
                onCreateAccount={(sub) => { setSelected(null); onCreateAccount(sub); }}
            />
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
    const [prefillData, setPrefillData]             = useState(null);
    const [activeIntakeId, setActiveIntakeId]       = useState(null);
    const [toast, setToast] = useState('');
    const navigate = useNavigate();

    useEffect(() => { fetchClients(); fetchStats(); }, []);

    const fetchClients = async () => {
        try {
            const res  = await authFetch('/api/clients');
            const data = await res.json();
            setClients(data.clients || []);
        } catch { /* ignore */ } finally { setLoadingClients(false); }
    };

    const fetchStats = async () => {
        try {
            const res  = await authFetch('/api/stats');
            const data = await res.json();
            setStats(data);
        } catch { /* ignore */ }
    };

    const handleLogout = async () => {
        const { supabase } = await import('../lib/supabase');
        await supabase.auth.signOut({ scope: 'global' });
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

    const openCreateFromIntake = (submission) => {
        setPrefillData({ fullName: submission.full_name, email: submission.email, phone: submission.phone });
        setActiveIntakeId(submission.id);
        setShowCreateClient(true);
    };

    const handleCreateClientClose = () => {
        setShowCreateClient(false);
        setPrefillData(null);
        setActiveIntakeId(null);
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
                    {activeSection === 'intake' && (
                        <IntakeSection onCreateAccount={openCreateFromIntake} />
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
                onClose={handleCreateClientClose}
                onClientCreated={handleClientCreated}
                prefillData={prefillData}
                intakeId={activeIntakeId}
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
