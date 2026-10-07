/*
# Create waitlist table

1. New Tables
- `waitlist`
  - `id` (uuid, primary key, auto-generated)
  - `email` (text, unique, not null) — the submitter's work email
  - `role` (text, not null, default 'member') — the submitter's role/interest category
  - `created_at` (timestamptz, default now()) — when the entry was created

2. Security
- Enable RLS on `waitlist`.
- Allow anon + authenticated INSERT so visitors can join the waitlist without signing in.
- No SELECT, UPDATE, or DELETE policies — entries are write-only from the client.
  Only the service-role key (server-side) can read or manage waitlist entries.

3. Notes
- This is a no-auth app (no sign-in screen), so INSERT is open to `anon`.
- `email` has a unique constraint to prevent duplicate waitlist entries.
- `role` defaults to 'member' but can be set to categorize interest (e.g. 'proxy-beta').
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
