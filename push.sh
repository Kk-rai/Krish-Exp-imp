#!/bin/bash
# ─── KrishiConnect v2 — Git Push Script ──────────────────────────────────────
# Run this from your project root after copying all files

echo "🌾 KrishiConnect v2 — Preparing to push..."

# 1. Copy all new files into the repo structure
# (assumes you've already placed the files correctly)

# 2. Stage all changes
git add .

# 3. Commit
git commit -m "feat: v3 — auth/OTP login, admin panel, farmer dashboard, live APIs, email notifications

- Add Supabase Auth with email OTP (no password needed)
- Farmer/buyer/admin role system
- Admin panel: verify farmers, manage enquiries & listings
- Farmer dashboard: post listings, view enquiries, reply by email
- Live agmarknet API (data.gov.in) with smart mock fallback
- Fixer.io GBP/INR with open-er-api secondary fallback  
- UK Trade Tariff live API (no key needed)
- Supabase Edge Function for email notifications on new enquiry
- Full RLS policies securing all tables
- Auto-trigger profile creation on user signup
- Price calculator wired to all 3 live data sources"

# 4. Push to GitHub
git push origin main

echo "✅ Pushed to GitHub!"
echo ""
echo "Next steps:"
echo "1. Go to Vercel → Settings → Environment Variables"
echo "2. Add all 5 vars from .env.example"
echo "3. Redeploy"
echo "4. Run supabase_schema_v2.sql in Supabase SQL editor"
echo "5. Set yourself as admin: UPDATE profiles SET role='admin' WHERE email='your@email.com'"
