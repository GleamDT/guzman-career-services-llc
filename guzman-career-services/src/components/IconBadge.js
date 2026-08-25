import React from 'react';
import './IconBadge.css';

// Consistent icon treatment across the marketing site — a Lucide icon inside
// a colored circle, replacing platform emoji (which render inconsistently
// and read as unprofessional/childish against the Navy/Teal brand).
function IconBadge({ icon: Icon, variant = 'navy', size = 'md' }) {
    return (
        <div className={`icon-badge icon-badge--${variant} icon-badge--${size}`}>
            <Icon strokeWidth={2} />
        </div>
    );
}

export default IconBadge;
