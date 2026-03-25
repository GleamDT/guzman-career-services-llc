import { supabase } from './supabase';

export async function authFetch(url, options = {}) {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    return fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });
}

export async function getAuthToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
}
