// Three modes, not two: 'unified' is today's actual behavior (marketing +
// portal on one domain) and stays the DEFAULT so staging/local dev — which
// never set this var — are completely unaffected. 'marketing' and 'portal'
// are the two split-production builds, opted into explicitly by name.
export const SITE_MODE = process.env.REACT_APP_SITE_MODE === 'marketing' ? 'marketing'
    : process.env.REACT_APP_SITE_MODE === 'portal' ? 'portal'
    : 'unified';
