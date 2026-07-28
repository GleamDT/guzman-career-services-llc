const { getFileExt, parseDeviceInfo } = require('./helpers');

describe('getFileExt', () => {
    test('maps Word .doc mimetype', () => {
        expect(getFileExt('application/msword')).toBe('.doc');
    });

    test('maps Word .docx mimetype', () => {
        expect(getFileExt('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe('.docx');
    });

    test('defaults to .pdf for anything else', () => {
        expect(getFileExt('application/pdf')).toBe('.pdf');
        expect(getFileExt('image/png')).toBe('.pdf');
    });
});

describe('parseDeviceInfo', () => {
    test('returns "Unknown device" when no user agent is given', () => {
        expect(parseDeviceInfo('')).toBe('Unknown device');
        expect(parseDeviceInfo(undefined)).toBe('Unknown device');
    });

    test('identifies a Windows desktop Chrome user agent', () => {
        const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
        expect(parseDeviceInfo(ua)).toBe('Desktop • Windows • Chrome');
    });

    test('identifies an iPhone Safari user agent as mobile', () => {
        const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
        expect(parseDeviceInfo(ua)).toBe('Mobile • iOS • Safari');
    });

    test('identifies an iPad as a tablet', () => {
        const ua = 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/604.1';
        expect(parseDeviceInfo(ua)).toBe('Tablet • iOS • Safari');
    });

    test('identifies a macOS Firefox user agent', () => {
        const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:126.0) Gecko/20100101 Firefox/126.0';
        expect(parseDeviceInfo(ua)).toBe('Desktop • macOS • Firefox');
    });

    test('identifies Edge before Chrome since Edge UA also contains Chrome/', () => {
        const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0';
        expect(parseDeviceInfo(ua)).toBe('Desktop • Windows • Edge');
    });
});
