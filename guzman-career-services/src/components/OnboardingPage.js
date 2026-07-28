import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { authFetch } from '../lib/authFetch';
import OnboardingForm from './OnboardingForm';
import Tech2mateOnboardingForm from './Tech2mateOnboardingForm';

function OnboardingPage() {
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        authFetch('/api/clients/me')
            .then(r => r.json())
            .then(data => setClient(data.client || null))
            .catch(() => setClient(null))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return null;
    if (!client) return <Navigate to="/" replace />;
    if (client.status !== 'Pending') return <Navigate to="/dashboard" replace />;

    return client.intake_form_type === 'tech2mate'
        ? <Tech2mateOnboardingForm />
        : <OnboardingForm />;
}

export default OnboardingPage;
