const { supabaseAdmin } = require('../../_supabase');

module.exports = async function handler(req, res) {
    if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

    const { id } = req.query;

    try {
        const { data, error } = await supabaseAdmin
            .from('invoices')
            .update({ status: 'Paid', paid_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return res.json({ success: true, invoice: data });
    } catch (error) {
        console.error('[PATCH /api/invoices/:id/mark-paid]', error.message);
        return res.status(500).json({ error: error.message });
    }
};
