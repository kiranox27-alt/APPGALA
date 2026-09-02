/*
# Create invitados (guests) table for gala reception app

1. New Tables
- `invitados` — stores each guest invited to a private event (weddings, 15th birthdays, corporate galas).
  - `id` (serial, primary key) — auto-incrementing guest ID (1, 2, 3...).
  - `nombre_completo` (text, not null) — full name of the guest.
  - `mesa` (text, not null) — assigned table, e.g. "Mesa 14" or "Mesa Principal".
  - `categoria` (text, not null) — guest category: Familia Novio, Amigos Novia, VIP, or Proveedores.
  - `pases_totales` (integer, not null, default 1) — number of people admitted on this pass.
  - `restriccion_alimentaria` (text[], default '{}') — dietary restrictions: Celiaco, Vegano, Vegetariano, Ninguna (multiple allowed).
  - `asistencia_confirmada` (boolean, default false) — RSVP confirmation before the event.
  - `estado_ingreso` (text, not null, default 'Pendiente') — real-time entry status: Pendiente, Ingresado, or Alerta.
  - `hora_ingreso` (timestamptz, nullable) — timestamp when the guest was checked in.
  - `created_at` (timestamptz, default now()) — record creation time.

2. Security
- Enable RLS on `invitados`.
- This is a single-tenant, no-auth app used by reception staff at the door. CRUD is intentionally
  open to anon + authenticated so the anon-key frontend can read/write guest data without a login screen.

3. Notes
- The QR code for each guest is generated on the fly from the guest `id` (encodes the numeric id),
  so it is not stored as a column.
- `restriccion_alimentaria` is a text array to support multiple simultaneous restrictions per guest.
*/

CREATE TABLE IF NOT EXISTS invitados (
  id serial PRIMARY KEY,
  nombre_completo text NOT NULL,
  mesa text NOT NULL,
  categoria text NOT NULL CHECK (categoria IN ('Familia Novio', 'Amigos Novia', 'VIP', 'Proveedores')),
  pases_totales integer NOT NULL DEFAULT 1,
  restriccion_alimentaria text[] NOT NULL DEFAULT '{}',
  asistencia_confirmada boolean NOT NULL DEFAULT false,
  estado_ingreso text NOT NULL DEFAULT 'Pendiente' CHECK (estado_ingreso IN ('Pendiente', 'Ingresado', 'Alerta')),
  hora_ingreso timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE invitados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_invitados" ON invitados;
CREATE POLICY "anon_select_invitados" ON invitados FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_invitados" ON invitados;
CREATE POLICY "anon_insert_invitados" ON invitados FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_invitados" ON invitados;
CREATE POLICY "anon_update_invitados" ON invitados FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_invitados" ON invitados;
CREATE POLICY "anon_delete_invitados" ON invitados FOR DELETE
  TO anon, authenticated USING (true);