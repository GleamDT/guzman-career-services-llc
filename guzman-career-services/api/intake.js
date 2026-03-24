const { supabaseAdmin } = require('./_supabase');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const {
        fullName,
        email,
        referredBy,
        phone,
        fullAddress,
        sex,
        veteranStatus,
        disabilityStatus,
        raceIdentity,
        workAuthorization,
        jobTitles,
        sharedEmail,
        sharedPassword,
        legalName,
        signatureDate,
        tcAgreed,
    } = req.body;

    if (!fullName || !email || !legalName || !tcAgreed) {
        return res.status(400).json({ error: 'Please fill in all required fields.' });
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('intake_submissions')
            .insert([{
                full_name: fullName,
                email,
                referred_by: referredBy || '',
                phone: phone || '',
                full_address: fullAddress || '',
                sex: sex || '',
                veteran_status: veteranStatus || '',
                disability_status: disabilityStatus || '',
                race_identity: raceIdentity || '',
                work_authorization: workAuthorization || '',
                job_titles: jobTitles || '',
                shared_email: sharedEmail || '',
                shared_password: sharedPassword || '',
                legal_name: legalName,
                signature_date: signatureDate || new Date().toISOString().split('T')[0],
                tc_agreed: true,
                status: 'pending',
            }])
            .select()
            .single();

        if (error) throw error;

        return res.json({ success: true, submissionId: data.id });
    } catch (error) {
        console.error('[POST /api/intake]', error.message);
        return res.status(400).json({ error: error.message });
    }
};
