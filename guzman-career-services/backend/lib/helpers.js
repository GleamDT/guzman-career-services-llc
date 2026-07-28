function getFileExt(mimetype) {
    if (mimetype === 'application/msword') return '.doc';
    if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return '.docx';
    return '.pdf';
}

// Parses a User-Agent header into a human-readable "Device • OS • Browser" summary
// for the terms-acceptance audit trail (browsers never expose a MAC address to the server or JS).
function parseDeviceInfo(userAgent) {
    if (!userAgent) return 'Unknown device';
    const ua = userAgent;
    const isTablet = /iPad|Tablet/i.test(ua);
    const isMobile = !isTablet && /Mobi|Android|iPhone/i.test(ua);
    const deviceKind = isTablet ? 'Tablet' : isMobile ? 'Mobile' : 'Desktop';

    let os = 'Unknown OS';
    if (/Windows NT/i.test(ua)) os = 'Windows';
    else if (/Android/i.test(ua)) os = 'Android';
    else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
    else if (/Mac OS X/i.test(ua)) os = 'macOS';
    else if (/Linux/i.test(ua)) os = 'Linux';

    let browser = 'Unknown browser';
    if (/Edg\//i.test(ua)) browser = 'Edge';
    else if (/OPR\/|Opera/i.test(ua)) browser = 'Opera';
    else if (/Chrome\//i.test(ua)) browser = 'Chrome';
    else if (/Firefox\//i.test(ua)) browser = 'Firefox';
    else if (/Safari\//i.test(ua)) browser = 'Safari';

    return `${deviceKind} • ${os} • ${browser}`;
}

module.exports = { getFileExt, parseDeviceInfo };
