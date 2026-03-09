const { supabaseAdmin } = require('../../../_supabase');

module.exports = async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const { clientId } = req.query;

    try {
        const storagePath = `${clientId}/resume.pdf`;
        const { data, error } = await supabaseAdmin.storage
            .from('resumes')
            .createSignedUrl(storagePath, 300);
        if (error) throw error;
        return res.json({ url: data.signedUrl });
    } catch (error) {
        console.error('[GET /api/clients/:clientId/resume/download]', error.message);
        return res.status(404).json({ error: 'Resume not found.' });
    }
};
