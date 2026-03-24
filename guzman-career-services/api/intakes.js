const { supabaseAdmin } = require('./_supabase');

module.exports = async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { data, error } = await supabaseAdmin
            .from('intake_submissions')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return res.json({ submissions: data || [] });
    } catch (error) {
        console.error('[GET /api/intakes]', error.message);
        return res.status(500).json({ error: error.message });
    }
};
