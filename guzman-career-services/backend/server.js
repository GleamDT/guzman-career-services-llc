require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors    = require('cors');
const multer  = require('multer');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const allowedOrigins = ['http://localhost:3000', process.env.SITE_URL].filter(Boolean);
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        file.mimetype === 'application/pdf'
            ? cb(null, true)
            : cb(new Error('Only PDF files are allowed.'));
    },
});

const supabaseAdmin = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

// ─── CLIENTS ──────────────────────────────────────────────────────────────────

// POST /api/clients — create client + send invite email
app.post('/api/clients', async (req, res) => {
    const { fullName, email, phone, intakeFormType, initialService } = req.body;
    if (!fullName || !email) return res.status(400).json({ error: 'Full name and email are required.' });

    try {
        const siteUrl = process.env.SITE_URL || 'http://localhost:3000';
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

        res.json({ success: true, client: clientData });
    } catch (error) {
        console.error('[POST /api/clients]', error.message);
        res.status(400).json({ error: error.message });
    }
});

// GET /api/clients — list all clients
app.get('/api/clients', async (_req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('clients')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json({ clients: data || [] });
    } catch (error) {
        console.error('[GET /api/clients]', error.message);
        res.status(500).json({ error: error.message });
    }
});

// PATCH /api/clients/:id/status — update client status (Pending → Active)
app.patch('/api/clients/:id/status', async (req, res) => {
    const { status } = req.body;
    try {
        const { data, error } = await supabaseAdmin
            .from('clients')
            .update({ status })
            .eq('id', req.params.id)
            .select()
            .single();
        if (error) throw error;
        res.json({ success: true, client: data });
    } catch (error) {
        console.error('[PATCH /api/clients/:id/status]', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ─── INVOICES ────────────────────────────────────────────────────────────────

// POST /api/invoices — create invoice for a client
app.post('/api/invoices', async (req, res) => {
    const { clientId, description, subtitle, amount } = req.body;
    if (!clientId || !description || !amount) return res.status(400).json({ error: 'Client, description, and amount are required.' });

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

        res.json({ success: true, invoice: data });
    } catch (error) {
        console.error('[POST /api/invoices]', error.message);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/invoices — all invoices with client info (admin view)
app.get('/api/invoices', async (_req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('invoices')
            .select('*, clients(id, full_name, email, phone)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json({ invoices: data || [] });
    } catch (error) {
        console.error('[GET /api/invoices]', error.message);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/clients/:clientId/invoices — invoices for one client (admin view)
app.get('/api/clients/:clientId/invoices', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('invoices')
            .select('*')
            .eq('client_id', req.params.clientId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json({ invoices: data || [] });
    } catch (error) {
        console.error('[GET /api/clients/:clientId/invoices]', error.message);
        res.status(500).json({ error: error.message });
    }
});

// PATCH /api/invoices/:id/mark-paid — mark invoice as paid
app.patch('/api/invoices/:id/mark-paid', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('invoices')
            .update({ status: 'Paid', paid_at: new Date().toISOString() })
            .eq('id', req.params.id)
            .select()
            .single();
        if (error) throw error;
        res.json({ success: true, invoice: data });
    } catch (error) {
        console.error('[PATCH /api/invoices/:id/mark-paid]', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

// GET /api/stats — summary numbers for the dashboard
app.get('/api/stats', async (_req, res) => {
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

        res.json({
            totalClients:   totalRes.count        || 0,
            pendingClients: pendingClientsRes.count || 0,
            activeClients:  activeClientsRes.count  || 0,
            totalRevenue:   totalRevenue.toFixed(2),
            pendingRevenue: pendingRevenue.toFixed(2),
        });
    } catch (error) {
        console.error('[GET /api/stats]', error.message);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/activity — recent clients + invoices for the dashboard feed
app.get('/api/activity', async (_req, res) => {
    try {
        const [clientsRes, invoicesRes] = await Promise.all([
            supabaseAdmin.from('clients')
                .select('id, full_name, email, status, created_at')
                .order('created_at', { ascending: false })
                .limit(5),
            supabaseAdmin.from('invoices')
                .select('id, invoice_number, description, amount, status, created_at, clients(full_name)')
                .order('created_at', { ascending: false })
                .limit(5),
        ]);

        res.json({
            recentClients:  clientsRes.data  || [],
            recentInvoices: invoicesRes.data || [],
        });
    } catch (error) {
        console.error('[GET /api/activity]', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ─── RESUMES ─────────────────────────────────────────────────────────────────

// POST /api/clients/:clientId/resume — upload a PDF resume
app.post('/api/clients/:clientId/resume', upload.single('resume'), async (req, res) => {
    const { clientId } = req.params;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No PDF file received.' });

    try {
        const storagePath = `${clientId}/resume.pdf`;

        const { error: uploadError } = await supabaseAdmin.storage
            .from('resumes')
            .upload(storagePath, file.buffer, { contentType: 'application/pdf', upsert: true });
        if (uploadError) throw uploadError;

        const { data, error } = await supabaseAdmin
            .from('clients')
            .update({
                resume_path:        storagePath,
                resume_filename:    file.originalname,
                resume_uploaded_at: new Date().toISOString(),
            })
            .eq('id', clientId)
            .select()
            .single();
        if (error) throw error;

        res.json({ success: true, client: data });
    } catch (error) {
        console.error('[POST /api/clients/:clientId/resume]', error.message);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/clients/:clientId/resume/download — get a short-lived signed URL
app.get('/api/clients/:clientId/resume/download', async (req, res) => {
    try {
        const storagePath = `${req.params.clientId}/resume.pdf`;
        const { data, error } = await supabaseAdmin.storage
            .from('resumes')
            .createSignedUrl(storagePath, 300); // 5-minute URL
        if (error) throw error;
        res.json({ url: data.signedUrl });
    } catch (error) {
        console.error('[GET /api/clients/:clientId/resume/download]', error.message);
        res.status(404).json({ error: 'Resume not found.' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✓ Guzman Career Services API running on http://localhost:${PORT}`);
});
