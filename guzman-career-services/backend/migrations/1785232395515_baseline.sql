-- Up Migration
--
-- Baseline migration: captures the schema as it already exists in staging and
-- production (previously created via schema.sql + ad hoc idempotent DDL that
-- ran inline in server.js on every boot). Written idempotently on purpose —
-- running this against a database that already has these objects is a safe
-- no-op; node-pg-migrate only needs to record that it ran once.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'client')),
    full_name TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    invite_token TEXT UNIQUE,
    invite_token_expires_at TIMESTAMPTZ,
    reset_token TEXT UNIQUE,
    reset_token_expires_at TIMESTAMPTZ,
    password_set BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Pending',
    intake_form_type TEXT NOT NULL DEFAULT 'general',
    initial_service TEXT NOT NULL DEFAULT '',
    has_logged_in BOOLEAN NOT NULL DEFAULT false,
    tc_accepted_version TEXT,
    tc_accepted_at TIMESTAMPTZ,
    resume_path TEXT,
    resume_filename TEXT,
    resume_uploaded_at TIMESTAMPTZ,
    resume_uploaded_by TEXT NOT NULL DEFAULT '',
    hibernated BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS resume_uploaded_by TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    subtitle TEXT NOT NULL DEFAULT '',
    amount NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    due_date DATE,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS intake_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    referred_by TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    full_address TEXT NOT NULL DEFAULT '',
    sex TEXT NOT NULL DEFAULT '',
    veteran_status TEXT NOT NULL DEFAULT '',
    disability_status TEXT NOT NULL DEFAULT '',
    race_identity TEXT NOT NULL DEFAULT '',
    work_authorization TEXT NOT NULL DEFAULT '',
    job_titles TEXT NOT NULL DEFAULT '',
    shared_email TEXT NOT NULL DEFAULT '',
    shared_password TEXT NOT NULL DEFAULT '',
    legal_name TEXT NOT NULL,
    signature_date DATE NOT NULL,
    tc_agreed BOOLEAN NOT NULL DEFAULT true,
    ip_address TEXT NOT NULL DEFAULT '',
    user_agent TEXT NOT NULL DEFAULT '',
    device_type TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending',
    linkedin_profile TEXT NOT NULL DEFAULT '',
    additional_notes TEXT NOT NULL DEFAULT '',
    intake_form_type TEXT NOT NULL DEFAULT 'general',
    resume_path TEXT,
    resume_filename TEXT,
    resume_uploaded_at TIMESTAMPTZ,
    converted_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE intake_submissions
    ADD COLUMN IF NOT EXISTS ip_address TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS user_agent TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS device_type TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS client_resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    resume_path TEXT NOT NULL,
    resume_filename TEXT NOT NULL,
    jd_link TEXT,
    uploaded_by TEXT NOT NULL DEFAULT '',
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE client_resumes ADD COLUMN IF NOT EXISTS uploaded_by TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    actor_name TEXT NOT NULL DEFAULT '',
    actor_email TEXT NOT NULL DEFAULT '',
    details TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_client_resumes_client_id ON client_resumes(client_id);
CREATE INDEX IF NOT EXISTS idx_intake_submissions_status ON intake_submissions(status);

-- Down Migration
--
-- Intentionally a no-op: this migration is a baseline capturing schema that
-- already existed before node-pg-migrate was introduced, not new state this
-- deploy created. There is nothing safe to roll back to.
