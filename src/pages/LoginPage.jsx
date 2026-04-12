import { useState } from "react";
import { supabase, upsertProfile } from "../services/supabase";
import { useAuth } from "../context/AuthContext";

const STATES = ["Madhya Pradesh","Maharashtra","Uttar Pradesh","Telangana","Kerala","Andhra Pradesh","Gujarat","Punjab","Rajasthan","Karnataka","Bihar","West Bengal","Tamil Nadu","Odisha","Haryana"];

export default function LoginPage({ onDone }) {
  const [step, setStep]     = useState("role");   // role | email | otp | profile
  const [role, setRole]     = useState(null);
  const [email, setEmail]   = useState("");
  const [otp, setOtp]       = useState("");
  const [name, setName]     = useState("");
  const [phone, setPhone]   = useState("");
  const [state, setState]   = useState("Madhya Pradesh");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);
  const [countdown, setCount] = useState(0);
  const { reloadProfile }   = useAuth();

  const startCount = () => {
    setCount(60);
    const t = setInterval(() => setCount(c => { if(c<=1){clearInterval(t);return 0;} return c-1; }), 1000);
  };

  const sendOTP = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser:true, data:{ role } }
      });
      if (err) throw err;
      setStep("otp"); startCount();
    } catch(err) { setError(err.message || "Failed to send OTP. Please try again."); }
    finally { setLoading(false); }
  };

  const verifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const { data, error: err } = await supabase.auth.verifyOtp({ email, token:otp, type:"email" });
      if (err) { setError("Invalid OTP. Please check and try again."); setLoading(false); return; }

      const { data: existing } = await supabase.from("profiles").select("name").eq("id", data.user.id).single();
      if (existing?.name) { await reloadProfile(); onDone(); return; }
      setStep("profile");
    } catch(err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError("Please enter your name."); return; }
    setLoading(true); setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await upsertProfile({ id:user.id, email:user.email, name:name.trim(), phone:phone||null, state, company:company||null, role, verified:false });
      await reloadProfile();
      onDone();
    } catch(err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background:"linear-gradient(135deg,#0d2e17 0%,#1a4a28 40%,#2d7a3a 100%)" }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3" style={{ background:"rgba(255,255,255,.1)" }}>🌾</div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily:"'DM Serif Display',serif" }}>KrishiConnect</h1>
          <p className="text-green-300 text-sm mt-1">India → UK Agricultural Exports</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

          {/* ── Step: Choose Role ── */}
          {step === "role" && (
            <div className="p-8">
              <h2 className="font-bold text-gray-800 text-xl mb-1">Welcome! Who are you?</h2>
              <p className="text-gray-400 text-sm mb-6">Choose your account type to get started</p>
              <div className="space-y-3">
                {[
                  { r:"farmer", icon:"👨‍🌾", title:"I'm an Indian Farmer", sub:"Post my produce · Reach UK buyers · Get better price", color:"#2d7a3a", bg:"#e8f5ea" },
                  { r:"buyer",  icon:"🇬🇧", title:"I'm a UK Buyer",        sub:"Find Indian produce · 0% duty via CETA · Direct contact", color:"#2563eb", bg:"#eff6ff" },
                ].map(opt => (
                  <button key={opt.r} onClick={() => { setRole(opt.r); setStep("email"); }}
                    className="w-full p-4 rounded-xl border-2 text-left transition-all hover:shadow-md"
                    style={{ borderColor:opt.color, background:opt.bg }}>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{opt.icon}</span>
                      <div>
                        <div className="font-bold text-gray-800">{opt.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{opt.sub}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={onDone} className="w-full mt-4 text-sm text-gray-400 hover:text-gray-600 text-center py-2">← Back to Home</button>
            </div>
          )}

          {/* ── Step: Email ── */}
          {step === "email" && (
            <div className="p-8">
              <button onClick={() => setStep("role")} className="text-xs text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1">← Back</button>
              <div className="flex items-center gap-2 mb-6">
                <span className="text-2xl">{role==="farmer"?"👨‍🌾":"🇬🇧"}</span>
                <div>
                  <h2 className="font-bold text-gray-800 text-lg">Enter your email</h2>
                  <p className="text-gray-400 text-xs">We'll send a one-time code — no password needed</p>
                </div>
              </div>
              {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
              <form onSubmit={sendOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                  <input className="inp" type="email" placeholder="your@email.com" required autoFocus
                    value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? "Sending..." : "Send OTP →"}
                </button>
              </form>
            </div>
          )}

          {/* ── Step: OTP ── */}
          {step === "otp" && (
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">📧</div>
                <h2 className="font-bold text-gray-800 text-lg">Check your email</h2>
                <p className="text-gray-400 text-sm mt-1">Enter the 6-digit code sent to</p>
                <p className="font-semibold text-gray-700 text-sm">{email}</p>
              </div>
              {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
              <form onSubmit={verifyOTP} className="space-y-4">
                <input className="inp text-center text-2xl font-bold tracking-widest" type="text"
                  placeholder="000000" maxLength={6} required autoFocus
                  value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,""))} />
                <button type="submit" disabled={loading || otp.length < 6} className="btn-primary w-full">
                  {loading ? "Verifying..." : "Verify & Continue →"}
                </button>
                <div className="text-center">
                  {countdown > 0
                    ? <span className="text-xs text-gray-400">Resend in {countdown}s</span>
                    : <button type="button" onClick={sendOTP} className="text-xs text-green-700 font-semibold hover:underline">Resend OTP</button>}
                </div>
              </form>
            </div>
          )}

          {/* ── Step: Profile ── */}
          {step === "profile" && (
            <div className="p-8">
              <h2 className="font-bold text-gray-800 text-xl mb-1">Complete your profile</h2>
              <p className="text-gray-400 text-sm mb-6">This helps farmers and buyers trust you</p>
              {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
              <form onSubmit={saveProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
                  <input className="inp" type="text" placeholder={role==="farmer"?"Ramesh Patel":"John Smith"} required autoFocus
                    value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                  <input className="inp" type="tel" placeholder={role==="farmer"?"+91 98260 12345":"+44 7700 900000"}
                    value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                {role === "farmer" ? (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">State</label>
                    <select className="inp" value={state} onChange={e => setState(e.target.value)}>
                      {STATES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Company Name</label>
                    <input className="inp" type="text" placeholder="Smith Imports Ltd"
                      value={company} onChange={e => setCompany(e.target.value)} />
                  </div>
                )}
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? "Saving..." : "Start Using KrishiConnect →"}
                </button>
              </form>
            </div>
          )}
        </div>
        <p className="text-center text-green-300/50 text-xs mt-6">No password · No broker · CETA 2025</p>
      </div>
    </div>
  );
}
