import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase, getMyListings, getEnquiriesForFarmer, createListing, updateListing, deleteListing } from "../services/supabase";
import PriceCalculator from "../components/PriceCalculator";
import KrishiAI from "../components/KrishiAI";

const CROPS  = ["Garlic","Onion","Potato","Turmeric","Ginger","Chilli"];
const STATES = ["Madhya Pradesh","Maharashtra","Uttar Pradesh","Telangana","Kerala","Andhra Pradesh","Gujarat","Punjab","Rajasthan","Karnataka","Bihar","West Bengal","Tamil Nadu","Odisha","Haryana"];
const CROP_EMOJI = { Garlic:"🧄", Onion:"🧅", Potato:"🥔", Turmeric:"🌿", Ginger:"🫚", Chilli:"🌶️" };

const SIDENAV = [
  { id:"dashboard",  icon:"📊", label:"Dashboard" },
  { id:"listings",   icon:"🌾", label:"My Listings" },
  { id:"enquiries",  icon:"📬", label:"Enquiries" },
  { id:"calculator", icon:"🧮", label:"Price Calculator" },
  { id:"profile",    icon:"👤", label:"My Profile" },
];

export default function FarmerPanel() {
  const { user, profile, reloadProfile } = useAuth();
  const [page, setPage]           = useState("dashboard");
  const [listings, setListings]   = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [l, e] = await Promise.all([getMyListings(user.id), getEnquiriesForFarmer(user.id)]);
      setListings(l || []);
      setEnquiries(e || []);
    } catch (err) { console.error("Load error:", err); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const pendingEnquiries = enquiries.filter(e => e.status === "pending").length;

  return (
    <div className="flex min-h-screen" style={{ fontFamily:"'DM Sans',sans-serif" }}>

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className={`${collapsed?"w-[68px]":"w-[240px]"} flex-shrink-0 transition-all duration-200 flex flex-col`}
        style={{ background:"linear-gradient(180deg,#0d2e17 0%,#1a4a28 100%)", minHeight:"100vh", position:"sticky", top:0, height:"100vh", overflowY:"auto" }}>

        <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-green-500/20 flex items-center justify-center text-lg flex-shrink-0">🌾</div>
          {!collapsed && (
            <div>
              <div className="font-bold text-white text-sm" style={{ fontFamily:"'DM Serif Display',serif" }}>KrishiConnect</div>
              <div className="text-green-400 text-xs">Farmer Portal</div>
            </div>
          )}
          <button onClick={() => setCollapsed(v=>!v)} className="ml-auto text-white/40 hover:text-white/80 text-lg flex-shrink-0">
            {collapsed ? "→" : "←"}
          </button>
        </div>

        {!collapsed && (
          <div className="mx-3 mt-4 p-3 rounded-xl" style={{ background:"rgba(255,255,255,.06)" }}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {(profile?.name||"F")[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-white font-semibold text-sm truncate">{profile?.name || user?.email?.split("@")[0] || "Farmer"}</div>
                <div className="text-green-400 text-xs truncate">{profile?.state || "India"}</div>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${profile?.verified ? "bg-green-400" : "bg-yellow-400"}`}/>
              <span className={`text-xs ${profile?.verified ? "text-green-400" : "text-yellow-400"}`}>
                {profile?.verified ? "Verified Farmer ✓" : "Pending Verification"}
              </span>
            </div>
          </div>
        )}

        <nav className="flex-1 px-2 py-4 space-y-0.5">
          {SIDENAV.map(item => (
            <button key={item.id} onClick={() => setPage(item.id)}
              className={`nav-item w-full ${page===item.id?"active":""}`}
              style={{ color: page===item.id?"#4ade80":"#94a3b8" }}>
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.id==="enquiries" && pendingEnquiries > 0 && (
                <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full bg-green-500 text-white font-bold">{pendingEnquiries}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <button onClick={() => supabase.auth.signOut()}
            className={`nav-item w-full ${collapsed?"justify-center":""}`} style={{ color:"#f87171" }}>
            <span className="text-lg flex-shrink-0">🚪</span>
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto" style={{ background:"#f0f2f5" }}>
        {/* Topbar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="font-bold text-gray-800 text-lg">
              {SIDENAV.find(n=>n.id===page)?.icon} {SIDENAV.find(n=>n.id===page)?.label}
            </h1>
            <p className="text-gray-400 text-xs mt-0.5">
              KrishiConnect · {new Date().toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="text-xs px-3 py-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 font-medium">↻ Refresh</button>
            {page !== "listings" && (
              <button onClick={() => setPage("listings")} className="btn-primary text-xs px-4 py-2">+ Post Listing</button>
            )}
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div style={{ width:32, height:32, border:"3px solid #e2e8f0", borderTopColor:"#2d7a3a", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>
            </div>
          ) : (
            <>
              {page === "dashboard"  && <FarmerHome listings={listings} enquiries={enquiries} profile={profile} setPage={setPage} />}
              {page === "listings"   && <MyListings listings={listings} user={user} profile={profile} onRefresh={load} />}
              {page === "enquiries"  && <EnquiriesPage enquiries={enquiries} />}
              {page === "calculator" && <PriceCalculator />}
              {page === "profile"    && <FarmerProfile profile={profile} user={user} reloadProfile={reloadProfile} />}
            </>
          )}
        </div>
      </main>

      <KrishiAI />
    </div>
  );
}

// ── Dashboard Home ─────────────────────────────────────────────────────────────
function FarmerHome({ listings, enquiries, profile, setPage }) {
  const activeListings = listings.filter(l => l.is_available).length;
  const pendingEnq     = enquiries.filter(e => e.status === "pending").length;
  const totalRevenue   = listings.reduce((s,l) => s + (l.quantity_kg * (l.price_inr_kg||0)), 0);

  return (
    <div className="space-y-6 anim-fade">
      {/* Verification banner */}
      {!profile?.verified && (
        <div className="rounded-xl p-4 flex items-start gap-3" style={{ background:"#fffbeb", border:"1px solid #f59e0b" }}>
          <span className="text-xl flex-shrink-0">⏳</span>
          <div>
            <p className="font-semibold text-amber-800 text-sm">Verification Pending</p>
            <p className="text-amber-700 text-xs mt-0.5">Admin will verify your account within 24 hours. You can post listings now — they'll be live immediately.</p>
          </div>
        </div>
      )}

      {/* Profile incomplete warning */}
      {!profile?.name && (
        <div className="rounded-xl p-4 flex items-start gap-3" style={{ background:"#eff6ff", border:"1px solid #3b82f6" }}>
          <span className="text-xl flex-shrink-0">👤</span>
          <div className="flex-1">
            <p className="font-semibold text-blue-800 text-sm">Complete your profile</p>
            <p className="text-blue-700 text-xs mt-0.5">Add your name and phone so buyers can contact you when you post a listing.</p>
          </div>
          <button onClick={() => setPage("profile")} className="btn-primary text-xs px-3 py-1.5 flex-shrink-0">Update →</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:"Active Listings", value:activeListings, icon:"🌾", color:"#2d7a3a", action:() => setPage("listings") },
          { label:"New Enquiries",   value:pendingEnq,     icon:"📬", color:"#2563eb", action:() => setPage("enquiries") },
          { label:"Total Listings",  value:listings.length, icon:"📦", color:"#7c3aed", action:null },
          { label:"Revenue Potential", value:totalRevenue > 0 ? `₹${(totalRevenue/100000).toFixed(1)}L` : "—", icon:"💰", color:"#d97706", action:null },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.action?"cursor-pointer hover:shadow-md":""} transition-all`} onClick={s.action||undefined}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{s.icon}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:`${s.color}15` }}>
                <div className="w-2 h-2 rounded-full" style={{ background:s.color }}/>
              </div>
            </div>
            <div className="font-bold text-2xl text-gray-800">{s.value}</div>
            <div className="text-gray-400 text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick action */}
      <div className="card p-6" style={{ background:"linear-gradient(135deg,#0d2e17,#1a4a28)" }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
          <div>
            <h3 className="font-bold text-white text-lg">Ready to reach UK buyers?</h3>
            <p className="text-green-300 text-sm mt-1">Post your produce in 2 minutes. 0% UK import duty via CETA.</p>
          </div>
          <button onClick={() => setPage("listings")} className="btn-primary flex-shrink-0" style={{ background:"linear-gradient(135deg,#f5a623,#e08c10)" }}>
            + Post New Listing →
          </button>
        </div>
      </div>

      {/* Recent listings */}
      {listings.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">Recent Listings</h3>
            <button onClick={() => setPage("listings")} className="text-xs text-green-700 font-semibold hover:underline">View All →</button>
          </div>
          <div className="space-y-3">
            {listings.slice(0,3).map(l => (
              <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background:"#f8fafc" }}>
                <span className="text-2xl">{CROP_EMOJI[l.commodity]||"🌿"}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800 text-sm">{l.commodity} — {l.quantity_kg?.toLocaleString("en-IN")} kg</div>
                  <div className="text-gray-400 text-xs">{l.district}, {l.state}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-green-700 text-sm">{l.price_inr_kg ? `₹${l.price_inr_kg}/kg` : "Best Offer"}</div>
                  <span className={`badge text-xs ${l.is_available?"bg-green-50 text-green-700":"bg-gray-100 text-gray-500"}`}>
                    {l.is_available ? "Live" : "Sold"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── My Listings + Post Form ────────────────────────────────────────────────────
function MyListings({ listings, user, profile, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Form defaults — always pull real profile data
  const defaultForm = () => ({
    commodity:"Garlic",
    quantity_kg:"",
    price_inr_kg:"",
    state: profile?.state || "Madhya Pradesh",
    district:"",
    description:"",
    grade:"",
  });
  const [form, setForm] = useState(defaultForm);

  // Re-sync state dropdown if profile loads after component mounts
  useEffect(() => {
    setForm(f => ({ ...f, state: profile?.state || f.state }));
  }, [profile?.state]);

  const showT = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  const openForm = () => {
    setForm(defaultForm());
    setShowForm(true);
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!form.quantity_kg || Number(form.quantity_kg) <= 0) {
      showT("❌ Please enter a valid quantity.", "error"); return;
    }
    if (!user?.id) {
      showT("❌ Not logged in. Please refresh and try again.", "error"); return;
    }
    if (!profile?.name) {
      showT("❌ Please complete your profile (add your name) before posting.", "error"); return;
    }

    setSaving(true);
    try {
      await createListing({
        farmer_id:    user.id,
        // FIXED: always use real profile data, never hardcoded test data
        farmer_name:  profile.name,
        farmer_phone: profile.phone || null,
        commodity:    form.commodity,
        quantity_kg:  Number(form.quantity_kg),
        price_inr_kg: form.price_inr_kg ? Number(form.price_inr_kg) : null,
        state:        form.state,
        district:     form.district.trim() || null,
        description:  form.description.trim() || null,
        grade:        form.grade.trim() || null,
        is_available: true,
        is_ceta_eligible: true,
      });
      showT("✅ Listing posted! UK buyers can now see your produce.");
      setShowForm(false);
      onRefresh();
    } catch (err) {
      console.error("Post listing error:", err);
      // Show the actual Supabase error message so it's debuggable
      showT(`❌ Failed to post: ${err?.message || "Unknown error. Check console for details."}`, "error");
    } finally { setSaving(false); }
  };

  const toggleAvailable = async (l) => {
    try {
      await updateListing(l.id, { is_available: !l.is_available });
      showT(l.is_available ? "Listing marked as Sold" : "✅ Listing is Live again!");
      onRefresh();
    } catch (err) { showT(`❌ Could not update: ${err?.message}`, "error"); }
  };

  const handleDelete = async (id) => {
    try {
      await deleteListing(id);
      setDeleteConfirm(null);
      showT("Listing deleted.");
      onRefresh();
    } catch (err) { showT(`❌ Could not delete: ${err?.message}`, "error"); }
  };

  return (
    <div className="space-y-5 anim-fade">
      {toast && (
        <div className={`p-3 rounded-xl text-sm font-medium anim-fade ${toast.type==="error"?"bg-red-50 border border-red-200 text-red-700":"bg-green-50 border border-green-200 text-green-700"}`}>
          {toast.msg}
        </div>
      )}

      {/* Profile incomplete gate */}
      {!profile?.name && (
        <div className="p-4 rounded-xl" style={{ background:"#fffbeb", border:"1px solid #f59e0b" }}>
          <p className="text-amber-800 text-sm font-semibold">⚠️ Complete your profile first</p>
          <p className="text-amber-700 text-xs mt-1">Go to <strong>My Profile</strong> and add your name before posting a listing — buyers need to know who you are.</p>
        </div>
      )}

      {/* Post button / form toggle */}
      {!showForm ? (
        <button onClick={openForm}
          className="w-full p-4 rounded-xl border-2 border-dashed border-green-300 text-green-700 font-semibold text-sm hover:bg-green-50 transition-all flex items-center justify-center gap-2">
          <span className="text-xl">+</span> Post New Produce Listing
        </button>
      ) : (
        /* ── Post Form ─────────────────────────────────────────────────── */
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100" style={{ background:"linear-gradient(135deg,#0d2e17,#1a4a28)" }}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-white text-base">Post Your Produce</h2>
                <p className="text-green-300 text-xs mt-0.5">Reach UK buyers directly · 2% platform fee only</p>
              </div>
              <button onClick={() => setShowForm(false)} className="text-white/50 hover:text-white text-xl font-light">✕</button>
            </div>
          </div>

          <form onSubmit={handlePost} className="p-6 space-y-5">

            {/* Seller info preview — so farmer can see what buyers will see */}
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background:"#f8fafc", border:"1px solid #e2e8f0" }}>
              <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {(profile?.name||"F")[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400">This listing will appear as:</p>
                <p className="font-semibold text-gray-800 text-sm">{profile?.name || "—"}</p>
                <p className="text-xs text-gray-400">{profile?.phone || "No phone added"} · {profile?.state}</p>
              </div>
              {!profile?.name && (
                <p className="text-xs text-red-500 font-medium flex-shrink-0">⚠️ Add your name in Profile first</p>
              )}
            </div>

            {/* Row 1 — Commodity + State */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Commodity *</label>
                <select className="inp" value={form.commodity} onChange={e => setForm(f=>({...f,commodity:e.target.value}))} required>
                  {CROPS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">State *</label>
                <select className="inp" value={form.state} onChange={e => setForm(f=>({...f,state:e.target.value}))} required>
                  {STATES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Row 2 — Quantity + Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Quantity (kg) *</label>
                <div className="relative">
                  <input className="inp pr-12" type="number" min="1" placeholder="e.g. 5000"
                    value={form.quantity_kg} onChange={e => setForm(f=>({...f,quantity_kg:e.target.value}))} required />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">kg</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Your Price (₹/kg)
                  <span className="text-gray-400 font-normal ml-1">(optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                  <input className="inp pl-7" type="number" min="0" step="0.5" placeholder="Leave blank for best offer"
                    value={form.price_inr_kg} onChange={e => setForm(f=>({...f,price_inr_kg:e.target.value}))} />
                </div>
              </div>
            </div>

            {/* Row 3 — District + Grade */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  District / Mandi
                  <span className="text-gray-400 font-normal ml-1">(helps with logistics)</span>
                </label>
                <input className="inp" type="text" placeholder="e.g. Mandsor, Nashik, Wayanad"
                  value={form.district} onChange={e => setForm(f=>({...f,district:e.target.value}))} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Grade / Quality
                  <span className="text-gray-400 font-normal ml-1">(optional)</span>
                </label>
                <input className="inp" type="text" placeholder="e.g. Export Grade A, Premium"
                  value={form.grade} onChange={e => setForm(f=>({...f,grade:e.target.value}))} />
              </div>
            </div>

            {/* Row 4 — Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Description
                <span className="text-gray-400 font-normal ml-1">(quality, variety, certifications)</span>
              </label>
              <textarea className="inp resize-none" rows={3}
                placeholder="e.g. Export grade white garlic, 5–6cm bulb size, moisture below 12%, APEDA certified. Available from JNPT. Minimum order 1MT."
                value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} />
            </div>

            {/* CETA info box */}
            <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background:"#e8f5ea", border:"1px solid #b7dfbc" }}>
              <span className="text-lg flex-shrink-0">✅</span>
              <div>
                <p className="text-green-800 text-xs font-semibold">CETA 2025 — 0% UK Import Duty</p>
                <p className="text-green-700 text-xs mt-0.5">Your listing will show UK buyers the exact ₹ payout with zero duty savings highlighted.</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={saving || !profile?.name} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? (
                  <><span style={{ width:16,height:16,border:"2px solid rgba(255,255,255,.4)",borderTopColor:"white",borderRadius:"50%",animation:"spin .8s linear infinite",display:"inline-block" }}/> Posting...</>
                ) : "Post Listing →"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline px-5">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:"rgba(0,0,0,.4)" }}
          onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl anim-pop" onClick={e=>e.stopPropagation()}>
            <h3 className="font-bold text-gray-800 mb-2">Delete this listing?</h3>
            <p className="text-gray-500 text-sm mb-5">This cannot be undone. Any pending enquiries for this listing will remain in the system.</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 rounded-xl font-bold text-white text-sm" style={{ background:"#dc2626" }}>
                Yes, Delete
              </button>
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl font-bold text-gray-600 text-sm border border-gray-200">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing listings */}
      {listings.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">🌾</div>
          <h3 className="font-bold text-gray-800 mb-2">No listings yet</h3>
          <p className="text-gray-400 text-sm">Post your first produce listing to start receiving enquiries from UK buyers.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-400 font-medium">{listings.length} listing{listings.length!==1?"s":""} total</p>
          {listings.map(l => (
            <div key={l.id} className="card p-4 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: l.is_available ? "#e8f5ea" : "#f1f5f9" }}>
                {CROP_EMOJI[l.commodity]||"🌿"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <h4 className="font-bold text-gray-800">{l.commodity}{l.grade ? ` · ${l.grade}` : ""}</h4>
                    <p className="text-gray-500 text-xs mt-0.5">{l.district ? `${l.district}, ` : ""}{l.state}</p>
                  </div>
                  <span className={`badge flex-shrink-0 ${l.is_available?"bg-green-50 text-green-700":"bg-gray-100 text-gray-500"}`}>
                    {l.is_available ? "🟢 Live" : "⚫ Sold"}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-700">📦 {Number(l.quantity_kg).toLocaleString("en-IN")} kg</span>
                  {l.price_inr_kg && <span className="text-sm font-semibold text-green-700">₹{l.price_inr_kg}/kg</span>}
                  {l.price_inr_kg && l.quantity_kg && (
                    <span className="text-xs text-gray-400">Total: ₹{(l.price_inr_kg * l.quantity_kg).toLocaleString("en-IN")}</span>
                  )}
                  {!l.price_inr_kg && <span className="text-xs text-gray-400">Best Offer</span>}
                </div>
                {l.description && <p className="text-gray-400 text-xs mt-1 line-clamp-1">{l.description}</p>}
                <div className="mt-3 flex gap-2">
                  <button onClick={() => toggleAvailable(l)}
                    className="text-xs px-3 py-1.5 rounded-lg border font-medium transition-all"
                    style={{ borderColor: l.is_available?"#e2e8f0":"#16a34a", color: l.is_available?"#6b7280":"#16a34a" }}>
                    {l.is_available ? "Mark as Sold" : "Mark as Available Again"}
                  </button>
                  <button onClick={() => setDeleteConfirm(l.id)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-red-100 text-red-400 font-medium hover:bg-red-50 transition-all">
                    🗑 Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Enquiries ─────────────────────────────────────────────────────────────────
function EnquiriesPage({ enquiries }) {
  if (enquiries.length === 0) return (
    <div className="card p-12 text-center anim-fade">
      <div className="text-5xl mb-4">📬</div>
      <h3 className="font-bold text-gray-800 mb-2">No enquiries yet</h3>
      <p className="text-gray-400 text-sm">Once UK buyers contact you, their enquiries will appear here.</p>
    </div>
  );

  return (
    <div className="space-y-4 anim-fade">
      <p className="text-xs text-gray-400 font-medium">{enquiries.length} enquir{enquiries.length!==1?"ies":"y"}</p>
      {enquiries.map(e => (
        <div key={e.id} className="card p-5">
          <div className="flex items-start gap-3 justify-between flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold flex-shrink-0">
                {(e.buyer_name||"B")[0].toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{e.buyer_name}</p>
                <p className="text-gray-400 text-xs">{e.buyer_company || "UK Buyer"}</p>
              </div>
            </div>
            <span className={`badge ${e.status==="pending"?"bg-amber-50 text-amber-700":e.status==="contacted"?"bg-blue-50 text-blue-700":"bg-gray-100 text-gray-500"}`}>
              {e.status}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-2.5 rounded-lg bg-gray-50">
              <p className="text-xs text-gray-400">Crop</p>
              <p className="text-sm font-semibold text-gray-700 mt-0.5">{e.listings?.commodity || "—"}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-gray-50">
              <p className="text-xs text-gray-400">Qty Needed</p>
              <p className="text-sm font-semibold text-gray-700 mt-0.5">{e.quantity_kg ? `${Number(e.quantity_kg).toLocaleString("en-IN")} kg` : "Flexible"}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-gray-50">
              <p className="text-xs text-gray-400">Date</p>
              <p className="text-sm font-semibold text-gray-700 mt-0.5">{new Date(e.created_at).toLocaleDateString("en-IN")}</p>
            </div>
          </div>
          {e.message && (
            <div className="mt-3 p-3 rounded-xl" style={{ background:"#f8fafc", border:"1px solid #e2e8f0" }}>
              <p className="text-xs text-gray-500 italic">"{e.message}"</p>
            </div>
          )}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <a href={`mailto:${e.buyer_email}?subject=Re: KrishiConnect Enquiry — ${e.listings?.commodity||"Produce"}`}
              className="btn-primary text-xs px-4 py-2 no-underline inline-flex items-center gap-1">
              📧 Reply via Email
            </a>
            <span className="text-xs text-gray-400">{e.buyer_email}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Profile ───────────────────────────────────────────────────────────────────
function FarmerProfile({ profile, user, reloadProfile }) {
  const [form, setForm]   = useState({
    name:  profile?.name  || "",
    phone: profile?.phone || "",
    state: profile?.state || "Madhya Pradesh",
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast]   = useState(null);

  // Sync if profile loads late
  useEffect(() => {
    setForm({
      name:  profile?.name  || "",
      phone: profile?.phone || "",
      state: profile?.state || "Madhya Pradesh",
    });
  }, [profile]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setToast({ msg:"❌ Name is required.", type:"error" }); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({
        name:  form.name.trim(),
        phone: form.phone.trim() || null,
        state: form.state,
      }).eq("id", user.id);
      if (error) throw new Error(error.message);
      await reloadProfile();
      setToast({ msg:"✅ Profile updated! Your name and phone will appear on new listings.", type:"success" });
    } catch (err) {
      setToast({ msg:`❌ ${err.message}`, type:"error" });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  return (
    <div className="max-w-lg anim-fade">
      <div className="card p-6">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6 pb-5 border-b border-gray-100">
          <div className="w-16 h-16 rounded-2xl bg-green-500 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
            {(profile?.name||"F")[0].toUpperCase()}
          </div>
          <div>
            <h2 className="font-bold text-gray-800 text-lg">{profile?.name || "Complete your profile"}</h2>
            <p className="text-gray-400 text-sm">{user?.email || profile?.phone || "—"}</p>
            <span className={`badge text-xs mt-1 ${profile?.verified?"bg-green-50 text-green-700":"bg-amber-50 text-amber-700"}`}>
              {profile?.verified ? "✓ Verified Farmer" : "⏳ Pending Verification"}
            </span>
          </div>
        </div>

        {!profile?.name && (
          <div className="mb-4 p-3 rounded-xl text-xs" style={{ background:"#eff6ff", border:"1px solid #bfdbfe" }}>
            <strong className="text-blue-800">👋 First time?</strong>
            <span className="text-blue-700"> Fill in your name and phone — this is what UK buyers see when you post a listing.</span>
          </div>
        )}

        {toast && (
          <div className={`mb-4 p-3 rounded-xl text-sm font-medium ${toast.type==="error"?"bg-red-50 border border-red-200 text-red-700":"bg-green-50 border border-green-200 text-green-700"}`}>
            {toast.msg}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
            <input className="inp" type="text" placeholder="e.g. Ramesh Patel" required
              value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} />
            <p className="text-xs text-gray-400 mt-1">This appears on your listings so buyers know who to contact.</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
            <input className="inp" type="tel" placeholder="+91 98260 12345"
              value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} />
            <p className="text-xs text-gray-400 mt-1">UK buyers can use WhatsApp or call this number directly.</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">State</label>
            <select className="inp" value={form.state} onChange={e => setForm(f=>({...f,state:e.target.value}))}>
              {STATES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>

        {/* Email shown read-only */}
        <div className="mt-5 pt-5 border-t border-gray-100">
          <p className="text-xs text-gray-400 font-semibold uppercase mb-2">Account Email</p>
          <p className="text-sm text-gray-600">{user?.email}</p>
          <p className="text-xs text-gray-400 mt-1">Email is linked to your OTP login and cannot be changed here.</p>
        </div>
      </div>
    </div>
  );
}
