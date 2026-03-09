const { supabaseAdmin } = require('./_supabase');

module.exports = async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const [totalRes, pendingClientsRes, activeClientsRes, invoicesRes] = await Promise.all([
            supabaseAdmin.from('clients').select('*', { count: 'exact', head: true }),
            supabaseAdmin.from('clients').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
            supabaseAdmin.from('clients').select('*', { count: 'exact', head: true }).eq('status', 'Active'),
            supabaseAdmin.from('invoices').select('amount, status'),
        ]);

        const invoices       = invoicesRes.data || [];
        const totalRevenue   = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + parseFloat(i.amount || 0), 0);
        const pendingRevenue = invoices.filter(i => i.status === 'Pending').reduce((s, i) => s + parseFloat(i.amount || 0), 0);

        return res.json({
            totalClients:   totalRes.count         || 0,
            pendingClients: pendingClientsRes.count || 0,
            activeClients:  activeClientsRes.count  || 0,
            totalRevenue:   totalRevenue.toFixed(2),
            pendingRevenue: pendingRevenue.toFixed(2),
        });
    } catch (error) {
        console.error('[GET /api/stats]', error.message);
        return res.status(500).json({ error: error.message });
    }
};
