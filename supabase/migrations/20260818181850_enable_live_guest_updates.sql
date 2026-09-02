/*
# Enable live guest check-in updates

1. Modified Database Features
- Add `invitados` to the Supabase realtime publication so reception screens can receive check-in changes immediately.

2. Security
- No policy changes. Existing row-level security policies remain unchanged.

3. Notes
- The frontend also refreshes periodically as a resilient fallback for devices or environments where realtime delivery is delayed.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'invitados'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.invitados;
  END IF;
END $$;