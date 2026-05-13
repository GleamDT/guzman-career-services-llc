const TOKEN_KEY = 'gcs_token';

export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem('auth');
}

function parseJWT(token) {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch {
        return null;
    }
}

// Returns the decoded JWT payload if valid and not expired, otherwise null.
export function getAuthUser() {
    const token = getToken();
    if (!token) return null;
    const payload = parseJWT(token);
    if (!payload) return null;
    if (payload.exp && payload.exp * 1000 < Date.now()) {
        clearToken();
        return null;
    }
    return payload; // { sub, email, role, iat, exp }
}
