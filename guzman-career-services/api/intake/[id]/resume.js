const multer = require('multer');
const { supabaseAdmin } = require('../../_supabase');

module.exports.config = {
    api: { bodyParser: false },
};

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        file.mimetype === 'application/pdf'
            ? cb(null, true)
            : cb(new Error('Only PDF files are allowed.'));
    },
});

function runMiddleware(req, res, fn) {
    return new Promise((resolve, reject) => {
        fn(req, res, result => (result instanceof Error ? reject(result) : resolve(result)));
    });
}

module.exports = async function handler(req, res) {
    const { id } = req.query;

    // GET — return signed URL for resume download/preview
    if (req.method === 'GET') {
        try {
            const { data: sub, error: fetchErr } = await supabaseAdmin
                .from('intake_submissions')
                .select('resume_path')
                .eq('id', id)
                .single();
            if (fetchErr) throw fetchErr;
            if (!sub?.resume_path) return res.status(404).json({ error: 'No resume on file.' });

            const { data, error } = await supabaseAdmin.storage
                .from('resumes')
                .createSignedUrl(sub.resume_path, 300);
            if (error) throw error;
            return res.json({ url: data.signedUrl });
        } catch (err) {
            console.error('[GET /api/intake/:id/resume]', err.message);
            return res.status(500).json({ error: err.message });
        }
    }

    // POST — upload resume PDF
    if (req.method === 'POST') {
        try {
            await runMiddleware(req, res, upload.single('resume'));
            const file = req.file;
            if (!file) return res.status(400).json({ error: 'No PDF file received.' });

            const storagePath = `intakes/${id}/resume.pdf`;
            const { error: uploadError } = await supabaseAdmin.storage
                .from('resumes')
                .upload(storagePath, file.buffer, { contentType: 'application/pdf', upsert: true });
            if (uploadError) throw uploadError;

            const { error } = await supabaseAdmin
                .from('intake_submissions')
                .update({
                    resume_path: storagePath,
                    resume_filename: file.originalname,
                    resume_uploaded_at: new Date().toISOString(),
                })
                .eq('id', id);
            if (error) throw error;

            return res.json({ success: true });
        } catch (err) {
            console.error('[POST /api/intake/:id/resume]', err.message);
            return res.status(500).json({ error: err.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};
