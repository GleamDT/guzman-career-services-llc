const { supabaseAdmin } = require('../../_supabase');

module.exports = async function handler(req, res) {
    if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

    const { clientId } = req.query;
    const { status } = req.body;

    try {
        const { data, error } = await supabaseAdmin
            .from('clients')
            .update({ status })
            .eq('id', clientId)
            .select()
            .single();
        if (error) throw error;
        return res.json({ success: true, client: data });
    } catch (error) {
        console.error('[PATCH /api/clients/:id/status]', error.message);
        return res.status(500).json({ error: error.message });
    }
};
