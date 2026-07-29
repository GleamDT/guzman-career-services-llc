-- Up Migration
--
-- Supports the post-onboarding initial program payment (lump sum or a
-- 2-installment split). invoice_kind is NULL for every existing/admin
-- created ad-hoc invoice (untouched); it's set to 'initial_lump',
-- 'initial_split_1', or 'initial_split_2' only for invoices created by
-- the new self-service flow, and doubles as the reminder-eligibility flag.

ALTER TABLE invoices
    ADD COLUMN IF NOT EXISTS invoice_kind TEXT,
    ADD COLUMN IF NOT EXISTS reminder_7day_sent_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS reminder_due_sent_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS reminder_overdue_sent_at TIMESTAMPTZ;

-- Down Migration

ALTER TABLE invoices
    DROP COLUMN IF EXISTS invoice_kind,
    DROP COLUMN IF EXISTS reminder_7day_sent_at,
    DROP COLUMN IF EXISTS reminder_due_sent_at,
    DROP COLUMN IF EXISTS reminder_overdue_sent_at;
