import { useState, useEffect } from "react";
import { getListings, createEnquiry } from "../services/supabase";

const CROPS = ["All","Garlic","Onion","Potato","Turmeric","Ginger","Chilli"];
const CROP_EMOJI = { Garlic:"🧄", Onion:"🧅", Potato:"🥔", Turmeric:"🌿", Ginger:"🫚", Chilli:"🌶️" };
const CROP_COLOR = { Garlic:"#7c5c00", Onion:"#9b2c2c", Potato:"#6b5a00", Turmeric:"#b45309", Ginger:"#166534", Chilli:"#991b1b" };
const CROP_BG    = { Garlic:"#fffbeb", Onion:"#fff5f5", Potato:"#fefce8", Turmeric:"#fff7ed", Ginger:"#f0fdf4", Chilli:"#fff1f2" };

export default function Listings({ onLogin, preview = false }) {
  const [listings, setListings]   = useState([]);
  const [filter, setFilter]       = useState("All");
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(null);
  const [enqForm, setEnqForm]     = useState({ buyer_name:"", buyer_email:"", buyer_company:"", quantity_kg:"", message:"" });
  const [enqStatus, setEnqStatus] = useState(null); // null | loading | success | error

  useEffect(() => {
    getListings()
      .then(d => setListings(d || []))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "All" ? listings : listings.filter(l => l.commodity === filter);
  const display  = preview ? filtered.slice(0, 6) : filtered;

  const sendEnquiry = async (e) => {
    e.preventDefault();
    if (!enqForm.buyer_name || !enqForm.buyer_email) return;
    setEnqStatus("loading");
    try {
      await createEnquiry({
        listing_id:   modal.id,
        buyer_id:     null,
        buyer_name:   enqForm.buyer_name,
        buyer_email:  enqForm.buyer_email,
        buyer_company:enqForm.buyer_company || null,
        quantity_kg:  enqForm.quantity_kg ? Number(enqForm.quantity_kg) : null,
        message:      enqForm.message || null,
      });
      setEnqStatus("success");
    } catch (err) {
      console.error("Enquiry error:", err);
      setEnqStatus("error");
    }
  };

  const closeModal = () => {
    setModal(null);
    setEnqStatus(null);
    setEnqForm({ buyer_name:"", buyer_email:"", buyer_company:"", quantity_kg:"", message:"" });
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div style={{ width:32,height:32,border:"3px solid #e2e8f0",borderTopColor:"#2d7a3a",borderRadius:"50%",animation:"spin .8s linear infinite" }}/>
    </div>
  );

  return (
    <div>
      {/* Filters */}
      {!preview && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {CROPS.map(c => (
            <button key={c} onClick={() => setFilter(c)}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ background:filter===c?"#2d7a3a":"#fff", color:filter===c?"#fff":"#6b7280", border:"1.5px solid", borderColor:filter===c?"#2d7a3a":"#e2e8f0" }}>
              {c !== "All" && CROP_EMOJI[c]} {c}
            </button>
          ))}
          <span className="ml-auto text-xs text-gray-400 self-center">{filtered.length} listing{filtered.length!==1?"s":""}</span>
        </div>
      )}

      {/* Grid */}
      {display.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🌾</div>
          <p className="text-gray-500">No listings found. Be the first to post!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {display.map(l => (
            <div key={l.id} className="listing-card" onClick={() => setModal(l)}>
              {/* Card header */}
              <div className="p-4 pb-3" style={{ background: CROP_BG[l.commodity]||"#f8fafc" }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{CROP_EMOJI[l.commodity]||"🌿"}</span>
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm">{l.commodity}</h3>
                      <p className="text-xs" style={{ color: CROP_COLOR[l.commodity]||"#666" }}>{l.grade || "Standard"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {l.price_inr_kg
                      ? <div className="font-bold text-green-700 text-base">₹{l.price_inr_kg}/kg</div>
                      : <div className="text-xs text-gray-400 font-medium">Best Offer</div>}
                    <div className="text-xs text-gray-400">{(l.quantity_kg/1000).toFixed(1)} MT</div>
                  </div>
                </div>
              </div>

              {/* Card body */}
              <div className="p-4 pt-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-xs">📍</span>
                  <span className="text-xs text-gray-500">{l.district ? `${l.district}, ` : ""}{l.state}</span>
                </div>
                {l.description && (
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">{l.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold">
                      {(l.farmer_name||"F")[0]}
                    </div>
                    <span className="text-xs text-gray-600 font-medium">{l.farmer_name}</span>
                    {l.profiles?.verified && <span className="text-xs text-green-600">✓</span>}
                  </div>
                  <span className="badge bg-green-50 text-green-700 text-xs">CETA 0%</span>
                </div>
              </div>

              <div className="px-4 pb-4">
                <button className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                  style={{ background:"linear-gradient(135deg,#2d7a3a,#4a9c5a)" }}>
                  Contact Farmer →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enquiry Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background:"rgba(0,0,0,.5)", backdropFilter:"blur(4px)" }}
          onClick={e => { if(e.target===e.currentTarget) closeModal(); }}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden anim-pop">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100" style={{ background:"linear-gradient(135deg,#0d2e17,#1a4a28)" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{CROP_EMOJI[modal.commodity]||"🌿"}</span>
                  <div>
                    <h3 className="font-bold text-white">{modal.commodity} — {(modal.quantity_kg/1000).toFixed(1)} MT</h3>
                    <p className="text-green-300 text-xs">{modal.district ? `${modal.district}, ` : ""}{modal.state} · {modal.farmer_name}</p>
                  </div>
                </div>
                <button onClick={closeModal} className="text-white/50 hover:text-white text-xl">✕</button>
              </div>
            </div>

            {enqStatus === "success" ? (
              <div className="p-10 text-center anim-fade">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="font-bold text-gray-800 text-lg mb-2">Enquiry Sent!</h3>
                <p className="text-gray-500 text-sm mb-1">The farmer has been notified.</p>
                <p className="text-gray-400 text-xs mb-6">They will contact you at <strong>{enqForm.buyer_email}</strong></p>
                <button onClick={closeModal} className="btn-primary px-8">Done</button>
              </div>
            ) : (
              <form onSubmit={sendEnquiry} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Your Name *</label>
                    <input className="inp" type="text" placeholder="John Smith" required
                      value={enqForm.buyer_name} onChange={e => setEnqForm(f=>({...f,buyer_name:e.target.value}))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Company</label>
                    <input className="inp" type="text" placeholder="Smith Imports Ltd"
                      value={enqForm.buyer_company} onChange={e => setEnqForm(f=>({...f,buyer_company:e.target.value}))} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address *</label>
                  <input className="inp" type="email" placeholder="john@smithimports.co.uk" required
                    value={enqForm.buyer_email} onChange={e => setEnqForm(f=>({...f,buyer_email:e.target.value}))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Quantity Needed (kg)</label>
                  <input className="inp" type="number" min="100" placeholder={`Available: ${modal.quantity_kg?.toLocaleString("en-IN")} kg`}
                    value={enqForm.quantity_kg} onChange={e => setEnqForm(f=>({...f,quantity_kg:e.target.value}))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Message</label>
                  <textarea className="inp" rows={3}
                    placeholder="e.g. We need monthly supply of 5MT. Please share phytosanitary cert details and earliest shipment date..."
                    value={enqForm.message} onChange={e => setEnqForm(f=>({...f,message:e.target.value}))} />
                </div>

                {/* CETA note */}
                <div className="flex gap-2 p-3 rounded-xl text-xs" style={{ background:"#e8f5ea", border:"1px solid #b7dfbc" }}>
                  <span>✅</span>
                  <span className="text-green-800"><strong>CETA 2025</strong> — 0% UK import duty on this produce. You save 12% vs non-CETA suppliers.</span>
                </div>

                {enqStatus === "error" && (
                  <p className="text-red-500 text-xs">❌ Failed to send. Please check your connection and try again.</p>
                )}

                <button type="submit" disabled={enqStatus==="loading"} className="btn-primary w-full flex items-center justify-center gap-2">
                  {enqStatus==="loading"
                    ? <><span style={{ width:16,height:16,border:"2px solid rgba(255,255,255,.4)",borderTopColor:"white",borderRadius:"50%",animation:"spin .8s linear infinite",display:"inline-block" }}/> Sending...</>
                    : "📬 Send Enquiry to Farmer"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
