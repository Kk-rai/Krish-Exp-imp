import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase, getMyListings, getEnquiriesForFarmer, createListing, updateListing } from "../services/supabase";
import PriceCalculator from "../components/PriceCalculator";
import KrishiAI from "../components/KrishiAI";

const CROPS  = ["Garlic","Onion","Potato","Turmeric","Ginger","Chilli","Wheat","Rice","Cumin","Coriander"];
const STATES = ["Madhya Pradesh","Maharashtra","Uttar Pradesh","Telangana","Kerala","Andhra Pradesh","Gujarat","Punjab","Rajasthan","Karnataka","Bihar","West Bengal","Tamil Nadu","Odisha","Haryana"];
const CROP_EMOJI = { Garlic:"🧄", Onion:"🧅", Potato:"🥔", Turmeric:"🌿", Ginger:"🫚", Chilli:"🌶️", Wheat:"🌾", Rice:"🍚", Cumin:"🫙", Coriander:"🌱" };

const SIDENAV = [
  { id:"dashboard",  icon:"📊", label:"Dashboard" },
  { id:"listings",   icon:"🌾", label:"My Listings" },
  { id:"enquiries",  icon:"📬", label:"Enquiries" },
  { id:"calculator", icon:"🧮", label:"Price Calculator" },
  { id:"profile",    icon:"👤", label:"My Profile" },
  { id:"help",       icon:"❓", label:"Help & Docs" },
];

export default function FarmerPanel() {
  const { user, profile, reloadProfile } = useAuth();
  const [page, setPage]         = useState("dashboard");
  const [listings, setListings] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { if (user) load(); }, [user]);

  const load = async () => {
    setLoading(true);
    try {
      const [l, e] = await Promise.all([
        getMyListings(user.id),
        getEnquiriesForFarmer(user.id),
      ]);
      setListings(l || []); setEnquiries(e || []);
    } catch(err) { console.error(err); }
    finally { setLoading(false); }
  };

  const pendingEnqCount = enquiries.filter(e => e.status === "pending").length;

  const navTo = (id) => { setPage(id); setMobileOpen(false); };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className={`flex items-center gap-2.5 px-4 py-5 border-b border-white/10 ${collapsed?"justify-center":""}`}>
        <div className="w-9 h-9 rounded-xl bg-green-500/20 flex items-center justify-center text-lg flex-shrink-0">🌾</div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="font-bold text-white text-sm truncate" style={{ fontFamily:"'DM Serif Display',serif" }}>KrishiConnect</div>
            <div className="text-green-400 text-xs">Farmer Portal</div>
          </div>
        )}
        <button onClick={() => setCollapsed(v=>!v)} className="ml-auto text-white/30 hover:text-white/70 text-sm flex-shrink-0 hidden md:block">
          {collapsed ? "▶" : "◀"}
        </button>
      </div>

      {/* Profile pill */}
      {!collapsed && (
        <div className="mx-3 mt-4 p-3 rounded-xl" style={{ background:"rgba(255,255,255,.06)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {(profile?.name||"F")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-white font-semibold text-sm truncate">{profile?.name||"Farmer"}</div>
              <div className="text-green-400 text-xs truncate">{profile?.state||"India"}</div>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${profile?.verified?"bg-green-400":"bg-yellow-400"}`}/>
            <span className={`text-xs ${profile?.verified?"text-green-400":"text-yellow-400"}`}>
              {profile?.verified ? "Verified Farmer" : "Awaiting Verification"}
            </span>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {SIDENAV.map(item => (
          <button key={item.id} onClick={() => navTo(item.id)}
            className={`nav-item w-full ${page===item.id?"active":""} ${collapsed?"justify-center px-0":""}`}
            style={{ color: page===item.id?"#4ade80":"#94a3b8" }}
            title={collapsed ? item.label : ""}>
            <span className="text-lg flex-shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
            {!collapsed && item.id==="enquiries" && pendingEnqCount > 0 && (
              <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full bg-green-500 text-white font-bold flex-shrink-0">
                {pendingEnqCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-white/10 space-y-0.5">
        <button onClick={() => supabase.auth.signOut()}
          className={`nav-item w-full ${collapsed?"justify-center px-0":""}`} style={{ color:"#f87171" }}
          title={collapsed ? "Sign Out" : ""}>
          <span className="text-lg flex-shrink-0">🚪</span>
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen" style={{ fontFamily:"'DM Sans',sans-serif" }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="w-64 flex flex-col" style={{ background:"linear-gradient(180deg,#0d2e17,#1a4a28)" }}>
            <SidebarContent />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)}/>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className={`hidden md:flex flex-col flex-shrink-0 transition-all duration-200 ${collapsed?"w-[68px]":"w-[240px]"}`}
        style={{ background:"linear-gradient(180deg,#0d2e17,#1a4a28)", minHeight:"100vh", position:"sticky", top:0, height:"100vh", overflowY:"auto" }}>
        <SidebarContent />
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto" style={{ background:"#f0f2f5", minWidth:0 }}>
        {/* Topbar */}
        <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3.5 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="md:hidden text-gray-500 text-xl">☰</button>
            <div>
              <h1 className="font-bold text-gray-800 text-base md:text-lg leading-tight">
                {SIDENAV.find(n=>n.id===page)?.icon} {SIDENAV.find(n=>n.id===page)?.label}
              </h1>
              <p className="text-gray-400 text-xs hidden sm:block">Namaste, {profile?.name||"Farmer"} 👋</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!profile?.verified && (
              <div className="hidden sm:block text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background:"#fff3e0", color:"#b07a00" }}>
                ⏳ Pending verification
              </div>
            )}
            <button onClick={load} className="text-xs px-3 py-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 font-medium">↻</button>
          </div>
        </div>

        <div className="p-4 md:p-6">
          {loading && page !== "calculator" && page !== "help" ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-4xl mb-3" style={{ animation:"spin 1.5s linear infinite", display:"inline-block" }}>🌾</div>
              <p className="text-sm mt-2">Loading your data...</p>
            </div>
          ) : (
            <>
              {page === "dashboard"  && <FarmerDashboardHome listings={listings} enquiries={enquiries} profile={profile} setPage={setPage} />}
              {page === "listings"   && <MyListings listings={listings} user={user} profile={profile} onRefresh={load} />}
              {page === "enquiries"  && <MyEnquiries enquiries={enquiries} onRefresh={load} />}
              {page === "calculator" && <PriceCalculator />}
              {page === "profile"    && <FarmerProfile profile={profile} user={user} reloadProfile={reloadProfile} />}
              {page === "help"       && <FarmerHelp />}
            </>
          )}
        </div>
      </main>

      <KrishiAI />
    </div>
  );
}

/* ── Dashboard Home ─────────────────────────────────────────────────────────── */
function FarmerDashboardHome({ listings, enquiries, profile, setPage }) {
  const activeListings   = listings.filter(l => l.is_available).length;
  const pendingEnquiries = enquiries.filter(e => e.status === "pending").length;
  const totalKg          = listings.reduce((s, l) => s + (l.quantity_kg || 0), 0);
  const potentialRevenue = listings.reduce((s, l) => s + ((l.quantity_kg||0) * (l.price_inr_kg||0)), 0);

  return (
    <div className="anim-fade space-y-5">
      {/* Verification banner */}
      {!profile?.verified && (
        <div className="rounded-xl p-4 flex items-start gap-3" style={{ background:"#fffbf0", border:"1px solid #f0dfa0" }}>
          <span className="text-xl flex-shrink-0">⏳</span>
          <div>
            <p className="font-semibold text-yellow-800 text-sm">Your account is pending verification</p>
            <p className="text-yellow-700 text-xs mt-0.5">An admin will verify your farmer account within 24 hours. You can post listings now — they'll appear after verification.</p>
          </div>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label:"Active Listings",    value:activeListings,           icon:"🌾", color:"#2d7a3a", bg:"#e8f5ea", action:()=>setPage("listings") },
          { label:"New Enquiries",      value:pendingEnquiries,         icon:"📬", color:"#b07a00", bg:"#fff3e0", action:()=>setPage("enquiries") },
          { label:"Total Produce (kg)", value:totalKg.toLocaleString("en-IN"), icon:"📦", color:"#2563eb", bg:"#dbeafe", action:null },
          { label:"Revenue Potential",  value:potentialRevenue>0?`₹${(potentialRevenue/100000).toFixed(1)}L`:"—", icon:"💰", color:"#7c3aed", bg:"#ede9fe", action:null },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.action?"cursor-pointer":""}`} onClick={s.action||undefined}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background:s.bg }}>{s.icon}</div>
              {s.action && <span className="text-gray-300 text-xs">→</span>}
            </div>
            <div className="text-xl md:text-2xl font-bold mb-0.5" style={{ color:s.color }}>{s.value}</div>
            <div className="text-gray-500 text-xs">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Recent enquiries */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">Recent Enquiries</h3>
            <button onClick={() => setPage("enquiries")} className="text-xs text-green-600 font-semibold hover:underline">View all →</button>
          </div>
          {enquiries.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-3xl mb-2">📬</div>
              <p className="text-sm">No enquiries yet.</p>
              <p className="text-xs mt-1">UK buyers will contact you here once they find your listings.</p>
            </div>
          ) : enquiries.slice(0,5).map(e => (
            <div key={e.id} className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-xs flex-shrink-0">
                {(e.buyer_name||"B")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-800 truncate">{e.buyer_name}</div>
                <div className="text-xs text-gray-500">{e.listings?.commodity} · {e.quantity_kg?`${Number(e.quantity_kg).toLocaleString("en-IN")}kg`:""}</div>
              </div>
              <StatusBadge status={e.status} />
            </div>
          ))}
        </div>

        {/* My listings */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">My Produce</h3>
            <button onClick={() => setPage("listings")} className="text-xs text-green-600 font-semibold hover:underline">Manage →</button>
          </div>
          {listings.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-3xl mb-2">🌱</div>
              <p className="text-sm">No listings yet.</p>
              <button onClick={() => setPage("listings")} className="btn-primary text-xs mt-3 py-1.5 px-4">+ Post Produce</button>
            </div>
          ) : listings.slice(0,5).map(l => (
            <div key={l.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
              <div className="text-2xl flex-shrink-0">{CROP_EMOJI[l.commodity]||"🌾"}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-gray-800">{l.commodity}</div>
                <div className="text-xs text-gray-500">{Number(l.quantity_kg).toLocaleString("en-IN")}kg {l.price_inr_kg?`· ₹${l.price_inr_kg}/kg`:""}</div>
              </div>
              <span className={`badge text-xs ${l.is_available?"bg-green-100 text-green-700":"bg-gray-100 text-gray-500"}`}>
                {l.is_available?"Active":"Sold"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CETA tip card */}
      <div className="rounded-xl p-5 flex items-start gap-3" style={{ background:"linear-gradient(135deg,#e8f5ea,#f0faf2)", border:"1px solid #b8ddc0" }}>
        <div className="text-2xl flex-shrink-0">💡</div>
        <div>
          <p className="font-semibold text-green-800 text-sm">CETA 2025 — Save 12-15% on every UK shipment</p>
          <p className="text-green-700 text-xs mt-1 leading-relaxed">India-UK CETA eliminates import duty on 99% of agri products. Your UK buyers pay less tax, so they can offer you more. Use the <button onClick={()=>setPage("calculator")} className="underline font-semibold">Price Calculator</button> to see your exact ₹ payout.</p>
        </div>
      </div>
    </div>
  );
}

/* ── My Listings ────────────────────────────────────────────────────────────── */
function MyListings({ listings, user, profile, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState(null);
  const [form, setForm] = useState({
    commodity:"Garlic", quantity_kg:"", price_inr_kg:"",
    state:profile?.state||"Madhya Pradesh", district:"", description:"",
  });

  const showT = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  const handlePost = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await createListing({
        ...form, farmer_id:user.id, farmer_name:profile?.name||"",
        quantity_kg:Number(form.quantity_kg),
        price_inr_kg:Number(form.price_inr_kg)||null,
        is_available:true, is_ceta_eligible:true,
      });
      showT("✅ Listing posted! UK buyers can now see your produce.");
      setShowForm(false);
      setForm({ commodity:"Garlic", quantity_kg:"", price_inr_kg:"", state:profile?.state||"Madhya Pradesh", district:"", description:"" });
      onRefresh();
    } catch(err) { showT("❌ Failed to post. Please try again.", "error"); console.error(err); }
    finally { setSaving(false); }
  };

  const toggleAvailability = async (l) => {
    await updateListing(l.id, { is_available: !l.is_available });
    showT(`Listing marked as ${!l.is_available?"Active":"Sold"}`);
    onRefresh();
  };

  return (
    <div className="anim-fade">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <p className="text-gray-500 text-sm">{listings.length} listing{listings.length!==1?"s":""} · {listings.filter(l=>l.is_available).length} active</p>
        <button onClick={() => setShowForm(v=>!v)} className="btn-primary">
          {showForm ? "✕ Cancel" : "+ Post New Listing"}
        </button>
      </div>

      {toast && (
        <div className={`mb-4 p-3 rounded-xl text-sm font-medium anim-fade ${toast.type==="error"?"bg-red-50 border border-red-200 text-red-700":"bg-green-50 border border-green-200 text-green-700"}`}>
          {toast.msg}
        </div>
      )}

      {/* Post form */}
      {showForm && (
        <div className="card p-5 mb-5 anim-fade">
          <h3 className="font-bold text-gray-800 mb-4">Post Your Produce</h3>
          <form onSubmit={handlePost} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Commodity *</label>
              <select value={form.commodity} onChange={e=>setForm(f=>({...f,commodity:e.target.value}))} className="inp">
                {CROPS.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">State *</label>
              <select value={form.state} onChange={e=>setForm(f=>({...f,state:e.target.value}))} className="inp">
                {STATES.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Quantity (kg) *</label>
              <input required type="number" min="1" value={form.quantity_kg}
                onChange={e=>setForm(f=>({...f,quantity_kg:e.target.value}))} className="inp" placeholder="e.g. 5000"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Your asking price (₹/kg)</label>
              <input type="number" min="0" value={form.price_inr_kg}
                onChange={e=>setForm(f=>({...f,price_inr_kg:e.target.value}))} className="inp" placeholder="Leave blank = Negotiable"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">District / Mandi</label>
              <input value={form.district} onChange={e=>setForm(f=>({...f,district:e.target.value}))} className="inp" placeholder="e.g. Mandsor"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description / Quality details</label>
              <input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} className="inp" placeholder="Grade, variety, post-harvest treatment..."/>
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary" disabled={saving}>{saving?"Posting...":"Post Listing →"}</button>
              <button type="button" className="btn-outline" onClick={()=>setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {listings.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">🌱</div>
          <p className="font-semibold text-gray-600">No listings yet</p>
          <p className="text-sm mt-1">Post your first produce to start getting enquiries from UK buyers.</p>
          <button onClick={() => setShowForm(true)} className="btn-primary mt-4 mx-auto">+ Post Produce</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map(l => (
            <div key={l.id} className="card card-hover overflow-hidden">
              <div className="px-5 pt-4 pb-3" style={{ background:"linear-gradient(135deg,#f0faf2,#e8f5e9)" }}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-3xl mb-1">{CROP_EMOJI[l.commodity]||"🌾"}</div>
                    <div className="font-bold text-green-900">{l.commodity}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{l.state}{l.district?`, ${l.district}`:""}</div>
                  </div>
                  <span className={`badge ${l.is_available?"bg-green-100 text-green-700":"bg-gray-100 text-gray-500"}`}>
                    {l.is_available?"Active":"Sold"}
                  </span>
                </div>
              </div>
              <div className="px-5 py-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <div>
                    <span className="text-gray-400 text-xs block">Quantity</span>
                    <span className="font-semibold text-gray-800">{Number(l.quantity_kg).toLocaleString("en-IN")} kg</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-400 text-xs block">Price</span>
                    <span className="font-semibold text-gray-800">{l.price_inr_kg?`₹${l.price_inr_kg}/kg`:"Negotiable"}</span>
                  </div>
                </div>
                {l.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{l.description}</p>}
                <div className="text-xs text-gray-400 mb-3">
                  Posted {new Date(l.created_at).toLocaleDateString("en-IN")}
                </div>
                <button onClick={() => toggleAvailability(l)}
                  className="w-full text-xs py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium transition-colors">
                  Mark as {l.is_available ? "Sold ✓" : "Available Again"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── My Enquiries ───────────────────────────────────────────────────────────── */
function MyEnquiries({ enquiries, onRefresh }) {
  const [filter, setFilter] = useState("all");
  const filtered = filter==="all" ? enquiries : enquiries.filter(e=>e.status===filter);

  return (
    <div className="anim-fade">
      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          ["all",       `All (${enquiries.length})`],
          ["pending",   `New (${enquiries.filter(e=>e.status==="pending").length})`],
          ["contacted", "Contacted"],
          ["closed",    "Closed"],
        ].map(([k,l]) => (
          <button key={k} onClick={() => setFilter(k)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background:filter===k?"#2d7a3a":"white", color:filter===k?"white":"#6b7280", border:"1px solid", borderColor:filter===k?"#2d7a3a":"#e5e7eb" }}>
            {l}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">📬</div>
          <p className="font-semibold text-gray-600">No {filter!=="all"?filter:""} enquiries</p>
          <p className="text-sm mt-1">UK buyers will reach out here when they find your listings.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(e => (
            <div key={e.id} className="card p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 flex-shrink-0">
                    {(e.buyer_name||"B")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-800">{e.buyer_name}{e.buyer_company?` · ${e.buyer_company}`:""}</div>
                    <div className="text-sm text-blue-600 mt-0.5">{e.buyer_email}</div>
                    <div className="text-xs text-gray-500 mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                      {e.listings?.commodity && <span>🌾 {e.listings.commodity}</span>}
                      {e.quantity_kg && <span>📦 {Number(e.quantity_kg).toLocaleString("en-IN")}kg wanted</span>}
                      <span>📅 {new Date(e.created_at).toLocaleDateString("en-IN")}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={e.status} />
                  <a href={`mailto:${e.buyer_email}?subject=Re: ${e.listings?.commodity||"Produce"} Enquiry — KrishiConnect&body=Dear ${e.buyer_name},%0A%0AThank you for your interest. I am happy to discuss your requirement for ${e.quantity_kg||""}kg of ${e.listings?.commodity||"produce"}.%0A%0ARegards,%0AKrishiConnect Farmer`}
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white no-underline flex-shrink-0"
                    style={{ background:"linear-gradient(135deg,#2d7a3a,#4a9c5a)" }}>
                    Reply →
                  </a>
                </div>
              </div>
              {e.message && (
                <div className="mt-3 p-3 rounded-xl text-sm text-gray-600 italic" style={{ background:"#f8fafc", border:"1px solid #e2e8f0" }}>
                  "{e.message}"
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Farmer Profile ──────────────────────────────────────────────────────────── */
function FarmerProfile({ profile, user, reloadProfile }) {
  const [form, setForm]     = useState({ name:profile?.name||"", phone:profile?.phone||"", state:profile?.state||"Madhya Pradesh" });
  const [saving, setSaving] = useState(false);
  const [toast, setToast]   = useState(null);

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update(form).eq("id", user.id);
      if (error) throw error;
      await reloadProfile();
      setToast({ msg:"✅ Profile updated successfully!", type:"success" });
      setTimeout(() => setToast(null), 3000);
    } catch(err) {
      setToast({ msg:`❌ ${err.message}`, type:"error" });
      console.error(err);
    } finally { setSaving(false); }
  };

  return (
    <div className="anim-fade max-w-lg">
      <div className="card p-6">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="w-16 h-16 rounded-2xl bg-green-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {(profile?.name||"F")[0].toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-gray-800 text-lg">{profile?.name||"Farmer"}</div>
            <div className="text-gray-500 text-sm mt-0.5">{user?.email || profile?.phone || "—"}</div>
            <div className="mt-2">
              {profile?.verified
                ? <span className="badge bg-green-100 text-green-700">✓ Verified Farmer</span>
                : <span className="badge bg-yellow-100 text-yellow-700">⏳ Awaiting Verification</span>
              }
            </div>
          </div>
        </div>

        {toast && (
          <div className={`mb-4 p-3 rounded-xl text-sm font-medium ${toast.type==="error"?"bg-red-50 border border-red-200 text-red-700":"bg-green-50 border border-green-200 text-green-700"}`}>
            {toast.msg}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name *</label>
            <input required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="inp" placeholder="Your full name"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mobile Number</label>
            <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} className="inp" placeholder="+91 98765 43210"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">State</label>
            <select value={form.state} onChange={e=>setForm(f=>({...f,state:e.target.value}))} className="inp bg-white">
              {STATES.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>

        {/* Readonly info */}
        <div className="mt-5 pt-5 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 mb-2">Account Info</p>
          <div className="space-y-1.5 text-xs text-gray-500">
            <div className="flex justify-between"><span>Role</span><span className="font-medium capitalize text-gray-700">Farmer</span></div>
            <div className="flex justify-between"><span>Joined</span><span className="font-medium text-gray-700">{profile?.created_at?new Date(profile.created_at).toLocaleDateString("en-IN"):"—"}</span></div>
            <div className="flex justify-between"><span>Verification</span><span className={`font-medium ${profile?.verified?"text-green-600":"text-yellow-600"}`}>{profile?.verified?"Verified":"Pending"}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Help & Docs ─────────────────────────────────────────────────────────────── */
function FarmerHelp() {
  const docs = [
    { title:"Export Documents Checklist", items:["Phytosanitary Certificate — State Agriculture Dept","Certificate of Origin (CETA) — Chamber of Commerce","Commercial Invoice — Your details + buyer details","Packing List — Carton-by-carton breakdown","Bill of Lading — From your shipping line","Fumigation Certificate — For certain commodities"] },
    { title:"CETA 2025 — What it means for you", items:["0% UK import duty on 99% of Indian agri products","UK buyers now pay 12-15% less tax on your goods","This saving can be passed to you as a better price","CETA Certificate of Origin must be from Chamber of Commerce","No expiry — permanent under the 2025 agreement"] },
    { title:"Shipping Process", items:["Step 1: Find UK buyer via KrishiConnect Marketplace","Step 2: Agree on price using the Price Calculator","Step 3: Contact a freight forwarder (JNPT / Mundra / Chennai)","Step 4: Prepare all 5 export documents","Step 5: Load goods, get Bill of Lading","Step 6: Buyer receives goods, you get payment"] },
  ];

  return (
    <div className="anim-fade max-w-2xl space-y-5">
      <div className="card p-5 flex items-start gap-3" style={{ background:"linear-gradient(135deg,#e8f5ea,#f0faf2)", border:"1px solid #b8ddc0" }}>
        <div className="text-2xl">💬</div>
        <div>
          <p className="font-semibold text-green-800 text-sm">Ask KrishiAI for instant help</p>
          <p className="text-green-700 text-xs mt-0.5">Click the 🌾 button at the bottom-right to ask anything in Hindi or English — documents, pricing, shipping, CETA rules.</p>
        </div>
      </div>
      {docs.map(d => (
        <div key={d.title} className="card p-5">
          <h3 className="font-bold text-gray-800 mb-3">📋 {d.title}</h3>
          <ul className="space-y-2">
            {d.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-green-500 font-bold mt-0.5 flex-shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }) {
  const m = { pending:["#fff3e0","#b07a00","⏳"], contacted:["#e0f2fe","#0369a1","📞"], closed:["#f0fdf4","#166534","✅"] };
  const [bg,color,icon] = m[status]||m.pending;
  return <span className="badge" style={{ background:bg, color }}>{icon} {status}</span>;
}
