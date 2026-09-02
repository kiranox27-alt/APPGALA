/*
# Add event date, location, and time fields

1. Modified Tables
- `evento` — added three new optional columns for event details shown on invitation cards:
  - `fecha` (date, nullable) — event date
  - `lugar` (text, nullable) — event venue/location
  - `hora` (time, nullable) — event start time

2. Security
- No security changes. Existing RLS policies on `evento` already allow full CRUD for anon + authenticated.

3. Notes
- All three columns are nullable so existing evento rows remain valid without backfilling.
- The upsert in the frontend will include these fields when provided.
*/

ALTER TABLE evento ADD COLUMN IF NOT EXISTS fecha date;
ALTER TABLE evento ADD COLUMN IF NOT EXISTS lugar text;
ALTER TABLE evento ADD COLUMN IF NOT EXISTS hora time;