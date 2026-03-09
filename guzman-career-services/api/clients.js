const { supabaseAdmin } = require('./_supabase');

module.exports = async function handler(req, res) {
    if (req.method === 'POST') {
        const { fullName, email, phone, intakeFormType, initialService } = req.body;
        if (!fullName || !email) return res.status(400).json({ error: 'Full name and email are required.' });

        try {
            const siteUrl = process.env.SITE_URL || `https://${req.headers.host}`;
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
                data: { role: 'client', full_name: fullName, phone: phone || '', password_set: false },
                redirectTo: `${siteUrl}/auth/callback`,
            });
            if (authError) throw authError;

            const { data: clientData, error: clientError } = await supabaseAdmin
                .from('clients')
                .insert([{
                    id: authData.user.id,
                    full_name: fullName,
                    email,
                    phone: phone || '',
                    intake_form_type: intakeFormType || 'general',
                    initial_service: initialService || '',
                    status: 'Pending',
                }])
                .select()
                .single();
            if (clientError) throw clientError;

            return res.json({ success: true, client: clientData });
        } catch (error) {
            console.error('[POST /api/clients]', error.message);
            return res.status(400).json({ error: error.message });
        }
    }

    if (req.method === 'GET') {
        try {
            const { data, error } = await supabaseAdmin
                .from('clients')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return res.json({ clients: data || [] });
        } catch (error) {
            console.error('[GET /api/clients]', error.message);
            return res.status(500).json({ error: error.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};
