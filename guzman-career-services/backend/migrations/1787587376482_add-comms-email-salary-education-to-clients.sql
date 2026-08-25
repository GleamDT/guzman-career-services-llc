-- Up Migration
--
-- comms_email: a communications address distinct from the account login email,
-- collected at signup. min_salary_expectation and education_history extend the
-- onboarding wizard (Professional / Background steps).

ALTER TABLE clients
    ADD COLUMN IF NOT EXISTS comms_email TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS min_salary_expectation TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS education_history JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Down Migration

ALTER TABLE clients
    DROP COLUMN IF EXISTS comms_email,
    DROP COLUMN IF EXISTS min_salary_expectation,
    DROP COLUMN IF EXISTS education_history;
