/*
# Add guest detail fields: adults, children, menu choice, notes

1. Modified Tables
- `invitados` — added four new columns:
  - `adultos` (int, default 0) — number of adults
  - `ninos` (int, default 0) — number of children
  - `menu_elegido` (text, nullable) — chosen menu: 'Carne/Asado', 'Pollo', 'Pescado', 'Menú Infantil'
  - `notas` (text, nullable) — free-text notes/observations

2. Security
- No security changes. Existing RLS policies remain unchanged.

3. Notes
- All columns are nullable / have defaults so existing rows remain valid.
- `pases_totales` is kept for backward compatibility; the frontend will auto-calculate it as adultos + ninos.
*/

ALTER TABLE invitados ADD COLUMN IF NOT EXISTS adultos int DEFAULT 0;
ALTER TABLE invitados ADD COLUMN IF NOT EXISTS ninos int DEFAULT 0;
ALTER TABLE invitados ADD COLUMN IF NOT EXISTS menu_elegido text;
ALTER TABLE invitados ADD COLUMN IF NOT EXISTS notas text;