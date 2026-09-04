/*
# Add invitation design template to events

1. Changes
- Add `invitation_config` JSONB column to `evento` table.
- Stores the visual design of the invitation (colors, fonts, frame, background image, QR position, footer message) so it is customized ONCE per event and automatically applied to every guest's invitation.
- Defaults to NULL (no custom design yet — the app falls back to built-in defaults).

2. Security
- No new tables. No RLS policy changes needed — `evento` already has anon+authenticated CRUD policies from the multi-event migration.
*/

ALTER TABLE evento
  ADD COLUMN IF NOT EXISTS invitation_config jsonb DEFAULT NULL;
