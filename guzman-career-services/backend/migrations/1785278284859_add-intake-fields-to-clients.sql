-- Up Migration
--
-- Self-service signup collects only email/password/track; everything the old
-- pre-account intake form asked is now completed post-login, directly onto
-- the client's own row, during onboarding.

ALTER TABLE clients
    ADD COLUMN IF NOT EXISTS legal_name TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS signature_date DATE,
    ADD COLUMN IF NOT EXISTS tc_agreed BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS ip_address TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS user_agent TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS device_type TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS sex TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS veteran_status TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS disability_status TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS race_identity TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS work_authorization TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS job_titles TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS referred_by TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS full_address TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS linkedin_profile TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS additional_notes TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS shared_email TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS shared_password TEXT NOT NULL DEFAULT '';

-- Down Migration

ALTER TABLE clients
    DROP COLUMN IF EXISTS legal_name,
    DROP COLUMN IF EXISTS signature_date,
    DROP COLUMN IF EXISTS tc_agreed,
    DROP COLUMN IF EXISTS ip_address,
    DROP COLUMN IF EXISTS user_agent,
    DROP COLUMN IF EXISTS device_type,
    DROP COLUMN IF EXISTS sex,
    DROP COLUMN IF EXISTS veteran_status,
    DROP COLUMN IF EXISTS disability_status,
    DROP COLUMN IF EXISTS race_identity,
    DROP COLUMN IF EXISTS work_authorization,
    DROP COLUMN IF EXISTS job_titles,
    DROP COLUMN IF EXISTS referred_by,
    DROP COLUMN IF EXISTS full_address,
    DROP COLUMN IF EXISTS linkedin_profile,
    DROP COLUMN IF EXISTS additional_notes,
    DROP COLUMN IF EXISTS shared_email,
    DROP COLUMN IF EXISTS shared_password;
