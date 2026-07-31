-- Viewer role: submissions only (no form settings access)
UPDATE "form_team_members"
SET "permissions" = ARRAY['view_submissions']::TEXT[]
WHERE "role" = 'VIEWER';
