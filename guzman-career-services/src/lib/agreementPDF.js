import jsPDF from 'jspdf';

const LOGO_URL = 'https://guzmancareerservices.com/logo.png';

function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

/**
 * Generates and downloads a branded PDF of a self-service client's signed
 * agreement record — legal name/signature, T&C acceptance, and the server-side
 * verification metadata captured when they completed onboarding.
 * @param {object} client - Row from clients (self-service onboarding fields)
 */
export async function downloadClientAgreementPDF(client) {
    const doc   = new jsPDF();
    const blue  = [29, 78, 216];
    const dark  = [15, 23, 42];
    const gray  = [100, 116, 139];
    const light = [248, 250, 252];
    const green = [5, 150, 105];

    let y = 44;

    const sectionTitle = (title) => {
        doc.setFillColor(...light);
        doc.rect(14, y - 5, 182, 9, 'F');
        doc.setTextColor(...blue);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(title.toUpperCase(), 17, y + 1);
        y += 12;
    };

    const row = (label, value, opts = {}) => {
        if (!value) return;
        doc.setTextColor(...gray);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(label, 17, y);
        doc.setTextColor(...(opts.color || dark));
        doc.setFontSize(9.5);
        doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
        const lines = doc.splitTextToSize(String(value), 110);
        doc.text(lines, 90, y);
        y += Math.max(7, lines.length * 5);
    };

    // ── Header bar ───────────────────────────────────────────────────────────
    doc.setFillColor(...blue);
    doc.rect(0, 0, 210, 36, 'F');

    try {
        const img   = await loadImage(LOGO_URL);
        const logoH = 22;
        const logoW = (img.naturalWidth / img.naturalHeight) * logoH;
        doc.addImage(img, 'PNG', 14, 5, logoW, logoH);
    } catch {
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(17);
        doc.setFont('helvetica', 'bold');
        doc.text('GUZMAN CAREER SERVICES', 14, 16);
    }

    doc.setTextColor(191, 219, 254);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Professional Career Coaching & Talent Placement', 14, 31);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('SIGNED AGREEMENT', 196, 15, { align: 'right' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Signed ${fmtDate(client.signature_date)}`, 196, 27, { align: 'right' });

    // ── Client ────────────────────────────────────────────────────────────────
    sectionTitle('Client');
    row('Full Name', client.full_name);
    row('Email', client.email);
    row('Service Track', client.intake_form_type === 'tech2mate' ? 'Tech2Mate Student' : 'Guzman Client');

    // ── Legal Agreement & Signature ──────────────────────────────────────────
    sectionTitle('Legal Agreement & Signature');
    row('Legal Name (Signature)', client.legal_name, { bold: true });
    row('Signature Date', fmtDate(client.signature_date));
    row('Terms & Conditions', client.tc_agreed ? 'Accepted' : 'Not Accepted', {
        color: client.tc_agreed ? green : [220, 38, 38],
        bold: true,
    });
    row('Terms Version Accepted', client.tc_accepted_version);
    row('Terms Accepted At', client.tc_accepted_at ? fmtDate(client.tc_accepted_at) : null);
    row('IP Address (Recorded)', client.ip_address || 'Not recorded');
    row('Device / Browser (Recorded)', client.device_type || 'Not recorded');

    // ── Footer ────────────────────────────────────────────────────────────────
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 285, 196, 285);
    doc.setTextColor(...gray);
    doc.setFontSize(7.5);
    doc.text('Guzman Career Services  |  support@guzmancareerservices.com', 105, 291, { align: 'center' });

    const safeName = (client.full_name || 'agreement').replace(/[^a-z0-9]+/gi, '_');
    doc.save(`signed-agreement-${safeName}.pdf`);
}
