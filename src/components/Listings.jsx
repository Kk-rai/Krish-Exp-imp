import { useState, useEffect } from "react";
import { getListings, createListing, createEnquiry } from "../services/supabase";
import { useAuth } from "../context/AuthContext";

const CROPS  = ["Garlic","Onion","Potato","Turmeric","Ginger","Chilli"];
const STATES = ["Madhya Pradesh","Maharashtra","Uttar Pradesh","Telangana","Kerala","Andhra Pradesh","Gujarat","Punjab","Rajasthan","Karnataka","Chhattisgarh"];
const CROP_EMOJI = { Garlic:"🧄", Onion:"🧅", Potato:"🥔", Turmeric:"🌿", Ginger:"🫚", Chilli:"🌶️" };

export default function Listings({ setShowLogin }) {
  const { user, profile } = useAuth();
  const [listings, setListings]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeView, setActiveView]     = useState("browse");
  const [filter, setFilter]             = useState("All");
  const [enquiryModal, setEnquiryModal] = useState(null);
  const [postForm, setPostForm]         = useState({ commodity:"Garlic", quantity_kg:"", price_inr_kg:"", state:"Madhya Pradesh", district:"", description:"" });
  const [postStatus, setPostStatus]     = useState(null);
  const [postError, setPostError]       = useState("");
  const [enquiryForm, setEnquiryForm]   = useState({ buyer_name:"", buyer_email:"", buyer_company:"", quantity_kg:"", message:"" });
  const [enquiryStatus, setEnquiryStatus] = useState(null);

  useEffect(() => { fetchListings(); }, []);

  const fetchListings = async () => {
    setLoading(true);
    try { setListings((await getListings()) || []); }
    catch { setListings(MOCK_LISTINGS); }
    finally { setLoading(false); }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    setPostError("");
    if (!user) { setShowLogin(true); return; }
    setPostStatus("loading");
    try {
      await createListing({
        farmer_id:    user.id,
        farmer_name:  profile?.name || user.email?.split("@")[0] || "Farmer",
        farmer_phone: profile?.phone || "",
        commodity:    postForm.commodity,
        quantity_kg:  Number(postForm.quantity_kg),
        price_inr_kg: Number(postForm.price_inr_kg),
        state:        postForm.state,
        district:     postForm.district,
        description:  postForm.description,
        is_available: true,
        is_ceta_eligible: true,
      });
      setPostStatus("success");
      setPostForm({ commodity:"Garlic", quantity_kg:"", price_inr_kg:"", state:"Madhya Pradesh", district:"", description:"" });
      fetchListings();
      setTimeout(() => { setPostStatus(null); setActiveView("browse"); }, 2000);
    } catch (err) {
      setPostStatus("error");
      setPostError(err?.message || "Failed to post. Please try again.");
      console.error("Post listing error:", err);
    }
  };

  const handleEnquiry = async (e) => {
    e.preventDefault();
    setEnquiryStatus("loading");
    try {
      await createEnquiry({ ...enquiryForm, listing_id: enquiryModal.id, quantity_kg: Number(enquiryForm.quantity_kg) });
      setEnquiryStatus("success");
      setTimeout(() => { setEnquiryModal(null); setEnquiryStatus(null); setEnquiryForm({ buyer_name:"", buyer_email:"", buyer_company:"", quantity_kg:"", message:"" }); }, 2000);
    } catch { setEnquiryStatus("error"); }
  };

  const filtered = filter === "All" ? listings : listings.filter(l => l.commodity === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-green-900" style={{ fontFamily:"'DM Serif Display', serif" }}>🛒 Marketplace</h2>
          <p className="text-sm text-gray-500 mt-0.5">Fresh Indian agri produce · CETA zero duty · Direct from farm</p>
        </div>
        <button onClick={() => {
            if (activeView === "browse") {
              if (!user) { setShowLogin(true); return; }
              setActiveView("post");
            } else { setActiveView("browse"); }
          }}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background:"linear-gradient(135deg,#2d7a3a,#4a9c5a)", boxShadow:"0 2px 10px rgba(45,122,58,.3)" }}>
          {activeView === "browse" ? "+ Post Produce" : "← Browse Listings"}
        </button>
      </div>

      {activeView === "browse" ? (
        <>
          <div className="flex gap-2 mb-5 flex-wrap">
            {["All", ...CROPS].map(c => (
              <button key={c} onClick={() => setFilter(c)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{ background: filter===c?"#2d7a3a":"white", color: filter===c?"white":"#374151", border:"1.5px solid", borderColor: filter===c?"#2d7a3a":"#e5e7eb" }}>
                {c !== "All" && CROP_EMOJI[c]} {c}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-400"><div className="text-3xl mb-3">🌾</div>Loading listings...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400"><div className="text-3xl mb-3">🌱</div>No listings yet. Be the first to post!</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(listing => (
                <ListingCard key={listing.id} listing={listing} onEnquire={() => setEnquiryModal(listing)} />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-sm border border-green-100 overflow-hidden">
          <div className="px-6 py-4" style={{ background:"linear-gradient(135deg,#1e5c2a,#2d7a3a)" }}>
            <h3 className="text-white font-bold text-lg">Post Your Produce</h3>
            <p className="text-green-200 text-sm">Posting as: {profile?.name || user?.email}</p>
          </div>
          <form onSubmit={handlePost} className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Commodity *</label>
                <select value={postForm.commodity} onChange={e => setPostForm(f => ({...f, commodity: e.target.value}))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 bg-gray-50">
                  {CROPS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">State *</label>
                <select value={postForm.state} onChange={e => setPostForm(f => ({...f, state: e.target.value}))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 bg-gray-50">
                  {STATES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Quantity (kg) *" type="number" value={postForm.quantity_kg} onChange={e => setPostForm(f => ({...f, quantity_kg: e.target.value}))} required placeholder="5000" />
              <FormField label="Price (₹/kg)" type="number" value={postForm.price_inr_kg} onChange={e => setPostForm(f => ({...f, price_inr_kg: e.target.value}))} placeholder="55" />
            </div>
            <FormField label="District / Mandi" value={postForm.district} onChange={e => setPostForm(f => ({...f, district: e.target.value}))} placeholder="Mandsor" />
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
              <textarea value={postForm.description} onChange={e => setPostForm(f => ({...f, description: e.target.value}))} rows={3}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 bg-gray-50 resize-none"
                placeholder="Grade, variety, quality details..."/>
            </div>
            <button type="submit" disabled={postStatus === "loading"}
              className="w-full py-3 rounded-xl font-semibold text-white text-sm"
              style={{ background:"linear-gradient(135deg,#2d7a3a,#4a9c5a)", boxShadow:"0 4px 14px rgba(45,122,58,.3)", opacity: postStatus==="loading"?0.7:1 }}>
              {postStatus==="loading" ? "Posting..." : postStatus==="success" ? "✅ Posted Successfully!" : "Post Listing →"}
            </button>
            {postStatus === "error" && <p className="text-red-500 text-xs text-center">{postError || "Failed to post. Please try again."}</p>}
          </form>
        </div>
      )}

      {enquiryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:"rgba(0,0,0,0.5)" }}
          onClick={e => { if (e.target === e.currentTarget) setEnquiryModal(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4" style={{ background:"linear-gradient(135deg,#1e5c2a,#2d7a3a)" }}>
              <h3 className="text-white font-bold">Send Enquiry</h3>
              <p className="text-green-200 text-sm">{enquiryModal.commodity} · {enquiryModal.quantity_kg}kg</p>
            </div>
            <form onSubmit={handleEnquiry} className="px-6 py-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Your Name *" value={enquiryForm.buyer_name} onChange={e => setEnquiryForm(f => ({...f, buyer_name: e.target.value}))} required placeholder="John Smith" />
                <FormField label="Email *" type="email" value={enquiryForm.buyer_email} onChange={e => setEnquiryForm(f => ({...f, buyer_email: e.target.value}))} required placeholder="john@ukimports.co.uk" />
              </div>
              <FormField label="Company" value={enquiryForm.buyer_company} onChange={e => setEnquiryForm(f => ({...f, buyer_company: e.target.value}))} placeholder="UK Imports Ltd" />
              <FormField label="Quantity needed (kg)" type="number" value={enquiryForm.quantity_kg} onChange={e => setEnquiryForm(f => ({...f, quantity_kg: e.target.value}))} placeholder="1000" />
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Message</label>
                <textarea value={enquiryForm.message} onChange={e => setEnquiryForm(f => ({...f, message: e.target.value}))} rows={3}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 bg-gray-50 resize-none"
                  placeholder="Delivery timeline, quality requirements, payment terms..."/>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setEnquiryModal(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600">Cancel</button>
                <button type="submit" disabled={enquiryStatus==="loading"}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background:"linear-gradient(135deg,#2d7a3a,#4a9c5a)" }}>
                  {enquiryStatus==="loading"?"Sending...":enquiryStatus==="success"?"✅ Sent!":"Send Enquiry →"}
                </button>
              </div>
              {enquiryStatus==="error" && <p className="text-red-500 text-xs text-center">Failed to send. Please try again.</p>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ListingCard({ listing, onEnquire }) {
  const emoji = CROP_EMOJI[listing.commodity] || "🌿";
  const farmerName = listing.profiles?.name || listing.farmer_name || "Farmer";
  return (
    <div className="bg-white rounded-2xl border border-green-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="px-5 py-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{emoji}</span>
            <div>
              <div className="font-bold text-green-900">{listing.commodity}</div>
              <div className="text-xs text-gray-500">{listing.state}{listing.district ? ` · ${listing.district}` : ""}</div>
            </div>
          </div>
          {listing.is_ceta_eligible && (
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background:"#e8f5ea", color:"#1e5c2a" }}>CETA ✓</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <div className="font-bold text-green-800 text-lg">{(listing.quantity_kg/1000).toFixed(1)}T</div>
            <div className="text-xs text-gray-500">Available</div>
          </div>
          <div className="bg-orange-50 rounded-xl p-3 text-center">
            <div className="font-bold text-orange-700 text-lg">{listing.price_inr_kg ? `₹${listing.price_inr_kg}/kg` : "Negotiable"}</div>
            <div className="text-xs text-gray-500">Asking price</div>
          </div>
        </div>
        {listing.description && <p className="text-xs text-gray-500 mb-3 leading-relaxed line-clamp-2">{listing.description}</p>}
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-400">by {farmerName}</div>
          <button onClick={onEnquire} className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white"
            style={{ background:"linear-gradient(135deg,#2d7a3a,#4a9c5a)" }}>Contact Farmer →</button>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      <input {...props} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 bg-gray-50 transition-colors"/>
    </div>
  );
}

const MOCK_LISTINGS = [
  { id:"1", farmer_name:"Ramesh Patel",   commodity:"Garlic",   quantity_kg:5000,  price_inr_kg:55, state:"Madhya Pradesh", district:"Mandsor",   description:"Fresh white garlic, export grade", is_ceta_eligible:true },
  { id:"2", farmer_name:"Suresh Yadav",   commodity:"Onion",    quantity_kg:8000,  price_inr_kg:22, state:"Maharashtra",    district:"Nashik",    description:"Red onion, 5-7cm, cleaned and sorted", is_ceta_eligible:true },
  { id:"3", farmer_name:"Kavita Sharma",  commodity:"Turmeric", quantity_kg:2000,  price_inr_kg:98, state:"Telangana",      district:"Nizamabad", description:"7% curcumin, machine cleaned", is_ceta_eligible:true },
  { id:"4", farmer_name:"Murugan Pillai", commodity:"Ginger",   quantity_kg:3000,  price_inr_kg:42, state:"Kerala",         district:"Wayanad",   description:"Baby ginger, export quality", is_ceta_eligible:true },
];
