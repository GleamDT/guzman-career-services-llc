const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { supabaseAdmin } = require('../../_supabase');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { id } = req.query;

    try {
        const { data: invoice, error } = await supabaseAdmin
            .from('invoices')
            .select('*, clients(id, full_name, email)')
            .eq('id', id)
            .single();

        if (error || !invoice) return res.status(404).json({ error: 'Invoice not found' });
        if (invoice.status === 'Paid') return res.status(400).json({ error: 'Invoice is already paid.' });

        const proto = req.headers['x-forwarded-proto'] || 'https';
        const host = req.headers['host'];
        const baseUrl = `${proto}://${host}`;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            customer_email: invoice.clients.email,
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: invoice.description,
                        ...(invoice.subtitle && { description: invoice.subtitle }),
                    },
                    unit_amount: Math.round(parseFloat(invoice.amount) * 100),
                },
                quantity: 1,
            }],
            metadata: {
                invoice_id: invoice.id,
                invoice_number: invoice.invoice_number,
            },
            success_url: `${baseUrl}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/dashboard?payment=cancelled`,
        });

        return res.json({ url: session.url });
    } catch (err) {
        console.error('[POST /api/invoices/:id/checkout]', err.message);
        return res.status(500).json({ error: err.message });
    }
};
