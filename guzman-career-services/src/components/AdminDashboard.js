import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const CLIENTS = [
    {
        id: 1,
        name: 'Eleanor Pena',
        email: 'eleanor.pena@example.com',
        status: 'Onboarded',
        dateJoined: 'Oct 24, 2023',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDaY-_taQgCUdUEp1NxhcHzrtw5AF_SNGMee8sBKrlQ7H6jVn2IhSk1O6caPkGEh5x_GS26PvfBEW2TGknj79pXw0vQouWVIZbu8BNaDBvUB9O-3P61WhDzZ7Q1eapivuGlXxfZVwsP0GcCm_xCjoM3nw0K6Xli-zwTZ9GcllYI3CcS2gudsWT0IJEG7v-K_QiSDZBD2YkvcNvr-zEFj8R5R6HLDYUrVDDjS4LyFCZOUXzxPhhtUOtwk3zXP2wdpnsLlGzPX_oebu6O',
    },
    {
        id: 2,
        name: 'Arlene McCoy',
        email: 'arlene.mccoy@example.com',
        status: 'Pending',
        dateJoined: 'Nov 02, 2023',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD-lOa5E7f1xu4V7oFGHmP9KYVP6vsMn7qn7qUfgSLuXHsmomcq_3s1OC4so8lcGEqAJgP7vzWTa-YYFHZzdfEyJilB4Z5FrYqaNRgNuqwnzdyd4L68PWG57TE1XshCxoa82J0IyHuDVB2CdLt7tHo5cFIIHKL1LZfduGGBJj24Y6fr6iK4zcaA6p5Q6irIyv8Oi5n8OTsj7qZc3pCrrKbSItdKQ-Q_nmE5pniYkrNpV-3HyUEXL4YKbYGmYe9tEjRHOPv87GjpnYP5',
    },
    {
        id: 3,
        name: 'Guy Hawkins',
        email: 'guy.hawkins@example.com',
        status: 'Onboarded',
        dateJoined: 'Oct 28, 2023',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA_ChwLFRAthgzt1M3iitRDGhWxw0DvLrgYXMklcIkngPijM9LSGGAANFSY_8eq885Jyu7s4SzE0ix6_7762Dch3jCShpI6fQ9JSAzxwk1QWxqwTp7inzxDfSTYZAJ2BQGa5GrJFaOwdNzBAnw--JY2ORfxk_98xYv83rh2xTr_op7zW0_sajXN7ZYSndqvvSeW_IYkeiPcfTWyOGQZFKaA34yq0A1BEGs9qZvGC6RNlQGnN8Y1cQgJSUiZbzUWQMBEXyNj8Oe-MrNQ',
    },
];

const STATS = [
    {
        label: 'Total Active Clients',
        value: '1,284',
        badge: '+12.5%',
        badgeColor: 'green',
        iconBg: '#eff6ff',
        iconColor: '#2563eb',
        icon: (
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
        ),
    },
    {
        label: 'Pending Onboarding',
        value: '42',
        badge: '8 new',
        badgeColor: 'amber',
        iconBg: '#fffbeb',
        iconColor: '#d97706',
        icon: (
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
        ),
    },
    {
        label: 'Monthly Revenue',
        value: '$14,250',
        badge: '+4.3%',
        badgeColor: 'green',
        iconBg: '#eef2ff',
        iconColor: '#4f46e5',
        icon: (
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
        ),
    },
];

const NAV_ITEMS = [
    {
        label: 'Dashboard',
        active: true,
        icon: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>,
    },
    {
        label: 'Clients',
        active: false,
        icon: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>,
    },
    {
        label: 'Invoices',
        active: false,
        icon: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>,
    },
    {
        label: 'Resumes',
        active: false,
        icon: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>,
    },
];

function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('All Clients');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        sessionStorage.removeItem('auth');
        navigate('/');
    };

    const filteredClients = activeTab === 'All Clients'
        ? CLIENTS
        : CLIENTS.filter(c => c.status === activeTab.replace('ed', '').trim() || c.status === activeTab);

    return (
        <div className="admin-layout">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="admin-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar--open' : ''}`}>
                <div className="admin-sidebar-logo">
                    <img src="/logo.png" alt="Guzman Career Services" className="admin-sidebar-logo-img" />
                </div>
                <nav className="admin-nav">
                    {NAV_ITEMS.map(item => (
                        <button
                            key={item.label}
                            className={`admin-nav-link ${item.active ? 'admin-nav-link--active' : ''}`}
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

            {/* Main area */}
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
                        <input type="text" placeholder="Search clients or files..." />
                    </div>
                    <div className="admin-topbar-right">
                        <button className="admin-notif-btn">
                            <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                            </svg>
                            <span className="admin-notif-dot" />
                        </button>
                        <div className="admin-user-info">
                            <div className="admin-user-text">
                                <p className="admin-user-name">Admin User</p>
                                <p className="admin-user-role">Operations Manager</p>
                            </div>
                            <img
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC5k97wr8cHcR97PbIoY91EHuSvGUo0Yx5nlV22hJeLoHXJFgt6VmhPVeuFs6Z8nkLmW2ZIfKKHLg-9QBwos4ZH-6e_TmWf4JtXnNBhmv1zvfZm6X-I4el-BWq_p4Qq3sdBXuM3_K1AL25dUG-HVvZxijr6_MV4Q_6wKX4G1COIzI9gVzAXWMkO2UjgjzufI-v1KageM80VaN1fB0a3BLbpsuduyrjta2dNu7xDwuqj0CmymhnFukA-uIF5D5PXUcYqM3RN-Feow9dy"
                                alt="Admin"
                                className="admin-avatar"
                            />
                        </div>
                    </div>
                </header>

                {/* Content */}
                <section className="admin-content">
                    {/* Page header */}
                    <div className="admin-page-header">
                        <div>
                            <h1>Admin Dashboard</h1>
                            <p>Overview of career service operations and client lifecycle.</p>
                        </div>
                        <button className="admin-create-btn">
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                            </svg>
                            Create Client Account
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="admin-stats-grid">
                        {STATS.map(stat => (
                            <div key={stat.label} className="admin-stat-card">
                                <div className="admin-stat-header">
                                    <div className="admin-stat-icon" style={{ background: stat.iconBg, color: stat.iconColor }}>
                                        {stat.icon}
                                    </div>
                                    <span className={`admin-stat-badge admin-stat-badge--${stat.badgeColor}`}>
                                        {stat.badge}
                                    </span>
                                </div>
                                <p className="admin-stat-label">{stat.label}</p>
                                <h3 className="admin-stat-value">{stat.value}</h3>
                            </div>
                        ))}
                    </div>

                    {/* Clients table */}
                    <div className="admin-table-card">
                        <div className="admin-table-header">
                            <h2>All Clients</h2>
                            <div className="admin-table-tabs">
                                {['All Clients', 'Onboarded', 'Pending'].map(tab => (
                                    <button
                                        key={tab}
                                        className={`admin-tab ${activeTab === tab ? 'admin-tab--active' : ''}`}
                                        onClick={() => setActiveTab(tab)}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="admin-table-wrap">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Client Name</th>
                                        <th>Status</th>
                                        <th>Email Address</th>
                                        <th className="text-center">Date Joined</th>
                                        <th className="text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredClients.map(client => (
                                        <tr key={client.id}>
                                            <td>
                                                <div className="admin-client-name">
                                                    <img src={client.avatar} alt={client.name} />
                                                    <span>{client.name}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`admin-status admin-status--${client.status.toLowerCase()}`}>
                                                    {client.status}
                                                </span>
                                            </td>
                                            <td className="admin-cell-muted">{client.email}</td>
                                            <td className="admin-cell-muted text-center">{client.dateJoined}</td>
                                            <td>
                                                <div className="admin-actions">
                                                    <button title="View Profile">
                                                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                                                            <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                                                        </svg>
                                                    </button>
                                                    <button title="Upload Resume">
                                                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                                                        </svg>
                                                    </button>
                                                    <button title="Create Invoice">
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

                        {/* Pagination */}
                        <div className="admin-pagination">
                            <span>Showing 1 to {filteredClients.length} of 1,284 clients</span>
                            <div className="admin-pagination-controls">
                                <button className="admin-page-btn">
                                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                                    </svg>
                                </button>
                                <button className="admin-page-num admin-page-num--active">1</button>
                                <button className="admin-page-num">2</button>
                                <button className="admin-page-num">3</button>
                                <button className="admin-page-btn">
                                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default AdminDashboard;
