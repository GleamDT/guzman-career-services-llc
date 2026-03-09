const { supabaseAdmin } = require('./_supabase');

module.exports = async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const [clientsRes, invoicesRes] = await Promise.all([
            supabaseAdmin
                .from('clients')
                .select('id, full_name, email, status, created_at')
                .order('created_at', { ascending: false })
                .limit(5),
            supabaseAdmin
                .from('invoices')
                .select('id, invoice_number, description, amount, status, created_at, clients(full_name)')
                .order('created_at', { ascending: false })
                .limit(5),
        ]);

        return res.json({
            recentClients:  clientsRes.data  || [],
            recentInvoices: invoicesRes.data || [],
        });
    } catch (error) {
        console.error('[GET /api/activity]', error.message);
        return res.status(500).json({ error: error.message });
    }
};
