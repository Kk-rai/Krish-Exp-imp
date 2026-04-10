-- ═══════════════════════════════════════════════════════════════════════════
-- KrishiConnect v2 — Complete Supabase Schema
-- Run this in: https://supabase.com/dashboard/project/oielrikosffzuklajfpi/sql/new
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Profiles (extends auth.users) ─────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  created_at  timestamptz default now(),
  email       text,
  name        text,
  phone       text,
  state       text,
  role        text default 'farmer' check (role in ('farmer','buyer','admin')),
  verified    boolean default false,
  avatar_url  text
);

-- Auto-create profile row when user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'farmer')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── 2. Listings ───────────────────────────────────────────────────────────────
create table if not exists public.listings (
  id              uuid default gen_random_uuid() primary key,
  created_at      timestamptz default now(),
  farmer_id       uuid references public.profiles(id) on delete cascade,
  farmer_name     text,
  commodity       text not null,
  quantity_kg     numeric not null check (quantity_kg > 0),
  price_inr_kg    numeric check (price_inr_kg >= 0),
  state           text not null,
  district        text,
  description     text,
  is_available    boolean default true,
  is_ceta_eligible boolean default true
);

-- ── 3. Enquiries ──────────────────────────────────────────────────────────────
create table if not exists public.enquiries (
  id              uuid default gen_random_uuid() primary key,
  created_at      timestamptz default now(),
  listing_id      uuid references public.listings(id) on delete set null,
  buyer_id        uuid references public.profiles(id) on delete set null,
  buyer_name      text not null,
  buyer_email     text not null,
  buyer_company   text,
  quantity_kg     numeric,
  message         text,
  status          text default 'pending' check (status in ('pending','contacted','closed'))
);

-- ── 4. Calculations history ───────────────────────────────────────────────────
create table if not exists public.calculations (
  id           uuid default gen_random_uuid() primary key,
  created_at   timestamptz default now(),
  user_id      uuid references public.profiles(id) on delete set null,
  crop         text,
  quantity_kg  numeric,
  source_state text,
  uk_city      text,
  total_gbp    numeric,
  farmer_payout numeric,
  fx_rate      numeric,
  is_ceta_zero boolean
);

-- ── 5. Row Level Security ──────────────────────────────────────────────────────
alter table public.profiles     enable row level security;
alter table public.listings     enable row level security;
alter table public.enquiries    enable row level security;
alter table public.calculations enable row level security;

-- Profiles: users see their own; admins see all
create policy "User can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Admin can view all profiles"
  on public.profiles for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
create policy "User can update own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Service role can insert profiles"
  on public.profiles for insert with check (true);

-- Listings: public read; only farmer owner can modify
create policy "Anyone can view listings"
  on public.listings for select using (true);
create policy "Farmer can create listing"
  on public.listings for insert with check (auth.uid() = farmer_id);
create policy "Farmer can update own listing"
  on public.listings for update using (auth.uid() = farmer_id);
create policy "Admin can update any listing"
  on public.listings for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Enquiries: buyers create; farmers see enquiries for their listings; admins see all
create policy "Authenticated can create enquiry"
  on public.enquiries for insert with check (auth.uid() is not null);
create policy "Unauthenticated can create enquiry"
  on public.enquiries for insert with check (true);
create policy "Farmer sees enquiries for their listings"
  on public.enquiries for select using (
    exists (select 1 from public.listings l where l.id = listing_id and l.farmer_id = auth.uid())
  );
create policy "Buyer sees own enquiries"
  on public.enquiries for select using (auth.uid() = buyer_id);
create policy "Admin sees all enquiries"
  on public.enquiries for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
create policy "Admin can update enquiry status"
  on public.enquiries for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Calculations: user sees own; admins see all
create policy "User can insert own calculation"
  on public.calculations for insert with check (true);
create policy "User can view own calculations"
  on public.calculations for select using (auth.uid() = user_id);

-- ── 6. Email notifications via Supabase Edge Function hook ───────────────────
-- When enquiry is created, send email to farmer (configure in Supabase dashboard)
-- Supabase → Database → Webhooks → Create webhook:
--   Table: enquiries | Event: INSERT
--   URL: https://oielrikosffzuklajfpi.supabase.co/functions/v1/notify-farmer
-- (Edge function code is in supabase/functions/notify-farmer/index.ts)

-- ── 7. Admin user setup ───────────────────────────────────────────────────────
-- After creating your admin account via the app, run this to promote it:
-- UPDATE public.profiles SET role = 'admin', verified = true WHERE email = 'your-admin@email.com';

-- ── 8. Sample data ────────────────────────────────────────────────────────────
-- Note: listings require real farmer_id from auth.users
-- Use the app to create listings, or insert with a real UUID:
-- insert into public.listings (farmer_id, farmer_name, commodity, quantity_kg, price_inr_kg, state, district, description)
-- values ('<your-farmer-uuid>', 'Ramesh Patel', 'Garlic', 5000, 55, 'Madhya Pradesh', 'Mandsor', 'Export grade');

-- ── 9. Indexes for performance ────────────────────────────────────────────────
create index if not exists idx_listings_commodity on public.listings(commodity);
create index if not exists idx_listings_state on public.listings(state);
create index if not exists idx_listings_farmer on public.listings(farmer_id);
create index if not exists idx_enquiries_listing on public.enquiries(listing_id);
create index if not exists idx_enquiries_status on public.enquiries(status);
create index if not exists idx_profiles_role on public.profiles(role);
