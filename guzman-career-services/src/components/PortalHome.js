import React from 'react';
import { Navigate } from 'react-router-dom';
import Login from './Login';

function getAuth() {
    try { return JSON.parse(sessionStorage.getItem('auth')); } catch { return null; }
}

// The portal's "/" — a login page, not a landing page. If already
// authenticated, skip straight to the right dashboard instead of showing
// the login form again.
function PortalHome() {
    const auth = getAuth();
    if (auth) {
        const dest = auth.role === 'admin' ? '/admin' : auth.role === 'staff' ? '/staff' : '/dashboard';
        return <Navigate to={dest} replace />;
    }
    return <Login isOpen={true} onClose={() => {}} />;
}

export default PortalHome;
