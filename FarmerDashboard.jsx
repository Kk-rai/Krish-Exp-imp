import { useState, useEffect } from "react";
import { getMyListings, getEnquiriesForFarmer, createListing, updateListing } from "../services/supabase";
import { useAuth } from "../context/AuthContext";

const CROPS  = ["Garlic","Onion","Potato","Turmeric","Ginger","Chilli"];
const STATES = ["Madhya Pradesh","Maharashtra","Uttar Pradesh","Telangana","Kerala","Andhra Pradesh","Gujarat","Punjab","Rajasthan","Karnataka"];

export default function FarmerDashboard() {
  const { user, profile, isVerified } = useAuth();
  const [tab, setTab]             = useState("listings");
  const [listings, setListings]   = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [showForm, setShowForm]   = useState(false);
  const [loading, setLoading]     = useState(true);
  const [form, setForm] = useState({ commodity:"Garlic", quantity_kg:"", price_inr_kg:"", state: profile?.state || "Madhya Pradesh", district:"", description:"" });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => { if (user) load(); }, [user]);

  const load = async () => {
    setLoading(true);
    try {
      const [l, e] = await Promise.all([
        getMyListings(user.id),
        getEnquiriesForFarmer(user.id),
      ]);
      setListings(l); setEnquiries(e);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createListing({ ...form, farmer_id: user.id, farmer_name: profile?.name, quantity_kg: Number(form.quantity_kg), price_inr_kg: Number(form.price_inr_kg) || null, is_available: true, is_ceta_eligible: true });
      setSuccess(true);
      setForm({ commodity:"Garlic", quantity_kg:"", price_inr_kg:"", state: profile?.state || "Madhya Pradesh", district:"", description:"" });
      setShowForm(false);
      await load();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  return (
    <div>
      {/* Welcome bar */}
      <div className="bg-white rounded-2xl p-5 border border-green-100 shadow-sm mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-green-900">Namaste, {profile?.name || "Farmer"} 👋</h2>
          <p className="text-sm text-gray-500 mt-0.5">{profile?.state} · {profile?.phone || profile?.email}</p>
        </div>
        <div className="text-right">
          {isVerified ? (
            <span className="text-xs px-3 py-1.5 rounded-full bg-green-100 text-green-700 font-semibold">✓ Verified Farmer</span>
          ) : (
            <span className="text-xs px-3 py-1.5 rounded-full bg-yellow-100 text-yellow-700 font-semibold">⏳ Verification Pending</span>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label:"My Listings",      value: listings.length,                            icon:"🌾", color:"#2d7a3a" },
          { label:"Enquiries Received", value: enquiries.length,                         icon:"📬", color:"#f5a623" },
          { label:"Active Listings",  value: listings.filter(l=>l.is_available).length,  icon:"✅", color:"#3b82f6" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
            <div className="text-xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {["listings","enquiries"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all"
            style={{ background: tab===t ? "#2d7a3a" : "white", color: tab===t ? "white" : "#374151", border:"1.5px solid", borderColor: tab===t ? "#2d7a3a" : "#e5e7eb" }}>
            {t === "listings" ? "🌾 My Listings" : "📬 Enquiries Received"}
          </button>
        ))}
        <button onClick={() => setShowForm(v => !v)}
          className="ml-auto px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg,#2d7a3a,#4a9c5a)" }}>
          + Post New Listing
        </button>
      </div>

      {/* Post form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-6 mb-5">
          <h3 className="font-bold text-green-900 mb-4">Post Your Produce</h3>
          {success && <div className="bg-green-50 text-green-700 px-4 py-2 rounded-xl text-sm mb-4">✅ Listing posted successfully!</div>}
          <form onSubmit={handlePost} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Commodity *</label>
              <select value={form.commodity} onChange={e => setForm(f=>({...f,commodity:e.target.value}))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 bg-gray-50">
                {CROPS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">State *</label>
              <select value={form.state} onChange={e => setForm(f=>({...f,state:e.target.value}))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 bg-gray-50">
                {STATES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Quantity (kg) *</label>
              <input required type="number" value={form.quantity_kg} onChange={e => setForm(f=>({...f,quantity_kg:e.target.value}))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 bg-gray-50" placeholder="5000"/>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Price (₹/kg)</label>
              <input type="number" value={form.price_inr_kg} onChange={e => setForm(f=>({...f,price_inr_kg:e.target.value}))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 bg-gray-50" placeholder="55"/>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">District / Mandi</label>
              <input value={form.district} onChange={e => setForm(f=>({...f,district:e.target.value}))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 bg-gray-50" placeholder="Mandsor"/>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
              <input value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 bg-gray-50" placeholder="Grade, quality details..."/>
            </div>
            <div className="col-span-2">
              <button type="submit" disabled={saving}
                className="px-8 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background:"linear-gradient(135deg,#2d7a3a,#4a9c5a)" }}>
                {saving ? "Posting..." : "Post Listing →"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? <div className="text-center py-10 text-gray-400">Loading...</div> : (
        <>
          {tab === "listings" && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.length === 0 ? (
                <div className="col-span-3 text-center py-16 text-gray-400">
                  <div className="text-3xl mb-2">🌱</div>
                  No listings yet. Post your first produce above!
                </div>
              ) : listings.map(l => (
                <div key={l.id} className="bg-white rounded-2xl border border-green-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-green-900">{l.commodity}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${l.is_available ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {l.is_available ? "Active" : "Sold"}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>{l.quantity_kg?.toLocaleString("en-IN")}kg · {l.price_inr_kg ? `₹${l.price_inr_kg}/kg` : "Price negotiable"}</div>
                    <div className="text-xs text-gray-400">{l.state}{l.district ? `, ${l.district}` : ""}</div>
                    {l.description && <div className="text-xs text-gray-500 mt-1">{l.description}</div>}
                  </div>
                  <button onClick={async () => { await updateListing(l.id, { is_available: !l.is_available }); load(); }}
                    className="mt-3 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                    Mark as {l.is_available ? "Sold" : "Available"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === "enquiries" && (
            <div className="space-y-3">
              {enquiries.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <div className="text-3xl mb-2">📬</div>
                  No enquiries yet. They'll appear here when UK buyers contact you.
                </div>
              ) : enquiries.map(e => (
                <div key={e.id} className="bg-white rounded-2xl border border-green-100 shadow-sm p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-gray-800">{e.buyer_name} {e.buyer_company ? `· ${e.buyer_company}` : ""}</div>
                      <div className="text-sm text-green-700 mt-0.5">{e.buyer_email}</div>
                      {e.quantity_kg && <div className="text-sm text-gray-600 mt-1">Wants: {e.quantity_kg}kg</div>}
                      {e.message && <div className="text-sm text-gray-500 mt-2 bg-gray-50 rounded-lg px-3 py-2">"{e.message}"</div>}
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <div className="text-xs text-gray-400">{new Date(e.created_at).toLocaleDateString("en-IN")}</div>
                      <a href={`mailto:${e.buyer_email}?subject=Re: ${e.listings?.commodity} enquiry from KrishiConnect`}
                        className="mt-2 inline-block text-xs px-3 py-1.5 rounded-lg text-white"
                        style={{ background:"linear-gradient(135deg,#2d7a3a,#4a9c5a)" }}>
                        Reply by Email →
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
