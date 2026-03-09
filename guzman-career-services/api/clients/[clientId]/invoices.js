const { supabaseAdmin } = require('../../_supabase');

module.exports = async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const { clientId } = req.query;

    try {
        const { data, error } = await supabaseAdmin
            .from('invoices')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return res.json({ invoices: data || [] });
    } catch (error) {
        console.error('[GET /api/clients/:clientId/invoices]', error.message);
        return res.status(500).json({ error: error.message });
    }
};
