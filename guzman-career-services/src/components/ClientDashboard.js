import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ClientDashboard.css';

const INVOICES = [
    {
        id: 'INV-2023-004',
        description: 'LinkedIn Profile Optimization',
        subtitle: 'Premium Profile Overhaul',
        date: 'Oct 24, 2023',
        amount: '$350.00',
        status: 'Pending',
    },
    {
        id: 'INV-2023-003',
        description: 'Executive Resume Writing',
        subtitle: 'Initial Draft & Revisions',
        date: 'Sep 12, 2023',
        amount: '$750.00',
        status: 'Paid',
    },
    {
        id: 'INV-2023-001',
        description: 'Career Strategy Session',
        subtitle: 'Consultation Hour',
        date: 'Aug 15, 2023',
        amount: '$150.00',
        status: 'Paid',
    },
];

function InvoicesTab() {
    return (
        <div className="cd-tab-content">
            {/* Header row with stats inline */}
            <div className="cd-section-header">
                <div className="cd-section-header-text">
                    <h2>Invoices &amp; Payments</h2>
                    <p>Manage your billing history and settle outstanding balances.</p>
                </div>
                <div className="cd-invoice-stats">
                    <div className="cd-stat-card">
                        <span className="cd-stat-label">Total Spent</span>
                        <span className="cd-stat-value">$1,250.00</span>
                    </div>
                    <div className="cd-stat-card">
                        <span className="cd-stat-label">Pending</span>
                        <span className="cd-stat-value cd-stat-value--pending">$350.00</span>
                    </div>
                </div>
            </div>

            {/* Table */}
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
                        {INVOICES.map(inv => (
                            <tr key={inv.id}>
                                <td className="cd-td-id">#{inv.id}</td>
                                <td className="cd-td-desc">
                                    <div className="cd-td-desc-main">{inv.description}</div>
                                    <div className="cd-td-desc-sub">{inv.subtitle}</div>
                                </td>
                                <td className="cd-td-date">{inv.date}</td>
                                <td className="cd-td-amount">{inv.amount}</td>
                                <td>
                                    <span className={`cd-invoice-status cd-invoice-status--${inv.status.toLowerCase()}`}>
                                        <span className="cd-status-dot" />
                                        {inv.status}
                                    </span>
                                </td>
                                <td>
                                    <div className="cd-invoice-actions">
                                        {inv.status === 'Pending' && (
                                            <button className="cd-btn cd-btn--pay">
                                                Pay with Stripe
                                            </button>
                                        )}
                                        {inv.status === 'Paid' && (
                                            <button className="cd-btn cd-btn--receipt">
                                                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                                                </svg>
                                                Receipt
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Table footer */}
                <div className="cd-table-footer">
                    <span className="cd-table-count">Showing {INVOICES.length} of {INVOICES.length} results</span>
                    <div className="cd-pagination">
                        <button className="cd-page-btn">Prev</button>
                        <button className="cd-page-btn">Next</button>
                    </div>
                </div>
            </div>

            {/* Payment security footer */}
            <div className="cd-payment-security">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="cd-security-icon">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
                <span>All payments are encrypted and processed securely by Stripe.</span>
            </div>
        </div>
    );
}

function ResumeTab() {
    return (
        <div className="cd-tab-content">
            {/* Page header */}
            <div className="cd-resume-page-header">
                <div>
                    <h2 className="cd-resume-page-title">My Professional Resume</h2>
                    <div className="cd-resume-timestamp">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                        </svg>
                        <span>Last updated by Admin on <strong>October 24, 2023</strong></span>
                    </div>
                </div>
                <button className="cd-btn cd-btn--download">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                    Download as PDF
                </button>
            </div>

            {/* Two-column grid */}
            <div className="cd-resume-grid">
                {/* Left sidebar */}
                <aside className="cd-resume-sidebar">
                    {/* File details */}
                    <div className="cd-resume-details-card">
                        <h3 className="cd-resume-details-title">File Details</h3>
                        <dl className="cd-resume-details-list">
                            <div>
                                <dt>File Name</dt>
                                <dd>John_Doe_Executive_Resume_v2.pdf</dd>
                            </div>
                            <div>
                                <dt>File Format</dt>
                                <dd>PDF Document</dd>
                            </div>
                            <div>
                                <dt>File Size</dt>
                                <dd>1.2 MB</dd>
                            </div>
                        </dl>
                    </div>

                    {/* Revision card */}
                    <div className="cd-resume-revision-card">
                        <h3>Need a revision?</h3>
                        <p>If you need updates or have questions about your resume, please contact your career consultant.</p>
                        <a href="mailto:support@guzmancareerservices.com" className="cd-revision-link">Contact Consultant</a>
                    </div>
                </aside>

                {/* Resume preview */}
                <section className="cd-resume-preview-wrap">
                    <div className="cd-resume-doc">
                        {/* Watermark */}
                        <div className="cd-resume-watermark" aria-hidden="true">GUZMAN CAREER SERVICES</div>

                        {/* Resume content */}
                        <div className="cd-resume-body">
                            <div className="cd-resume-doc-header">
                                <h3>JOHN DOE</h3>
                                <p className="cd-resume-doc-title">Senior Project Manager | Tech Solutions Specialist</p>
                                <p className="cd-resume-doc-contact">123 Career Blvd, New York, NY &bull; (555) 012-3456 &bull; john.doe@email.com</p>
                            </div>

                            <div className="cd-resume-section cd-resume-section--top-border">
                                <h4>Professional Summary</h4>
                                <p>Results-oriented professional with over 10 years of experience in managing high-stakes technology projects. Proven track record of increasing operational efficiency and leading cross-functional teams to deliver projects on time and under budget.</p>
                            </div>

                            <div className="cd-resume-section">
                                <h4>Experience</h4>
                                <div className="cd-resume-job">
                                    <div className="cd-resume-job-header">
                                        <strong>Lead Solutions Architect &bull; TechCorp Global</strong>
                                        <span>2018 – Present</span>
                                    </div>
                                    <ul>
                                        <li>Orchestrated the migration of legacy systems to AWS cloud, reducing costs by 25%.</li>
                                        <li>Lead a team of 15 developers and 3 designers on mission-critical client projects.</li>
                                        <li>Implemented Agile methodologies resulting in a 40% increase in sprint velocity.</li>
                                    </ul>
                                </div>
                                <div className="cd-resume-job">
                                    <div className="cd-resume-job-header">
                                        <strong>Project Coordinator &bull; Innovate Digital</strong>
                                        <span>2014 – 2018</span>
                                    </div>
                                    <ul>
                                        <li>Managed project lifecycles for mid-sized enterprise clients across North America.</li>
                                        <li>Coordinated vendor relations and ensured compliance with SOC2 standards.</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="cd-resume-two-col">
                                <div className="cd-resume-section">
                                    <h4>Education</h4>
                                    <p className="cd-resume-edu-degree">M.S. in Computer Science</p>
                                    <p className="cd-resume-edu-school">University of Excellence, 2014</p>
                                </div>
                                <div className="cd-resume-section">
                                    <h4>Skills</h4>
                                    <div className="cd-resume-skills">
                                        {['Agile/Scrum', 'Cloud Arch', 'Team Leadership', 'Python'].map(s => (
                                            <span key={s} className="cd-skill-tag">{s}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Zoom controls */}
                    <div className="cd-zoom-controls">
                        <button className="cd-zoom-btn" title="Zoom out">
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                            </svg>
                        </button>
                        <span className="cd-zoom-pct">100%</span>
                        <button className="cd-zoom-btn" title="Zoom in">
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                            </svg>
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}

function ClientDashboard() {
    const [activeTab, setActiveTab] = useState('Invoices');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        sessionStorage.removeItem('auth');
        navigate('/');
    };

    const tabs = ['Invoices', 'My Resume'];

    return (
        <div className="cd-layout">
            {sidebarOpen && (
                <div className="cd-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
            )}

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
                {/* Top bar */}
                <header className="cd-topbar">
                    <button className="cd-hamburger" onClick={() => setSidebarOpen(v => !v)} aria-label="Toggle menu">
                        <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                        </svg>
                    </button>
                    <h1 className="cd-topbar-title">Client Portal</h1>
                    <div className="cd-topbar-user">
                        <div className="cd-user-text">
                            <p className="cd-user-name">Eleanor Pena</p>
                            <p className="cd-user-role">General Client</p>
                        </div>
                        <div className="cd-user-avatar">EP</div>
                    </div>
                </header>

                {/* Tab content */}
                <section className="cd-content">
                    {/* Mobile tabs */}
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

                    {activeTab === 'Invoices' && <InvoicesTab />}
                    {activeTab === 'My Resume' && <ResumeTab />}
                </section>
            </div>
        </div>
    );
}

export default ClientDashboard;
