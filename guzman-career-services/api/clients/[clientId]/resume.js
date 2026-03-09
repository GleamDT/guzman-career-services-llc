const multer = require('multer');
const { supabaseAdmin } = require('../../_supabase');

// Must disable Vercel's default body parser for file uploads
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
        fn(req, res, (result) => {
            if (result instanceof Error) return reject(result);
            return resolve(result);
        });
    });
}

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { clientId } = req.query;

    try {
        await runMiddleware(req, res, upload.single('resume'));

        const file = req.file;
        if (!file) return res.status(400).json({ error: 'No PDF file received.' });

        const storagePath = `${clientId}/resume.pdf`;
        const { error: uploadError } = await supabaseAdmin.storage
            .from('resumes')
            .upload(storagePath, file.buffer, { contentType: 'application/pdf', upsert: true });
        if (uploadError) throw uploadError;

        const { data, error } = await supabaseAdmin
            .from('clients')
            .update({
                resume_path: storagePath,
                resume_filename: file.originalname,
                resume_uploaded_at: new Date().toISOString(),
            })
            .eq('id', clientId)
            .select()
            .single();
        if (error) throw error;

        return res.json({ success: true, client: data });
    } catch (error) {
        console.error('[POST /api/clients/:clientId/resume]', error.message);
        return res.status(500).json({ error: error.message });
    }
};
