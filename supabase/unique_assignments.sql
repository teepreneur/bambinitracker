-- Prevent duplicate activity assignments for the same child on the same day
-- Note: Cast to date is not immutable for TIMESTAMPTZ because it depends on the TimeZone setting.
-- We fix this by explicitly defining the timezone for the index.

CREATE UNIQUE INDEX IF NOT EXISTS unique_child_activity_daily 
ON child_activities (child_id, activity_id, (CAST(assigned_at AT TIME ZONE 'UTC' AS DATE)));
