// Empty on Railway (portal frontend and API are same-origin there — identical
// behavior to a relative fetch). Set to the portal's URL on the marketing
// (Vercel) build, since that origin doesn't have its own backend.
export const API_BASE = process.env.REACT_APP_PORTAL_URL || '';
