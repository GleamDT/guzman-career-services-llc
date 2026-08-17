import React from 'react';
import './WhoItsFor.css';

const SEGMENTS = [
    {
        icon: '💼',
        title: 'Busy Professionals',
        quote: "I don't have hours every week to apply.",
    },
    {
        icon: '🔄',
        title: 'Recently Laid-Off Professionals',
        quote: 'I need to maintain application momentum.',
    },
    {
        icon: '🧭',
        title: 'Career Changers',
        quote: 'I need a structured approach to pursuing new opportunities.',
    },
    {
        icon: '🌍',
        title: 'Eligible Newcomers',
        quote: 'I need help navigating and managing applications in the US/Canadian market.',
    },
];

function WhoItsFor() {
    return (
        <section id="who-its-for" className="section section-alt">
            <div className="container">
                <div className="section-header text-center">
                    <h2 className="section-title">Who This Is For</h2>
                </div>

                <div className="who-grid">
                    {SEGMENTS.map((segment, i) => (
                        <div className="who-card" key={i}>
                            <div className="who-icon">{segment.icon}</div>
                            <h3 className="who-title">{segment.title}</h3>
                            <p className="who-quote">&ldquo;{segment.quote}&rdquo;</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default WhoItsFor;
