-- Run this against your Railway PostgreSQL database to set up the schema.
-- You can also use this to migrate existing data from Supabase.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (replaces Supabase auth.users)
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
    email_verified BOOLEAN NOT NULL DEFAULT true,
    otp_code TEXT,
    otp_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Clients
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
    -- Onboarding fields (filled in post-signup, post-login; see PATCH /api/clients/me/onboarding)
    legal_name TEXT NOT NULL DEFAULT '',
    signature_date DATE,
    tc_agreed BOOLEAN NOT NULL DEFAULT false,
    ip_address TEXT NOT NULL DEFAULT '',
    user_agent TEXT NOT NULL DEFAULT '',
    device_type TEXT NOT NULL DEFAULT '',
    sex TEXT NOT NULL DEFAULT '',
    veteran_status TEXT NOT NULL DEFAULT '',
    disability_status TEXT NOT NULL DEFAULT '',
    race_identity TEXT NOT NULL DEFAULT '',
    work_authorization TEXT NOT NULL DEFAULT '',
    job_titles TEXT NOT NULL DEFAULT '',
    referred_by TEXT NOT NULL DEFAULT '',
    full_address TEXT NOT NULL DEFAULT '',
    linkedin_profile TEXT NOT NULL DEFAULT '',
    additional_notes TEXT NOT NULL DEFAULT '',
    shared_email TEXT NOT NULL DEFAULT '',
    shared_password TEXT NOT NULL DEFAULT '',
    onboarding_step SMALLINT NOT NULL DEFAULT 1,
    country TEXT NOT NULL DEFAULT '',
    -- Client's own onboarding resume upload — kept separate from resume_path above,
    -- which is the consultant-facing resume shown on the client's "My Resume" tab.
    intake_resume_path TEXT,
    intake_resume_filename TEXT,
    intake_resume_uploaded_at TIMESTAMPTZ,
    -- Communications email (distinct from the account login email), plus
    -- job-criteria/background extensions to the onboarding wizard.
    comms_email TEXT NOT NULL DEFAULT '',
    min_salary_expectation TEXT NOT NULL DEFAULT '',
    education_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Invoices
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
    invoice_kind TEXT,
    reminder_7day_sent_at TIMESTAMPTZ,
    reminder_due_sent_at TIMESTAMPTZ,
    reminder_overdue_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Intake Submissions
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

-- Client Resumes (history)
CREATE TABLE IF NOT EXISTS client_resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    resume_path TEXT NOT NULL,
    resume_filename TEXT NOT NULL,
    jd_link TEXT,
    uploaded_by TEXT NOT NULL DEFAULT '',
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activity Log
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    actor_name TEXT NOT NULL DEFAULT '',
    actor_email TEXT NOT NULL DEFAULT '',
    details TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_client_resumes_client_id ON client_resumes(client_id);
CREATE INDEX IF NOT EXISTS idx_intake_submissions_status ON intake_submissions(status);

-- ──────────────────────────────────────────────────────────────────────────────
-- ADMIN SEED (run once to create your admin account)
-- Replace the values below, then run this block manually.
-- ──────────────────────────────────────────────────────────────────────────────
-- INSERT INTO users (email, password_hash, role, full_name, password_set)
-- VALUES (
--     'admin@example.com',
--     '$2a$12$REPLACE_WITH_BCRYPT_HASH',   -- bcrypt hash of your chosen password
--     'admin',
--     'Admin',
--     true
-- );
