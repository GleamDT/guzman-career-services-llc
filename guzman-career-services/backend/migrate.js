/**
 * Supabase → Railway + Cloudinary migration script
 *
 * Usage:
 *   DB only:           SUPABASE_DB_URL="postgresql://..." node migrate.js
 *   DB + files:        SUPABASE_DB_URL="..." SUPABASE_URL="https://xxx.supabase.co" SUPABASE_SERVICE_ROLE_KEY="..." node migrate.js --files
 *
 * SUPABASE_DB_URL  → Supabase Settings → Database → Connection string → URI (direct, not pooler)
 * SUPABASE_URL     → Supabase Settings → API → Project URL
 * SUPABASE_SERVICE_ROLE_KEY → Supabase Settings → API → service_role key
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { Pool } = require('pg');
const { uploadFile } = require('./r2');

const MIGRATE_FILES = process.argv.includes('--files');
const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;
const RAILWAY_DB_URL = process.env.DATABASE_URL;

if (!SUPABASE_DB_URL) {
    console.error('❌  Set SUPABASE_DB_URL before running this script.');
    process.exit(1);
}
if (!RAILWAY_DB_URL) {
    console.error('❌  DATABASE_URL (Railway) not found in .env');
    process.exit(1);
}

// ─── DATABASE MIGRATION ───────────────────────────────────────────────────────

async function migrateDatabase(src, dst) {
    // 1. Users (from Supabase auth.users — passwords are bcrypt-compatible)
    console.log('\n[1/5] Migrating users...');
    const { rows: authUsers } = await src.query(`
        SELECT
            id,
            email,
            encrypted_password,
            COALESCE(raw_user_meta_data->>'full_name', '') AS full_name,
            COALESCE(raw_user_meta_data->>'phone', '')     AS phone,
            COALESCE(raw_user_meta_data->>'role', 'client') AS role,
            created_at
        FROM auth.users
        ORDER BY created_at
    `);
    let userCount = 0;
    for (const u of authUsers) {
        await dst.query(`
            INSERT INTO users (id, email, password_hash, role, full_name, phone, password_set, created_at)
            VALUES ($1,$2,$3,$4,$5,$6,true,$7)
            ON CONFLICT (id) DO NOTHING
        `, [u.id, u.email, u.encrypted_password, u.role, u.full_name, u.phone, u.created_at]);
        userCount++;
    }
    console.log(`  ✓ ${userCount} users migrated`);

    // 2. Clients
    console.log('\n[2/5] Migrating clients...');
    const { rows: clients } = await src.query('SELECT * FROM clients ORDER BY created_at');
    let clientCount = 0;
    for (const c of clients) {
        await dst.query(`
            INSERT INTO clients (
                id, full_name, email, phone, status, intake_form_type, initial_service,
                has_logged_in, tc_accepted_version, tc_accepted_at,
                resume_path, resume_filename, resume_uploaded_at, created_at
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
            ON CONFLICT (id) DO NOTHING
        `, [
            c.id, c.full_name, c.email, c.phone || '',
            c.status || 'Pending', c.intake_form_type || 'general', c.initial_service || '',
            c.has_logged_in || false, c.tc_accepted_version, c.tc_accepted_at,
            c.resume_path, c.resume_filename, c.resume_uploaded_at, c.created_at,
        ]);
        clientCount++;
    }
    console.log(`  ✓ ${clientCount} clients migrated`);

    // 3. Invoices
    console.log('\n[3/5] Migrating invoices...');
    const { rows: invoices } = await src.query('SELECT * FROM invoices ORDER BY created_at');
    let invoiceCount = 0;
    for (const inv of invoices) {
        await dst.query(`
            INSERT INTO invoices (
                id, client_id, invoice_number, description, subtitle,
                amount, status, due_date, paid_at, created_at
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
            ON CONFLICT (id) DO NOTHING
        `, [
            inv.id, inv.client_id, inv.invoice_number, inv.description, inv.subtitle || '',
            inv.amount, inv.status || 'Pending', inv.due_date, inv.paid_at, inv.created_at,
        ]);
        invoiceCount++;
    }
    console.log(`  ✓ ${invoiceCount} invoices migrated`);

    // 4. Intake submissions
    console.log('\n[4/5] Migrating intake submissions...');
    const { rows: intakes } = await src.query('SELECT * FROM intake_submissions ORDER BY created_at');
    let intakeCount = 0;
    for (const i of intakes) {
        await dst.query(`
            INSERT INTO intake_submissions (
                id, full_name, email, referred_by, phone, full_address, sex,
                veteran_status, disability_status, race_identity, work_authorization,
                job_titles, shared_email, shared_password, legal_name, signature_date,
                tc_agreed, status, linkedin_profile, additional_notes, intake_form_type,
                resume_path, resume_filename, resume_uploaded_at, converted_client_id, created_at
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26)
            ON CONFLICT (id) DO NOTHING
        `, [
            i.id, i.full_name, i.email, i.referred_by || '', i.phone || '',
            i.full_address || '', i.sex || '', i.veteran_status || '', i.disability_status || '',
            i.race_identity || '', i.work_authorization || '', i.job_titles || '',
            i.shared_email || '', i.shared_password || '', i.legal_name, i.signature_date,
            i.tc_agreed, i.status || 'pending', i.linkedin_profile || '', i.additional_notes || '',
            i.intake_form_type || 'general', i.resume_path, i.resume_filename,
            i.resume_uploaded_at, i.converted_client_id, i.created_at,
        ]);
        intakeCount++;
    }
    console.log(`  ✓ ${intakeCount} intake submissions migrated`);

    // 5. Client resume history
    console.log('\n[5/5] Migrating client resume history...');
    const { rows: resumes } = await src.query('SELECT * FROM client_resumes ORDER BY uploaded_at');
    let resumeCount = 0;
    for (const r of resumes) {
        await dst.query(`
            INSERT INTO client_resumes (id, client_id, resume_path, resume_filename, jd_link, uploaded_at)
            VALUES ($1,$2,$3,$4,$5,$6)
            ON CONFLICT (id) DO NOTHING
        `, [r.id, r.client_id, r.resume_path, r.resume_filename, r.jd_link, r.uploaded_at]);
        resumeCount++;
    }
    console.log(`  ✓ ${resumeCount} resume records migrated`);
}

// ─── FILE MIGRATION (Supabase Storage → Cloudinary) ──────────────────────────

async function migrateFiles() {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SERVICE_KEY) {
        console.error('\n❌  SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required for --files');
        process.exit(1);
    }

    const headers = {
        Authorization: `Bearer ${SERVICE_KEY}`,
        apikey: SERVICE_KEY,
    };

    // Recursively list all files under a prefix
    async function listAllFiles(bucket, prefix = '') {
        const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${bucket}`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ prefix, limit: 1000, offset: 0 }),
        });
        if (!res.ok) return [];
        const items = await res.json();
        const files = [];
        for (const item of items) {
            if (!item.name) continue;
            const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
            // folders have no metadata.size — recurse into them
            if (!item.metadata || item.metadata.size === undefined || item.metadata.size === null) {
                const nested = await listAllFiles(bucket, fullPath);
                files.push(...nested);
            } else {
                files.push(fullPath);
            }
        }
        return files;
    }

    const buckets = ['resumes'];

    for (const bucket of buckets) {
        console.log(`\n[Files] Scanning bucket: ${bucket}`);

        const allFiles = await listAllFiles(bucket);
        console.log(`  Found ${allFiles.length} files`);

        let uploaded = 0;
        let skipped = 0;

        for (const path of allFiles) {
            const downloadUrl = `${SUPABASE_URL}/storage/v1/object/authenticated/${bucket}/${path}`;

            try {
                const fileRes = await fetch(downloadUrl, { headers });
                if (!fileRes.ok) {
                    console.warn(`  ⚠ Could not download ${path} (${fileRes.status})`);
                    skipped++;
                    continue;
                }

                const buffer = Buffer.from(await fileRes.arrayBuffer());
                const contentType = fileRes.headers.get('content-type') || 'application/octet-stream';
                const cloudinaryKey = `${bucket}/${path}`;

                await uploadFile(cloudinaryKey, buffer, contentType);
                console.log(`  ✓ ${path}`);
                uploaded++;
            } catch (err) {
                console.warn(`  ⚠ Error migrating ${path}: ${err.message}`);
                skipped++;
            }
        }

        console.log(`  Uploaded: ${uploaded}  Skipped: ${skipped}`);
    }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
    const src = new Pool({ connectionString: SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
    const dst = new Pool({
        connectionString: RAILWAY_DB_URL,
        ssl: RAILWAY_DB_URL.includes('localhost') ? false : { rejectUnauthorized: false },
    });

    console.log('🚀 Starting migration...');

    try {
        await migrateDatabase(src, dst);

        if (MIGRATE_FILES) {
            console.log('\n📁 Migrating files from Supabase Storage to Cloudinary...');
            await migrateFiles();
        } else {
            console.log('\n💡 Tip: Run with --files to also migrate Supabase Storage files to Cloudinary.');
        }

        console.log('\n✅ Migration complete!');
        console.log('\nNext steps:');
        console.log('  1. Verify data in Railway dashboard (Postgres → Database tab)');
        console.log('  2. Seed your admin account if not migrated (see schema.sql comments)');
        console.log('  3. Update SITE_URL in .env to your production domain');
    } catch (err) {
        console.error('\n❌ Migration failed:', err.message);
        console.error(err.stack);
        process.exit(1);
    } finally {
        await src.end();
        await dst.end();
    }
}

main();
