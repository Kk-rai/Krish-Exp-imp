import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase, getListings, createEnquiry } from "../services/supabase";
import PriceCalculator from "../components/PriceCalculator";
import KrishiAI from "../components/KrishiAI";

const CROPS = ["All","Garlic","Onion","Potato","Turmeric","Ginger","Chilli"];
const CROP_EMOJI = { Garlic:"🧄", Onion:"🧅", Potato:"🥔", Turmeric:"🌿", Ginger:"🫚", Chilli:"🌶️" };
const SIDENAV = [
  { id:"dashboard",   icon:"📊", label:"Dashboard" },
  { id:"marketplace", icon:"🛒", label:"Browse Produce" },
  { id:"enquiries",   icon:"📬", label:"My Enquiries" },
  { id:"calculator",  icon:"🧮", label:"Price Calculator" },
  { id:"profile",     icon:"👤", label:"My Profile" },
];

export default function BuyerPanel() {
  const { user, profile, reloadProfile } = useAuth();
  const [page, setPage]           = useState("dashboard");
  const [listings, setListings]   = useState([]);
  const [myEnquiries, setMyEnqs]  = useState([]);
  const [loading, setLoading]     = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [modal, setModal]         = useState(null);
  const [filter, setFilter]       = useState("All");
  const [enqForm, setEnqForm]     = useState({ buyer_name:"", buyer_email:"", buyer_company:"", quantity_kg:"", message:"" });
  const [enqStatus, setEnqStatus] = useState(null);
  const [enqError, setEnqError]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getListings();
      setListings(data || []);
      if (user) {
        const { data: enqs, error } = await supabase.from("enquiries")
          .select("*, listings(commodity,quantity_kg,farmer_name,state)")
          .eq("buyer_id", user.id)
          .order("created_at", { ascending:false });
        if (error) console.error("Enquiries load error:", error.message);
        setMyEnqs(enqs || []);
      }
    } catch(err) { console.error("Load error:", err); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const openModal = (l) => {
    setModal(l);
    setEnqStatus(null);
    setEnqError(null);
    // Pre-fill with real profile data — never use hardcoded test data
    setEnqForm({
      buyer_name:    profile?.name    || "",
      buyer_email:   user?.email      || "",
      buyer_company: profile?.company || "",
      quantity_kg:   "",
      message:       "",
    });
  };

  const sendEnquiry = async (e) => {
    e.preventDefault();
    setEnqStatus("loading");
    setEnqError(null);
    try {
      await createEnquiry({
        listing_id:    modal.id,
        buyer_id:      user?.id || null,
        buyer_name:    enqForm.buyer_name,
        buyer_email:   enqForm.buyer_email,
        buyer_company: enqForm.buyer_company || null,
        quantity_kg:   enqForm.quantity_kg ? Number(enqForm.quantity_kg) : null,
        message:       enqForm.message || null,
      });
      setEnqStatus("success");
      load();
    } catch(err) {
      console.error("Enquiry error:", err);
      setEnqStatus("error");
      // Show actual error message so it's debuggable
      setEnqError(err?.message || "Unknown error. Please try again.");
    }
  };

  const closeModal = () => { setModal(null); setEnqStatus(null); setEnqError(null); };

  const filtered = filter === "All" ? listings : listings.filter(l => l.commodity === filter);

  return (
    <div className="flex min-h-screen" style={{ fontFamily:"'DM Sans',sans-serif" }}>
      {/* Sidebar */}
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
          <button onClick={() => setCollapsed(v=>!v)} className="ml-auto text-white/40 hover:text-white/80 text-lg flex-shrink-0">
            {collapsed?"→":"←"}
          </button>
        </div>
        {!collapsed && (
          <div className="mx-3 mt-4 p-3 rounded-xl" style={{ background:"rgba(255,255,255,.06)" }}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-blue-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {(profile?.name||"B")[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-white font-semibold text-sm truncate">{profile?.name||"UK Buyer"}</div>
                <div className="text-blue-300 text-xs truncate">{profile?.company||"Importer"}</div>
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
              {!collapsed && item.id==="enquiries" && myEnquiries.length > 0 && (
                <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full bg-blue-500 text-white font-bold">{myEnquiries.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <button onClick={() => supabase.auth.signOut()}
            className={`buyer-nav-item nav-item w-full ${collapsed?"justify-center":""}`} style={{ color:"#f87171" }}>
            <span className="text-lg flex-shrink-0">🚪</span>
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto" style={{ background:"#f0f2f5" }}>
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="font-bold text-gray-800 text-lg">{SIDENAV.find(n=>n.id===page)?.icon} {SIDENAV.find(n=>n.id===page)?.label}</h1>
            <p className="text-gray-400 text-xs mt-0.5">KrishiConnect UK Buyer Portal · {new Date().toLocaleDateString("en-GB",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
          </div>
          <button onClick={load} className="text-xs px-3 py-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 font-medium">↻ Refresh</button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div style={{ width:32,height:32,border:"3px solid #e2e8f0",borderTopColor:"#2563eb",borderRadius:"50%",animation:"spin .8s linear infinite" }}/>
            </div>
          ) : (
            <>
              {page==="dashboard"   && <BuyerHome listings={listings} myEnquiries={myEnquiries} setPage={setPage} />}
              {page==="marketplace" && (
                <MarketplacePage listings={listings} filter={filter} setFilter={setFilter}
                  filtered={filtered} onContact={openModal} />
              )}
              {page==="enquiries"   && <MyEnquiriesPage enquiries={myEnquiries} />}
              {page==="calculator"  && <PriceCalculator />}
              {page==="profile"     && <BuyerProfile profile={profile} user={user} reloadProfile={reloadProfile} />}
            </>
          )}
        </div>
      </main>

      {/* Enquiry Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background:"rgba(0,0,0,.5)", backdropFilter:"blur(4px)" }}
          onClick={e => { if(e.target===e.currentTarget) closeModal(); }}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden anim-pop">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between"
              style={{ background:"linear-gradient(135deg,#0c2340,#1a3a5c)" }}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{CROP_EMOJI[modal.commodity]||"🌿"}</span>
                <div>
                  <h3 className="font-bold text-white">{modal.commodity} · {(modal.quantity_kg/1000).toFixed(1)} MT</h3>
                  <p className="text-blue-300 text-xs">{modal.farmer_name} · {modal.district||modal.state}</p>
                </div>
              </div>
              <button onClick={closeModal} className="text-white/50 hover:text-white text-xl">✕</button>
            </div>
            {enqStatus==="success" ? (
              <div className="p-10 text-center anim-fade">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="font-bold text-gray-800 text-lg mb-2">Enquiry Sent!</h3>
                <p className="text-gray-500 text-sm">The farmer will contact you at <strong>{enqForm.buyer_email}</strong></p>
                <button onClick={closeModal} className="btn-primary mt-6 px-8">Done</button>
              </div>
            ) : (
              <form onSubmit={sendEnquiry} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Your Name *</label>
                    <input className="inp" required value={enqForm.buyer_name}
                      onChange={e=>setEnqForm(f=>({...f,buyer_name:e.target.value}))} placeholder="John Smith"/>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Company</label>
                    <input className="inp" value={enqForm.buyer_company}
                      onChange={e=>setEnqForm(f=>({...f,buyer_company:e.target.value}))} placeholder="Smith Imports Ltd"/>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label>
                  <input className="inp" type="email" required value={enqForm.buyer_email}
                    onChange={e=>setEnqForm(f=>({...f,buyer_email:e.target.value}))} placeholder="john@company.co.uk"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Quantity Needed (kg)</label>
                  <input className="inp" type="number" min="100" value={enqForm.quantity_kg}
                    onChange={e=>setEnqForm(f=>({...f,quantity_kg:e.target.value}))}
                    placeholder={`Up to ${Number(modal.quantity_kg).toLocaleString("en-IN")} kg available`}/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Message</label>
                  <textarea className="inp" rows={3} value={enqForm.message}
                    onChange={e=>setEnqForm(f=>({...f,message:e.target.value}))}
                    placeholder="e.g. Looking for regular monthly supply. Please share latest phytosanitary certificate and earliest loading date..."/>
                </div>
                <div className="p-3 rounded-xl text-xs flex gap-2" style={{ background:"#eff6ff", border:"1px solid #bfdbfe" }}>
                  <span>✅</span>
                  <span className="text-blue-800"><strong>CETA 2025:</strong> 0% UK import duty on this produce. You save ~12% vs non-India suppliers.</span>
                </div>
                {enqStatus==="error" && (
                  <div className="p-3 rounded-xl text-xs" style={{ background:"#fef2f2", border:"1px solid #fecaca" }}>
                    <p className="text-red-700 font-semibold">❌ Failed to send enquiry</p>
                    <p className="text-red-600 mt-0.5">{enqError}</p>
                  </div>
                )}
                <button type="submit" disabled={enqStatus==="loading"}
                  className="w-full py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2"
                  style={{ background:"linear-gradient(135deg,#2563eb,#1d4ed8)" }}>
                  {enqStatus==="loading"
                    ? <><span style={{ width:16,height:16,border:"2px solid rgba(255,255,255,.4)",borderTopColor:"white",borderRadius:"50%",animation:"spin .8s linear infinite",display:"inline-block" }}/> Sending...</>
                    : "📬 Send Enquiry to Farmer"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <KrishiAI />
    </div>
  );
}

function BuyerHome({ listings, myEnquiries, setPage }) {
  return (
    <div className="space-y-6 anim-fade">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:"Available Listings", value:listings.length,    icon:"🌾", color:"#2d7a3a" },
          { label:"My Enquiries",       value:myEnquiries.length, icon:"📬", color:"#2563eb", action:()=>setPage("enquiries") },
          { label:"UK Import Duty",     value:"0%",               icon:"✅", color:"#059669" },
          { label:"Live GBP Rate",      value:"~₹107",            icon:"💱", color:"#d97706" },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.action?"cursor-pointer":""}`} onClick={s.action||undefined}>
            <span className="text-2xl">{s.icon}</span>
            <div className="font-bold text-2xl text-gray-800 mt-2">{s.value}</div>
            <div className="text-gray-400 text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card p-6" style={{ background:"linear-gradient(135deg,#0c2340,#1a3a5c)" }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="font-bold text-white text-lg">Find Indian Produce</h3>
            <p className="text-blue-300 text-sm mt-1">Browse {listings.length} verified listings from across India</p>
          </div>
          <button onClick={() => setPage("marketplace")} className="btn-gold">Browse Marketplace →</button>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-bold text-gray-800 mb-4">Why buy from KrishiConnect?</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon:"🏷️", title:"0% UK Import Duty", desc:"India-UK CETA 2025 eliminates import duty on 99% of agricultural products. You save 12–15% immediately." },
            { icon:"🤝", title:"Direct from Farmer", desc:"No broker, no middleman. Contact the farmer directly. Build long-term supply relationships." },
            { icon:"📊", title:"Full Price Transparency", desc:"See exact landed cost in GBP — mandi price + shipping + packaging + 0% duty. No surprises." },
          ].map(f => (
            <div key={f.title} className="p-4 rounded-xl" style={{ background:"#f8fafc" }}>
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="font-semibold text-gray-800 text-sm mb-1">{f.title}</div>
              <p className="text-gray-400 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MarketplacePage({ listings, filter, setFilter, filtered, onContact }) {
  return (
    <div className="anim-fade">
      <div className="flex gap-2 mb-6 flex-wrap items-center">
        {CROPS.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background:filter===c?"#2563eb":"#fff", color:filter===c?"#fff":"#6b7280", border:"1.5px solid", borderColor:filter===c?"#2563eb":"#e2e8f0" }}>
            {c!=="All" && CROP_EMOJI[c]} {c}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400">{filtered.length} listing{filtered.length!==1?"s":""}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 card p-12">
          <div className="text-4xl mb-3">🌾</div>
          <p className="text-gray-500">No listings in this category yet.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(l => (
            <div key={l.id} className="listing-card">
              <div className="p-4 pb-3" style={{ background:"#f0f7ff" }}>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{CROP_EMOJI[l.commodity]||"🌿"}</span>
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm">{l.commodity}</h3>
                      <p className="text-xs text-blue-600">{l.grade || "Standard"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {l.price_inr_kg ? <div className="font-bold text-green-700">₹{l.price_inr_kg}/kg</div> : <div className="text-xs text-gray-400 font-medium">Best Offer</div>}
                    <div className="text-xs text-gray-400">{(l.quantity_kg/1000).toFixed(1)} MT</div>
                  </div>
                </div>
              </div>
              <div className="p-4 pt-3 space-y-2">
                <div className="text-xs text-gray-500 flex items-center gap-1">📍 {l.district ? `${l.district}, ` : ""}{l.state}</div>
                {l.description && <p className="text-xs text-gray-400 line-clamp-2">{l.description}</p>}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold">
                      {(l.farmer_name||"F")[0]}
                    </div>
                    {l.farmer_name}
                    {l.profiles?.verified && <span className="text-green-600 text-xs">✓</span>}
                  </div>
                  <span className="badge bg-green-50 text-green-700 text-xs">CETA 0%</span>
                </div>
                <button onClick={() => onContact(l)} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white mt-1"
                  style={{ background:"linear-gradient(135deg,#2563eb,#1d4ed8)" }}>
                  Contact Farmer →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MyEnquiriesPage({ enquiries }) {
  if (enquiries.length === 0) return (
    <div className="card p-12 text-center anim-fade">
      <div className="text-5xl mb-4">📬</div>
      <h3 className="font-bold text-gray-800 mb-2">No enquiries yet</h3>
      <p className="text-gray-400 text-sm">Browse the marketplace and contact farmers to see your enquiries here.</p>
    </div>
  );
  return (
    <div className="space-y-4 anim-fade">
      {enquiries.map(e => (
        <div key={e.id} className="card p-5">
          <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{CROP_EMOJI[e.listings?.commodity]||"🌿"}</span>
              <div>
                <p className="font-semibold text-gray-800">{e.listings?.commodity || "Produce"}</p>
                <p className="text-xs text-gray-400">{e.listings?.farmer_name} · {e.listings?.state}</p>
              </div>
            </div>
            <span className={`badge ${e.status==="pending"?"bg-amber-50 text-amber-700":e.status==="contacted"?"bg-blue-50 text-blue-700":"bg-gray-100 text-gray-500"}`}>{e.status}</span>
          </div>
          {e.message && <p className="text-xs text-gray-500 italic p-3 rounded-xl bg-gray-50 mb-3">"{e.message}"</p>}
          <p className="text-xs text-gray-400">{new Date(e.created_at).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}</p>
        </div>
      ))}
    </div>
  );
}

function BuyerProfile({ profile, user, reloadProfile }) {
  const [form, setForm] = useState({
    name:    profile?.name    || "",
    phone:   profile?.phone   || "",
    company: profile?.company || "",
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast]   = useState(null);

  useEffect(() => {
    setForm({ name: profile?.name||"", phone: profile?.phone||"", company: profile?.company||"" });
  }, [profile]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({
        name:    form.name.trim(),
        phone:   form.phone.trim() || null,
        company: form.company.trim() || null,
      }).eq("id", user.id);
      if (error) throw new Error(error.message);
      await reloadProfile();
      setToast({ msg:"✅ Profile updated! Your details will pre-fill in future enquiries.", type:"success" });
    } catch(err) { setToast({ msg:`❌ ${err.message}`, type:"error" }); }
    finally { setSaving(false); setTimeout(()=>setToast(null),4000); }
  };

  return (
    <div className="max-w-lg anim-fade">
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6 pb-5 border-b border-gray-100">
          <div className="w-16 h-16 rounded-2xl bg-blue-500 flex items-center justify-center text-white font-bold text-2xl">
            {(profile?.name||"B")[0].toUpperCase()}
          </div>
          <div>
            <h2 className="font-bold text-gray-800 text-lg">{profile?.name||"UK Buyer"}</h2>
            <p className="text-gray-400 text-sm">{user?.email}</p>
            <span className="badge text-xs mt-1 bg-blue-50 text-blue-700">🇬🇧 UK Buyer</span>
          </div>
        </div>
        {toast && (
          <div className={`mb-4 p-3 rounded-xl text-sm font-medium ${toast.type==="error"?"bg-red-50 border border-red-200 text-red-700":"bg-green-50 border border-green-200 text-green-700"}`}>
            {toast.msg}
          </div>
        )}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
            <input className="inp" required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="John Smith"/>
            <p className="text-xs text-gray-400 mt-1">Pre-fills your name when you send enquiries to farmers.</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Company Name</label>
            <input className="inp" value={form.company} onChange={e=>setForm(f=>({...f,company:e.target.value}))} placeholder="Smith Imports Ltd"/>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone / WhatsApp</label>
            <input className="inp" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="+44 7700 900000"/>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full">{saving?"Saving...":"Save Profile"}</button>
        </form>
        <div className="mt-5 pt-5 border-t border-gray-100">
          <p className="text-xs text-gray-400 font-semibold uppercase mb-2">Account Email</p>
          <p className="text-sm text-gray-600">{user?.email}</p>
        </div>
      </div>
    </div>
  );
}
