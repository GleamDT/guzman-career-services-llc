-- Up Migration
--
-- The client's own onboarding resume upload must never land in the same place
-- as a consultant-uploaded resume (client_resumes / clients.resume_*), since
-- the dashboard's "My Resume" tab is explicitly the consultant-facing one.
-- Also adds Country to the onboarding personal-info step.

ALTER TABLE clients
    ADD COLUMN IF NOT EXISTS intake_resume_path TEXT,
    ADD COLUMN IF NOT EXISTS intake_resume_filename TEXT,
    ADD COLUMN IF NOT EXISTS intake_resume_uploaded_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT '';

-- Down Migration

ALTER TABLE clients
    DROP COLUMN IF EXISTS intake_resume_path,
    DROP COLUMN IF EXISTS intake_resume_filename,
    DROP COLUMN IF EXISTS intake_resume_uploaded_at,
    DROP COLUMN IF EXISTS country;
