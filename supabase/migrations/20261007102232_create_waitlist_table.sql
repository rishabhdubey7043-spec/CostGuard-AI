/*
# Create waitlist table

1. New Tables
- `waitlist`
  - `id` (uuid, primary key, auto-generated)
  - `email` (text, unique, not null) — the submitter's work email
  - `role` (text, not null, default 'member') — categorizes the entry (e.g. spend band, interests)
  - `created_at` (timestamptz, default now()) — when the entry was created

2. Security
- Enable RLS on `waitlist`.
- Allow anon + authenticated INSERT so visitors can join the waitlist without signing in.
- Allow authenticated SELECT so the admin dashboard (password-gated) can read entries.
- No UPDATE or DELETE policies — entries are write-once from the client.

3. Notes
- This app has no sign-in screen for regular users. The admin dashboard uses a
  simple password gate in the frontend, and queries via the Supabase anon key.
  The SELECT policy is scoped to `anon, authenticated` so the admin dashboard can
  read entries. The admin password is set via an environment variable.
*/

CREATE TABLE IF NOT EXISTS waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_waitlist" ON waitlist;
CREATE POLICY "anon_insert_waitlist"
ON waitlist FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_waitlist" ON waitlist;
CREATE POLICY "anon_select_waitlist"
ON waitlist FOR SELECT
TO anon, authenticated
USING (true);
