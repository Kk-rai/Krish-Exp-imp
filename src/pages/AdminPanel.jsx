import { useState, useEffect } from "react";
import { getAllProfiles, getAllEnquiries, getListings, getAdminStats, verifyFarmer, setUserRole, updateEnquiryStatus } from "../services/supabase";
import { useAuth } from "../context/AuthContext";

export default function AdminPanel() {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState("dashboard");
  const [stats, setStats] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (isAdmin) loadAll(); }, [isAdmin]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [s, p, e, l] = await Promise.all([
        getAdminStats(), getAllProfiles(), getAllEnquiries(),
        getListings(),
      ]);
      setStats(s); setProfiles(p); setEnquiries(e); setListings(l);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (!isAdmin) return (
    <div className="text-center py-20 text-gray-500">
      <div className="text-4xl mb-3">🚫</div>
      <p>Admin access only.</p>
    </div>
  );

  const TABS = [
    { key: "dashboard", label: "📊 Dashboard" },
    { key: "farmers",   label: "👨‍🌾 Farmers" },
    { key: "enquiries", label: "📬 Enquiries" },
    { key: "listings",  label: "🌾 Listings" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-green-900" style={{ fontFamily: "'DM Serif Display',serif" }}>
            🔐 Admin Panel
          </h2>
          <p className="text-sm text-gray-500">Manage farmers, enquiries & listings</p>
        </div>
        <button onClick={loadAll} className="text-sm px-4 py-2 rounded-xl border border-green-200 text-green-700 hover:bg-green-50">
          ↻ Refresh
        </button>
      </div>

      {/* Tab nav */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: tab === t.key ? "#2d7a3a" : "white", color: tab === t.key ? "white" : "#374151", border: "1.5px solid", borderColor: tab === t.key ? "#2d7a3a" : "#e5e7eb" }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading admin data...</div>
      ) : (
        <>
          {tab === "dashboard" && stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label:"Total Listings",    value: stats.totalListings,      color:"#2d7a3a", icon:"🌾" },
                { label:"Total Enquiries",   value: stats.totalEnquiries,     color:"#f5a623", icon:"📬" },
                { label:"Total Users",       value: stats.totalUsers,         color:"#3b82f6", icon:"👥" },
                { label:"Pending Enquiries", value: stats.pendingEnquiries,   color:"#ef4444", icon:"⏳" },
                { label:"Unverified Farmers",value: stats.unverifiedFarmers,  color:"#8b5cf6", icon:"❓" },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {tab === "farmers" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-800">All Users ({profiles.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                      <th className="px-6 py-3">Name</th>
                      <th className="px-6 py-3">Email / Phone</th>
                      <th className="px-6 py-3">Role</th>
                      <th className="px-6 py-3">State</th>
                      <th className="px-6 py-3">Verified</th>
                      <th className="px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.map(p => (
                      <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50">
                        <td className="px-6 py-3 font-medium text-gray-800">{p.name || "—"}</td>
                        <td className="px-6 py-3 text-gray-500">
                          <div>{p.email}</div>
                          {p.phone && <div className="text-xs">{p.phone}</div>}
                        </td>
                        <td className="px-6 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                            style={{ background: p.role === "farmer" ? "#e8f5ea" : p.role === "admin" ? "#fef3c7" : "#dbeafe", color: p.role === "farmer" ? "#1e5c2a" : p.role === "admin" ? "#92400e" : "#1e40af" }}>
                            {p.role || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-gray-500 text-xs">{p.state || "—"}</td>
                        <td className="px-6 py-3">
                          <span className={`w-2 h-2 rounded-full inline-block mr-1 ${p.verified ? "bg-green-500" : "bg-yellow-400"}`}/>
                          {p.verified ? "Verified" : "Pending"}
                        </td>
                        <td className="px-6 py-3">
                          {p.role === "farmer" && !p.verified && (
                            <button onClick={async () => { await verifyFarmer(p.id, true); loadAll(); }}
                              className="text-xs px-3 py-1 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 mr-1">
                              ✓ Verify
                            </button>
                          )}
                          {p.role === "farmer" && p.verified && (
                            <button onClick={async () => { await verifyFarmer(p.id, false); loadAll(); }}
                              className="text-xs px-3 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">
                              Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "enquiries" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-800">All Enquiries ({enquiries.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                      <th className="px-6 py-3">Buyer</th>
                      <th className="px-6 py-3">Commodity</th>
                      <th className="px-6 py-3">Quantity</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enquiries.map(e => (
                      <tr key={e.id} className="border-t border-gray-50 hover:bg-gray-50">
                        <td className="px-6 py-3">
                          <div className="font-medium text-gray-800">{e.buyer_name}</div>
                          <div className="text-xs text-gray-500">{e.buyer_email}</div>
                          {e.buyer_company && <div className="text-xs text-gray-400">{e.buyer_company}</div>}
                        </td>
                        <td className="px-6 py-3 text-gray-700">{e.listings?.commodity || "—"}</td>
                        <td className="px-6 py-3 text-gray-500">{e.quantity_kg ? `${e.quantity_kg}kg` : "—"}</td>
                        <td className="px-6 py-3 text-gray-500 text-xs">{new Date(e.created_at).toLocaleDateString("en-IN")}</td>
                        <td className="px-6 py-3">
                          <StatusBadge status={e.status} />
                        </td>
                        <td className="px-6 py-3">
                          <select value={e.status || "pending"}
                            onChange={async ev => { await updateEnquiryStatus(e.id, ev.target.value); loadAll(); }}
                            className="text-xs px-2 py-1 rounded-lg border border-gray-200 focus:outline-none">
                            <option value="pending">Pending</option>
                            <option value="contacted">Contacted</option>
                            <option value="closed">Closed</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "listings" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-800">All Listings ({listings.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                      <th className="px-6 py-3">Farmer</th>
                      <th className="px-6 py-3">Commodity</th>
                      <th className="px-6 py-3">Qty / Price</th>
                      <th className="px-6 py-3">State</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listings.map(l => (
                      <tr key={l.id} className="border-t border-gray-50 hover:bg-gray-50">
                        <td className="px-6 py-3 font-medium text-gray-800">
                          {l.profiles?.name || l.farmer_name || "—"}
                          {l.profiles?.verified && <span className="ml-1 text-green-500 text-xs">✓</span>}
                        </td>
                        <td className="px-6 py-3 font-semibold text-green-800">{l.commodity}</td>
                        <td className="px-6 py-3 text-gray-600">{l.quantity_kg}kg · {l.price_inr_kg ? `₹${l.price_inr_kg}/kg` : "Neg."}</td>
                        <td className="px-6 py-3 text-gray-500 text-xs">{l.state}</td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${l.is_available ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {l.is_available ? "Active" : "Sold"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = { pending: ["#fff3e0","#b07a00","⏳"], contacted: ["#e0f2fe","#0369a1","📞"], closed: ["#f0fdf4","#166534","✅"] };
  const [bg, color, icon] = map[status] || map.pending;
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: bg, color }}>
      {icon} {status}
    </span>
  );
}
