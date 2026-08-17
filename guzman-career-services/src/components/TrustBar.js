import React from 'react';
import './TrustBar.css';

const ITEMS = [
    { value: '300+', label: 'Clients Served' },
    { value: '25k+', label: 'Applications Submitted' },
    { value: 'US & Canada', label: 'Where We Operate' },
    { value: 'Human-Managed', label: 'Not Automated' },
];

function TrustBar() {
    return (
        <section id="trust-bar" className="trust-bar">
            <div className="container trust-bar-grid">
                {ITEMS.map((item, i) => (
                    <div className="trust-bar-item" key={i}>
                        <div className="trust-bar-value">{item.value}</div>
                        <div className="trust-bar-label">{item.label}</div>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default TrustBar;
