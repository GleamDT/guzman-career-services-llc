import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateClientModal from './CreateClientModal';
import CreateStaffModal from './CreateStaffModal';
import CreateInvoiceModal from './CreateInvoiceModal';
import { downloadInvoicePDF } from '../lib/invoicePDF';
import { authFetch, getAuthToken } from '../lib/authFetch';
import { clearToken } from '../lib/auth';
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

const PAGE_SIZE = 10;

function usePagination(items) {
    const [page, setPage] = useState(1);
    const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    const safePage = Math.min(page, pageCount);
    const paged = items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
    return { page: safePage, setPage, pageCount, paged };
}

function Paginator({ page, pageCount, total, setPage }) {
    const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
    const to = Math.min(page * PAGE_SIZE, total);

    const left = Math.max(1, page - 2);
    const right = Math.min(pageCount, page + 2);
    const pages = [];
    for (let i = left; i <= right; i++) pages.push(i);

    return (
        <div className="admin-pagination">
            <span>Showing {from}{total > 0 ? `–${to}` : ''} of {total}</span>
            {pageCount > 1 && (
                <div className="admin-pagination-controls">
                    <button className="admin-page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
                    </button>
                    {left > 1 && <><button className="admin-page-num" onClick={() => setPage(1)}>1</button>{left > 2 && <span style={{ color: '#94a3b8', padding: '0 2px' }}>…</span>}</>}
                    {pages.map(p => (
                        <button key={p} className={`admin-page-num${p === page ? ' admin-page-num--active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                    ))}
                    {right < pageCount && <>{right < pageCount - 1 && <span style={{ color: '#94a3b8', padding: '0 2px' }}>…</span>}<button className="admin-page-num" onClick={() => setPage(pageCount)}>{pageCount}</button></>}
                    <button className="admin-page-btn" onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page === pageCount}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
                    </button>
                </div>
            )}
        </div>
    );
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
    {
        key: 'staff', label: 'Staff',
        icon: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>,
    },
];

// ─── Dashboard Section ────────────────────────────────────────────────────────
function DashboardSection({ stats, onCreateClient, onCreateStaff, onNavigate }) {
    const [activity, setActivity] = useState({ recentClients: [], recentInvoices: [] });

    useEffect(() => {
        authFetch('/api/activity')
            .then(r => r.json())
            .then(d => { if (Array.isArray(d.recentClients)) setActivity(d); })
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
                <div style={{ display: 'flex', gap: '0.625rem' }}>
                    <button className="admin-create-btn" onClick={onCreateClient}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                        </svg>
                        New Client
                    </button>
                    <button className="admin-create-btn" style={{ background: '#7c3aed' }} onClick={onCreateStaff}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                        </svg>
                        New Staff
                    </button>
                </div>
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
                    {(activity.recentClients || []).length === 0
                        ? <p className="ads-empty">No clients yet.</p>
                        : (activity.recentClients || []).map(c => (
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
                    {(activity.recentInvoices || []).length === 0
                        ? <p className="ads-empty">No invoices yet.</p>
                        : (activity.recentInvoices || []).map(inv => (
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

// ─── Client Details Modal ─────────────────────────────────────────────────────
function ClientDetailsModal({ client, onClose, onClientUpdated }) {
    const [loading, setLoading] = useState(false);

    if (!client) return null;

    const handleHibernate = async () => {
        setLoading(true);
        try {
            const res = await authFetch(`/api/clients/${client.id}/hibernate`, { method: 'PATCH' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            onClientUpdated(data.client);
        } catch (err) {
            alert('Error: ' + err.message);
        } finally { setLoading(false); }
    };

    const handleUnhibernate = async () => {
        setLoading(true);
        try {
            const res = await authFetch(`/api/clients/${client.id}/unhibernate`, { method: 'PATCH' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            onClientUpdated(data.client);
        } catch (err) {
            alert('Error: ' + err.message);
        } finally { setLoading(false); }
    };

    return (
        <div className="idm-overlay" onClick={onClose}>
            <div className="idm-modal" onClick={e => e.stopPropagation()}>
                <div className="idm-header">
                    <div>
                        <h2>{client.full_name}</h2>
                        <p>Client since {fmtDate(client.created_at)}</p>
                    </div>
                    <div className="idm-header-right">
                        {client.hibernated
                            ? <span className="idm-status-badge" style={{ background: '#fef3c7', color: '#92400e' }}>Hibernated</span>
                            : <span className={`idm-status-badge idm-status--${(client.status || 'pending').toLowerCase()}`}>{client.status}</span>
                        }
                        <button className="idm-close" onClick={onClose}>✕</button>
                    </div>
                </div>

                <div className="idm-body">
                    <div className="idm-section-title">Contact</div>
                    <div className="idm-row"><span className="idm-label">Email</span><span className="idm-value">{client.email}</span></div>
                    <div className="idm-row"><span className="idm-label">Phone</span><span className="idm-value">{client.phone || '—'}</span></div>

                    <div className="idm-section-title">Account</div>
                    <div className="idm-row"><span className="idm-label">Status</span><span className="idm-value">{client.status}</span></div>
                    <div className="idm-row"><span className="idm-label">Has Logged In</span><span className="idm-value">{client.has_logged_in ? 'Yes' : 'No'}</span></div>
                    <div className="idm-row"><span className="idm-label">Service</span><span className="idm-value">{client.initial_service || '—'}</span></div>
                    <div className="idm-row"><span className="idm-label">T&amp;C Accepted</span><span className="idm-value">{client.tc_accepted_at ? fmtDate(client.tc_accepted_at) : 'Not yet'}</span></div>

                    {client.resume_filename && (
                        <>
                            <div className="idm-section-title">Resume</div>
                            <div className="idm-row"><span className="idm-label">File</span><span className="idm-value">{client.resume_filename}</span></div>
                            <div className="idm-row"><span className="idm-label">Uploaded</span><span className="idm-value">{fmtDate(client.resume_uploaded_at)}</span></div>
                        </>
                    )}
                </div>

                <div className="idm-footer" style={{ gap: '0.75rem' }}>
                    {client.hibernated ? (
                        <button className="idm-btn-primary" onClick={handleUnhibernate} disabled={loading}>
                            {loading ? 'Updating…' : '▶ Unhibernate Account'}
                        </button>
                    ) : (
                        <button
                            className="idm-btn-secondary"
                            style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' }}
                            onClick={handleHibernate}
                            disabled={loading}
                        >
                            {loading ? 'Updating…' : '⏸ Hibernate Account'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Clients Section ──────────────────────────────────────────────────────────
function ClientsSection({ clients, loading, onCreateClient, onCreateInvoice, onClientUpdated, onClientDeleted, isStaff = false }) {
    const [filter, setFilter] = useState('All');
    const [selectedClient, setSelectedClient] = useState(null);
    const [pendingDeleteClient, setPendingDeleteClient] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const handleDeleteClient = async () => {
        if (!pendingDeleteClient) return;
        setDeleting(true);
        try {
            const res = await authFetch(`/api/clients/${pendingDeleteClient.id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            onClientDeleted(pendingDeleteClient.id);
            setPendingDeleteClient(null);
        } catch (err) {
            alert('Error: ' + err.message);
        } finally { setDeleting(false); }
    };

    const filtered = filter === 'All' ? clients : clients.filter(c => c.status === filter);
    const { page, setPage, pageCount, paged } = usePagination(filtered);
    useEffect(() => setPage(1), [filter, setPage]);

    return (
        <div className="ads-section">
            <div className="admin-page-header">
                <div>
                    <h1>Client Management</h1>
                    <p>All registered client accounts and their onboarding status.</p>
                </div>
                {!isStaff && (
                    <button className="admin-create-btn" onClick={onCreateClient}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                        </svg>
                        Create Client Account
                    </button>
                )}
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
                                {!isStaff && <th>Email</th>}
                                {!isStaff && <th>Phone</th>}
                                <th>Date Joined</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={isStaff ? 5 : 7} className="ads-table-msg">Loading clients…</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={isStaff ? 5 : 7} className="ads-table-msg">No clients found.</td></tr>
                            ) : paged.map(client => (
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
                                    {!isStaff && <td className="admin-cell-muted">{client.email}</td>}
                                    {!isStaff && <td className="admin-cell-muted">{client.phone || '—'}</td>}
                                    <td className="admin-cell-muted">{fmtDate(client.created_at)}</td>
                                    <td>
                                        <div className="admin-actions">
                                            {!isStaff && (
                                                <button title="Create Invoice" onClick={() => onCreateInvoice(client)}>
                                                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                                                    </svg>
                                                </button>
                                            )}
                                            <button
                                                className="ads-action-btn ads-action-btn--dl"
                                                title="View Details"
                                                onClick={() => setSelectedClient(client)}
                                            >
                                                Details
                                            </button>
                                            {!isStaff && (
                                                <button
                                                    className="ads-action-btn ads-action-btn--del"
                                                    title="Delete Client"
                                                    onClick={() => setPendingDeleteClient(client)}
                                                >
                                                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Paginator page={page} pageCount={pageCount} total={filtered.length} setPage={setPage} />
            </div>

            {pendingDeleteClient && (
                <div className="idm-confirm-overlay" onClick={() => setPendingDeleteClient(null)}>
                    <div className="idm-confirm-box" onClick={e => e.stopPropagation()}>
                        <h4 className="idm-confirm-title">Delete {pendingDeleteClient.full_name}?</h4>
                        <p className="idm-confirm-warn">
                            This will permanently delete the client account, all their invoices, and all associated resume files. This action cannot be undone.
                        </p>
                        <div className="idm-confirm-actions">
                            <button className="idm-btn-secondary" onClick={() => setPendingDeleteClient(null)} disabled={deleting}>Cancel</button>
                            <button className="idm-btn-delete" onClick={handleDeleteClient} disabled={deleting}>
                                {deleting ? 'Deleting…' : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ClientDetailsModal
                client={selectedClient}
                onClose={() => setSelectedClient(null)}
                onClientUpdated={(updated) => { onClientUpdated(updated); setSelectedClient(updated); }}
            />
        </div>
    );
}

// ─── Invoices Section ─────────────────────────────────────────────────────────
function InvoicesSection({ onShowToast }) {
    const [invoices, setInvoices]             = useState([]);
    const [loading, setLoading]               = useState(true);
    const [filter, setFilter]                 = useState('All');
    const [markingId, setMarkingId]           = useState(null);
    const [pendingDeleteInv, setPendingDeleteInv] = useState(null);
    const [deleting, setDeleting]             = useState(false);

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

    const handleDeleteInvoice = async () => {
        if (!pendingDeleteInv) return;
        setDeleting(true);
        try {
            const res  = await authFetch(`/api/invoices/${pendingDeleteInv.id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setInvoices(prev => prev.filter(i => i.id !== pendingDeleteInv.id));
            setPendingDeleteInv(null);
            onShowToast('Invoice deleted.');
        } catch (err) {
            onShowToast(`Error: ${err.message}`);
        } finally { setDeleting(false); }
    };

    const filtered = filter === 'All' ? invoices : invoices.filter(i => i.status === filter);
    const { page, setPage, pageCount, paged } = usePagination(filtered);
    useEffect(() => setPage(1), [filter, setPage]);
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
                            ) : paged.map(inv => (
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
                                    <td className="admin-cell-muted">
                                        <div>{fmtDate(inv.created_at)}</div>
                                        {inv.due_date && (
                                            <div style={{ fontSize: '0.78rem', color: '#d97706', marginTop: '2px' }}>
                                                Due: {fmtDate(inv.due_date)}
                                            </div>
                                        )}
                                    </td>
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
                                            <button
                                                className="ads-action-btn ads-action-btn--del"
                                                onClick={() => setPendingDeleteInv(inv)}
                                                title="Delete Invoice"
                                            >
                                                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Paginator page={page} pageCount={pageCount} total={filtered.length} setPage={setPage} />
            </div>

            {pendingDeleteInv && (
                <div className="idm-confirm-overlay" onClick={() => setPendingDeleteInv(null)}>
                    <div className="idm-confirm-box" onClick={e => e.stopPropagation()}>
                        <h4 className="idm-confirm-title">Delete Invoice #{pendingDeleteInv.invoice_number}?</h4>
                        {pendingDeleteInv.status === 'Paid' ? (
                            <p className="idm-confirm-warn">
                                Warning: This invoice has already been marked as paid. Deleting it will permanently remove all payment records associated with it.
                            </p>
                        ) : (
                            <p className="idm-confirm-body">This action cannot be undone.</p>
                        )}
                        <div className="idm-confirm-actions">
                            <button className="idm-btn-secondary" onClick={() => setPendingDeleteInv(null)} disabled={deleting}>Cancel</button>
                            <button className="idm-btn-delete" onClick={handleDeleteInvoice} disabled={deleting}>
                                {deleting ? 'Deleting…' : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Resumes Section ──────────────────────────────────────────────────────────
function ResumesSection({ clients, onResumeUploaded, onShowToast, isStaff = false }) {
    const { page, setPage, pageCount, paged: pagedClients } = usePagination(clients);
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
        const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowed.includes(file.type)) {
            onShowToast('Error: Only PDF or Word documents are allowed.');
            return;
        }
        setSelectedFile(file);
    };

    const handleUploadSubmit = async () => {
        if (!selectedFile || !uploadModal) return;
        const { clientId } = uploadModal;
        setUploadingId(clientId);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('resume', selectedFile);
        if (jdLink.trim()) formData.append('jd_link', jdLink.trim());

        const token = await getAuthToken();

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `/api/clients/${clientId}/resume`);
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

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

    const handleDownload = async (clientId, filename) => {
        try {
            const res = await authFetch(`/api/clients/${clientId}/resume/download`);
            if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Download failed'); }
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename || 'resume.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
        } catch (err) {
            onShowToast(`Error: ${err.message}`);
        }
    };

    return (
        <div className="ads-section">
            <input ref={fileInputRef} type="file" accept=".pdf,application/pdf,.doc,application/msword,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" style={{ display: 'none' }} onChange={handleFileSelect} />

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
                            <label>PDF or Word File</label>
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
                                {!isStaff && <th>Email</th>}
                                <th>Resume Status</th>
                                <th>Latest File</th>
                                <th>Last Uploaded</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients.length === 0 ? (
                                <tr><td colSpan={isStaff ? 5 : 6} className="ads-table-msg">No clients yet.</td></tr>
                            ) : pagedClients.map(client => {
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
                                        {!isStaff && <td className="admin-cell-muted">{client.email}</td>}
                                        <td>
                                            <span className={`ads-resume-badge ${hasResume ? 'ads-resume-badge--uploaded' : 'ads-resume-badge--missing'}`}>
                                                {hasResume ? '✓ Uploaded' : 'Not uploaded'}
                                            </span>
                                        </td>
                                        <td className="admin-cell-muted ads-filename" title={client.resume_filename || undefined}>
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
                                                        onClick={() => handleDownload(client.id, client.resume_filename)}
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
                <Paginator page={page} pageCount={pageCount} total={clients.length} setPage={setPage} />
            </div>
        </div>
    );
}

// ─── Intake Details Modal ─────────────────────────────────────────────────────
function IntakeDetailsModal({ submission, onClose, onCreateAccount, onDeleted }) {
    const [resumeLoading, setResumeLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteFile, setDeleteFile] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        if (!submission) return;
        setDeleting(true);
        try {
            const res = await authFetch(`/api/intake/${submission.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deleteFile }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            onDeleted(submission.id);
            onClose();
        } catch (err) {
            alert('Error: ' + err.message);
        } finally { setDeleting(false); }
    };

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

    if (!submission) return null;

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

                <div className="idm-footer" style={{ justifyContent: 'space-between' }}>
                    <button
                        className="idm-btn-delete"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={deleting}
                    >
                        🗑 Delete Intake
                    </button>
                    {submission.status === 'pending' && (
                        <button className="idm-btn-primary" onClick={() => { onClose(); onCreateAccount(submission); }}>
                            Create Client Account
                        </button>
                    )}
                </div>

                {showDeleteConfirm && (
                    <div className="idm-confirm-overlay" onClick={() => setShowDeleteConfirm(false)}>
                        <div className="idm-confirm-box" onClick={e => e.stopPropagation()}>
                            <h4 className="idm-confirm-title">Delete this intake?</h4>
                            <p className="idm-confirm-body">This action cannot be undone.</p>
                            {submission.resume_path && (
                                <label className="idm-confirm-check">
                                    <input
                                        type="checkbox"
                                        checked={deleteFile}
                                        onChange={e => setDeleteFile(e.target.checked)}
                                    />
                                    Also delete the attached resume file from storage
                                </label>
                            )}
                            <div className="idm-confirm-actions">
                                <button className="idm-btn-secondary" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>Cancel</button>
                                <button className="idm-btn-delete" onClick={handleDelete} disabled={deleting}>
                                    {deleting ? 'Deleting…' : 'Yes, Delete'}
                                </button>
                            </div>
                        </div>
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
    const { page, setPage, pageCount, paged } = usePagination(filtered);
    useEffect(() => setPage(1), [filter, setPage]);

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
                            ) : paged.map(s => (
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
                <Paginator page={page} pageCount={pageCount} total={filtered.length} setPage={setPage} />
            </div>

            <IntakeDetailsModal
                submission={selected}
                onClose={() => setSelected(null)}
                onCreateAccount={(sub) => { setSelected(null); onCreateAccount(sub); }}
                onDeleted={(id) => { setSubmissions(prev => prev.filter(s => s.id !== id)); }}
            />
        </div>
    );
}

// ─── Staff Section ────────────────────────────────────────────────────────────
function StaffSection({ onCreateStaff, onShowToast }) {
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading]     = useState(true);
    const [pendingDelete, setPendingDelete] = useState(null);
    const [deleting, setDeleting]           = useState(false);
    const [resetTarget, setResetTarget]     = useState(null);
    const [newPassword, setNewPassword]     = useState('');
    const [showPw, setShowPw]               = useState(false);
    const [resetLoading, setResetLoading]   = useState(false);
    const [resetError, setResetError]       = useState('');

    useEffect(() => {
        authFetch('/api/staff')
            .then(r => r.json())
            .then(d => setStaffList(d.staff || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const handleDelete = async () => {
        if (!pendingDelete) return;
        setDeleting(true);
        try {
            const res = await authFetch(`/api/staff/${pendingDelete.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            setStaffList(prev => prev.filter(s => s.id !== pendingDelete.id));
            onShowToast(`${pendingDelete.full_name} has been removed.`);
            setPendingDelete(null);
        } catch {
            onShowToast('Failed to remove staff member.');
        } finally {
            setDeleting(false);
        }
    };

    const handleResetSubmit = async (e) => {
        e.preventDefault();
        if (!resetTarget) return;
        if (newPassword.length < 8) { setResetError('Password must be at least 8 characters.'); return; }
        setResetLoading(true);
        setResetError('');
        try {
            const res = await authFetch(`/api/staff/${resetTarget.id}/reset-password`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: newPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            onShowToast(`✓ Password reset and email sent to ${resetTarget.email}`);
            setResetTarget(null);
            setNewPassword('');
        } catch (err) {
            setResetError(err.message || 'Failed to reset password.');
        } finally {
            setResetLoading(false);
        }
    };

    const activeCount  = staffList.filter(s => s.password_set).length;
    const pendingCount = staffList.filter(s => !s.password_set).length;

    return (
        <div className="ads-section">
            {/* Page header */}
            <div className="admin-page-header">
                <div>
                    <h1>Staff Management</h1>
                    <p>Team members with access to the admin portal.</p>
                </div>
                <button className="admin-create-btn" style={{ background: '#7c3aed' }} onClick={onCreateStaff}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                    </svg>
                    Add Staff Member
                </button>
            </div>

            {/* Summary cards */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {[
                    { label: 'Total Staff', value: staffList.length, color: '#7c3aed', bg: '#f5f3ff' },
                    { label: 'Active',      value: activeCount,      color: '#059669', bg: '#ecfdf5' },
                    { label: 'Needs Setup', value: pendingCount,     color: '#d97706', bg: '#fffbeb' },
                ].map(card => (
                    <div key={card.label} style={{
                        flex: '1', minWidth: 140,
                        background: 'white', border: '1px solid #e2e8f0',
                        borderRadius: '0.75rem', padding: '1.25rem 1.5rem',
                        display: 'flex', flexDirection: 'column', gap: '0.25rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    }}>
                        <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 500 }}>{card.label}</span>
                        <span style={{ fontSize: '1.75rem', fontWeight: 700, color: card.color }}>{card.value}</span>
                    </div>
                ))}
            </div>

            {/* Table card */}
            <div className="admin-table-card">
                <div className="admin-table-header">
                    <h2>All Staff ({staffList.length})</h2>
                </div>
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Staff Member</th>
                                <th>Email</th>
                                <th>Status</th>
                                <th>Date Added</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="ads-table-msg">Loading staff…</td></tr>
                            ) : staffList.length === 0 ? (
                                <tr><td colSpan={5} className="ads-table-msg">No staff accounts yet. Click "Add Staff Member" to get started.</td></tr>
                            ) : staffList.map(s => (
                                <tr key={s.id}>
                                    <td>
                                        <div className="admin-client-name">
                                            <div className="ads-avatar" style={{ background: '#7c3aed' }}>
                                                {getInitials(s.full_name)}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>{s.full_name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="admin-cell-muted">{s.email}</td>
                                    <td>
                                        <span className={`admin-status admin-status--${s.password_set ? 'active' : 'pending'}`}>
                                            {s.password_set ? 'Active' : 'Needs Setup'}
                                        </span>
                                    </td>
                                    <td className="admin-cell-muted">{fmtDate(s.created_at)}</td>
                                    <td>
                                        <div className="admin-actions">
                                            <button
                                                className="ads-action-btn ads-action-btn--dl"
                                                onClick={() => { setResetTarget(s); setNewPassword(''); setShowPw(false); setResetError(''); }}
                                                title="Reset password"
                                            >
                                                Reset Password
                                            </button>
                                            <button
                                                className="ads-action-btn ads-action-btn--del"
                                                onClick={() => setPendingDelete(s)}
                                                title="Remove staff member"
                                            >
                                                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                                                </svg>
                                                Remove
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Confirm Delete Modal */}
            {pendingDelete && (
                <div className="ccm-overlay" onClick={() => setPendingDelete(null)}>
                    <div className="ccm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
                        <div className="ccm-header">
                            <div>
                                <h2>Remove Staff Member</h2>
                                <p>Are you sure you want to remove <strong>{pendingDelete.full_name}</strong>? This cannot be undone.</p>
                            </div>
                            <button className="ccm-close" onClick={() => setPendingDelete(null)}>
                                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                                </svg>
                            </button>
                        </div>
                        <div className="ccm-form">
                            <div className="ccm-actions">
                                <button type="button" className="ccm-btn ccm-btn--cancel" onClick={() => setPendingDelete(null)}>Cancel</button>
                                <button
                                    type="button"
                                    className="ccm-btn ccm-btn--submit"
                                    style={{ background: '#dc2626' }}
                                    onClick={handleDelete}
                                    disabled={deleting}
                                >
                                    {deleting ? 'Removing…' : 'Yes, Remove'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {resetTarget && (
                <div className="ccm-overlay" onClick={() => setResetTarget(null)}>
                    <div className="ccm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
                        <div className="ccm-header">
                            <div>
                                <h2>Reset Password</h2>
                                <p>Set a new password for <strong>{resetTarget.full_name}</strong>. A credentials email will be sent to them.</p>
                            </div>
                            <button className="ccm-close" onClick={() => setResetTarget(null)}>
                                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                                </svg>
                            </button>
                        </div>
                        <form className="ccm-form" onSubmit={handleResetSubmit}>
                            <div className="ccm-grid">
                                <div className="ccm-field ccm-field--full">
                                    <label>New Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showPw ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={e => { setNewPassword(e.target.value); setResetError(''); }}
                                            placeholder="At least 8 characters"
                                            autoComplete="new-password"
                                            required
                                            style={{ paddingRight: '2.5rem' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPw(v => !v)}
                                            aria-label="Toggle visibility"
                                            style={{
                                                position: 'absolute', right: '0.6rem', top: '50%',
                                                transform: 'translateY(-50%)', background: 'none',
                                                border: 'none', cursor: 'pointer', color: '#64748b',
                                                display: 'flex', alignItems: 'center',
                                            }}
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                                                {showPw ? 'visibility_off' : 'visibility'}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            {resetError && <p className="ccm-error">{resetError}</p>}
                            <div className="ccm-actions">
                                <button type="button" className="ccm-btn ccm-btn--cancel" onClick={() => setResetTarget(null)}>Cancel</button>
                                <button type="submit" className="ccm-btn ccm-btn--submit" disabled={resetLoading}>
                                    {resetLoading ? 'Saving…' : 'Save & Send Email'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main AdminDashboard ──────────────────────────────────────────────────────
function AdminDashboard({ userRole = 'admin' }) {
    const isStaff = userRole === 'staff';
    const [activeSection, setActiveSection] = useState(isStaff ? 'clients' : 'dashboard');
    const [sidebarOpen, setSidebarOpen]     = useState(false);
    const [clients, setClients]             = useState([]);
    const [stats, setStats]                 = useState({ totalClients: 0, activeClients: 0, pendingClients: 0, totalRevenue: '0.00', pendingRevenue: '0.00' });
    const [loadingClients, setLoadingClients] = useState(true);
    const [showCreateClient, setShowCreateClient]   = useState(false);
    const [showCreateStaff, setShowCreateStaff]     = useState(false);
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
            if (res.ok) setStats(data);
        } catch { /* ignore */ }
    };

    const handleLogout = () => {
        clearToken();
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

    const handleStaffCreated = (user) => {
        showToast(`✓ Staff account created and invite sent to ${user.email}`);
    };

    const handleInvoiceCreated = () => {
        showToast('✓ Invoice created successfully.');
        fetchStats();
    };

    const handleResumeUploaded = (updatedClient) => {
        setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
    };

    const handleClientUpdated = (updatedClient) => {
        setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
    };

    const handleClientDeleted = (clientId) => {
        setClients(prev => prev.filter(c => c.id !== clientId));
        setStats(prev => ({ ...prev, totalClients: Math.max(0, prev.totalClients - 1) }));
        showToast('Client deleted.');
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
                    {NAV_ITEMS
                        .filter(item => !isStaff || item.key === 'clients' || item.key === 'resumes')
                        .map(item => (
                            <button
                                key={item.key}
                                className={`admin-nav-link ${activeSection === item.key ? 'admin-nav-link--active' : ''}`}
                                onClick={() => { setActiveSection(item.key); setSidebarOpen(false); }}
                            >
                                {item.icon}
                                {item.label}
                            </button>
                        ))
                    }
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
                                <p className="admin-user-name">{isStaff ? 'Staff' : 'Admin'}</p>
                                <p className="admin-user-role">{isStaff ? 'Staff Member' : 'Operations Manager'}</p>
                            </div>
                            <div className="ads-topbar-avatar">{isStaff ? 'S' : 'A'}</div>
                        </div>
                    </div>
                </header>

                {/* Section content */}
                <section className="admin-content">
                    {activeSection === 'dashboard' && (
                        <DashboardSection
                            stats={stats}
                            onCreateClient={() => setShowCreateClient(true)}
                            onCreateStaff={() => setShowCreateStaff(true)}
                            onNavigate={setActiveSection}
                        />
                    )}
                    {activeSection === 'clients' && (
                        <ClientsSection
                            clients={clients}
                            loading={loadingClients}
                            onCreateClient={() => setShowCreateClient(true)}
                            onCreateInvoice={openInvoiceModal}
                            onClientUpdated={handleClientUpdated}
                            onClientDeleted={handleClientDeleted}
                            isStaff={isStaff}
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
                            isStaff={isStaff}
                        />
                    )}
                    {activeSection === 'staff' && !isStaff && (
                        <StaffSection
                            onCreateStaff={() => setShowCreateStaff(true)}
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
            <CreateStaffModal
                isOpen={showCreateStaff}
                onClose={() => setShowCreateStaff(false)}
                onStaffCreated={handleStaffCreated}
            />

            {/* Toast */}
            {toast && (
                <div className="ads-toast">{toast}</div>
            )}
        </div>
    );
}

export default AdminDashboard;
