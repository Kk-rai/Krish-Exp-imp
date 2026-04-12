import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase, getListings, createEnquiry } from "../services/supabase";
import PriceCalculator from "../components/PriceCalculator";
import KrishiAI from "../components/KrishiAI";

const CROPS = ["Garlic","Onion","Potato","Turmeric","Ginger","Chilli"];
const CROP_EMOJI = { Garlic:"🧄", Onion:"🧅", Potato:"🥔", Turmeric:"🌿", Ginger:"🫚", Chilli:"🌶️" };

const SIDENAV = [
  { id:"dashboard",  icon:"📊", label:"Dashboard" },
  { id:"marketplace",icon:"🛒", label:"Browse Produce" },
  { id:"myenquiries",icon:"📬", label:"My Enquiries" },
  { id:"calculator", icon:"🧮", label:"Price Calculator" },
  { id:"profile",    icon:"👤", label:"My Profile" },
];

const MOCK_LISTINGS = [
  { id:"1", farmer_name:"Ramesh Patel",   commodity:"Garlic",   quantity_kg:5000,  price_inr_kg:55, state:"Madhya Pradesh", district:"Mandsor",   description:"Fresh white garlic, export grade", is_available:true, is_ceta_eligible:true, profiles:{ name:"Ramesh Patel", verified:true } },
  { id:"2", farmer_name:"Suresh Yadav",   commodity:"Onion",    quantity_kg:8000,  price_inr_kg:22, state:"Maharashtra",    district:"Nashik",    description:"Red onion, 5-7cm, cleaned", is_available:true, is_ceta_eligible:true, profiles:{ name:"Suresh Yadav", verified:true } },
  { id:"3", farmer_name:"Kavita Sharma",  commodity:"Turmeric", quantity_kg:2000,  price_inr_kg:98, state:"Telangana",      district:"Nizamabad", description:"7% curcumin, machine cleaned", is_available:true, is_ceta_eligible:true, profiles:{ name:"Kavita Sharma", verified:false } },
  { id:"4", farmer_name:"Murugan Pillai", commodity:"Ginger",   quantity_kg:3000,  price_inr_kg:42, state:"Kerala",         district:"Wayanad",   description:"Baby ginger, export quality", is_available:true, is_ceta_eligible:true, profiles:{ name:"Murugan Pillai", verified:true } },
  { id:"5", farmer_name:"Anjali Reddy",   commodity:"Chilli",   quantity_kg:1500,  price_inr_kg:76, state:"Andhra Pradesh", district:"Guntur",    description:"Guntur Sannam S4, 12-15% moisture", is_available:true, is_ceta_eligible:true, profiles:{ name:"Anjali Reddy", verified:true } },
  { id:"6", farmer_name:"Vikram Singh",   commodity:"Potato",   quantity_kg:10000, price_inr_kg:14, state:"Uttar Pradesh",  district:"Agra",      description:"Chipsona variety, 40-60mm", is_available:true, is_ceta_eligible:true, profiles:{ name:"Vikram Singh", verified:false } },
];

export default function BuyerPanel() {
  const { user, profile, reloadProfile } = useAuth();
  const [page, setPage]         = useState("dashboard");
  const [listings, setListings] = useState([]);
  const [myEnquiries, setMyEnquiries] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => { load(); }, [user]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getListings();
      setListings(data?.length ? data : MOCK_LISTINGS);
      if (user) {
        const { data: enqs } = await supabase.from("enquiries").select("*, listings(commodity,quantity_kg)").eq("buyer_id", user.id).order("created_at",{ascending:false});
        setMyEnquiries(enqs || []);
      }
    } catch { setListings(MOCK_LISTINGS); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen" style={{ fontFamily:"'DM Sans',sans-serif" }}>
      {/* ── Buyer Sidebar ─────────────────────────────────────────────────── */}
      <aside className={`${collapsed?"w-[68px]":"w-[240px]"} flex-shrink-0 transition-all duration-200 flex flex-col buyer-sidebar`}
        style={{ minHeight:"100vh", position:"sticky", top:0, height:"100vh", overflowY:"auto" }}>

        <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-blue-400/20 flex items-center justify-center text-lg flex-shrink-0">🇬🇧</div>
          {!collapsed && (
            <div>
              <div className="font-bold text-white text-sm" style={{ fontFamily:"'DM Serif Display',serif" }}>KrishiConnect</div>
              <div className="text-blue-300 text-xs">UK Buyer Portal</div>
            </div>
          )}
          <button onClick={() => setCollapsed(v=>!v)} className="ml-auto text-white/40 hover:text-white/80 flex-shrink-0 text-lg">
            {collapsed ? "→" : "←"}
          </button>
        </div>

        {!collapsed && (
          <div className="mx-3 mt-4 p-3 rounded-xl" style={{ background:"rgba(255,255,255,.06)" }}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-blue-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {(profile?.name||"B")[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-white font-semibold text-sm truncate">{profile?.name || "Buyer"}</div>
                <div className="text-blue-300 text-xs truncate">{profile?.company || "UK Importer"}</div>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 px-2 py-4 space-y-0.5">
          {SIDENAV.map(item => (
            <button key={item.id} onClick={() => setPage(item.id)}
              className={`buyer-nav-item nav-item w-full ${page===item.id?"active":""}`}>
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <button onClick={() => supabase.auth.signOut()} className={`nav-item w-full ${collapsed?"justify-center":""}`} style={{ color:"#f87171" }}>
            <span className="text-lg flex-shrink-0">🚪</span>
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto" style={{ background:"#f0f2f5" }}>
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="font-bold text-gray-800 text-lg">
              {SIDENAV.find(n=>n.id===page)?.icon} {SIDENAV.find(n=>n.id===page)?.label}
            </h1>
            <p className="text-gray-400 text-xs mt-0.5">Welcome, {profile?.name || "Buyer"} 👋</p>
          </div>
          <button onClick={load} className="text-xs px-3 py-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">↻ Refresh</button>
        </div>

        <div className="p-6">
          {loading && page !== "calculator" ? (
            <div className="text-center py-20 text-gray-400">Loading...</div>
          ) : (
            <>
              {page === "dashboard"   && <BuyerDashHome listings={listings} myEnquiries={myEnquiries} setPage={setPage} />}
              {page === "marketplace" && <BuyerMarketplace listings={listings} user={user} profile={profile} onRefresh={load} />}
              {page === "myenquiries" && <BuyerEnquiries enquiries={myEnquiries} />}
              {page === "calculator"  && <PriceCalculator />}
              {page === "profile"     && <BuyerProfile profile={profile} user={user} reloadProfile={reloadProfile} />}
            </>
          )}
        </div>
      </main>
      <KrishiAI />
    </div>
  );
}

function BuyerDashHome({ listings, myEnquiries, setPage }) {
  return (
    <div className="anim-fade">
      {/* CETA hero banner */}
      <div className="rounded-2xl p-6 mb-6 text-white relative overflow-hidden" style={{ background:"linear-gradient(135deg,#0c2340,#1a3a5c)" }}>
        <div className="absolute right-6 top-4 text-6xl opacity-20">🇬🇧</div>
        <div className="text-xs font-bold text-blue-300 mb-2">INDIA-UK CETA 2025 ACTIVE</div>
        <h2 className="text-2xl font-bold mb-2" style={{ fontFamily:"'DM Serif Display',serif" }}>Source Indian produce at zero import duty</h2>
        <p className="text-blue-200 text-sm max-w-lg">CETA eliminates UK import duty on 99% of Indian agri products. Buy directly from verified Indian farmers — no broker margins, full price transparency.</p>
        <button onClick={() => setPage("marketplace")} className="mt-4 px-5 py-2.5 rounded-xl font-bold text-sm" style={{ background:"#38bdf8", color:"#0c2340" }}>
          Browse Available Produce →
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label:"Products Available", value:listings.length,      icon:"🌾", color:"#2d7a3a", bg:"#e8f5ea" },
          { label:"My Enquiries",       value:myEnquiries.length,   icon:"📬", color:"#2563eb", bg:"#dbeafe" },
          { label:"Pending Replies",    value:myEnquiries.filter(e=>e.status==="pending").length, icon:"⏳", color:"#b07a00", bg:"#fff3e0" },
          { label:"Import Duty",        value:"0%",                 icon:"✅", color:"#059669", bg:"#d1fae5" },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3" style={{ background:s.bg }}>{s.icon}</div>
            <div className="text-2xl font-bold mb-0.5" style={{ color:s.color }}>{s.value}</div>
            <div className="text-gray-500 text-xs">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Latest listings */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">Latest Available Produce</h3>
          <button onClick={() => setPage("marketplace")} className="text-xs text-blue-600 font-semibold hover:underline">Browse all →</button>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Commodity</th><th>Farmer</th><th>Quantity</th><th>Price</th><th>State</th><th>CETA</th></tr></thead>
            <tbody>
              {listings.slice(0,6).map(l => (
                <tr key={l.id}>
                  <td className="font-semibold">{CROP_EMOJI[l.commodity]} {l.commodity}</td>
                  <td>{l.profiles?.name||l.farmer_name} {l.profiles?.verified&&<span className="text-green-500">✓</span>}</td>
                  <td>{l.quantity_kg?.toLocaleString("en-IN")} kg</td>
                  <td>{l.price_inr_kg?`₹${l.price_inr_kg}/kg`:"Negotiable"}</td>
                  <td className="text-gray-500 text-xs">{l.state}</td>
                  <td><span className="badge bg-green-100 text-green-700">0% duty</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function BuyerMarketplace({ listings, user, profile, onRefresh }) {
  const [filter, setFilter]   = useState("All");
  const [modal, setModal]     = useState(null);
  const [form, setForm]       = useState({ buyer_name:"", buyer_email:"", buyer_company:"", quantity_kg:"", message:"" });
  const [status, setStatus]   = useState(null);

  useEffect(() => {
    if (modal && user) setForm(f => ({ ...f, buyer_name:f.buyer_name||profile?.name||"", buyer_email:f.buyer_email||user.email||"", buyer_company:f.buyer_company||profile?.company||"" }));
  }, [modal]);

  const sendEnquiry = async (e) => {
    e.preventDefault(); setStatus("loading");
    try {
      await createEnquiry({ ...form, listing_id:modal.id, buyer_id:user?.id||null, quantity_kg:Number(form.quantity_kg)||null });
      setStatus("success");
      setTimeout(() => { setModal(null); setStatus(null); setForm({ buyer_name:"", buyer_email:"", buyer_company:"", quantity_kg:"", message:"" }); }, 2500);
    } catch { setStatus("error"); }
  };

  const filtered = filter === "All" ? listings : listings.filter(l => l.commodity === filter);

  return (
    <div className="anim-fade">
      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {["All",...CROPS].map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{ background:filter===c?"#0c2340":"white", color:filter===c?"white":"#374151", border:"1.5px solid", borderColor:filter===c?"#0c2340":"#e5e7eb" }}>
            {c!=="All"&&CROP_EMOJI[c]} {c}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(l => (
          <div key={l.id} className="card card-hover overflow-hidden">
            <div className="px-5 pt-5 pb-3" style={{ background:"linear-gradient(135deg,#f0f6ff,#e8f0fe)" }}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-3xl mb-1">{CROP_EMOJI[l.commodity]||"🌾"}</div>
                  <div className="font-bold text-gray-800">{l.commodity}</div>
                  <div className="text-xs text-gray-500">{l.state}{l.district?`, ${l.district}`:""}</div>
                </div>
                <div className="text-right">
                  {l.price_inr_kg ? <div className="font-bold text-green-800 text-lg">₹{l.price_inr_kg}<span className="text-xs font-normal">/kg</span></div> : <div className="text-xs text-gray-500">Negotiable</div>}
                  <span className="badge bg-green-100 text-green-700 text-xs mt-1">0% duty</span>
                </div>
              </div>
            </div>
            <div className="px-5 py-4">
              <div className="flex gap-4 text-sm mb-3">
                <div><span className="text-gray-400 text-xs">Available</span><div className="font-semibold">{l.quantity_kg?.toLocaleString("en-IN")} kg</div></div>
                <div><span className="text-gray-400 text-xs">Farmer</span><div className="font-medium text-sm">{l.profiles?.name||l.farmer_name} {l.profiles?.verified&&<span className="text-green-500 text-xs">✓</span>}</div></div>
              </div>
              {l.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{l.description}</p>}
              <button onClick={() => setModal(l)}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ background:"linear-gradient(135deg,#0c2340,#1a3a5c)" }}>
                Contact Farmer →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Enquiry Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:"rgba(0,0,0,.5)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md anim-pop">
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ background:"linear-gradient(135deg,#0c2340,#1a3a5c)" }}>
              <div>
                <div className="text-white font-bold">Send Enquiry</div>
                <div className="text-blue-200 text-xs">{CROP_EMOJI[modal.commodity]} {modal.commodity} · {modal.quantity_kg?.toLocaleString("en-IN")}kg · {modal.state}</div>
              </div>
              <button onClick={() => setModal(null)} className="text-white/70 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-6">
              {status === "success" ? (
                <div className="text-center py-8">
                  <div className="text-5xl mb-4">📬</div>
                  <p className="font-bold text-gray-800 text-lg">Enquiry Sent!</p>
                  <p className="text-sm text-gray-500 mt-2">The farmer will contact you shortly at {form.buyer_email}.</p>
                </div>
              ) : (
                <form onSubmit={sendEnquiry} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs font-semibold text-gray-600 mb-1">Your Name *</label><input required value={form.buyer_name} onChange={e=>setForm(f=>({...f,buyer_name:e.target.value}))} className="inp" placeholder="John Smith"/></div>
                    <div><label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label><input required type="email" value={form.buyer_email} onChange={e=>setForm(f=>({...f,buyer_email:e.target.value}))} className="inp" placeholder="you@company.co.uk"/></div>
                    <div><label className="block text-xs font-semibold text-gray-600 mb-1">Company</label><input value={form.buyer_company} onChange={e=>setForm(f=>({...f,buyer_company:e.target.value}))} className="inp" placeholder="UK Imports Ltd"/></div>
                    <div><label className="block text-xs font-semibold text-gray-600 mb-1">Quantity (kg)</label><input type="number" value={form.quantity_kg} onChange={e=>setForm(f=>({...f,quantity_kg:e.target.value}))} className="inp" placeholder="e.g. 2000"/></div>
                  </div>
                  <div><label className="block text-xs font-semibold text-gray-600 mb-1">Message</label><textarea rows={3} value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))} className="inp resize-none" placeholder="Hi, I'm interested. Can we discuss pricing and delivery?"/></div>
                  {status==="error" && <p className="text-red-500 text-xs">Failed to send. Please try again.</p>}
                  <div className="flex gap-3 pt-1">
                    <button type="submit" className="btn-primary flex-1" disabled={status==="loading"}>{status==="loading"?"Sending...":"Send Enquiry →"}</button>
                    <button type="button" className="btn-outline" onClick={()=>setModal(null)}>Cancel</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BuyerEnquiries({ enquiries }) {
  return (
    <div className="anim-fade">
      {enquiries.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">📬</div>
          <p className="font-medium">No enquiries sent yet</p>
          <p className="text-sm mt-1">Browse the marketplace and contact farmers to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {enquiries.map(e => (
            <div key={e.id} className="card p-5 flex items-start justify-between flex-wrap gap-3">
              <div>
                <div className="font-semibold text-gray-800">{CROP_EMOJI[e.listings?.commodity]} {e.listings?.commodity}</div>
                <div className="text-sm text-gray-500 mt-0.5">{e.quantity_kg?`${e.quantity_kg.toLocaleString("en-IN")}kg requested`:""}</div>
                <div className="text-xs text-gray-400 mt-1">{new Date(e.created_at).toLocaleDateString("en-IN")}</div>
                {e.message && <p className="text-xs text-gray-500 mt-2 italic">"{e.message}"</p>}
              </div>
              <div className="flex items-center gap-2">
                {(() => { const m={pending:["#fff3e0","#b07a00","⏳ Pending"],contacted:["#e0f2fe","#0369a1","📞 Contacted"],closed:["#f0fdf4","#166534","✅ Done"]};const[bg,c,label]=m[e.status]||m.pending; return <span className="badge" style={{background:bg,color:c}}>{label}</span>; })()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BuyerProfile({ profile, user, reloadProfile }) {
  const [form, setForm] = useState({ name:profile?.name||"", phone:profile?.phone||"", company:profile?.company||"" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await supabase.from("profiles").update(form).eq("id", user.id);
      await reloadProfile(); setSaved(true); setTimeout(()=>setSaved(false),2500);
    } catch(err){ console.error(err); } finally{ setSaving(false); }
  };

  return (
    <div className="anim-fade max-w-lg">
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
            {(profile?.name||"B")[0].toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-gray-800 text-lg">{profile?.name||"Buyer"}</div>
            <div className="text-gray-500 text-sm">{user?.email||profile?.phone}</div>
            <span className="badge bg-blue-100 text-blue-700 mt-1">🇬🇧 UK Buyer</span>
          </div>
        </div>
        {saved && <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">✅ Profile updated!</div>}
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name</label><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="inp"/></div>
          <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone (UK)</label><input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} className="inp" placeholder="+44 7700 900000"/></div>
          <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Company Name</label><input value={form.company} onChange={e=>setForm(f=>({...f,company:e.target.value}))} className="inp" placeholder="UK Imports Ltd"/></div>
          <button type="submit" className="btn-primary w-full" disabled={saving}>{saving?"Saving...":"Save Changes"}</button>
        </form>
      </div>
    </div>
  );
}
