import React from 'react';

// Single source of truth for which logo file to render. 'color' (navy+teal,
// for light backgrounds) is the default; pass variant="white" on any dark
// background (brand panels, sidebars, footer).
function Logo({ variant = 'color', className, alt = 'Guzman Career Services' }) {
    const src = variant === 'white' ? '/logo-white.png' : '/logo.png';
    return <img src={src} alt={alt} className={className} />;
}

export default Logo;
