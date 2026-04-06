require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors    = require('cors');
const multer  = require('multer');
const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const app = express();
const allowedOrigins = ['http://localhost:3000', process.env.SITE_URL].filter(Boolean);
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        ALLOWED_MIME_TYPES.includes(file.mimetype)
            ? cb(null, true)
            : cb(new Error('Only PDF or Word documents are allowed.'));
    },
});

function getFileExt(mimetype) {
    if (mimetype === 'application/msword') return '.doc';
    if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return '.docx';
    return '.pdf';
}

const supabaseAdmin = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────

async function requireAdmin(req, res, next) {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user || user.user_metadata?.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    req.user = user;
    next();
}

async function requireAdminOrStaff(req, res, next) {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Unauthorized' });
    const role = user.user_metadata?.role;
    if (role !== 'admin' && role !== 'staff') return res.status(403).json({ error: 'Forbidden' });
    req.user = user;
    next();
}

async function requireAuth(req, res, next) {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Unauthorized' });
    req.user = user;
    next();
}

// ─── CLIENTS ──────────────────────────────────────────────────────────────────

// POST /api/clients — create client + send invite email
app.post('/api/clients', requireAdmin, async (req, res) => {
    const { fullName, email, phone, intakeFormType, initialService, intakeId } = req.body;
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

        if (intakeId) {
            await supabaseAdmin
                .from('intake_submissions')
                .update({ status: 'converted', converted_client_id: clientData.id })
                .eq('id', intakeId);
        }

        res.json({ success: true, client: clientData });
    } catch (error) {
        console.error('[POST /api/clients]', error.message);
        res.status(400).json({ error: error.message });
    }
});

// GET /api/clients — list all clients
app.get('/api/clients', requireAdminOrStaff, async (_req, res) => {
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

// PATCH /api/clients/:id/mark-logged-in — called when client first accesses their dashboard
app.patch('/api/clients/:id/mark-logged-in', requireAuth, async (req, res) => {
    try {
        await supabaseAdmin
            .from('clients')
            .update({ has_logged_in: true })
            .eq('id', req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('[PATCH /api/clients/:id/mark-logged-in]', error.message);
        res.status(500).json({ error: error.message });
    }
});

// PATCH /api/clients/:id/status — update client status (Pending → Active)
app.patch('/api/clients/:id/status', requireAdmin, async (req, res) => {
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
app.post('/api/invoices', requireAdmin, async (req, res) => {
    const { clientId, description, subtitle, amount, due_date } = req.body;
    if (!clientId || !description || !amount) return res.status(400).json({ error: 'Client, description, and amount are required.' });

    try {
        const { count } = await supabaseAdmin
            .from('invoices')
            .select('*', { count: 'exact', head: true });

        const invoiceNumber = `INV-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(3, '0')}`;

        const insertPayload = {
            client_id: clientId,
            invoice_number: invoiceNumber,
            description,
            subtitle: subtitle || '',
            amount: parseFloat(amount),
            status: 'Pending',
        };
        if (due_date) insertPayload.due_date = due_date;

        const { data, error } = await supabaseAdmin
            .from('invoices')
            .insert([insertPayload])
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
app.get('/api/invoices', requireAdmin, async (_req, res) => {
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
app.get('/api/clients/:clientId/invoices', requireAdmin, async (req, res) => {
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
app.patch('/api/invoices/:id/mark-paid', requireAdmin, async (req, res) => {
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

// POST /api/invoices/:id/checkout — create Stripe Checkout session
app.post('/api/invoices/:id/checkout', requireAuth, async (req, res) => {
    const { id } = req.params;

    try {
        const { data: invoice, error } = await supabaseAdmin
            .from('invoices')
            .select('*, clients(id, full_name, email)')
            .eq('id', id)
            .single();

        if (error || !invoice) return res.status(404).json({ error: 'Invoice not found' });
        if (invoice.status === 'Paid') return res.status(400).json({ error: 'Invoice is already paid.' });

        const baseUrl = process.env.SITE_URL || 'http://localhost:3000';

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'cashapp', 'amazon_pay', 'klarna'],
            mode: 'payment',
            customer_email: invoice.clients.email,
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: invoice.description,
                        ...(invoice.subtitle && { description: invoice.subtitle }),
                    },
                    unit_amount: Math.round(parseFloat(invoice.amount) * 100),
                },
                quantity: 1,
            }],
            metadata: {
                invoice_id: invoice.id,
                invoice_number: invoice.invoice_number,
            },
            success_url: `${baseUrl}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/dashboard?payment=cancelled`,
        });

        res.json({ url: session.url });
    } catch (err) {
        console.error('[POST /api/invoices/:id/checkout]', err.message);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/payments/verify — verify Stripe payment and mark invoice paid
app.post('/api/payments/verify', requireAuth, async (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status !== 'paid') {
            return res.status(400).json({ error: 'Payment not completed.' });
        }

        const invoiceId = session.metadata?.invoice_id;
        if (!invoiceId) return res.status(400).json({ error: 'Invoice reference missing from session.' });

        await supabaseAdmin
            .from('invoices')
            .update({ status: 'Paid', paid_at: new Date().toISOString() })
            .eq('id', invoiceId)
            .eq('status', 'Pending');

        res.json({ success: true });
    } catch (err) {
        console.error('[POST /api/payments/verify]', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

// GET /api/stats — summary numbers for the dashboard
app.get('/api/stats', requireAdmin, async (_req, res) => {
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
app.get('/api/activity', requireAdmin, async (_req, res) => {
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

// ─── INTAKE FORMS ────────────────────────────────────────────────────────────

// POST /api/intake — store intake submission (no auth creation)
app.post('/api/intake', async (req, res) => {
    const { fullName, email, referredBy, phone, fullAddress, sex, veteranStatus, disabilityStatus,
        raceIdentity, workAuthorization, jobTitles, sharedEmail, sharedPassword,
        legalName, signatureDate, tcAgreed,
        linkedinProfile, additionalNotes, intakeFormType } = req.body;
    if (!fullName || !email || !legalName || !tcAgreed) {
        return res.status(400).json({ error: 'Please fill in all required fields.' });
    }
    try {
        const { data, error } = await supabaseAdmin
            .from('intake_submissions')
            .insert([{
                full_name: fullName, email,
                referred_by: referredBy || '', phone: phone || '',
                full_address: fullAddress || '', sex: sex || '',
                veteran_status: veteranStatus || '', disability_status: disabilityStatus || '',
                race_identity: raceIdentity || '', work_authorization: workAuthorization || '',
                job_titles: jobTitles || '', shared_email: sharedEmail || '',
                shared_password: sharedPassword || '', legal_name: legalName,
                signature_date: signatureDate || new Date().toISOString().split('T')[0],
                tc_agreed: true, status: 'pending',
                linkedin_profile: linkedinProfile || '',
                additional_notes: additionalNotes || '',
                intake_form_type: intakeFormType || 'general',
            }])
            .select().single();
        if (error) throw error;
        res.json({ success: true, submissionId: data.id });
    } catch (error) {
        console.error('[POST /api/intake]', error.message);
        res.status(400).json({ error: error.message });
    }
});

// POST /api/intake/:id/resume — upload intake resume
app.post('/api/intake/:id/resume', upload.single('resume'), async (req, res) => {
    const { id } = req.params;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file received.' });
    try {
        const ext = getFileExt(file.mimetype);
        const storagePath = `intakes/${id}/resume${ext}`;
        const { error: uploadError } = await supabaseAdmin.storage
            .from('resumes')
            .upload(storagePath, file.buffer, { contentType: file.mimetype, upsert: true });
        if (uploadError) throw uploadError;
        await supabaseAdmin.from('intake_submissions').update({
            resume_path: storagePath,
            resume_filename: file.originalname,
            resume_uploaded_at: new Date().toISOString(),
        }).eq('id', id);
        res.json({ success: true });
    } catch (error) {
        console.error('[POST /api/intake/:id/resume]', error.message);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/intake/:id/resume — get signed URL for intake resume
app.get('/api/intake/:id/resume', requireAdmin, async (req, res) => {
    try {
        const { data: sub } = await supabaseAdmin
            .from('intake_submissions').select('resume_path').eq('id', req.params.id).single();
        if (!sub?.resume_path) return res.status(404).json({ error: 'No resume on file.' });
        const { data, error } = await supabaseAdmin.storage
            .from('resumes').createSignedUrl(sub.resume_path, 300);
        if (error) throw error;
        res.json({ url: data.signedUrl });
    } catch (error) {
        console.error('[GET /api/intake/:id/resume]', error.message);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/intakes — list all intake submissions
app.get('/api/intakes', requireAdmin, async (_req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('intake_submissions').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        res.json({ submissions: data || [] });
    } catch (error) {
        console.error('[GET /api/intakes]', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ─── RESUMES ─────────────────────────────────────────────────────────────────

// POST /api/clients/:clientId/resume — upload a PDF resume (supports multiple + JD link)
app.post('/api/clients/:clientId/resume', requireAdminOrStaff, upload.single('resume'), async (req, res) => {
    const { clientId } = req.params;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file received.' });

    const jdLink = req.body.jd_link || null;
    const timestamp = Date.now();
    const ext = getFileExt(file.mimetype);
    const storagePath = `${clientId}/${timestamp}_resume${ext}`;

    try {
        const { error: uploadError } = await supabaseAdmin.storage
            .from('resumes')
            .upload(storagePath, file.buffer, { contentType: file.mimetype, upsert: false });
        if (uploadError) throw uploadError;

        // Insert into client_resumes for full history
        const { error: insertError } = await supabaseAdmin
            .from('client_resumes')
            .insert({
                client_id:       clientId,
                resume_path:     storagePath,
                resume_filename: file.originalname,
                jd_link:         jdLink,
            });
        if (insertError) throw insertError;

        // Keep clients table updated with latest resume (backward compat)
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

// GET /api/clients/:clientId/resumes — list all uploaded resumes for a client
app.get('/api/clients/:clientId/resumes', requireAuth, async (req, res) => {
    const isAdmin = req.user.user_metadata?.role === 'admin';
    const isOwner = req.user.id === req.params.clientId;
    if (!isAdmin && !isOwner) return res.status(403).json({ error: 'Forbidden' });
    try {
        const { data, error } = await supabaseAdmin
            .from('client_resumes')
            .select('id, resume_filename, jd_link, uploaded_at')
            .eq('client_id', req.params.clientId)
            .order('uploaded_at', { ascending: false });
        if (error) throw error;
        res.json({ resumes: data || [] });
    } catch (error) {
        console.error('[GET /api/clients/:clientId/resumes]', error.message);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/clients/:clientId/resume/download — get a short-lived signed URL
// Optional query param: ?resumeId=uuid (for a specific resume from client_resumes)
app.get('/api/clients/:clientId/resume/download', requireAuth, async (req, res) => {
    const isAdmin = req.user.user_metadata?.role === 'admin';
    const isOwner = req.user.id === req.params.clientId;
    if (!isAdmin && !isOwner) return res.status(403).json({ error: 'Forbidden' });
    try {
        let storagePath;
        if (req.query.resumeId) {
            const { data: row, error: rowErr } = await supabaseAdmin
                .from('client_resumes')
                .select('resume_path')
                .eq('id', req.query.resumeId)
                .eq('client_id', req.params.clientId)
                .single();
            if (rowErr || !row) return res.status(404).json({ error: 'Resume not found.' });
            storagePath = row.resume_path;
        } else {
            storagePath = `${req.params.clientId}/resume.pdf`;
        }
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

// ─── SERVE REACT BUILD ────────────────────────────────────────────────────────
const path = require('path');
const buildPath = path.join(__dirname, '../build');
app.use(express.static(buildPath));
app.get('*', (_req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✓ Guzman Career Services API running on http://localhost:${PORT}`);
});
