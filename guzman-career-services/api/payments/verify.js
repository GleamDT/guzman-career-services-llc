const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { supabaseAdmin } = require('../_supabase');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status !== 'paid') {
            return res.status(400).json({ error: 'Payment not completed.' });
        }

        const invoiceId = session.metadata?.invoice_id;
        if (!invoiceId) return res.status(400).json({ error: 'Invoice reference missing from session.' });

        await supabaseAdmin
            .from('invoices')
            .update({ status: 'Paid', paid_at: new Date().toISOString() })
            .eq('id', invoiceId)
            .eq('status', 'Pending');

        return res.json({ success: true });
    } catch (err) {
        console.error('[POST /api/payments/verify]', err.message);
        return res.status(500).json({ error: err.message });
    }
};
