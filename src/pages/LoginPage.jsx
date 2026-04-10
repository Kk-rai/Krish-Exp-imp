import { useState } from "react";
import { supabase, upsertProfile } from "../services/supabase";
import { useAuth } from "../context/AuthContext";

export default function LoginPage({ onDone }) {
  const [step, setStep]     = useState("role");   // role | email | otp | profile
  const [role, setRole]     = useState(null);
  const [email, setEmail]   = useState("");
  const [otp, setOtp]       = useState("");
  const [name, setName]     = useState("");
  const [phone, setPhone]   = useState("");
  const [state, setState]   = useState("Madhya Pradesh");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);
  const [countdown, setCountdown] = useState(0);
  const { reloadProfile }   = useAuth();

  const STATES = ["Madhya Pradesh","Maharashtra","Uttar Pradesh","Telangana","Kerala","Andhra Pradesh","Gujarat","Punjab","Rajasthan","Karnataka"];

  const startCountdown = () => {
    setCountdown(60);
    const t = setInterval(() => setCountdown(c => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000);
  };

  const sendOTP = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, data: { role } },
    });
    if (err) { setError(err.message); setLoading(false); return; }
    setStep("otp");
    startCountdown();
    setLoading(false);
  };

  const verifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    const { data, error: err } = await supabase.auth.verifyOtp({ email, token: otp, type: "email" });
    if (err) { setError("Invalid OTP. Please check your email."); setLoading(false); return; }

    // Check if profile exists
    const { data: existing } = await supabase.from("profiles").select("id").eq("id", data.user.id).single();
    if (!existing) setStep("profile");
    else { await reloadProfile(); onDone?.(); }
    setLoading(false);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    try {
      await upsertProfile({ id: user.id, email, name, phone, state, role, verified: false, created_at: new Date().toISOString() });
      await reloadProfile();
      onDone?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    if (countdown > 0) return;
    await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    startCountdown();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg, #f0faf2 0%, #e8f5e9 50%, #fff8e7 100%)" }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3 shadow-lg" style={{ background: "linear-gradient(135deg,#2d7a3a,#4a9c5a)" }}>🌾</div>
          <h1 className="text-2xl font-bold text-green-900" style={{ fontFamily: "'DM Serif Display',serif" }}>KrishiConnect</h1>
          <p className="text-gray-500 text-sm mt-1">India → UK Agricultural Export Platform</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-green-100">

          {/* STEP 1: Choose role */}
          {step === "role" && (
            <div className="p-8">
              <h2 className="text-lg font-bold text-gray-800 mb-1">Who are you?</h2>
              <p className="text-sm text-gray-500 mb-6">Choose your role to get started</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { key: "farmer", icon: "👨‍🌾", title: "Indian Farmer", desc: "Export my produce to UK" },
                  { key: "buyer",  icon: "🇬🇧", title: "UK Buyer",      desc: "Source agri products from India" },
                ].map(r => (
                  <button key={r.key} onClick={() => { setRole(r.key); setStep("email"); }}
                    className="p-4 rounded-xl border-2 text-left transition-all hover:border-green-500 hover:shadow-md"
                    style={{ borderColor: "#e5e7eb" }}>
                    <div className="text-3xl mb-2">{r.icon}</div>
                    <div className="font-semibold text-gray-800 text-sm">{r.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Enter email */}
          {step === "email" && (
            <div className="p-8">
              <button onClick={() => setStep("role")} className="text-sm text-green-600 mb-4 flex items-center gap-1">← Back</button>
              <h2 className="text-lg font-bold text-gray-800 mb-1">
                {role === "farmer" ? "👨‍🌾 Farmer Login" : role === "buyer" ? "🇬🇧 UK Buyer Login" : "🔐 Admin Login"}
              </h2>
              <p className="text-sm text-gray-500 mb-6">We'll send a 6-digit OTP to your email — no password needed</p>
              <form onSubmit={sendOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-green-500 transition-colors"
                    placeholder={role === "buyer" ? "you@ukcompany.co.uk" : "you@example.com"} />
                </div>
                {error && <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl font-semibold text-white text-sm"
                  style={{ background: "linear-gradient(135deg,#2d7a3a,#4a9c5a)", opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Sending OTP..." : "Send OTP →"}
                </button>
              </form>
            </div>
          )}

          {/* STEP 3: OTP verification */}
          {step === "otp" && (
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-2xl mx-auto mb-3">📬</div>
                <h2 className="text-lg font-bold text-gray-800">Check your email</h2>
                <p className="text-sm text-gray-500 mt-1">OTP sent to <span className="font-semibold text-green-700">{email}</span></p>
              </div>
              <form onSubmit={verifyOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">6-digit OTP</label>
                  <input
                    type="text" required maxLength={6} value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] focus:outline-none focus:border-green-500 transition-colors"
                    placeholder="• • • • • •"
                    autoFocus />
                </div>
                {error && <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                <button type="submit" disabled={loading || otp.length < 6}
                  className="w-full py-3 rounded-xl font-semibold text-white text-sm"
                  style={{ background: "linear-gradient(135deg,#2d7a3a,#4a9c5a)", opacity: (loading || otp.length < 6) ? 0.5 : 1 }}>
                  {loading ? "Verifying..." : "Verify & Login →"}
                </button>
              </form>
              <div className="text-center mt-4">
                {countdown > 0 ? (
                  <p className="text-xs text-gray-400">Resend in {countdown}s</p>
                ) : (
                  <button onClick={resendOTP} className="text-xs text-green-600 hover:underline">Resend OTP</button>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Profile setup (first time) */}
          {step === "profile" && (
            <div className="p-8">
              <h2 className="text-lg font-bold text-gray-800 mb-1">Complete your profile</h2>
              <p className="text-sm text-gray-500 mb-6">Just a few details to get you started</p>
              <form onSubmit={saveProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
                  <input required value={name} onChange={e => setName(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-green-500"
                    placeholder={role === "buyer" ? "John Smith" : "Ramesh Patel"} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-green-500"
                    placeholder={role === "buyer" ? "+44 7700 900000" : "+91 98765 43210"} />
                </div>
                {role === "farmer" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">State</label>
                    <select value={state} onChange={e => setState(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-green-500 bg-white">
                      {STATES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                )}
                {error && <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl font-semibold text-white text-sm"
                  style={{ background: "linear-gradient(135deg,#2d7a3a,#4a9c5a)", opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Saving..." : "Enter KrishiConnect →"}
                </button>
              </form>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          🔒 Secured by Supabase Auth · No passwords stored · OTP expires in 60 minutes
        </p>
      </div>
    </div>
  );
}
