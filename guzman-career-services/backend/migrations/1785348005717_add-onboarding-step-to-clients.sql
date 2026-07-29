-- Up Migration
--
-- Tracks which onboarding step a client last completed, so logging out
-- mid-onboarding and back in resumes at the right step instead of restarting.

ALTER TABLE clients
    ADD COLUMN IF NOT EXISTS onboarding_step SMALLINT NOT NULL DEFAULT 1;

-- Down Migration

ALTER TABLE clients
    DROP COLUMN IF EXISTS onboarding_step;
