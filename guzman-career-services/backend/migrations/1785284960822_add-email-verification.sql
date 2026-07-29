-- Up Migration
--
-- Email OTP verification for self-service signup. DEFAULT true is
-- deliberate: existing accounts (admin/staff/client, all created via a
-- trusted invite or admin-created flow) must NOT suddenly be locked out.
-- Only the signup endpoint explicitly sets this false for new accounts.

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS otp_code TEXT,
    ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ;

-- Down Migration

ALTER TABLE users
    DROP COLUMN IF EXISTS email_verified,
    DROP COLUMN IF EXISTS otp_code,
    DROP COLUMN IF EXISTS otp_expires_at;
