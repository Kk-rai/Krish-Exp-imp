import { useState, useEffect } from "react";
import { getEnquiriesForBuyer } from "../services/supabase";
import { useAuth } from "../context/AuthContext";

const STATUS_STYLES = {
  pending:   { bg: "#fff8e6", color: "#b07a00", label: "Pending" },
  contacted: { bg: "#e8f5ea", color: "#1e5c2a", label: "Contacted" },
  closed:    { bg: "#f3f4f6", color: "#6b7280", label: "Closed" },
};

export default function BuyerDashboard({ setActiveTab }) {
  const { user, profile, isBuyer } = useAuth();
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isBuyer) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const rows = await getEnquiriesForBuyer(user.id);
        if (!cancelled) setEnquiries(rows);
      } catch (e) {
        console.error(e);
        if (!cancelled) setEnquiries([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, isBuyer]);

  if (!isBuyer) {
    return (
      <div className="text-center py-20 text-gray-500">
        <div className="text-4xl mb-3">🛒</div>
        <p className="mb-4">This area is for UK buyers. Sign in with a buyer account.</p>
        <button
          type="button"
          onClick={() => setActiveTab("Marketplace")}
          className="text-sm font-semibold text-green-700 underline"
        >
          Go to Marketplace
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white rounded-2xl p-5 border border-green-100 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-green-900">Hello, {profile?.name || "Buyer"} 🇬🇧</h2>
          <p className="text-sm text-gray-500 mt-0.5">{profile?.email}{profile?.phone ? ` · ${profile.phone}` : ""}</p>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab("Marketplace")}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white shrink-0"
          style={{ background: "linear-gradient(135deg,#2d7a3a,#4a9c5a)", boxShadow: "0 2px 10px rgba(45,122,58,.3)" }}
        >
          Browse listings
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "My enquiries", value: enquiries.length, icon: "📬", color: "#2d7a3a" },
          { label: "Pending", value: enquiries.filter(e => e.status === "pending").length, icon: "⏳", color: "#f5a623" },
          { label: "Closed", value: enquiries.filter(e => e.status === "closed").length, icon: "✅", color: "#6b7280" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
            <div className="text-xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <h3 className="text-lg font-bold text-green-900 mb-3" style={{ fontFamily: "'DM Serif Display', serif" }}>Enquiry history</h3>

      {loading ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-3xl mb-3">🌾</div>
          Loading your enquiries...
        </div>
      ) : enquiries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-green-100 p-10 text-center text-gray-500">
          <div className="text-3xl mb-3">📭</div>
          <p className="mb-4">You have not sent any enquiries yet while signed in as a buyer.</p>
          <button
            type="button"
            onClick={() => setActiveTab("Marketplace")}
            className="text-sm font-semibold text-green-700"
          >
            Open Marketplace →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {enquiries.map(enq => {
            const st = STATUS_STYLES[enq.status] || STATUS_STYLES.pending;
            const L = enq.listings;
            return (
              <div
                key={enq.id}
                className="bg-white rounded-2xl border border-green-100 shadow-sm p-5 flex flex-col md:flex-row md:items-start md:justify-between gap-3"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-bold text-green-900">{L?.commodity || "Listing"}</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: st.bg, color: st.color }}
                    >
                      {st.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {L?.farmer_name ? `Farmer: ${L.farmer_name}` : "Farmer"}
                    {L?.state ? ` · ${L.state}` : ""}
                    {L?.district ? ` · ${L.district}` : ""}
                  </p>
                  {enq.quantity_kg != null && (
                    <p className="text-xs text-gray-500 mt-1">Quantity discussed: {enq.quantity_kg} kg</p>
                  )}
                  {enq.message && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-3">&ldquo;{enq.message}&rdquo;</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Sent {new Date(enq.created_at).toLocaleString("en-GB")}
                  </p>
                </div>
                <div className="text-sm text-gray-500 md:text-right shrink-0">
                  <div>{enq.buyer_company || "—"}</div>
                  <div className="text-xs text-gray-400">{enq.buyer_email}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
