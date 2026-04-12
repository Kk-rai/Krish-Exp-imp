import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase, getAllProfiles, getAllEnquiries, getListings, getAdminStats, verifyFarmer, updateEnquiryStatus, updateListing } from "../services/supabase";

const SIDENAV = [
  { id:"overview",  icon:"📊", label:"Overview" },
  { id:"farmers",   icon:"👨‍🌾", label:"Farmers" },
  { id:"buyers",    icon:"🇬🇧", label:"Buyers" },
  { id:"listings",  icon:"🌾", label:"Listings" },
  { id:"enquiries", icon:"📬", label:"Enquiries" },
  { id:"analytics", icon:"📈", label:"Analytics" },
];

export default function AdminPanel() {
  const { user, profile, isAdmin } = useAuth();
  const [page, setPage]       = useState("overview");
  const [stats, setStats]     = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [listings, setListings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch]   = useState("");
  const [toast, setToast]     = useState(null);

  useEffect(() => { if (isAdmin) loadAll(); }, [isAdmin]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [s, p, e, l] = await Promise.all([getAdminStats(), getAllProfiles(), getAllEnquiries(), getListings()]);
      setStats(s); setProfiles(p); setEnquiries(e); setListings(l);
    } catch(err) { console.error(err); }
    finally { setLoading(false); }
  };

  const showToast = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const doVerify = async (uid, val) => {
    await verifyFarmer(uid, val);
    showToast(val ? "✅ Farmer verified!" : "Verification revoked");
    loadAll();
  };

  if (!isAdmin) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:"#f0f2f5" }}>
      <div className="card p-10 text-center max-w-sm">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="font-bold text-gray-800 text-lg mb-2">Admin Access Only</h2>
        <p className="text-gray-500 text-sm">Your account doesn't have admin privileges.</p>
        <button onClick={() => supabase.auth.signOut()} className="btn-outline mt-4">Sign Out</button>
      </div>
    </div>
  );

  const farmers = profiles.filter(p => p.role === "farmer");
  const buyers  = profiles.filter(p => p.role === "buyer");
  const filteredProfiles = profiles.filter(p =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen" style={{ fontFamily:"'DM Sans',sans-serif" }}>
      {/* ── Admin Sidebar (dark navy) ──────────────────────────────────────── */}
      <aside className={`${collapsed?"w-[68px]":"w-[240px]"} flex-shrink-0 transition-all duration-200 flex flex-col admin-sidebar`}
        style={{ minHeight:"100vh", position:"sticky", top:0, height:"100vh", overflowY:"auto" }}>

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background:"rgba(245,166,35,.2)" }}>⚙️</div>
          {!collapsed && (
            <div>
              <div className="font-bold text-white text-sm" style={{ fontFamily:"'DM Serif Display',serif" }}>KrishiConnect</div>
              <div className="text-yellow-400 text-xs">Admin Console</div>
            </div>
          )}
          <button onClick={() => setCollapsed(v=>!v)} className="ml-auto text-white/40 hover:text-white/80 flex-shrink-0 text-lg">
            {collapsed ? "→" : "←"}
          </button>
        </div>

        {/* Admin info */}
        {!collapsed && (
          <div className="mx-3 mt-4 p-3 rounded-xl" style={{ background:"rgba(245,166,35,.1)", border:"1px solid rgba(245,166,35,.2)" }}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background:"#f5a623" }}>
                {(profile?.name||"A")[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-white font-semibold text-sm truncate">{profile?.name||"Admin"}</div>
                <div className="text-yellow-400 text-xs">Super Admin</div>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 px-2 py-4 space-y-0.5">
          {SIDENAV.map(item => (
            <button key={item.id} onClick={() => setPage(item.id)}
              className={`admin-nav-item nav-item w-full ${page===item.id?"active":""}`}>
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
              {/* Badges */}
              {!collapsed && item.id==="farmers" && stats?.unverifiedFarmers > 0 && (
                <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full bg-red-500 text-white font-bold">{stats.unverifiedFarmers}</span>
              )}
              {!collapsed && item.id==="enquiries" && stats?.pendingEnquiries > 0 && (
                <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full bg-yellow-500 text-white font-bold">{stats.pendingEnquiries}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <button onClick={loadAll} className={`admin-nav-item nav-item w-full ${collapsed?"justify-center":""}`} style={{ color:"#60a5fa" }}>
            <span className="text-lg flex-shrink-0">↻</span>
            {!collapsed && <span>Refresh Data</span>}
          </button>
          <button onClick={() => supabase.auth.signOut()} className={`admin-nav-item nav-item w-full ${collapsed?"justify-center":""}`} style={{ color:"#f87171" }}>
            <span className="text-lg flex-shrink-0">🚪</span>
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ── Admin Main Content ─────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto" style={{ background:"#f0f2f5" }}>
        {/* Topbar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="font-bold text-gray-800 text-lg">
              {SIDENAV.find(n=>n.id===page)?.icon} {SIDENAV.find(n=>n.id===page)?.label}
            </h1>
            <p className="text-gray-400 text-xs mt-0.5">KrishiConnect Admin Console · {new Date().toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
          </div>
          <div className="flex items-center gap-3">
            {toast && (
              <div className={`text-xs px-3 py-2 rounded-lg font-medium anim-fade ${toast.type==="success"?"bg-green-50 text-green-700 border border-green-200":"bg-red-50 text-red-600"}`}>
                {toast.msg}
              </div>
            )}
            <button onClick={loadAll} className="text-xs px-3 py-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 font-medium">↻ Refresh</button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-4xl mb-3">⏳</div>
              <p>Loading admin data...</p>
            </div>
          ) : (
            <>
              {page === "overview"  && <AdminOverview stats={stats} farmers={farmers} buyers={buyers} enquiries={enquiries} listings={listings} setPage={setPage} />}
              {page === "farmers"   && <AdminFarmers farmers={farmers} onVerify={doVerify} search={search} setSearch={setSearch} />}
              {page === "buyers"    && <AdminBuyers buyers={buyers} search={search} setSearch={setSearch} />}
              {page === "listings"  && <AdminListings listings={listings} onToggle={async(id,v)=>{ await updateListing(id,{is_available:v}); loadAll(); showToast("Listing updated"); }} />}
              {page === "enquiries" && <AdminEnquiries enquiries={enquiries} onStatus={async(id,s)=>{ await updateEnquiryStatus(id,s); loadAll(); showToast("Status updated"); }} />}
              {page === "analytics" && <AdminAnalytics stats={stats} listings={listings} enquiries={enquiries} farmers={farmers} buyers={buyers} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// ── Overview ──────────────────────────────────────────────────────────────────
function AdminOverview({ stats, farmers, buyers, enquiries, listings, setPage }) {
  if (!stats) return null;
  return (
    <div className="anim-fade">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          { label:"Total Farmers",        value:farmers.length,           icon:"👨‍🌾", color:"#2d7a3a", bg:"#e8f5ea", action:()=>setPage("farmers") },
          { label:"Total UK Buyers",      value:buyers.length,            icon:"🇬🇧", color:"#2563eb", bg:"#dbeafe", action:()=>setPage("buyers") },
          { label:"Active Listings",      value:listings.filter(l=>l.is_available).length, icon:"🌾", color:"#059669", bg:"#d1fae5", action:()=>setPage("listings") },
          { label:"Total Enquiries",      value:stats.totalEnquiries,     icon:"📬", color:"#b07a00", bg:"#fff3e0", action:()=>setPage("enquiries") },
          { label:"Pending Verification", value:stats.unverifiedFarmers,  icon:"⏳", color:"#dc2626", bg:"#fee2e2", action:()=>setPage("farmers") },
        ].map(s => (
          <div key={s.label} className="stat-card cursor-pointer" onClick={s.action}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3" style={{ background:s.bg }}>{s.icon}</div>
            <div className="text-3xl font-bold mb-0.5" style={{ color:s.color }}>{s.value}</div>
            <div className="text-gray-500 text-xs">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5 mb-5">
        {/* Recent farmers needing verification */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">⏳ Pending Verification</h3>
            <button onClick={() => setPage("farmers")} className="text-xs text-green-600 font-semibold hover:underline">View all →</button>
          </div>
          {farmers.filter(f=>!f.verified).length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm">✅ All farmers verified!</div>
          ) : farmers.filter(f=>!f.verified).slice(0,5).map(f => (
            <div key={f.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
              <div>
                <div className="font-medium text-sm text-gray-800">{f.name||"—"}</div>
                <div className="text-xs text-gray-500">{f.email} · {f.state||"—"}</div>
              </div>
              <button onClick={async()=>{ await verifyFarmer(f.id,true); window.location.reload(); }}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white"
                style={{ background:"#2d7a3a" }}>
                ✓ Verify
              </button>
            </div>
          ))}
        </div>

        {/* Recent enquiries */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">📬 Recent Enquiries</h3>
            <button onClick={() => setPage("enquiries")} className="text-xs text-green-600 font-semibold hover:underline">View all →</button>
          </div>
          {enquiries.slice(0,5).map(e => (
            <div key={e.id} className="flex items-start justify-between py-2.5 border-b border-gray-50 last:border-0">
              <div>
                <div className="font-medium text-sm text-gray-800">{e.buyer_name}</div>
                <div className="text-xs text-gray-500">{e.listings?.commodity} · {e.quantity_kg?`${e.quantity_kg}kg`:""}</div>
              </div>
              <StatusBadge status={e.status} />
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="card p-5">
        <h3 className="font-bold text-gray-800 mb-3">Quick Actions</h3>
        <div className="flex gap-3 flex-wrap">
          {[
            { label:`Verify ${farmers.filter(f=>!f.verified).length} Farmers`, action:()=>setPage("farmers"), color:"#2d7a3a" },
            { label:`Review ${enquiries.filter(e=>e.status==="pending").length} Enquiries`, action:()=>setPage("enquiries"), color:"#b07a00" },
            { label:"View All Listings", action:()=>setPage("listings"), color:"#2563eb" },
            { label:"See Analytics", action:()=>setPage("analytics"), color:"#7c3aed" },
          ].map(a => (
            <button key={a.label} onClick={a.action} className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background:a.color }}>
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Farmers management ────────────────────────────────────────────────────────
function AdminFarmers({ farmers, onVerify, search, setSearch }) {
  const filtered = farmers.filter(f =>
    !search || f.name?.toLowerCase().includes(search.toLowerCase()) || f.email?.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="anim-fade">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <p className="text-gray-500 text-sm">{farmers.length} farmers · {farmers.filter(f=>f.verified).length} verified · {farmers.filter(f=>!f.verified).length} pending</p>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search farmers..." className="inp" style={{ width:260 }}/>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Farmer</th><th>Email / Phone</th><th>State</th><th>Joined</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(f => (
                <tr key={f.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs flex-shrink-0">
                        {(f.name||"F")[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-800">{f.name||"—"}</span>
                    </div>
                  </td>
                  <td>
                    <div className="text-xs text-gray-600">{f.email||"—"}</div>
                    {f.phone && <div className="text-xs text-green-600">{f.phone}</div>}
                  </td>
                  <td className="text-gray-500 text-xs">{f.state||"—"}</td>
                  <td className="text-gray-400 text-xs">{f.created_at?new Date(f.created_at).toLocaleDateString("en-IN"):"—"}</td>
                  <td>
                    {f.verified
                      ? <span className="badge bg-green-100 text-green-700">✓ Verified</span>
                      : <span className="badge bg-yellow-100 text-yellow-700">⏳ Pending</span>
                    }
                  </td>
                  <td>
                    <div className="flex gap-1.5">
                      {!f.verified
                        ? <button onClick={()=>onVerify(f.id,true)} className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white" style={{ background:"#2d7a3a" }}>✓ Verify</button>
                        : <button onClick={()=>onVerify(f.id,false)} className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-red-50 text-red-600 border border-red-200">Revoke</button>
                      }
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-10 text-gray-400 text-sm">No farmers found</div>}
        </div>
      </div>
    </div>
  );
}

// ── Buyers management ─────────────────────────────────────────────────────────
function AdminBuyers({ buyers, search, setSearch }) {
  const filtered = buyers.filter(b =>
    !search || b.name?.toLowerCase().includes(search.toLowerCase()) || b.email?.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="anim-fade">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <p className="text-gray-500 text-sm">{buyers.length} UK buyers registered</p>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search buyers..." className="inp" style={{ width:260 }}/>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Buyer</th><th>Email / Phone</th><th>Company</th><th>Joined</th></tr></thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">{(b.name||"B")[0].toUpperCase()}</div>
                      <span className="font-medium text-gray-800">{b.name||"—"}</span>
                    </div>
                  </td>
                  <td>
                    <div className="text-xs text-gray-600">{b.email||"—"}</div>
                    {b.phone && <div className="text-xs text-blue-600">{b.phone}</div>}
                  </td>
                  <td className="text-gray-500 text-sm">{b.company||"—"}</td>
                  <td className="text-gray-400 text-xs">{b.created_at?new Date(b.created_at).toLocaleDateString("en-IN"):"—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-10 text-gray-400 text-sm">No buyers found</div>}
        </div>
      </div>
    </div>
  );
}

// ── Listings management ───────────────────────────────────────────────────────
function AdminListings({ listings, onToggle }) {
  const [filter, setFilter] = useState("all");
  const filtered = filter==="all"?listings:filter==="active"?listings.filter(l=>l.is_available):listings.filter(l=>!l.is_available);
  return (
    <div className="anim-fade">
      <div className="flex gap-2 mb-4">
        {[["all","All"],["active","Active"],["sold","Sold"]].map(([k,l]) => (
          <button key={k} onClick={()=>setFilter(k)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background:filter===k?"#1e293b":"white", color:filter===k?"white":"#6b7280", border:"1px solid", borderColor:filter===k?"#1e293b":"#e5e7eb" }}>
            {l} ({k==="all"?listings.length:k==="active"?listings.filter(l=>l.is_available).length:listings.filter(l=>!l.is_available).length})
          </button>
        ))}
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Commodity</th><th>Farmer</th><th>Qty / Price</th><th>State</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id}>
                  <td className="font-semibold text-green-800">{l.commodity}</td>
                  <td>
                    <div>{l.profiles?.name||l.farmer_name||"—"}</div>
                    {l.profiles?.verified && <span className="text-green-500 text-xs">✓ verified</span>}
                  </td>
                  <td className="text-xs">{l.quantity_kg?.toLocaleString("en-IN")}kg {l.price_inr_kg?`· ₹${l.price_inr_kg}/kg`:"· neg."}</td>
                  <td className="text-gray-500 text-xs">{l.state}</td>
                  <td><span className={`badge ${l.is_available?"bg-green-100 text-green-700":"bg-gray-100 text-gray-500"}`}>{l.is_available?"Active":"Sold"}</span></td>
                  <td><button onClick={()=>onToggle(l.id,!l.is_available)} className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">{l.is_available?"Mark Sold":"Reactivate"}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length===0&&<div className="text-center py-10 text-gray-400 text-sm">No listings</div>}
        </div>
      </div>
    </div>
  );
}

// ── Enquiries management ──────────────────────────────────────────────────────
function AdminEnquiries({ enquiries, onStatus }) {
  const [filter, setFilter] = useState("all");
  const filtered = filter==="all"?enquiries:enquiries.filter(e=>e.status===filter);
  return (
    <div className="anim-fade">
      <div className="flex gap-2 mb-4 flex-wrap">
        {["all","pending","contacted","closed"].map(f => (
          <button key={f} onClick={()=>setFilter(f)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
            style={{ background:filter===f?"#1e293b":"white", color:filter===f?"white":"#6b7280", border:"1px solid", borderColor:filter===f?"#1e293b":"#e5e7eb" }}>
            {f} ({f==="all"?enquiries.length:enquiries.filter(e=>e.status===f).length})
          </button>
        ))}
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Buyer</th><th>Commodity</th><th>Qty</th><th>Message</th><th>Date</th><th>Status</th><th>Update</th></tr></thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id}>
                  <td>
                    <div className="font-medium text-gray-800">{e.buyer_name}</div>
                    <div className="text-xs text-blue-600">{e.buyer_email}</div>
                    {e.buyer_company&&<div className="text-xs text-gray-400">{e.buyer_company}</div>}
                  </td>
                  <td className="font-medium text-green-800">{e.listings?.commodity||"—"}</td>
                  <td className="text-gray-500 text-xs">{e.quantity_kg?`${Number(e.quantity_kg).toLocaleString("en-IN")}kg`:"—"}</td>
                  <td className="max-w-[180px]"><div className="text-xs text-gray-500 truncate" title={e.message}>{e.message||"—"}</div></td>
                  <td className="text-gray-400 text-xs">{new Date(e.created_at).toLocaleDateString("en-IN")}</td>
                  <td><StatusBadge status={e.status}/></td>
                  <td>
                    <select value={e.status||"pending"} onChange={ev=>onStatus(e.id,ev.target.value)}
                      className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 focus:outline-none bg-white">
                      <option value="pending">Pending</option>
                      <option value="contacted">Contacted</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length===0&&<div className="text-center py-10 text-gray-400 text-sm">No {filter!=="all"?filter:""} enquiries</div>}
        </div>
      </div>
    </div>
  );
}

// ── Analytics ─────────────────────────────────────────────────────────────────
function AdminAnalytics({ stats, listings, enquiries, farmers, buyers }) {
  const commodityCounts = listings.reduce((acc,l) => { acc[l.commodity]=(acc[l.commodity]||0)+1; return acc; }, {});
  const stateCounts = listings.reduce((acc,l) => { acc[l.state]=(acc[l.state]||0)+1; return acc; }, {});
  const enquiryByStatus = { pending:enquiries.filter(e=>e.status==="pending").length, contacted:enquiries.filter(e=>e.status==="contacted").length, closed:enquiries.filter(e=>e.status==="closed").length };
  const totalQty = listings.reduce((s,l)=>s+(l.quantity_kg||0),0);

  return (
    <div className="anim-fade">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label:"Total Produce (kg)", value:totalQty.toLocaleString("en-IN"), icon:"📦", color:"#2d7a3a" },
          { label:"Farmer Conversion", value:`${farmers.length>0?Math.round((farmers.filter(f=>f.verified).length/farmers.length)*100):0}%`, icon:"✅", color:"#059669" },
          { label:"Enquiry Close Rate", value:`${enquiries.length>0?Math.round((enquiryByStatus.closed/enquiries.length)*100):0}%`, icon:"📊", color:"#2563eb" },
          { label:"Avg Enquiry / Listing", value:listings.length>0?(enquiries.length/listings.length).toFixed(1):0, icon:"📈", color:"#7c3aed" },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold mb-0.5" style={{ color:s.color }}>{s.value}</div>
            <div className="text-gray-500 text-xs">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Listings by commodity */}
        <div className="card p-5">
          <h3 className="font-bold text-gray-800 mb-4">Listings by Commodity</h3>
          {Object.entries(commodityCounts).sort((a,b)=>b[1]-a[1]).map(([crop,count]) => {
            const max = Math.max(...Object.values(commodityCounts));
            return (
              <div key={crop} className="flex items-center gap-3 mb-3">
                <div className="text-sm w-20 text-gray-600 flex-shrink-0">{crop}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className="h-2 rounded-full" style={{ width:`${(count/max)*100}%`, background:"linear-gradient(90deg,#2d7a3a,#4a9c5a)" }}/>
                </div>
                <div className="text-sm font-semibold text-gray-700 w-6 text-right">{count}</div>
              </div>
            );
          })}
        </div>

        {/* Enquiry pipeline */}
        <div className="card p-5">
          <h3 className="font-bold text-gray-800 mb-4">Enquiry Pipeline</h3>
          {[
            { label:"Pending", count:enquiryByStatus.pending, color:"#f5a623", bg:"#fff3e0" },
            { label:"Contacted", count:enquiryByStatus.contacted, color:"#2563eb", bg:"#dbeafe" },
            { label:"Closed / Won", count:enquiryByStatus.closed, color:"#059669", bg:"#d1fae5" },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-3 mb-4">
              <div className="w-32 text-sm text-gray-600">{s.label}</div>
              <div className="flex-1 h-8 rounded-xl flex items-center px-3 font-bold text-sm"
                style={{ background:s.bg, color:s.color, width:`${enquiries.length>0?(s.count/enquiries.length)*100:0}%`, minWidth:48 }}>
                {s.count}
              </div>
            </div>
          ))}
          <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
            Total enquiries: {enquiries.length} · Close rate: {enquiries.length>0?Math.round((enquiryByStatus.closed/enquiries.length)*100):0}%
          </div>
        </div>

        {/* Top states */}
        <div className="card p-5">
          <h3 className="font-bold text-gray-800 mb-4">Listings by State</h3>
          {Object.entries(stateCounts).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([state,count]) => (
            <div key={state} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-700">🗺 {state}</span>
              <span className="font-semibold text-green-700 text-sm">{count}</span>
            </div>
          ))}
        </div>

        {/* Platform health */}
        <div className="card p-5">
          <h3 className="font-bold text-gray-800 mb-4">Platform Health</h3>
          {[
            { label:"Farmers verified", pct:farmers.length>0?Math.round((farmers.filter(f=>f.verified).length/farmers.length)*100):0, good:70 },
            { label:"Listings active",  pct:listings.length>0?Math.round((listings.filter(l=>l.is_available).length/listings.length)*100):0, good:60 },
            { label:"Enquiries handled",pct:enquiries.length>0?Math.round(((enquiryByStatus.contacted+enquiryByStatus.closed)/enquiries.length)*100):0, good:50 },
          ].map(m => (
            <div key={m.label} className="mb-4">
              <div className="flex justify-between mb-1"><span className="text-sm text-gray-600">{m.label}</span><span className="text-sm font-semibold">{m.pct}%</span></div>
              <div className="h-2 bg-gray-100 rounded-full">
                <div className="h-2 rounded-full transition-all" style={{ width:`${m.pct}%`, background:m.pct>=m.good?"#2d7a3a":"#f5a623" }}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const m = { pending:["#fff3e0","#b07a00","⏳"], contacted:["#e0f2fe","#0369a1","📞"], closed:["#f0fdf4","#166534","✅"] };
  const [bg,color,icon] = m[status]||m.pending;
  return <span className="badge" style={{ background:bg, color }}>{icon} {status}</span>;
}
