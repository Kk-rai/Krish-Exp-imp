# 🌾 KrishiConnect v2 — India → UK Agricultural Export Platform

> Pre-final year B.Tech | Indore | Live at [krish-exp-imp.vercel.app](https://krish-exp-imp.vercel.app)

## What's new in v2

| Feature | Status |
|---------|--------|
| Email OTP login (no passwords) | ✅ |
| Farmer / Buyer / Admin roles | ✅ |
| Admin panel — verify farmers, manage enquiries | ✅ |
| Farmer dashboard — post listings, view enquiries, reply by email | ✅ |
| Email notification to farmer when enquiry received | ✅ |
| Live agmarknet API (data.gov.in) with smart fallback | ✅ |
| Fixer.io + open-er-api double fallback for GBP/INR | ✅ |
| UK Trade Tariff live API (no key needed) | ✅ |
| Full Supabase RLS security policies | ✅ |
| Auto profile creation on signup | ✅ |

---

## ⚡ Quick Start

```bash
git clone https://github.com/Kk-rai/krishiconnect.git
cd krishiconnect
npm install
cp .env.example .env   # fill in your keys
npm run dev
```

---

## 🔑 Environment Variables

Add these in both your `.env` file (local) AND Vercel dashboard (production):

```env
VITE_SUPABASE_URL=https://oielrikosffzuklajfpi.supabase.co
VITE_SUPABASE_ANON_KEY=          # Supabase → Settings → API → anon key
VITE_DATAGOV_API_KEY=            # data.gov.in → Profile → API Key
VITE_FIXER_API_KEY=              # fixer.io/dashboard
VITE_ANTHROPIC_API_KEY=          # console.anthropic.com → API Keys
```

---

## 🗄️ Supabase Setup (one-time, ~5 minutes)

### Step 1 — Run the schema
1. Go to: https://supabase.com/dashboard/project/oielrikosffzuklajfpi/sql/new
2. Paste the entire contents of `supabase_schema_v2.sql`
3. Click **Run** — creates all tables, RLS policies, triggers, indexes

### Step 2 — Enable Email OTP
1. Supabase dashboard → **Authentication** → **Providers**
2. Make sure **Email** is enabled
3. Under **Email** settings → disable "Confirm email" (we use OTP flow)
4. Set OTP expiry to **3600** seconds (1 hour)

### Step 3 — Make yourself admin
After signing up through the app once, run in SQL editor:
```sql
UPDATE public.profiles 
SET role = 'admin', verified = true 
WHERE email = 'your-admin-email@example.com';
```

### Step 4 — Set up email notifications (optional but recommended)
1. Sign up at [resend.com](https://resend.com) — free 3000 emails/month
2. Install Supabase CLI: `npm install -g supabase`
3. Run: `supabase login`
4. Run: `supabase functions deploy notify-farmer --project-ref oielrikosffzuklajfpi`
5. Set secret: `supabase secrets set RESEND_API_KEY=your_resend_key --project-ref oielrikosffzuklajfpi`
6. In Supabase dashboard → **Database** → **Webhooks** → Create new:
   - Table: `enquiries` | Event: `INSERT`
   - URL: `https://oielrikosffzuklajfpi.supabase.co/functions/v1/notify-farmer`

---

## 🚀 Deploy to Vercel

```bash
git add .
git commit -m "feat: v2 complete — auth, admin panel, live APIs"
git push origin main
```

Then in [Vercel dashboard](https://vercel.com/davidks9900-6362s-projects/krishiconnect):
1. **Settings** → **Environment Variables**
2. Add all 5 variables from `.env.example`
3. **Deployments** → **Redeploy**

---

## 📁 Project Structure

```
src/
  context/
    AuthContext.jsx        ← Session + role management (wraps whole app)
  pages/
    LoginPage.jsx          ← Email OTP, role select, profile setup
    AdminPanel.jsx         ← Verify farmers, manage enquiries & listings
    FarmerDashboard.jsx    ← Post listings, view enquiries, reply
  components/
    KrishiAI.jsx           ← Floating AI chat (EN/HI)
    PriceCalculator.jsx    ← Full calculator with live data
    PriceTicker.jsx        ← Scrolling mandi price ticker
    Listings.jsx           ← Marketplace browse + enquiry form
  services/
    supabase.js            ← DB client + all query helpers + auth helpers
    agmarknet.js           ← Live mandi prices (data.gov.in) + fallback
    fixer.js               ← GBP/INR rate (fixer.io + open-er-api fallback)
    ukTariff.js            ← UK import duties (live GOV.UK API, no key)
    claude.js              ← KrishiAI (Anthropic claude-sonnet-4-6)
  utils/
    priceCalculator.js     ← Core landed cost engine
  App.jsx                  ← Router, nav, auth gating
supabase/
  functions/
    notify-farmer/
      index.ts             ← Edge function: email farmer on new enquiry
supabase_schema_v2.sql     ← Complete DB schema — run once in SQL editor
.env.example               ← All required env vars
```

---

## 🔐 Security Features

- **No passwords** — email OTP only (Supabase Auth)
- **Row Level Security** on every table — users can only access their own data
- **Role-based access** — farmer/buyer/admin with different permissions
- **Farmer verification** — admin must verify before listing appears
- **API keys in env vars** — never in source code
- **CORS handled** by Supabase and Vercel automatically

---

## 🧪 Test the APIs locally

```js
// In browser console after npm run dev:

// Test mandi price (mock until key added)
import { getMandiPrice } from "./src/services/agmarknet.js"
const p = await getMandiPrice("Garlic", "Madhya Pradesh")
console.log(p) // { modalPrice: 5500, perKg: 55, ... }

// Test exchange rate
import { getGBPtoINR } from "./src/services/fixer.js"
const fx = await getGBPtoINR()
console.log(fx.INRperGBP) // 107.42

// Test full calculator
import { calculateLandedCost } from "./src/utils/priceCalculator.js"
const r = await calculateLandedCost({ crop:"Garlic", quantityKg:500, sourceState:"Madhya Pradesh", ukCity:"London" })
console.log(r.totalGBPFormatted, r.farmerPayoutFormatted)
```

---

*Built in Indore by a B.Tech student. Indian farmers deserve better margins. 🌾*
