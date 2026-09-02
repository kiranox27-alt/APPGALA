/*
# Add event type selection and dynamic categories

1. New Tables
- `evento` — single-row config table (id always 1) storing the event type and optional name.
  - `id` (int, primary key, always 1)
  - `tipo` (text, not null) — Casamiento, Cumpleaños de 15, or Fiesta Privada
  - `nombre` (text, nullable) — optional event name
  - `created_at` (timestamptz)

2. Modified Tables
- `invitados` — removed CHECK constraint on `categoria` so categories can be dynamic per event type.
- `invitados` — updated CHECK constraint on `estado_ingreso` to only allow 'Pendiente' and 'Ingresado' (removed 'Alerta').

3. Security
- Enable RLS on `evento`.
- Allow anon + authenticated CRUD (single-tenant, no auth).

4. Data Updates
- Migrated old categories to new casamiento-style categories.
- Updated 'Alerta' status to 'Pendiente'.
- Updated 'Ninguna' dietary restriction to 'Normal'.
*/

CREATE TABLE IF NOT EXISTS evento (
  id int PRIMARY KEY DEFAULT 1,
  tipo text NOT NULL CHECK (tipo IN ('Casamiento', 'Cumpleaños de 15', 'Fiesta Privada')),
  nombre text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

ALTER TABLE evento ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_evento" ON evento;
CREATE POLICY "anon_select_evento" ON evento FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_evento" ON evento;
CREATE POLICY "anon_insert_evento" ON evento FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_evento" ON evento;
CREATE POLICY "anon_update_evento" ON evento FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_evento" ON evento;
CREATE POLICY "anon_delete_evento" ON evento FOR DELETE
  TO anon, authenticated USING (true);

-- Relax categoria constraint (categories are now dynamic per event type)
ALTER TABLE invitados DROP CONSTRAINT IF EXISTS invitados_categoria_check;

-- Update estado_ingreso constraint (remove Alerta, keep Pendiente + Ingresado)
ALTER TABLE invitados DROP CONSTRAINT IF EXISTS invitados_estado_ingreso_check;
ALTER TABLE invitados ADD CONSTRAINT invitados_estado_ingreso_check
  CHECK (estado_ingreso IN ('Pendiente', 'Ingresado'));

-- Migrate existing data to new category names
UPDATE invitados SET categoria = 'Familiares del Novio' WHERE categoria = 'Familia Novio';
UPDATE invitados SET categoria = 'Invitados de la Novia' WHERE categoria = 'Amigos Novia';
UPDATE invitados SET categoria = 'Otros / Amigos en común' WHERE categoria IN ('VIP', 'Proveedores');
UPDATE invitados SET estado_ingreso = 'Pendiente' WHERE estado_ingreso = 'Alerta';
UPDATE invitados SET restriccion_alimentaria = ARRAY_REPLACE(restriccion_alimentaria, 'Ninguna', 'Normal');