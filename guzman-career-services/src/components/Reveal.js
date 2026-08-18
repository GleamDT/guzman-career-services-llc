import React from 'react';
import { useInView } from '../lib/useInView';
import './Reveal.css';

// Wraps any content so it animates in once, the moment it actually scrolls
// into view — replaces the old per-card CSS animations that ran once on
// page load and were long finished before most visitors scrolled to them.
function Reveal({ children, delay = 0, className = '', as: Tag = 'div' }) {
    const [ref, inView] = useInView();

    return (
        <Tag
            ref={ref}
            className={`reveal ${inView ? 'reveal--visible' : ''} ${className}`}
            style={{ transitionDelay: inView ? `${delay}ms` : '0ms' }}
        >
            {children}
        </Tag>
    );
}

export default Reveal;
