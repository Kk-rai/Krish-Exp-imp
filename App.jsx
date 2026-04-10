import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import AdminPanel from "./pages/AdminPanel";
import FarmerDashboard from "./pages/FarmerDashboard";
import PriceTicker from "./components/PriceTicker";
import PriceCalculator from "./components/PriceCalculator";
import KrishiAI from "./components/KrishiAI";
import Listings from "./components/Listings";
import { supabase } from "./services/supabase";

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

function AppInner() {
  const { user, profile, loading, isAdmin, isFarmer } = useAuth();
  const [activeTab, setActiveTab] = useState("Home");
  const [showLogin, setShowLogin] = useState(false);

  const NAV_TABS = [
    "Home",
    "Calculator",
    "Marketplace",
    "How It Works",
    ...(user && isFarmer  ? ["My Dashboard"] : []),
    ...(user && isAdmin   ? ["Admin"] : []),
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#f5f9f6" }}>
      <div className="text-center">
        <div className="text-4xl mb-3">🌾</div>
        <div className="text-green-700 font-semibold">Loading KrishiConnect...</div>
      </div>
    </div>
  );

  if (showLogin) return <LoginPage onDone={() => { setShowLogin(false); setActiveTab("Home"); }} />;

  return (
    <div className="min-h-screen" style={{ background: "#f5f9f6", fontFamily: "'DM Sans', sans-serif" }}>
      <PriceTicker />

      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-white border-b border-green-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
          <button onClick={() => setActiveTab("Home")} className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-lg"
              style={{ background: "linear-gradient(135deg,#2d7a3a,#4a9c5a)" }}>🌾</div>
            <div className="text-left">
              <div className="font-bold text-green-900 leading-tight text-sm" style={{ fontFamily:"'DM Serif Display',serif" }}>KrishiConnect</div>
              <div className="text-xs text-green-600 leading-tight">India → UK · CETA 2025</div>
            </div>
          </button>

          <div className="hidden md:flex items-center gap-1">
            {NAV_TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ background: activeTab===tab ? "#e8f5ea" : "transparent", color: activeTab===tab ? "#1e5c2a" : "#6b7280" }}>
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden md:block text-right">
                  <div className="text-xs font-semibold text-gray-700">{profile?.name || user.email?.split("@")[0]}</div>
                  <div className="text-xs text-gray-400 capitalize">{profile?.role || "user"}</div>
                </div>
                <button onClick={() => supabase.auth.signOut()}
                  className="text-xs px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50">
                  Sign Out
                </button>
              </div>
            ) : (
              <button onClick={() => setShowLogin(true)}
                className="text-sm font-semibold px-4 py-2 rounded-xl text-white"
                style={{ background:"linear-gradient(135deg,#2d7a3a,#4a9c5a)", boxShadow:"0 2px 10px rgba(45,122,58,.3)" }}>
                Login / Register
              </button>
            )}
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="md:hidden flex gap-1 px-4 pb-2 overflow-x-auto">
          {NAV_TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: activeTab===tab ? "#e8f5ea" : "#f3f4f6", color: activeTab===tab ? "#1e5c2a" : "#6b7280" }}>
              {tab}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === "Home"         && <HomePage setActiveTab={setActiveTab} setShowLogin={setShowLogin} user={user} />}
        {activeTab === "Calculator"   && <PriceCalculator />}
        {activeTab === "Marketplace"  && <Listings user={user} setShowLogin={setShowLogin} />}
        {activeTab === "How It Works" && <HowItWorks />}
        {activeTab === "My Dashboard" && <FarmerDashboard />}
        {activeTab === "Admin"        && <AdminPanel />}
      </main>

      <KrishiAI />
    </div>
  );
}

function HomePage({ setActiveTab, setShowLogin, user }) {
  return (
    <div>
      <div className="text-center py-12 px-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6"
          style={{ background:"#e8f5ea", color:"#1e5c2a", border:"1px solid #b8ddc0" }}>
          🇮🇳 India-UK CETA Active · Zero Duty on 99% Agri Exports 🇬🇧
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-green-900 leading-tight mb-4"
          style={{ fontFamily:"'DM Serif Display',serif" }}>
          Your Crop. UK Market.<br/>
          <span style={{ color:"#f5a623" }}>No Brokers. Full Price.</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-xl mx-auto mb-8">
          KrishiConnect connects Indian farmers directly to UK buyers. See your exact ₹ payout. UK buyers see full £ cost. Transparent. Simple. Fair.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => setActiveTab("Calculator")}
            className="px-8 py-3.5 rounded-xl font-semibold text-white text-base"
            style={{ background:"linear-gradient(135deg,#2d7a3a,#4a9c5a)", boxShadow:"0 4px 18px rgba(45,122,58,.35)" }}>
            🧮 Calculate Export Price
          </button>
          {!user && (
            <button onClick={() => setShowLogin(true)}
              className="px-8 py-3.5 rounded-xl font-semibold text-base border-2"
              style={{ borderColor:"#2d7a3a", color:"#2d7a3a" }}>
              👨‍🌾 Register as Farmer
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {[
          { value:"0%",   label:"UK Import Duty (CETA)", icon:"✅" },
          { value:"99%",  label:"Agri products covered",  icon:"🌾" },
          { value:"+17%", label:"More vs broker route",   icon:"💰" },
          { value:"₹107", label:"Per GBP (approx)",       icon:"💱" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 text-center border border-green-100 shadow-sm">
            <div className="text-3xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold" style={{ color:"#1e5c2a" }}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {[
          { icon:"🧮", title:"Price Calculator",  desc:"Live mandi prices + GBP/INR rate. See exact ₹ payout and UK landed cost in £.", cta:"Try Calculator", tab:"Calculator" },
          { icon:"🌾", title:"Post Your Produce",  desc:"List your crop. UK buyers contact you directly. No middlemen beyond 2% platform fee.", cta:"Browse Listings", tab:"Marketplace" },
          { icon:"💬", title:"Ask KrishiAI",       desc:"Hindi/English AI assistant for export docs, CETA, pricing and shipping questions.", cta:null, tab:null },
        ].map(card => (
          <div key={card.title} className="bg-white rounded-2xl p-6 border border-green-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl mb-3">{card.icon}</div>
            <h3 className="font-bold text-green-900 text-lg mb-2">{card.title}</h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">{card.desc}</p>
            {card.tab && <button onClick={() => setActiveTab(card.tab)} className="text-sm font-semibold text-green-700">{card.cta} →</button>}
          </div>
        ))}
      </div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { n:"01", title:"Register & verify", desc:"Sign up with your email, get OTP, complete your profile. Admin verifies your farmer account.", who:"Farmer" },
    { n:"02", title:"List your crop",    desc:"Post produce with quantity, price, and location. Takes 2 minutes.", who:"Farmer" },
    { n:"03", title:"UK buyer finds you", desc:"UK importers browse and send enquiry directly. You get an email notification instantly.", who:"Buyer" },
    { n:"04", title:"Use price calculator", desc:"Both sides see the exact CETA landed cost breakdown in ₹ and £.", who:"Both" },
    { n:"05", title:"Prepare documents",  desc:"Phytosanitary cert, CoO (CETA), invoice, packing list, Bill of Lading.", who:"Farmer" },
    { n:"06", title:"Ship & get paid",    desc:"0% UK import duty via CETA. Ship via freight forwarder. Get full payout.", who:"Farmer" },
  ];
  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-green-900 text-center mb-2" style={{ fontFamily:"'DM Serif Display',serif" }}>How It Works</h2>
      <p className="text-center text-gray-500 mb-10">From mandi to Manchester in 6 steps</p>
      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-green-100"/>
        {steps.map((step, i) => (
          <div key={i} className="relative flex gap-5 mb-8">
            <div className="w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center font-bold text-white text-lg z-10"
              style={{ background:"linear-gradient(135deg,#2d7a3a,#4a9c5a)" }}>{step.n}</div>
            <div className="bg-white rounded-2xl p-5 flex-1 border border-green-100 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-green-900">{step.title}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: step.who==="Farmer"?"#e8f5ea":step.who==="Buyer"?"#fff3e0":"#f3e8ff", color: step.who==="Farmer"?"#1e5c2a":step.who==="Buyer"?"#b07a00":"#6b21a8" }}>
                  {step.who}
                </span>
              </div>
              <p className="text-gray-600 text-sm">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
