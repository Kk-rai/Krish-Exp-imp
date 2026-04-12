import { useState, useEffect } from "react";
import PriceTicker from "../components/PriceTicker";
import PriceCalculator from "../components/PriceCalculator";
import Listings from "../components/Listings";
import KrishiAI from "../components/KrishiAI";

const NAV = ["Home", "Calculator", "Marketplace", "How It Works"];
const CROP_EMOJI = { Garlic:"🧄", Onion:"🧅", Potato:"🥔", Turmeric:"🌿", Ginger:"🫚", Chilli:"🌶️" };

export default function PublicApp({ onLogin }) {
  const [tab, setTab] = useState("Home");

  return (
    <div className="min-h-screen" style={{ background:"#f0f2f5", fontFamily:"'DM Sans',sans-serif" }}>
      <PriceTicker />

      {/* ── Topnav ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-5 flex items-center justify-between h-16">
          <button onClick={() => setTab("Home")} className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-lg"
              style={{ background:"linear-gradient(135deg,#2d7a3a,#4a9c5a)" }}>🌾</div>
            <div>
              <div className="font-bold text-green-900 text-sm leading-tight" style={{ fontFamily:"'DM Serif Display',serif" }}>KrishiConnect</div>
              <div className="text-xs text-green-600 leading-tight">India → UK · CETA 2025</div>
            </div>
          </button>

          <div className="hidden md:flex items-center gap-0.5">
            {NAV.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ background:tab===t?"#e8f5ea":"transparent", color:tab===t?"#1e5c2a":"#6b7280" }}>
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={onLogin}
              className="text-sm font-semibold px-4 py-2 rounded-xl text-white"
              style={{ background:"linear-gradient(135deg,#2d7a3a,#4a9c5a)", boxShadow:"0 2px 10px rgba(45,122,58,.3)" }}>
              Login / Register
            </button>
          </div>
        </div>
        {/* Mobile tabs */}
        <div className="md:hidden flex gap-1.5 px-4 pb-2 overflow-x-auto no-scrollbar">
          {NAV.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background:tab===t?"#2d7a3a":"#f1f5f9", color:tab===t?"white":"#6b7280" }}>
              {t}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {tab === "Home"         && <HomePage setTab={setTab} onLogin={onLogin} />}
        {tab === "Calculator"   && <PriceCalculator />}
        {tab === "Marketplace"  && <Listings onLogin={onLogin} />}
        {tab === "How It Works" && <HowItWorks />}
      </main>

      <footer className="border-t border-gray-200 bg-white mt-16 py-8 text-center text-sm text-gray-400">
        <p className="font-medium text-gray-600">🌾 KrishiConnect · India → UK Agricultural Exports</p>
        <p className="mt-1 text-xs">Built with ❤️ in Indore · CETA 2025 · Zero broker fees</p>
      </footer>

      <KrishiAI />
    </div>
  );
}

function HomePage({ setTab, onLogin }) {
  return (
    <div className="anim-fade">
      {/* Hero */}
      <div className="rounded-2xl overflow-hidden mb-8 relative" style={{ background:"linear-gradient(135deg,#0d3320 0%,#1e5c2a 50%,#2d7a3a 100%)", minHeight:380 }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage:"radial-gradient(circle at 70% 50%, #f5a623 0%, transparent 60%)" }}/>
        <div className="relative px-8 py-16 md:py-20 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{ background:"rgba(245,166,35,.2)", color:"#f5a623", border:"1px solid rgba(245,166,35,.3)" }}>
            🇮🇳 India-UK CETA 2025 Active · Zero Duty on 99% Agri Exports 🇬🇧
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4"
            style={{ fontFamily:"'DM Serif Display',serif" }}>
            Your Crop.<br/>UK Market.<br/>
            <span style={{ color:"#f5a623" }}>No Brokers.</span>
          </h1>
          <p className="text-green-200 text-lg mb-8 max-w-lg leading-relaxed">
            Connect directly with UK buyers. See your exact ₹ payout. Zero import duty under CETA. Fair, transparent, no middlemen.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => setTab("Calculator")}
              className="px-7 py-3.5 rounded-xl font-bold text-base text-white transition-all hover:opacity-90"
              style={{ background:"linear-gradient(135deg,#f5a623,#e08c10)", boxShadow:"0 4px 16px rgba(245,166,35,.4)" }}>
              🧮 Calculate My Payout
            </button>
            <button onClick={onLogin}
              className="px-7 py-3.5 rounded-xl font-bold text-base transition-all hover:bg-white/10"
              style={{ border:"2px solid rgba(255,255,255,.4)", color:"white" }}>
              👨‍🌾 Register Free →
            </button>
          </div>
        </div>

        {/* Floating stat cards */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:grid grid-cols-2 gap-3">
          {[
            { v:"0%",   l:"UK Import Duty",    c:"#4ade80" },
            { v:"99%",  l:"Products covered",  c:"#60a5fa" },
            { v:"+17%", l:"vs broker route",   c:"#f5a623" },
            { v:"₹107", l:"Per GBP today",     c:"#f472b6" },
          ].map(s => (
            <div key={s.l} className="rounded-xl p-4 text-center" style={{ background:"rgba(255,255,255,.1)", backdropFilter:"blur(10px)", border:"1px solid rgba(255,255,255,.15)" }}>
              <div className="text-2xl font-bold" style={{ color:s.c }}>{s.v}</div>
              <div className="text-white/60 text-xs mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 lg:hidden">
        {[
          { v:"0%",   l:"UK Import Duty (CETA)", icon:"✅" },
          { v:"99%",  l:"Agri products covered",  icon:"🌾" },
          { v:"+17%", l:"More vs broker route",   icon:"💰" },
          { v:"₹107", l:"Per GBP (approx)",       icon:"💱" },
        ].map(s => (
          <div key={s.l} className="card p-4 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-xl font-bold text-green-800">{s.v}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Feature cards */}
      <div className="grid md:grid-cols-3 gap-5 mb-8">
        {[
          { icon:"🧮", title:"Export Price Calculator", desc:"Enter crop + quantity → see exact UK landed cost in £ and your ₹ payout. Live mandi prices + GBP/INR rate.", cta:"Try Calculator", action:() => setTab("Calculator"), color:"#2d7a3a" },
          { icon:"🛒", title:"Direct Marketplace",      desc:"Post your produce. UK buyers browse and contact you directly. No broker, only 2% platform fee.", cta:"Browse Market", action:() => setTab("Marketplace"), color:"#2563eb" },
          { icon:"💬", title:"KrishiAI Assistant",      desc:"Ask anything in Hindi or English — export docs, CETA rules, shipping process, UK market prices.", cta:null, action:null, color:"#7c3aed" },
        ].map(c => (
          <div key={c.title} className="card card-hover p-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
              style={{ background:`${c.color}15` }}>{c.icon}</div>
            <h3 className="font-bold text-gray-800 text-base mb-2">{c.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-4">{c.desc}</p>
            {c.action
              ? <button onClick={c.action} className="text-sm font-semibold" style={{ color:c.color }}>{c.cta} →</button>
              : <span className="text-xs text-purple-500 font-medium">Click 🌾 button at bottom-right →</span>
            }
          </div>
        ))}
      </div>

      {/* How it works - compact */}
      <div className="card p-6">
        <h2 className="font-bold text-gray-800 text-lg mb-5">How It Works — 6 Steps</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { n:"01", t:"Register & verify", d:"OTP login, complete profile. Admin verifies within 24h.", who:"Farmer" },
            { n:"02", t:"List your crop",    d:"Post produce in 2 mins. Goes live immediately.", who:"Farmer" },
            { n:"03", t:"Buyer finds you",   d:"UK importers browse verified listings, send enquiry.", who:"Buyer" },
            { n:"04", t:"See full pricing",  d:"Both sides see exact ₹/£ breakdown. No surprises.", who:"Both" },
            { n:"05", t:"Prepare documents", d:"Phytosanitary cert, CoO (CETA), invoice, packing list.", who:"Farmer" },
            { n:"06", t:"Ship & get paid",   d:"0% UK duty via CETA. Ship via freight forwarder.", who:"Farmer" },
          ].map((s,i) => {
            const c = s.who==="Farmer"?["#e8f5ea","#1e5c2a"]:s.who==="Buyer"?["#fff3e0","#b07a00"]:["#f3e8ff","#6b21a8"];
            return (
              <div key={i} className="flex gap-3">
                <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                  style={{ background:"linear-gradient(135deg,#2d7a3a,#4a9c5a)" }}>{s.n}</div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-sm text-gray-800">{s.t}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background:c[0], color:c[1] }}>{s.who}</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{s.d}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { n:"01", title:"Register & verify",     desc:"Sign up with email OTP — no password. Complete profile. Admin verifies your farmer account within 24 hours.", who:"Farmer" },
    { n:"02", title:"List your crop",         desc:"Post produce with quantity, price, location. Goes live immediately for UK buyers to see.", who:"Farmer" },
    { n:"03", title:"UK buyer finds you",     desc:"UK importers browse verified listings and send direct enquiry. You get email notification instantly.", who:"Buyer" },
    { n:"04", title:"Use price calculator",   desc:"Both sides see exact CETA landed cost breakdown in ₹ and £. Full transparency, no surprises.", who:"Both" },
    { n:"05", title:"Prepare documents",      desc:"Phytosanitary certificate, Certificate of Origin (CETA), Commercial Invoice, Packing List, Bill of Lading.", who:"Farmer" },
    { n:"06", title:"Ship & get paid",        desc:"0% UK import duty via CETA. Ship via freight forwarder from JNPT/Mundra/Chennai. Receive full payout.", who:"Farmer" },
  ];
  return (
    <div className="max-w-2xl mx-auto anim-fade">
      <h2 className="text-3xl font-bold text-gray-800 text-center mb-2" style={{ fontFamily:"'DM Serif Display',serif" }}>How It Works</h2>
      <p className="text-center text-gray-500 mb-10">From mandi to Manchester in 6 steps</p>
      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-0.5" style={{ background:"#e2e8f0" }}/>
        {steps.map((step,i) => {
          const c = step.who==="Farmer"?["#e8f5ea","#1e5c2a"]:step.who==="Buyer"?["#fff3e0","#b07a00"]:["#f3e8ff","#6b21a8"];
          return (
            <div key={i} className="relative flex gap-5 mb-7">
              <div className="w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center font-bold text-white text-lg z-10"
                style={{ background:"linear-gradient(135deg,#2d7a3a,#4a9c5a)" }}>{step.n}</div>
              <div className="card p-5 flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-gray-800">{step.title}</h3>
                  <span className="badge" style={{ background:c[0], color:c[1] }}>{step.who}</span>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
