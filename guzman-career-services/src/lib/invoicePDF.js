import jsPDF from 'jspdf';

const LOGO_URL = 'https://nrudubbkecsjafrdsexq.supabase.co/storage/v1/object/public/Public_assets/logo.png';

function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

/**
 * Generates and downloads a branded invoice PDF.
 * @param {object} invoice - Invoice record from Supabase
 * @param {object} client  - Client record { full_name, email, phone }
 */
export async function downloadInvoicePDF(invoice, client) {
    const doc  = new jsPDF();
    const blue  = [29, 78, 216];
    const dark  = [15, 23, 42];
    const gray  = [100, 116, 139];
    const light = [248, 250, 252];

    // ── Header bar ───────────────────────────────────────────────────────────
    doc.setFillColor(...blue);
    doc.rect(0, 0, 210, 36, 'F');

    // Logo
    try {
        const img   = await loadImage(LOGO_URL);
        const logoH = 22;
        const logoW = (img.naturalWidth / img.naturalHeight) * logoH;
        doc.addImage(img, 'PNG', 14, 5, logoW, logoH);
    } catch {
        // Fallback to text if logo fails to load
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(17);
        doc.setFont('helvetica', 'bold');
        doc.text('GUZMAN CAREER SERVICES', 14, 16);
    }

    // Tagline
    doc.setTextColor(191, 219, 254);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Professional Career Coaching & Talent Placement', 14, 31);

    // Invoice label top-right
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 196, 15, { align: 'right' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`#${invoice.invoice_number}`, 196, 27, { align: 'right' });

    // ── Bill To ──────────────────────────────────────────────────────────────
    doc.setTextColor(...gray);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO', 14, 52);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...dark);
    doc.setFontSize(11);
    doc.text(client?.full_name || 'Client', 14, 60);
    doc.setFontSize(9);
    doc.setTextColor(...gray);
    if (client?.email) doc.text(client.email, 14, 67);
    if (client?.phone) doc.text(client.phone, 14, 73);

    // ── Invoice Meta (right column) ──────────────────────────────────────────
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...gray);
    doc.text('DATE ISSUED', 130, 52);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...dark);
    doc.setFontSize(9);
    const issuedDate = invoice.created_at
        ? new Date(invoice.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : '—';
    doc.text(issuedDate, 130, 60);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...gray);
    doc.text('STATUS', 130, 70);
    const isPaid = invoice.status === 'Paid';
    doc.setTextColor(isPaid ? 5 : 217, isPaid ? 150 : 119, isPaid ? 105 : 6);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.status?.toUpperCase() || 'PENDING', 130, 78);

    // ── Divider ──────────────────────────────────────────────────────────────
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(14, 86, 196, 86);

    // ── Table header ─────────────────────────────────────────────────────────
    doc.setFillColor(...light);
    doc.rect(14, 90, 182, 10, 'F');
    doc.setTextColor(...gray);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('DESCRIPTION', 18, 97);
    doc.text('AMOUNT', 188, 97, { align: 'right' });

    // ── Line item ─────────────────────────────────────────────────────────────
    doc.setTextColor(...dark);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.description || 'Service', 18, 111);

    if (invoice.subtitle) {
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...gray);
        doc.text(invoice.subtitle, 18, 119);
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...dark);
    doc.text(`$${parseFloat(invoice.amount || 0).toFixed(2)}`, 188, 111, { align: 'right' });

    // ── Total ────────────────────────────────────────────────────────────────
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 126, 196, 126);

    doc.setFillColor(...blue);
    doc.rect(130, 129, 66, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL DUE', 135, 139);
    doc.text(`$${parseFloat(invoice.amount || 0).toFixed(2)}`, 192, 139, { align: 'right' });

    // Payment note
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    if (isPaid) {
        doc.setTextColor(5, 150, 105);
        doc.text('Payment received — Thank you!', 14, 139);
        if (invoice.paid_at) {
            doc.setTextColor(...gray);
            doc.text(`Paid on ${new Date(invoice.paid_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, 14, 147);
        }
    } else {
        doc.setTextColor(...gray);
        doc.text('Payment is due upon receipt.', 14, 139);
    }

    // ── Footer ───────────────────────────────────────────────────────────────
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 270, 196, 270);
    doc.setTextColor(...gray);
    doc.setFontSize(8);
    doc.text('Guzman Career Services  |  support@guzmancareerservices.com', 105, 277, { align: 'center' });
    doc.text('Thank you for choosing Guzman Career Services!', 105, 283, { align: 'center' });

    doc.save(`${invoice.invoice_number}.pdf`);
}
