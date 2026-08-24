import React from 'react';
import { Briefcase, RefreshCw, Compass, Globe } from 'lucide-react';
import IconBadge from './IconBadge';
import Reveal from './Reveal';
import './WhoItsFor.css';

const SEGMENTS = [
    {
        icon: Briefcase,
        title: 'Busy Professionals',
        quote: "I don't have hours every week to apply.",
    },
    {
        icon: RefreshCw,
        title: 'Recently Laid-Off Professionals',
        quote: 'I need to maintain application momentum.',
    },
    {
        icon: Compass,
        title: 'Career Changers',
        quote: 'I need a structured approach to pursuing new opportunities.',
    },
    {
        icon: Globe,
        title: 'Newcomer Professionals',
        quote: 'Professionals navigating job applications in the US or Canadian market who are eligible to pursue their target opportunities.',
        plain: true,
    },
];

function WhoItsFor() {
    return (
        <section id="who-its-for" className="section section-alt who-section">
            <div className="who-icon-decoration">
                <Globe strokeWidth={1} />
            </div>
            <div className="container">
                <Reveal>
                    <div className="section-header text-center">
                        <h2 className="section-title">Who This Is For</h2>
                    </div>
                </Reveal>

                <div className="who-grid">
                    {SEGMENTS.map((segment, i) => (
                        <Reveal delay={i * 100} key={i}>
                            <div className="who-card">
                                <IconBadge icon={segment.icon} variant="navy" size="sm" />
                                <h3 className="who-title">{segment.title}</h3>
                                <p className={`who-quote${segment.plain ? ' who-quote--plain' : ''}`}>
                                    {segment.plain ? segment.quote : <>&ldquo;{segment.quote}&rdquo;</>}
                                </p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default WhoItsFor;
