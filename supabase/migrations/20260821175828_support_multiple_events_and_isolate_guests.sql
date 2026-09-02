/*
# Support multiple events and isolate guests per event

1. Modified Tables
- `evento` — removed single-row constraint (CHECK id=1) to allow multiple events.
  - Changed id default to auto-increment via sequence.
  - Added 'Fiesta de Egresados' to tipo CHECK constraint (was missing, causing save failures).
- `invitados` — added `evento_id` column referencing `evento(id)` to isolate guests per event.
  - Existing guests are assigned to the current event (id=1).
  - Foreign key with ON DELETE CASCADE so deleting an event removes its guests.
  - Added index on evento_id for query performance.

2. Security
- No policy changes. Existing RLS policies allow anon + authenticated CRUD on both tables.

3. Notes
- This migration enables the app to support multiple independent events.
  Each event has its own completely separate list of guests.
- The evento table previously only allowed a single row (id=1). Now multiple events can coexist.
- 'Fiesta de Egresados' was missing from the tipo CHECK constraint, which caused
  event creation to silently fail when that type was selected.
*/

-- 1. Drop single-row constraint on evento
ALTER TABLE evento DROP CONSTRAINT IF EXISTS single_row;

-- 2. Create auto-increment sequence for evento.id
CREATE SEQUENCE IF NOT EXISTS evento_id_seq;
ALTER TABLE evento ALTER COLUMN id SET DEFAULT nextval('evento_id_seq');
ALTER SEQUENCE evento_id_seq OWNED BY evento.id;
SELECT setval('evento_id_seq', (SELECT COALESCE(MAX(id), 1) FROM evento));

-- 3. Update tipo CHECK constraint to include 'Fiesta de Egresados'
ALTER TABLE evento DROP CONSTRAINT IF EXISTS evento_tipo_check;
ALTER TABLE evento ADD CONSTRAINT evento_tipo_check
  CHECK (tipo IN ('Casamiento', 'Cumpleaños de 15', 'Fiesta de Egresados', 'Fiesta Privada'));

-- 4. Add evento_id column to invitados
ALTER TABLE invitados ADD COLUMN IF NOT EXISTS evento_id int;

-- 5. Assign existing guests to the current event (id=1 or the first event)
UPDATE invitados SET evento_id = (SELECT id FROM evento ORDER BY id LIMIT 1) WHERE evento_id IS NULL;

-- 6. Make evento_id NOT NULL
ALTER TABLE invitados ALTER COLUMN evento_id SET NOT NULL;

-- 7. Add foreign key with cascade delete
ALTER TABLE invitados DROP CONSTRAINT IF EXISTS invitados_evento_fk;
ALTER TABLE invitados ADD CONSTRAINT invitados_evento_fk
  FOREIGN KEY (evento_id) REFERENCES evento(id) ON DELETE CASCADE;

-- 8. Add index for query performance
CREATE INDEX IF NOT EXISTS idx_invitados_evento_id ON invitados(evento_id);