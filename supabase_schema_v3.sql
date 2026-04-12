-- ═══════════════════════════════════════════════════════════════════════════
-- KrishiConnect v3 — PRODUCTION SCHEMA (FINAL)
-- Paste this ENTIRE file into Supabase SQL Editor and click Run
-- Dashboard → SQL Editor → New Query → Paste → Run
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Drop ALL existing policies first (safe to re-run) ────────────────────
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ── Tables (CREATE IF NOT EXISTS — safe to re-run) ───────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  created_at  TIMESTAMPTZ DEFAULT now(),
  email       TEXT,
  name        TEXT,
  phone       TEXT,
  state       TEXT,
  company     TEXT,
  role        TEXT DEFAULT 'farmer' CHECK (role IN ('farmer','buyer','admin')),
  verified    BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.listings (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       TIMESTAMPTZ DEFAULT now(),
  farmer_id        UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  farmer_name      TEXT,
  farmer_phone     TEXT,
  commodity        TEXT NOT NULL,
  quantity_kg      NUMERIC NOT NULL CHECK (quantity_kg > 0),
  price_inr_kg     NUMERIC,
  state            TEXT NOT NULL,
  district         TEXT,
  description      TEXT,
  grade            TEXT,
  moisture_pct     NUMERIC,
  is_available     BOOLEAN DEFAULT true,
  is_ceta_eligible BOOLEAN DEFAULT true,
  views            INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.enquiries (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    TIMESTAMPTZ DEFAULT now(),
  listing_id    UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  buyer_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  buyer_name    TEXT NOT NULL,
  buyer_email   TEXT NOT NULL,
  buyer_company TEXT,
  quantity_kg   NUMERIC,
  message       TEXT,
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending','contacted','closed'))
);

CREATE TABLE IF NOT EXISTS public.calculations (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    TIMESTAMPTZ DEFAULT now(),
  user_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  crop          TEXT,
  quantity_kg   NUMERIC,
  source_state  TEXT,
  uk_city       TEXT,
  total_gbp     NUMERIC,
  farmer_payout NUMERIC,
  fx_rate       NUMERIC,
  is_ceta_zero  BOOLEAN
);

-- ── Trigger: auto-create profile row on new user signup ──────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'farmer')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ── Enable RLS on all tables ──────────────────────────────────────────────
ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculations ENABLE ROW LEVEL SECURITY;

-- ── profiles policies ─────────────────────────────────────────────────────
-- Own profile: read + write
CREATE POLICY "profiles_select_own"   ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own"   ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert"       ON public.profiles FOR INSERT WITH CHECK (true);

-- Admin: see all profiles, update any (for verify, role changes)
CREATE POLICY "profiles_select_admin" ON public.profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
CREATE POLICY "profiles_update_admin" ON public.profiles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ── listings policies ─────────────────────────────────────────────────────
-- Anyone (including public) can read active listings
CREATE POLICY "listings_select_all" ON public.listings FOR SELECT USING (true);

-- KEY FIX: Any logged-in user can post — no verified check.
-- Same as OLX — list first, verify later. Admin removes bad ones.
CREATE POLICY "listings_insert_auth" ON public.listings FOR INSERT
  WITH CHECK (auth.uid() = farmer_id);

-- Farmer can update/delete their own listings
CREATE POLICY "listings_update_own" ON public.listings FOR UPDATE
  USING (auth.uid() = farmer_id);
CREATE POLICY "listings_delete_own" ON public.listings FOR DELETE
  USING (auth.uid() = farmer_id);

-- Admin can update or delete any listing
CREATE POLICY "listings_update_admin" ON public.listings FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
CREATE POLICY "listings_delete_admin" ON public.listings FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ── enquiries policies ────────────────────────────────────────────────────
-- Anyone can send an enquiry (no login required — like OLX contact seller)
CREATE POLICY "enquiries_insert_anyone" ON public.enquiries FOR INSERT WITH CHECK (true);

-- Farmer sees enquiries on their listings
CREATE POLICY "enquiries_select_farmer" ON public.enquiries FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.farmer_id = auth.uid()));

-- Buyer sees their own enquiries
CREATE POLICY "enquiries_select_buyer" ON public.enquiries FOR SELECT
  USING (auth.uid() = buyer_id);

-- Admin sees all enquiries and can update status
CREATE POLICY "enquiries_select_admin" ON public.enquiries FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
CREATE POLICY "enquiries_update_admin" ON public.enquiries FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ── calculations policies ─────────────────────────────────────────────────
CREATE POLICY "calc_insert" ON public.calculations FOR INSERT WITH CHECK (true);
CREATE POLICY "calc_select" ON public.calculations FOR SELECT USING (auth.uid() = user_id);

-- ── Indexes for performance ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_listings_commodity ON public.listings(commodity);
CREATE INDEX IF NOT EXISTS idx_listings_state     ON public.listings(state);
CREATE INDEX IF NOT EXISTS idx_listings_available ON public.listings(is_available);
CREATE INDEX IF NOT EXISTS idx_listings_farmer    ON public.listings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_listing  ON public.enquiries(listing_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_buyer    ON public.enquiries(buyer_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_status   ON public.enquiries(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role      ON public.profiles(role);

-- ── SEED DATA — 10 realistic listings (safe to re-run) ───────────────────
INSERT INTO public.profiles (id, email, name, phone, state, role, verified) VALUES
  ('00000000-0000-0000-0000-000000000001', 'demo@krishiconnect.in', 'KrishiConnect Demo', '+91-0000000000', 'Madhya Pradesh', 'farmer', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.listings (farmer_id, farmer_name, farmer_phone, commodity, quantity_kg, price_inr_kg, state, district, description, grade, moisture_pct, is_available, is_ceta_eligible) VALUES
  ('00000000-0000-0000-0000-000000000001','Ramesh Patel',   '+91-9826012345','Garlic',   8000,  58, 'Madhya Pradesh','Mandsor',   'White garlic, large bulb 5–6cm, machine graded, APEDA registered farm. Ready to ship from JNPT.',       'Export Grade A', 11.5, true, true),
  ('00000000-0000-0000-0000-000000000001','Suresh Yadav',   '+91-9823456781','Onion',   12000,  24, 'Maharashtra',   'Nashik',    'Red onion 5–7cm, double peeled, sorted. Nashik APMC certified. 10MT minimum order.',                   'Export Grade A', 12.0, true, true),
  ('00000000-0000-0000-0000-000000000001','Kavita Sharma',  '+91-9848123456','Turmeric',  3000, 102, 'Telangana',     'Nizamabad', 'Erode variety, 7% curcumin, machine polished, fumigation certificate available.',                     'Premium',         9.5, true, true),
  ('00000000-0000-0000-0000-000000000001','Murugan Pillai', '+91-9447234567','Ginger',    4500,  44, 'Kerala',        'Wayanad',   'Baby ginger, tender, fibrous variety preferred by UK curry houses. FSSAI certified.',                   'Export Grade A', 13.0, true, true),
  ('00000000-0000-0000-0000-000000000001','Anjali Reddy',   '+91-9849012345','Chilli',    2000,  80, 'Andhra Pradesh','Guntur',    'Guntur Sannam S4, 12–14% moisture, Scoville 35,000–40,000 HU. Popular in UK Asian grocery.',          'S4 Export',      13.5, true, true),
  ('00000000-0000-0000-0000-000000000001','Vikram Singh',   '+91-9415234567','Potato',   15000,  15, 'Uttar Pradesh', 'Agra',      'Kufri Chipsona 1, 40–60mm, washed and graded. Cold storage available. FCL preferred.',                 'Grade A',        14.0, true, true),
  ('00000000-0000-0000-0000-000000000001','Harish Patel',   '+91-9824567890','Garlic',    5000,  54, 'Gujarat',       'Bhavnagar', 'White garlic, medium bulb 4–5cm. Competitive price for large buyers. Minimum 5MT.',                    'Export Grade B', 12.0, true, true),
  ('00000000-0000-0000-0000-000000000001','Deepa Nair',     '+91-9895123456','Ginger',    2500,  46, 'Kerala',        'Idukki',    'Mature dry ginger, high oleoresin content, preferred by UK spice processors. Organic certified.',       'Organic Export', 10.5, true, true),
  ('00000000-0000-0000-0000-000000000001','Ravi Kumar',     '+91-9440123456','Turmeric',  2000,  95, 'Andhra Pradesh','Nalgonda',  'Salem variety, 4% curcumin, finger turmeric, polished. Documents ready: phyto, CoO, invoice.',        'Grade A',        10.0, true, true),
  ('00000000-0000-0000-0000-000000000001','Priya Menon',    '+91-9447890123','Onion',     8000,  22, 'Karnataka',     'Belgaum',   'White onion, 5–6cm, export quality. Karnataka APMC certified. Available for spot shipment.',            'Export Grade A', 12.5, true, true)
ON CONFLICT DO NOTHING;

-- ── Make yourself admin (run this ONE line separately after signing up) ───
-- UPDATE public.profiles SET role = 'admin', verified = true WHERE email = 'your@email.com';

