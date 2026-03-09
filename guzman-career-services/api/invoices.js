const { supabaseAdmin } = require('./_supabase');

module.exports = async function handler(req, res) {
    if (req.method === 'POST') {
        const { clientId, description, subtitle, amount } = req.body;
        if (!clientId || !description || !amount) {
            return res.status(400).json({ error: 'Client, description, and amount are required.' });
        }

        try {
            const { count } = await supabaseAdmin
                .from('invoices')
                .select('*', { count: 'exact', head: true });

            const invoiceNumber = `INV-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(3, '0')}`;

            const { data, error } = await supabaseAdmin
                .from('invoices')
                .insert([{
                    client_id: clientId,
                    invoice_number: invoiceNumber,
                    description,
                    subtitle: subtitle || '',
                    amount: parseFloat(amount),
                    status: 'Pending',
                }])
                .select()
                .single();
            if (error) throw error;

            return res.json({ success: true, invoice: data });
        } catch (error) {
            console.error('[POST /api/invoices]', error.message);
            return res.status(400).json({ error: error.message });
        }
    }

    if (req.method === 'GET') {
        try {
            const { data, error } = await supabaseAdmin
                .from('invoices')
                .select('*, clients(id, full_name, email, phone)')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return res.json({ invoices: data || [] });
        } catch (error) {
            console.error('[GET /api/invoices]', error.message);
            return res.status(500).json({ error: error.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};
