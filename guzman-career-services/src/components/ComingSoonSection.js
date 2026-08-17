import React from 'react';
import './ComingSoonSection.css';

// Structural placeholder for homepage sections that don't have real content yet
// (verified testimonials, Application Desk walkthrough, FAQ, newsletter signup).
// Keeps the CEO's approved section order intact without inventing copy.
function ComingSoonSection({ id, eyebrow, title, note }) {
    return (
        <section id={id} className="section coming-soon-section">
            <div className="container">
                <div className="coming-soon-card">
                    <span className="coming-soon-eyebrow">{eyebrow}</span>
                    <h2 className="coming-soon-title">{title}</h2>
                    <p className="coming-soon-note">{note}</p>
                </div>
            </div>
        </section>
    );
}

export default ComingSoonSection;
