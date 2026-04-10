-- ============================================================
-- KrishiConnect DB Migration — Run ONCE in Supabase SQL Editor
-- Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

-- 1. Add farmer_id FK to listings (safe — skips if already exists)
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS farmer_id uuid REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS listings_farmer_id_idx ON listings(farmer_id);

-- 2. RLS: farmers can only insert their own listings
DROP POLICY IF EXISTS "Farmers insert own listings" ON listings;
CREATE POLICY "Farmers insert own listings"
  ON listings FOR INSERT
  WITH CHECK (auth.uid() = farmer_id);

-- 3. RLS: farmers can only update/delete their own listings
DROP POLICY IF EXISTS "Farmers manage own listings" ON listings;
CREATE POLICY "Farmers manage own listings"
  ON listings FOR UPDATE
  USING (auth.uid() = farmer_id);

DROP POLICY IF EXISTS "Farmers delete own listings" ON listings;
CREATE POLICY "Farmers delete own listings"
  ON listings FOR DELETE
  USING (auth.uid() = farmer_id);

-- 4. Public can read active listings; farmer can see their own
DROP POLICY IF EXISTS "Public read listings" ON listings;
CREATE POLICY "Public read listings"
  ON listings FOR SELECT
  USING (is_available = true OR auth.uid() = farmer_id);

-- 5. Prevent users from self-promoting to admin via client
DROP POLICY IF EXISTS "Users update own profile safe" ON profiles;
CREATE POLICY "Users update own profile safe"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role != 'admin');

-- ── To make yourself admin (run separately after above) ───────────────────────
-- UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
