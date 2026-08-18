import React from 'react';
import Reveal from './Reveal';
import './AutoApplyComparison.css';

const ROWS = [
    { autoApply: 'Keyword matching', guzman: 'Human review' },
    { autoApply: 'Maximum volume', guzman: 'Targeted applications' },
    { autoApply: 'Limited screening', guzman: 'Opportunity evaluation' },
    { autoApply: 'Automated submissions', guzman: 'Human-managed process' },
    { autoApply: 'Little visibility', guzman: 'Application tracking' },
];

function AutoApplyComparison() {
    return (
        <section id="comparison" className="section comparison-section">
            <div className="container">
                <Reveal>
                    <div className="section-header text-center">
                        <h2 className="section-title">Not Another Auto-Apply Tool</h2>
                        <p className="section-subtitle">
                            Real specialists. Real job research. Targeted applications. Our application specialists
                            review opportunities against your job-search criteria before applying.
                        </p>
                    </div>
                </Reveal>

                <Reveal delay={150}>
                    <div className="comparison-table">
                        <div className="comparison-table-header">
                            <div className="comparison-col comparison-col--auto">Mass Auto-Apply</div>
                            <div className="comparison-col comparison-col--guzman">Guzman</div>
                        </div>
                        {ROWS.map((row, i) => (
                            <div className="comparison-table-row" key={i}>
                                <div className="comparison-col comparison-col--auto">
                                    <span className="comparison-icon comparison-icon--no">✕</span>
                                    {row.autoApply}
                                </div>
                                <div className="comparison-col comparison-col--guzman">
                                    <span className="comparison-icon comparison-icon--yes">✓</span>
                                    {row.guzman}
                                </div>
                            </div>
                        ))}
                    </div>
                </Reveal>
            </div>
        </section>
    );
}

export default AutoApplyComparison;
