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

function fmtDateTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        + ' at '
        + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
}

/**
 * Generates and downloads a branded PDF of a full client intake submission,
 * including the terms & conditions acceptance record (signature, server timestamp,
 * IP address, and device info captured at submission time).
 * @param {object} submission - Row from intake_submissions
 */
export async function downloadIntakePDF(submission) {
    const doc   = new jsPDF();
    const blue  = [29, 78, 216];
    const dark  = [15, 23, 42];
    const gray  = [100, 116, 139];
    const light = [248, 250, 252];
    const green = [5, 150, 105];

    let y = 44;

    const ensureSpace = (needed) => {
        if (y + needed > 280) {
            doc.addPage();
            y = 20;
        }
    };

    const sectionTitle = (title) => {
        ensureSpace(14);
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
        ensureSpace(9);
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
    doc.text('INTAKE FORM', 196, 15, { align: 'right' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Submitted ${fmtDate(submission.created_at)}`, 196, 27, { align: 'right' });

    // ── Personal Information ─────────────────────────────────────────────────
    sectionTitle('Personal Information');
    row('Full Name', submission.full_name);
    row('Email', submission.email);
    row('Phone', submission.phone);
    row('Address', submission.full_address);
    row('Sex', submission.sex);
    row('Referred By', submission.referred_by);

    // ── Identity & Status ────────────────────────────────────────────────────
    sectionTitle('Identity & Status');
    row('Veteran Status', submission.veteran_status);
    row('Disability Status', submission.disability_status);
    row('Race / Ethnicity', submission.race_identity);
    row('Work Authorization', submission.work_authorization);

    // ── Professional Details ─────────────────────────────────────────────────
    sectionTitle('Professional Details');
    row('Form Type', submission.intake_form_type === 'tech2mate' ? 'Tech2Mate Student' : 'Guzman Client');
    row('Job Title(s)', submission.job_titles);
    row('LinkedIn Profile', submission.linkedin_profile);
    row('Shared Email', submission.shared_email);
    if (submission.shared_password) row('Shared Password', submission.shared_password);

    // ── Legal Agreement & Signature ──────────────────────────────────────────
    sectionTitle('Legal Agreement & Signature');
    row('Legal Name (Signature)', submission.legal_name, { bold: true });
    row('Signature Date', fmtDate(submission.signature_date));
    row('Terms & Conditions', submission.tc_agreed ? 'Accepted' : 'Not Accepted', {
        color: submission.tc_agreed ? green : [220, 38, 38],
        bold: true,
    });
    row('Signed At (Server-Verified)', fmtDateTime(submission.created_at));
    row('IP Address', submission.ip_address || 'Not recorded');
    row('Device / Browser', submission.device_type || 'Not recorded');

    // ── Additional Notes ──────────────────────────────────────────────────────
    if (submission.additional_notes) {
        sectionTitle('Additional Notes');
        ensureSpace(14);
        doc.setTextColor(...dark);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(submission.additional_notes, 176);
        ensureSpace(lines.length * 5);
        doc.text(lines, 17, y);
        y += lines.length * 5 + 4;
    }

    // ── Footer (every page) ──────────────────────────────────────────────────
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setDrawColor(226, 232, 240);
        doc.line(14, 285, 196, 285);
        doc.setTextColor(...gray);
        doc.setFontSize(7.5);
        doc.text('Guzman Career Services  |  support@guzmancareerservices.com', 105, 291, { align: 'center' });
        doc.text(`Page ${i} of ${pageCount}`, 196, 291, { align: 'right' });
    }

    const safeName = (submission.full_name || 'intake').replace(/[^a-z0-9]+/gi, '_');
    doc.save(`intake-${safeName}.pdf`);
}
