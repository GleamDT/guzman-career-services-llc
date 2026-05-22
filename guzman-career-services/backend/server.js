require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express    = require('express');
const cors       = require('cors');
const multer     = require('multer');
const https      = require('https');
const { Resend } = require('resend');
const stripe     = require('stripe')(process.env.STRIPE_SECRET_KEY);
const jwt        = require('jsonwebtoken');
const bcrypt     = require('bcryptjs');
const crypto     = require('crypto');
const { pool }   = require('./db');
const { uploadFile, getSignedDownloadUrl, deleteFile } = require('./r2');

// Reliable HTTPS buffer fetch — avoids Node built-in fetch reliability issues with Cloudinary CDN
function httpsGetBuffer(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return httpsGetBuffer(res.headers.location).then(resolve).catch(reject);
            }
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, buffer: Buffer.concat(chunks) }));
            res.on('error', reject);
        }).on('error', reject);
    });
}

const app = express();
const allowedOrigins = ['http://localhost:3000', process.env.SITE_URL].filter(Boolean);
app.use(cors({ origin: allowedOrigins }));

// Stripe webhook must be registered before express.json() — requires raw body
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
        console.warn('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not set — skipping verification');
        return res.sendStatus(200);
    }
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error('[Stripe Webhook] Signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    try {
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            if (session.payment_status === 'paid') {
                const invoiceId = session.metadata?.invoice_id;
                if (invoiceId) {
                    await pool.query(
                        `UPDATE invoices SET status = 'Paid', paid_at = NOW() WHERE id = $1 AND status = 'Pending'`,
                        [invoiceId]
                    );
                    console.log(`[Stripe Webhook] Invoice ${invoiceId} marked as paid`);
                }
            }
        }
        res.sendStatus(200);
    } catch (err) {
        console.error('[Stripe Webhook] Handler error:', err.message);
        res.sendStatus(500);
    }
});

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

const siteUrl = () => process.env.SITE_URL || 'http://localhost:3000';

// ─── EMAIL ────────────────────────────────────────────────────────────────────

const resend = new Resend(process.env.RESEND_API_KEY);
const emailFrom = () => process.env.EMAIL_FROM || 'noreply@guzmancareerservices.com';

async function sendPortalNotification(toEmail, toName) {
    if (!process.env.RESEND_API_KEY) return;
    try {
        await resend.emails.send({
            from: `Guzman Career Services <${emailFrom()}>`,
            to: toEmail,
            subject: 'You have a new message on your portal',
            html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

          <!-- Header -->
          <tr>
            <td style="background:#1d4ed8;padding:30px 40px 26px;">
              <img src="${siteUrl()}/logo.png" alt="Guzman Career Services" width="160" style="display:block;height:auto;border:0;" />
              <p style="margin:10px 0 0;font-size:13px;color:#bfdbfe;letter-spacing:0.3px;">
                Professional Career Coaching &amp; Talent Placement
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 28px;">
              <h1 style="margin:0 0 10px;font-size:24px;color:#0f172a;font-weight:700;">You have a new message 💬</h1>
              <p style="margin:0 0 18px;font-size:15px;color:#475569;line-height:1.7;">
                Hello <strong>${toName}</strong>,
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.7;">
                Your career coach at <strong>Guzman Career Services</strong> has sent you a message.
                Log in to your portal to read it and stay on track with your career journey.
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td style="background:#1d4ed8;border-radius:8px;">
                    <a href="${siteUrl()}"
                       style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
                      View My Portal →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#94a3b8;">
                Log in anytime at <a href="${siteUrl()}" style="color:#2563eb;text-decoration:none;">${siteUrl()}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;">support@guzmancareerservices.com</p>
              <p style="margin:12px 0 0;font-size:11px;color:#cbd5e1;line-height:1.6;">
                You received this because you have an active account with Guzman Career Services.<br />
                If this was unexpected, please contact us at the email above.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
        });
    } catch (err) {
        console.error('[sendPortalNotification] Email failed:', err.message);
    }
}

async function sendStaffWelcomeEmail(toEmail, toName, password) {
    if (!process.env.RESEND_API_KEY) return;
    try {
        await resend.emails.send({
            from: `Guzman Career Services <${emailFrom()}>`,
            to: toEmail,
            subject: 'Your Staff Account Has Been Created',
            html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
          <tr>
            <td style="background:#1d4ed8;padding:30px 40px 26px;">
              <img src="${siteUrl()}/logo.png" alt="Guzman Career Services" width="160" style="display:block;height:auto;border:0;" />
              <p style="margin:10px 0 0;font-size:13px;color:#bfdbfe;letter-spacing:0.3px;">
                Professional Career Coaching &amp; Talent Placement
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 28px;">
              <h1 style="margin:0 0 10px;font-size:24px;color:#0f172a;font-weight:700;">Welcome to the Team! 🎉</h1>
              <p style="margin:0 0 18px;font-size:15px;color:#475569;line-height:1.7;">
                Hello <strong>${toName}</strong>,
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.7;">
                Your staff account at <strong>Guzman Career Services</strong> has been created.
                Here are your login credentials:
              </p>
              <table cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin:0 0 28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 10px;font-size:14px;color:#64748b;">
                      <strong style="color:#0f172a;">Email:</strong>&nbsp;&nbsp;${toEmail}
                    </p>
                    <p style="margin:0;font-size:14px;color:#64748b;">
                      <strong style="color:#0f172a;">Password:</strong>&nbsp;&nbsp;${password}
                    </p>
                  </td>
                </tr>
              </table>
              <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td style="background:#1d4ed8;border-radius:8px;">
                    <a href="${siteUrl()}"
                       style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
                      Log In Now →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:13px;color:#94a3b8;">
                For security, please change your password after your first login.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;">support@guzmancareerservices.com</p>
              <p style="margin:12px 0 0;font-size:11px;color:#cbd5e1;line-height:1.6;">
                You received this because an account was created for you at Guzman Career Services.<br />
                If this was unexpected, please contact us at the email above.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
        });
    } catch (err) {
        console.error('[sendStaffWelcomeEmail] Email failed:', err.message);
    }
}

async function sendInviteEmail(toEmail, toName, inviteLink) {
    if (!process.env.RESEND_API_KEY) return;
    try {
        await resend.emails.send({
            from: `Guzman Career Services <${emailFrom()}>`,
            to: toEmail,
            subject: 'You have been invited',
            html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

          <!-- Header -->
          <tr>
            <td style="background:#1d4ed8;padding:30px 40px 26px;">
              <img src="${siteUrl()}/logo.png" alt="Guzman Career Services" width="160" style="display:block;height:auto;border:0;" />
              <p style="margin:10px 0 0;font-size:13px;color:#bfdbfe;letter-spacing:0.3px;">
                Professional Career Coaching &amp; Talent Placement
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 28px;">
              <h1 style="margin:0 0 10px;font-size:24px;color:#0f172a;font-weight:700;">Welcome aboard! 🎉</h1>
              <p style="margin:0 0 18px;font-size:15px;color:#475569;line-height:1.7;">
                Hello <strong>${toName}</strong>,
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.7;">
                Your client account at <strong>Guzman Career Services</strong> has been created.
                Click the button below to set your password and access your personal portal —
                where you can view invoices, manage your resume, and stay connected with your career coach.
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td style="background:#1d4ed8;border-radius:8px;">
                    <a href="${inviteLink}"
                       style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
                      Set My Password →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#94a3b8;">
                This link expires in <strong>7 days</strong>. If you didn't expect this email, you can safely ignore it.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:0;" />
            </td>
          </tr>

          <!-- What to expect -->
          <tr>
            <td style="padding:28px 40px 32px;">
              <p style="margin:0 0 16px;font-size:12px;font-weight:700;color:#64748b;letter-spacing:0.8px;text-transform:uppercase;">
                What's waiting for you
              </p>
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="width:36px;vertical-align:top;padding-top:2px;font-size:18px;">📋</td>
                  <td style="padding-bottom:14px;">
                    <p style="margin:0;font-size:14px;font-weight:600;color:#0f172a;">View Your Invoices</p>
                    <p style="margin:4px 0 0;font-size:13px;color:#64748b;line-height:1.5;">Track payments and download PDF invoices anytime.</p>
                  </td>
                </tr>
                <tr>
                  <td style="width:36px;vertical-align:top;padding-top:2px;font-size:18px;">📄</td>
                  <td style="padding-bottom:14px;">
                    <p style="margin:0;font-size:14px;font-weight:600;color:#0f172a;">Resume Management</p>
                    <p style="margin:4px 0 0;font-size:13px;color:#64748b;line-height:1.5;">Upload and manage your resume directly from your portal.</p>
                  </td>
                </tr>
                <tr>
                  <td style="width:36px;vertical-align:top;padding-top:2px;font-size:18px;">🚀</td>
                  <td>
                    <p style="margin:0;font-size:14px;font-weight:600;color:#0f172a;">Career Support</p>
                    <p style="margin:4px 0 0;font-size:13px;color:#64748b;line-height:1.5;">Stay connected with your career coach and track your progress.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;">support@guzmancareerservices.com</p>
              <p style="margin:12px 0 0;font-size:11px;color:#cbd5e1;line-height:1.6;">
                You received this because an account was created for you.<br />
                If this was unexpected, please contact us at the email above.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
        });
    } catch (err) {
        console.error('[sendInviteEmail] Email failed:', err.message);
    }
}

async function sendResetEmail(toEmail, toName, resetLink) {
    if (!process.env.RESEND_API_KEY) return;
    try {
        await resend.emails.send({
            from: `Guzman Career Services <${emailFrom()}>`,
            to: toEmail,
            subject: 'Reset your password',
            html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

          <!-- Header -->
          <tr>
            <td style="background:#1d4ed8;padding:30px 40px 26px;">
              <img src="${siteUrl()}/logo.png" alt="Guzman Career Services" width="160" style="display:block;height:auto;border:0;" />
              <p style="margin:10px 0 0;font-size:13px;color:#bfdbfe;letter-spacing:0.3px;">
                Professional Career Coaching &amp; Talent Placement
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 28px;">
              <h1 style="margin:0 0 10px;font-size:24px;color:#0f172a;font-weight:700;">Password Reset Request</h1>
              <p style="margin:0 0 18px;font-size:15px;color:#475569;line-height:1.7;">
                Hi <strong>${toName}</strong>,
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.7;">
                We received a request to reset the password for your <strong>Guzman Career Services</strong> account.
                Click the button below to create a new password.
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td style="background:#1d4ed8;border-radius:8px;">
                    <a href="${resetLink}"
                       style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
                      Reset My Password →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#94a3b8;">
                This link expires in <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email — your password will not change.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:0;" />
            </td>
          </tr>

          <!-- Security note -->
          <tr>
            <td style="padding:24px 40px 32px;">
              <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#64748b;letter-spacing:0.8px;text-transform:uppercase;">
                Security tips
              </p>
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="width:36px;vertical-align:top;padding-top:2px;font-size:18px;">🔒</td>
                  <td style="padding-bottom:14px;">
                    <p style="margin:0;font-size:14px;font-weight:600;color:#0f172a;">Use a strong password</p>
                    <p style="margin:4px 0 0;font-size:13px;color:#64748b;line-height:1.5;">At least 8 characters with a mix of letters and numbers.</p>
                  </td>
                </tr>
                <tr>
                  <td style="width:36px;vertical-align:top;padding-top:2px;font-size:18px;">🚫</td>
                  <td>
                    <p style="margin:0;font-size:14px;font-weight:600;color:#0f172a;">Never share your password</p>
                    <p style="margin:4px 0 0;font-size:13px;color:#64748b;line-height:1.5;">Guzman Career Services will never ask for your password via email.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;">support@guzmancareerservices.com</p>
              <p style="margin:12px 0 0;font-size:11px;color:#cbd5e1;line-height:1.6;">
                You received this because a password reset was requested for your account.<br />
                If this was unexpected, please contact us at the email above.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
        });
    } catch (err) {
        console.error('[sendResetEmail] Email failed:', err.message);
    }
}

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────

function verifyToken(token) {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return null;
    }
}

function requireAdmin(req, res, next) {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    req.user = payload;
    next();
}

function requireAdminOrStaff(req, res, next) {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const payload = verifyToken(token);
    if (!payload) return res.status(401).json({ error: 'Unauthorized' });
    if (payload.role !== 'admin' && payload.role !== 'staff') return res.status(403).json({ error: 'Forbidden' });
    req.user = payload;
    next();
}

function requireAuth(req, res, next) {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const payload = verifyToken(token);
    if (!payload) return res.status(401).json({ error: 'Unauthorized' });
    req.user = payload;
    next();
}

// ─── AUTH ENDPOINTS ───────────────────────────────────────────────────────────

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
        const user = result.rows[0];
        if (!user || !user.password_hash) {
            return res.status(401).json({ error: 'Incorrect email or password.' });
        }
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return res.status(401).json({ error: 'Incorrect email or password.' });
        const token = jwt.sign(
            { sub: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        res.json({ token, role: user.role, email: user.email });
    } catch (error) {
        console.error('[POST /api/auth/login]', error.message);
        res.status(500).json({ error: 'Login failed.' });
    }
});

// POST /api/auth/reset-password — send reset link email
app.post('/api/auth/reset-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
        const user = result.rows[0];
        if (user) {
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
            await pool.query(
                'UPDATE users SET reset_token = $1, reset_token_expires_at = $2 WHERE id = $3',
                [resetToken, resetExpiry, user.id]
            );
            const resetLink = `${siteUrl()}/set-password?token=${resetToken}&type=reset`;
            sendResetEmail(email, user.full_name, resetLink);
        }
        // Always respond success to prevent email enumeration
        res.json({ success: true });
    } catch (error) {
        console.error('[POST /api/auth/reset-password]', error.message);
        res.status(500).json({ error: 'Failed to process request.' });
    }
});

// POST /api/auth/set-password — set password from invite or reset token
app.post('/api/auth/set-password', async (req, res) => {
    const { token, password, type } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and password are required.' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    try {
        const column = type === 'reset' ? 'reset_token' : 'invite_token';
        const expiryColumn = type === 'reset' ? 'reset_token_expires_at' : 'invite_token_expires_at';
        const result = await pool.query(
            `SELECT * FROM users WHERE ${column} = $1 AND ${expiryColumn} > NOW()`,
            [token]
        );
        const user = result.rows[0];
        if (!user) return res.status(400).json({ error: 'Invalid or expired token.' });
        const passwordHash = await bcrypt.hash(password, 12);
        await pool.query(
            `UPDATE users SET password_hash = $1, password_set = true, ${column} = NULL, ${expiryColumn} = NULL WHERE id = $2`,
            [passwordHash, user.id]
        );
        const jwtToken = jwt.sign(
            { sub: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        res.json({ token: jwtToken, role: user.role, email: user.email });
    } catch (error) {
        console.error('[POST /api/auth/set-password]', error.message);
        res.status(500).json({ error: 'Failed to set password.' });
    }
});

// ─── CLIENTS ──────────────────────────────────────────────────────────────────

// GET /api/clients/me — current client's profile (must be before /:id routes)
app.get('/api/clients/me', requireAuth, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM clients WHERE id = $1', [req.user.sub]);
        const client = result.rows[0];
        if (!client) return res.status(404).json({ error: 'Client not found.' });
        res.json({ client });
    } catch (error) {
        console.error('[GET /api/clients/me]', error.message);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/clients/me/invoices — current client's invoices
app.get('/api/clients/me/invoices', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM invoices WHERE client_id = $1 ORDER BY created_at DESC',
            [req.user.sub]
        );
        res.json({ invoices: result.rows });
    } catch (error) {
        console.error('[GET /api/clients/me/invoices]', error.message);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/clients — create client + send invite email
app.post('/api/clients', requireAdmin, async (req, res) => {
    const { fullName, email, phone, intakeFormType, initialService, intakeId } = req.body;
    if (!fullName || !email) return res.status(400).json({ error: 'Full name and email are required.' });
    try {
        const inviteToken = crypto.randomBytes(32).toString('hex');
        const inviteExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        const userResult = await pool.query(
            `INSERT INTO users (email, role, full_name, phone, invite_token, invite_token_expires_at)
             VALUES ($1, 'client', $2, $3, $4, $5) RETURNING id`,
            [email.toLowerCase().trim(), fullName, phone || '', inviteToken, inviteExpiry]
        );
        const userId = userResult.rows[0].id;
        const clientResult = await pool.query(
            `INSERT INTO clients (id, full_name, email, phone, intake_form_type, initial_service, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'Pending') RETURNING *`,
            [userId, fullName, email, phone || '', intakeFormType || 'general', initialService || '']
        );
        const clientData = clientResult.rows[0];
        if (intakeId) {
            await pool.query(
                `UPDATE intake_submissions SET status = 'converted', converted_client_id = $1 WHERE id = $2`,
                [clientData.id, intakeId]
            );
        }
        const inviteLink = `${siteUrl()}/set-password?token=${inviteToken}`;
        sendInviteEmail(email, fullName, inviteLink);
        res.json({ success: true, client: clientData });
    } catch (error) {
        console.error('[POST /api/clients]', error.message);
        if (error.code === '23505' && error.constraint === 'users_email_key') {
            return res.status(400).json({ error: 'An account with this email already exists.' });
        }
        res.status(400).json({ error: error.message });
    }
});

// GET /api/clients — list all clients
app.get('/api/clients', requireAdminOrStaff, async (_req, res) => {
    try {
        const result = await pool.query('SELECT * FROM clients ORDER BY created_at DESC');
        res.json({ clients: result.rows });
    } catch (error) {
        console.error('[GET /api/clients]', error.message);
        res.status(500).json({ error: error.message });
    }
});

// PATCH /api/clients/:id/mark-logged-in
app.patch('/api/clients/:id/mark-logged-in', requireAuth, async (req, res) => {
    try {
        await pool.query('UPDATE clients SET has_logged_in = true WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error('[PATCH /api/clients/:id/mark-logged-in]', error.message);
        res.status(500).json({ error: error.message });
    }
});

// PATCH /api/clients/:id/accept-terms
app.patch('/api/clients/:id/accept-terms', requireAuth, async (req, res) => {
    const { termsVersion } = req.body;
    if (!termsVersion) return res.status(400).json({ error: 'Terms version is required.' });
    try {
        const result = await pool.query(
            `UPDATE clients SET tc_accepted_version = $1, tc_accepted_at = NOW()
             WHERE id = $2 RETURNING *`,
            [termsVersion, req.params.id]
        );
        res.json({ success: true, client: result.rows[0] });
    } catch (error) {
        console.error('[PATCH /api/clients/:id/accept-terms]', error.message);
        res.status(500).json({ error: error.message });
    }
});

// PATCH /api/clients/:id/status
app.patch('/api/clients/:id/status', requireAdmin, async (req, res) => {
    const { status } = req.body;
    try {
        const result = await pool.query(
            'UPDATE clients SET status = $1 WHERE id = $2 RETURNING *',
            [status, req.params.id]
        );
        res.json({ success: true, client: result.rows[0] });
    } catch (error) {
        console.error('[PATCH /api/clients/:id/status]', error.message);
        res.status(500).json({ error: error.message });
    }
});

// PATCH /api/clients/:id/hibernate
app.patch('/api/clients/:id/hibernate', requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `UPDATE clients SET hibernated = true WHERE id = $1 RETURNING *`,
            [req.params.id]
        );
        if (!result.rows[0]) return res.status(404).json({ error: 'Client not found.' });
        res.json({ client: result.rows[0] });
    } catch (error) {
        console.error('[PATCH /api/clients/:id/hibernate]', error.message);
        res.status(500).json({ error: error.message });
    }
});

// PATCH /api/clients/:id/unhibernate
app.patch('/api/clients/:id/unhibernate', requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `UPDATE clients SET hibernated = false WHERE id = $1 RETURNING *`,
            [req.params.id]
        );
        if (!result.rows[0]) return res.status(404).json({ error: 'Client not found.' });
        res.json({ client: result.rows[0] });
    } catch (error) {
        console.error('[PATCH /api/clients/:id/unhibernate]', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ─── STAFF ───────────────────────────────────────────────────────────────────

// POST /api/staff — create staff account with password set by the admin
app.post('/api/staff', requireAdmin, async (req, res) => {
    const { fullName, email, password } = req.body;
    if (!fullName || !email) return res.status(400).json({ error: 'Full name and email are required.' });
    if (!password || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    try {
        // Give a clear error if the email is already in use
        const existing = await pool.query('SELECT id, role FROM users WHERE email = $1', [email.toLowerCase().trim()]);
        if (existing.rows[0]) {
            const role = existing.rows[0].role;
            if (role === 'staff') return res.status(400).json({ error: 'A staff account with this email already exists.' });
            return res.status(400).json({ error: `This email is already registered as a ${role}. Please use a different email address.` });
        }
        const passwordHash = await bcrypt.hash(password, 12);
        const userResult = await pool.query(
            `INSERT INTO users (email, role, full_name, password_hash, password_set)
             VALUES ($1, 'staff', $2, $3, true) RETURNING id`,
            [email.toLowerCase().trim(), fullName, passwordHash]
        );
        const userId = userResult.rows[0].id;
        // Send welcome email with login credentials
        sendStaffWelcomeEmail(email, fullName, password);
        res.json({ success: true, user: { id: userId, email, full_name: fullName } });
    } catch (error) {
        console.error('[POST /api/staff]', error.message);
        res.status(400).json({ error: 'Failed to create staff account. Please try again.' });
    }
});

// GET /api/staff — list all staff accounts
app.get('/api/staff', requireAdmin, async (_req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, email, full_name, password_set, created_at FROM users WHERE role = 'staff' ORDER BY created_at DESC`
        );
        res.json({ staff: result.rows });
    } catch (error) {
        console.error('[GET /api/staff]', error.message);
        res.status(500).json({ error: error.message });
    }
});

// PATCH /api/staff/:id/reset-password — admin resets a staff member's password
app.patch('/api/staff/:id/reset-password', requireAdmin, async (req, res) => {
    const { password } = req.body;
    if (!password || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    try {
        const staffRes = await pool.query(`SELECT id, email, full_name FROM users WHERE id = $1 AND role = 'staff'`, [req.params.id]);
        if (!staffRes.rows[0]) return res.status(404).json({ error: 'Staff member not found.' });
        const { email, full_name } = staffRes.rows[0];
        const passwordHash = await bcrypt.hash(password, 12);
        await pool.query(
            `UPDATE users SET password_hash = $1, password_set = true WHERE id = $2`,
            [passwordHash, req.params.id]
        );
        // Re-send welcome email with new credentials
        sendStaffWelcomeEmail(email, full_name, password);
        res.json({ success: true });
    } catch (error) {
        console.error('[PATCH /api/staff/:id/reset-password]', error.message);
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/staff/:id — remove a staff account
app.delete('/api/staff/:id', requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(`DELETE FROM users WHERE id = $1 AND role = 'staff' RETURNING id`, [req.params.id]);
        if (!result.rows[0]) return res.status(404).json({ error: 'Staff member not found.' });
        res.json({ success: true });
    } catch (error) {
        console.error('[DELETE /api/staff/:id]', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ─── INVOICES ────────────────────────────────────────────────────────────────

// POST /api/invoices — create invoice
app.post('/api/invoices', requireAdmin, async (req, res) => {
    const { clientId, description, subtitle, amount, due_date } = req.body;
    if (!clientId || !description || !amount) return res.status(400).json({ error: 'Client, description, and amount are required.' });
    try {
        const year = new Date().getFullYear();
        const unique = Date.now().toString().slice(-7);
        const invoiceNumber = `INV-${year}-${unique}`;
        const values = [clientId, invoiceNumber, description, subtitle || '', parseFloat(amount)];
        let sql = `INSERT INTO invoices (client_id, invoice_number, description, subtitle, amount, status)
                   VALUES ($1, $2, $3, $4, $5, 'Pending')`;
        if (due_date) {
            sql = `INSERT INTO invoices (client_id, invoice_number, description, subtitle, amount, status, due_date)
                   VALUES ($1, $2, $3, $4, $5, 'Pending', $6)`;
            values.push(due_date);
        }
        sql += ' RETURNING *';
        const result = await pool.query(sql, values);
        const invoice = result.rows[0];
        const clientRow = await pool.query('SELECT email, full_name FROM clients WHERE id = $1', [clientId]);
        if (clientRow.rows[0]) sendPortalNotification(clientRow.rows[0].email, clientRow.rows[0].full_name);
        res.json({ success: true, invoice });
    } catch (error) {
        console.error('[POST /api/invoices]', error.message);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/invoices — all invoices with client info (admin view)
app.get('/api/invoices', requireAdmin, async (_req, res) => {
    try {
        const result = await pool.query(`
            SELECT i.*, c.id AS c_id, c.full_name AS c_full_name, c.email AS c_email, c.phone AS c_phone
            FROM invoices i
            JOIN clients c ON c.id = i.client_id
            ORDER BY i.created_at DESC
        `);
        const invoices = result.rows.map(row => ({
            ...row,
            clients: { id: row.c_id, full_name: row.c_full_name, email: row.c_email, phone: row.c_phone },
        }));
        res.json({ invoices });
    } catch (error) {
        console.error('[GET /api/invoices]', error.message);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/clients/:clientId/invoices — invoices for one client (admin view)
app.get('/api/clients/:clientId/invoices', requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM invoices WHERE client_id = $1 ORDER BY created_at DESC',
            [req.params.clientId]
        );
        res.json({ invoices: result.rows });
    } catch (error) {
        console.error('[GET /api/clients/:clientId/invoices]', error.message);
        res.status(500).json({ error: error.message });
    }
});

// PATCH /api/invoices/:id/mark-paid
app.patch('/api/invoices/:id/mark-paid', requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `UPDATE invoices SET status = 'Paid', paid_at = NOW() WHERE id = $1 RETURNING *`,
            [req.params.id]
        );
        res.json({ success: true, invoice: result.rows[0] });
    } catch (error) {
        console.error('[PATCH /api/invoices/:id/mark-paid]', error.message);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/invoices/:id/checkout — create Stripe checkout session
app.post('/api/invoices/:id/checkout', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT i.*, c.full_name AS c_full_name, c.email AS c_email
            FROM invoices i
            JOIN clients c ON c.id = i.client_id
            WHERE i.id = $1
        `, [req.params.id]);
        const row = result.rows[0];
        if (!row) return res.status(404).json({ error: 'Invoice not found' });
        if (row.status === 'Paid') return res.status(400).json({ error: 'Invoice is already paid.' });
        const baseUrl = siteUrl();
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'cashapp', 'amazon_pay', 'klarna'],
            mode: 'payment',
            customer_email: row.c_email,
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: row.description,
                        ...(row.subtitle && { description: row.subtitle }),
                    },
                    unit_amount: Math.round(parseFloat(row.amount) * 100),
                },
                quantity: 1,
            }],
            metadata: { invoice_id: row.id, invoice_number: row.invoice_number },
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
        if (session.payment_status !== 'paid') return res.status(400).json({ error: 'Payment not completed.' });
        const invoiceId = session.metadata?.invoice_id;
        if (!invoiceId) return res.status(400).json({ error: 'Invoice reference missing from session.' });
        await pool.query(
            `UPDATE invoices SET status = 'Paid', paid_at = NOW() WHERE id = $1 AND status = 'Pending'`,
            [invoiceId]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('[POST /api/payments/verify]', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

// GET /api/stats
app.get('/api/stats', requireAdmin, async (_req, res) => {
    try {
        const [totalRes, pendingRes, activeRes, invoicesRes] = await Promise.all([
            pool.query('SELECT COUNT(*) FROM clients'),
            pool.query("SELECT COUNT(*) FROM clients WHERE status = 'Pending'"),
            pool.query("SELECT COUNT(*) FROM clients WHERE status = 'Active'"),
            pool.query('SELECT amount, status FROM invoices'),
        ]);
        const invoices = invoicesRes.rows;
        const totalRevenue   = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + parseFloat(i.amount || 0), 0);
        const pendingRevenue = invoices.filter(i => i.status === 'Pending').reduce((s, i) => s + parseFloat(i.amount || 0), 0);
        res.json({
            totalClients:   parseInt(totalRes.rows[0].count),
            pendingClients: parseInt(pendingRes.rows[0].count),
            activeClients:  parseInt(activeRes.rows[0].count),
            totalRevenue:   totalRevenue.toFixed(2),
            pendingRevenue: pendingRevenue.toFixed(2),
        });
    } catch (error) {
        console.error('[GET /api/stats]', error.message);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/activity
app.get('/api/activity', requireAdmin, async (_req, res) => {
    try {
        const [clientsRes, invoicesRes] = await Promise.all([
            pool.query('SELECT id, full_name, email, status, created_at FROM clients ORDER BY created_at DESC LIMIT 5'),
            pool.query(`
                SELECT i.id, i.invoice_number, i.description, i.amount, i.status, i.created_at,
                       c.full_name AS c_full_name
                FROM invoices i
                JOIN clients c ON c.id = i.client_id
                ORDER BY i.created_at DESC LIMIT 5
            `),
        ]);
        const recentInvoices = invoicesRes.rows.map(row => ({
            ...row,
            clients: { full_name: row.c_full_name },
        }));
        res.json({ recentClients: clientsRes.rows, recentInvoices });
    } catch (error) {
        console.error('[GET /api/activity]', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ─── INTAKE FORMS ────────────────────────────────────────────────────────────

// POST /api/intake — store intake submission (public, no auth)
app.post('/api/intake', async (req, res) => {
    const { fullName, email, referredBy, phone, fullAddress, sex, veteranStatus, disabilityStatus,
        raceIdentity, workAuthorization, jobTitles, sharedEmail, sharedPassword,
        legalName, signatureDate, tcAgreed,
        linkedinProfile, additionalNotes, intakeFormType } = req.body;
    if (!fullName || !email || !legalName || !tcAgreed) {
        return res.status(400).json({ error: 'Please fill in all required fields.' });
    }
    try {
        const result = await pool.query(`
            INSERT INTO intake_submissions (
                full_name, email, referred_by, phone, full_address, sex,
                veteran_status, disability_status, race_identity, work_authorization,
                job_titles, shared_email, shared_password, legal_name,
                signature_date, tc_agreed, status, linkedin_profile,
                additional_notes, intake_form_type
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
            RETURNING id
        `, [
            fullName, email, referredBy || '', phone || '',
            fullAddress || '', sex || '', veteranStatus || '',
            disabilityStatus || '', raceIdentity || '', workAuthorization || '',
            jobTitles || '', sharedEmail || '', sharedPassword || '',
            legalName, signatureDate || new Date().toISOString().split('T')[0],
            true, 'pending', linkedinProfile || '', additionalNotes || '',
            intakeFormType || 'general',
        ]);
        res.json({ success: true, submissionId: result.rows[0].id });
    } catch (error) {
        console.error('[POST /api/intake]', error.message);
        res.status(400).json({ error: error.message });
    }
});

// POST /api/intake/:id/resume — upload intake resume
app.post('/api/intake/:id/resume', requireAdminOrStaff, upload.single('resume'), async (req, res) => {
    const { id } = req.params;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file received.' });
    try {
        const ext = getFileExt(file.mimetype);
        const storagePath = `intakes/${id}/resume${ext}`;
        await uploadFile(storagePath, file.buffer, file.mimetype);
        await pool.query(
            `UPDATE intake_submissions SET resume_path = $1, resume_filename = $2, resume_uploaded_at = NOW() WHERE id = $3`,
            [storagePath, file.originalname, id]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('[POST /api/intake/:id/resume]', error.message);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/intake/:id/resume — get signed URL for intake resume
app.get('/api/intake/:id/resume', requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT resume_path FROM intake_submissions WHERE id = $1', [req.params.id]
        );
        const sub = result.rows[0];
        if (!sub?.resume_path) return res.status(404).json({ error: 'No resume on file.' });
        const url = await getSignedDownloadUrl(sub.resume_path, 300);
        res.json({ url });
    } catch (error) {
        console.error('[GET /api/intake/:id/resume]', error.message);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/intakes — list all intake submissions
app.get('/api/intakes', requireAdmin, async (_req, res) => {
    try {
        const result = await pool.query('SELECT * FROM intake_submissions ORDER BY created_at DESC');
        res.json({ submissions: result.rows });
    } catch (error) {
        console.error('[GET /api/intakes]', error.message);
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/intake/:id — delete an intake submission (optionally its file)
app.delete('/api/intake/:id', requireAdmin, async (req, res) => {
    try {
        const { deleteFile: shouldDeleteFile } = req.body;
        const intake = await pool.query('SELECT * FROM intake_submissions WHERE id = $1', [req.params.id]);
        if (!intake.rows[0]) return res.status(404).json({ error: 'Intake not found.' });
        if (shouldDeleteFile && intake.rows[0].resume_path) {
            await deleteFile(intake.rows[0].resume_path);
        }
        await pool.query('DELETE FROM intake_submissions WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error('[DELETE /api/intake/:id]', error.message);
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/clients/:id — delete a client account and all associated data
app.delete('/api/clients/:id', requireAdmin, async (req, res) => {
    try {
        const clientRes = await pool.query('SELECT * FROM clients WHERE id = $1', [req.params.id]);
        if (!clientRes.rows[0]) return res.status(404).json({ error: 'Client not found.' });
        const client = clientRes.rows[0];

        // Delete all resume files from storage
        const resumeRecords = await pool.query('SELECT resume_path FROM client_resumes WHERE client_id = $1', [req.params.id]);
        for (const row of resumeRecords.rows) {
            if (row.resume_path) await deleteFile(row.resume_path).catch(() => {});
        }
        if (client.resume_path) await deleteFile(client.resume_path).catch(() => {});

        // Delete associated records
        await pool.query('DELETE FROM client_resumes WHERE client_id = $1', [req.params.id]);
        await pool.query('DELETE FROM invoices WHERE client_id = $1', [req.params.id]);
        await pool.query('DELETE FROM clients WHERE id = $1', [req.params.id]);
        await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);

        res.json({ success: true });
    } catch (error) {
        console.error('[DELETE /api/clients/:id]', error.message);
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/invoices/:id — delete an invoice
app.delete('/api/invoices/:id', requireAdmin, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM invoices WHERE id = $1 RETURNING *', [req.params.id]);
        if (!result.rows[0]) return res.status(404).json({ error: 'Invoice not found.' });
        res.json({ success: true });
    } catch (error) {
        console.error('[DELETE /api/invoices/:id]', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ─── RESUMES ─────────────────────────────────────────────────────────────────

// POST /api/clients/:clientId/resume — upload a resume for a client
app.post('/api/clients/:clientId/resume', requireAdminOrStaff, upload.single('resume'), async (req, res) => {
    const { clientId } = req.params;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file received.' });
    const jdLink = req.body.jd_link || null;
    const timestamp = Date.now();
    const ext = getFileExt(file.mimetype);
    const storagePath = `${clientId}/${timestamp}_resume${ext}`;
    try {
        await uploadFile(storagePath, file.buffer, file.mimetype);
        await pool.query(
            `INSERT INTO client_resumes (client_id, resume_path, resume_filename, jd_link)
             VALUES ($1, $2, $3, $4)`,
            [clientId, storagePath, file.originalname, jdLink]
        );
        const result = await pool.query(
            `UPDATE clients SET resume_path = $1, resume_filename = $2, resume_uploaded_at = NOW()
             WHERE id = $3 RETURNING *`,
            [storagePath, file.originalname, clientId]
        );
        const clientData = result.rows[0];
        sendPortalNotification(clientData.email, clientData.full_name);
        res.json({ success: true, client: clientData });
    } catch (error) {
        console.error('[POST /api/clients/:clientId/resume]', error.message);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/clients/:clientId/resumes — list all resumes for a client
app.get('/api/clients/:clientId/resumes', requireAuth, async (req, res) => {
    const isAdmin = req.user.role === 'admin';
    const isOwner = req.user.sub === req.params.clientId;
    if (!isAdmin && !isOwner) return res.status(403).json({ error: 'Forbidden' });
    try {
        const result = await pool.query(
            'SELECT id, resume_filename, jd_link, uploaded_at FROM client_resumes WHERE client_id = $1 ORDER BY uploaded_at DESC',
            [req.params.clientId]
        );
        res.json({ resumes: result.rows });
    } catch (error) {
        console.error('[GET /api/clients/:clientId/resumes]', error.message);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/clients/:clientId/resume/download — stream file directly to client
// Proxies from Cloudinary server-side to avoid browser CORS issues.
app.get('/api/clients/:clientId/resume/download', requireAuth, async (req, res) => {
    const isAdmin = ['admin', 'staff'].includes(req.user.role);
    const isOwner = req.user.sub === req.params.clientId;
    if (!isAdmin && !isOwner) return res.status(403).json({ error: 'Forbidden' });
    try {
        let resumePath, resumeFilename;
        if (req.query.resumeId) {
            const result = await pool.query(
                'SELECT resume_path, resume_filename FROM client_resumes WHERE id = $1 AND client_id = $2',
                [req.query.resumeId, req.params.clientId]
            );
            if (!result.rows[0]) return res.status(404).json({ error: 'Resume not found.' });
            resumePath    = result.rows[0].resume_path;
            resumeFilename = result.rows[0].resume_filename;
        } else {
            // Fallback: most recent resume from clients table
            const result = await pool.query(
                'SELECT resume_path, resume_filename FROM clients WHERE id = $1',
                [req.params.clientId]
            );
            if (!result.rows[0] || !result.rows[0].resume_path) {
                return res.status(404).json({ error: 'No resume on file.' });
            }
            resumePath    = result.rows[0].resume_path;
            resumeFilename = result.rows[0].resume_filename;
        }

        const signedUrl = await getSignedDownloadUrl(resumePath, 60);
        const { statusCode, headers: cloudHeaders, buffer } = await httpsGetBuffer(signedUrl);
        if (statusCode !== 200) throw new Error(`Storage error: ${statusCode}`);

        // Infer content-type from filename if Cloudinary returns a generic type
        let contentType = cloudHeaders['content-type'] || '';
        if (!contentType || contentType.startsWith('text/html') || contentType === 'application/octet-stream') {
            const ext = (resumeFilename || resumePath || '').split('.').pop().toLowerCase();
            if (ext === 'pdf')  contentType = 'application/pdf';
            else if (ext === 'docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            else if (ext === 'doc')  contentType = 'application/msword';
            else contentType = 'application/octet-stream';
        }

        const safeFilename = (resumeFilename || 'resume').replace(/[^\w.\-]/g, '_');
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(resumeFilename || 'resume')}`);
        res.setHeader('Content-Length', buffer.length);
        res.end(buffer);
    } catch (error) {
        console.error('[GET /api/clients/:clientId/resume/download]', error.message);
        if (!res.headersSent) res.status(500).json({ error: 'Could not download file.' });
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
