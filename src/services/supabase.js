import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ── Auth helpers ──────────────────────────────────────────────────────────────
export const auth = {
  // Email OTP (magic link / OTP — no password needed)
  sendOTP: (email) =>
    supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } }),

  // Phone OTP via Twilio (enable in Supabase → Auth → Providers → Phone)
  sendPhoneOTP: (phone) =>
    supabase.auth.signInWithOtp({ phone, options: { shouldCreateUser: true } }),

  verifyEmailOTP: (email, token) =>
    supabase.auth.verifyOtp({ email, token, type: "email" }),

  verifyPhoneOTP: (phone, token) =>
    supabase.auth.verifyOtp({ phone, token, type: "sms" }),

  signOut: () => supabase.auth.signOut(),
  getSession: () => supabase.auth.getSession(),
  getUser: () => supabase.auth.getUser(),
  onAuthChange: (cb) => supabase.auth.onAuthStateChange(cb),
};

// ── Profiles ──────────────────────────────────────────────────────────────────
export async function upsertProfile(profile) {
  const { data, error } = await supabase
    .from("profiles")
    .upsert(profile, { onConflict: "id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data;
}

// ── Listings ──────────────────────────────────────────────────────────────────
export async function getListings(filters = {}) {
  let q = supabase
    .from("listings")
    .select("*, profiles(name, phone, state, verified)")
    .eq("is_available", true)
    .order("created_at", { ascending: false });
  if (filters.commodity) q = q.eq("commodity", filters.commodity);
  if (filters.state) q = q.eq("state", filters.state);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function getMyListings(userId) {
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("farmer_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createListing(listing) {
  const { data, error } = await supabase
    .from("listings")
    .insert([listing])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateListing(id, updates) {
  const { data, error } = await supabase
    .from("listings")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Enquiries ─────────────────────────────────────────────────────────────────
export async function createEnquiry(enquiry) {
  const { data, error } = await supabase
    .from("enquiries")
    .insert([enquiry])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// FIX: correct query — first get farmer's listing IDs, then filter enquiries
export async function getEnquiriesForFarmer(farmerId) {
  const { data: myListings, error: listErr } = await supabase
    .from("listings")
    .select("id")
    .eq("farmer_id", farmerId);
  if (listErr) throw listErr;

  const ids = (myListings || []).map((l) => l.id);
  if (!ids.length) return [];

  const { data, error } = await supabase
    .from("enquiries")
    .select("*, listings(commodity, quantity_kg)")
    .in("listing_id", ids)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

// Admin: all enquiries
export async function getAllEnquiries() {
  const { data, error } = await supabase
    .from("enquiries")
    .select("*, listings(commodity, farmer_id, quantity_kg)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function updateEnquiryStatus(id, status) {
  const { data, error } = await supabase
    .from("enquiries")
    .update({ status })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Calculations history ──────────────────────────────────────────────────────
export async function saveCalculation(calc) {
  const { error } = await supabase.from("calculations").insert([calc]);
  if (error) console.warn("calc save failed:", error.message);
}

// ── Admin helpers ─────────────────────────────────────────────────────────────
export async function getAllProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function setUserRole(userId, role) {
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);
  if (error) throw error;
}

export async function verifyFarmer(userId, verified) {
  const { error } = await supabase
    .from("profiles")
    .update({ verified })
    .eq("id", userId);
  if (error) throw error;
}

export async function getAdminStats() {
  const [listings, enquiries, profiles] = await Promise.all([
    supabase.from("listings").select("id, is_available", { count: "exact" }),
    supabase.from("enquiries").select("id, status", { count: "exact" }),
    supabase.from("profiles").select("id, role, verified", { count: "exact" }),
  ]);
  return {
    totalListings: listings.count || 0,
    totalEnquiries: enquiries.count || 0,
    totalUsers: profiles.count || 0,
    pendingEnquiries:
      enquiries.data?.filter((e) => e.status === "pending").length || 0,
    unverifiedFarmers:
      profiles.data?.filter((p) => p.role === "farmer" && !p.verified)
        .length || 0,
  };
}
