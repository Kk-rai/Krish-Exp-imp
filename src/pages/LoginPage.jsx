import { useState } from "react";
import { supabase, upsertProfile } from "../services/supabase";
import { useAuth } from "../context/AuthContext";

const STATES = [
  "Madhya Pradesh","Maharashtra","Uttar Pradesh","Telangana","Kerala",
  "Andhra Pradesh","Gujarat","Punjab","Rajasthan","Karnataka","Bihar",
  "West Bengal","Tamil Nadu","Odisha","Haryana",
];

export default function LoginPage({ onDone }) {
  const [step, setStep]           = useState("role");   // role | method | otp | profile
  const [role, setRole]           = useState(null);
  const [loginMethod, setMethod]  = useState("email");  // email | phone
  const [email, setEmail]         = useState("");
  const [phone, setPhone]         = useState("");
  const [otp, setOtp]             = useState("");
  const [name, setName]           = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [state, setState]         = useState("Madhya Pradesh");
  const [company, setCompany]     = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [countdown, setCountdown] = useState(0);
  const { reloadProfile }         = useAuth();

  const startCountdown = () => {
    setCountdown(60);
    const t = setInterval(() => setCountdown(c => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000);
  };

  // ── Send OTP ────────────────────────────────────────────────────────────────
  const sendOTP = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      let err;
      if (loginMethod === "phone") {
        // Normalize phone: ensure +91 prefix
        const normalized = phone.startsWith("+") ? phone : `+91${phone.replace(/\D/g,"")}`;
        ({ error: err } = await supabase.auth.signInWithOtp({
          phone: normalized,
          options: { shouldCreateUser: true, data: { role } },
        }));
      } else {
        ({ error: err } = await supabase.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: true, data: { role } },
        }));
      }
      if (err) throw err;
      setStep("otp");
      startCountdown();
    } catch (err) {
      setError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Verify OTP ──────────────────────────────────────────────────────────────
  const verifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      let data, err;
      if (loginMethod === "phone") {
        const normalized = phone.startsWith("+") ? phone : `+91${phone.replace(/\D/g,"")}`;
        ({ data, error: err } = await supabase.auth.verifyOtp({
          phone: normalized, token: otp, type: "sms",
        }));
      } else {
        ({ data, error: err } = await supabase.auth.verifyOtp({
          email, token: otp, type: "email",
        }));
      }
      if (err) { setError("Invalid OTP. Please check and try again."); setLoading(false); return; }

      // Check if profile already exists
      const { data: existing } = await supabase
        .from("profiles").select("id").eq("id", data.user.id).single();
      if (!existing) {
        setStep("profile");
      } else {
        await reloadProfile();
        onDone?.();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Save Profile ─────────────────────────────────────────────────────────────
  const saveProfile = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await upsertProfile({
        id: user.id,
        email: loginMethod === "email" ? email : user.email || "",
        phone: loginMethod === "phone"
          ? (phone.startsWith("+") ? phone : `+91${phone.replace(/\D/g,"")}`)
          : profilePhone,
        name,
        state: role === "farmer" ? state : null,
        company: role === "buyer" ? company : null,
        role,
        verified: false,
        created_at: new Date().toISOString(),
      });
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
    if (loginMethod === "phone") {
      const normalized = phone.startsWith("+") ? phone : `+91${phone.replace(/\D/g,"")}`;
      await supabase.auth.signInWithOtp({ phone: normalized });
    } else {
      await supabase.auth.signInWithOtp({ email });
    }
    startCountdown();
  };

  // ── Shared input style ───────────────────────────────────────────────────────
  const inp = "w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-green-500 transition-colors";

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg,#f0faf2 0%,#e8f5e9 50%,#fff8e7 100%)" }}>
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3 shadow-lg"
            style={{ background: "linear-gradient(135deg,#2d7a3a,#4a9c5a)" }}>🌾</div>
          <h1 className="text-2xl font-bold text-green-900" style={{ fontFamily:"'DM Serif Display',serif" }}>KrishiConnect</h1>
          <p className="text-gray-500 text-sm mt-1">India → UK Agricultural Export Platform</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-green-100">

          {/* STEP 1 — Role */}
          {step === "role" && (
            <div className="p-8">
              <h2 className="text-lg font-bold text-gray-800 mb-1">Who are you?</h2>
              <p className="text-sm text-gray-500 mb-6">Choose your role to continue</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { key:"farmer", icon:"👨‍🌾", title:"Indian Farmer", desc:"Export my produce to UK" },
                  { key:"buyer",  icon:"🇬🇧", title:"UK Buyer",      desc:"Source agri products from India" },
                ].map(r => (
                  <button key={r.key} onClick={() => { setRole(r.key); setStep("method"); }}
                    className="p-4 rounded-xl border-2 text-left transition-all hover:border-green-500 hover:shadow-md"
                    style={{ borderColor:"#e5e7eb" }}>
                    <div className="text-3xl mb-2">{r.icon}</div>
                    <div className="font-semibold text-gray-800 text-sm">{r.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2 — Login method: email or phone */}
          {step === "method" && (
            <div className="p-8">
              <button onClick={() => setStep("role")} className="text-sm text-green-600 mb-4 flex items-center gap-1">← Back</button>
              <h2 className="text-lg font-bold text-gray-800 mb-1">
                {role === "farmer" ? "👨‍🌾 Farmer Login" : "🇬🇧 UK Buyer Login"}
              </h2>
              <p className="text-sm text-gray-500 mb-5">We'll send you a 6-digit OTP — no password needed</p>

              {/* Email / Phone toggle */}
              <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-5">
                {["email","phone"].map(m => (
                  <button key={m} onClick={() => setMethod(m)}
                    className="flex-1 py-2.5 text-sm font-semibold transition-all"
                    style={{ background: loginMethod===m ? "#2d7a3a" : "white", color: loginMethod===m ? "white" : "#6b7280" }}>
                    {m === "email" ? "📧 Email OTP" : "📱 Phone OTP"}
                  </button>
                ))}
              </div>

              <form onSubmit={sendOTP} className="space-y-4">
                {loginMethod === "email" ? (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                      className={inp} placeholder={role==="buyer" ? "you@ukcompany.co.uk" : "you@example.com"} />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Mobile Number {role === "farmer" ? "(India +91)" : "(UK +44)"}
                    </label>
                    <div className="flex gap-2">
                      <span className="flex items-center px-3 rounded-xl border border-gray-200 text-sm text-gray-500 bg-gray-50">
                        {role === "farmer" ? "🇮🇳 +91" : "🇬🇧 +44"}
                      </span>
                      <input type="tel" required value={phone}
                        onChange={e => setPhone(e.target.value.replace(/\D/g,"").slice(0,10))}
                        className={inp + " flex-1"} placeholder={role==="farmer" ? "98765 43210" : "7700 900000"} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {role === "farmer" ? "Enter your 10-digit Indian mobile number" : "Enter your UK mobile number"}
                    </p>
                  </div>
                )}
                {error && <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl font-semibold text-white text-sm"
                  style={{ background:"linear-gradient(135deg,#2d7a3a,#4a9c5a)", opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Sending OTP..." : "Send OTP →"}
                </button>
              </form>
            </div>
          )}

          {/* STEP 3 — OTP verification */}
          {step === "otp" && (
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-2xl mx-auto mb-3">
                  {loginMethod === "phone" ? "📱" : "📬"}
                </div>
                <h2 className="text-lg font-bold text-gray-800">
                  {loginMethod === "phone" ? "Check your SMS" : "Check your email"}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  OTP sent to <span className="font-semibold text-green-700">
                    {loginMethod === "phone"
                      ? (phone.startsWith("+") ? phone : `+91${phone}`)
                      : email}
                  </span>
                </p>
              </div>
              <form onSubmit={verifyOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">6-digit OTP</label>
                  <input
                    type="text" required maxLength={6} value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g,"").slice(0,6))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] focus:outline-none focus:border-green-500"
                    placeholder="• • • • • •" autoFocus />
                </div>
                {error && <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                <button type="submit" disabled={loading || otp.length < 6}
                  className="w-full py-3 rounded-xl font-semibold text-white text-sm"
                  style={{ background:"linear-gradient(135deg,#2d7a3a,#4a9c5a)", opacity:(loading||otp.length<6)?0.5:1 }}>
                  {loading ? "Verifying..." : "Verify & Login →"}
                </button>
              </form>
              <div className="text-center mt-4">
                {countdown > 0
                  ? <p className="text-xs text-gray-400">Resend in {countdown}s</p>
                  : <button onClick={resendOTP} className="text-xs text-green-600 hover:underline">Resend OTP</button>
                }
              </div>
              <button onClick={() => setStep("method")} className="text-xs text-gray-400 hover:text-gray-600 block text-center mt-2 w-full">
                ← Change {loginMethod === "phone" ? "number" : "email"}
              </button>
            </div>
          )}

          {/* STEP 4 — Profile setup (first time only) */}
          {step === "profile" && (
            <div className="p-8">
              <h2 className="text-lg font-bold text-gray-800 mb-1">Complete your profile</h2>
              <p className="text-sm text-gray-500 mb-6">Just a few details to get started</p>
              <form onSubmit={saveProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
                  <input required value={name} onChange={e => setName(e.target.value)}
                    className={inp} placeholder={role==="buyer" ? "John Smith" : "Ramesh Patel"} />
                </div>

                {/* If logged in by email, ask for phone too */}
                {loginMethod === "email" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Phone Number {role === "farmer" ? "(+91)" : "(+44)"}
                    </label>
                    <input value={profilePhone} onChange={e => setProfilePhone(e.target.value)}
                      className={inp} placeholder={role==="buyer" ? "+44 7700 900000" : "+91 98765 43210"} />
                  </div>
                )}

                {role === "farmer" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">State *</label>
                    <select value={state} onChange={e => setState(e.target.value)}
                      className={inp + " bg-white"}>
                      {STATES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                )}

                {role === "buyer" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Company Name</label>
                    <input value={company} onChange={e => setCompany(e.target.value)}
                      className={inp} placeholder="UK Imports Ltd" />
                  </div>
                )}

                {error && <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl font-semibold text-white text-sm"
                  style={{ background:"linear-gradient(135deg,#2d7a3a,#4a9c5a)", opacity:loading?0.7:1 }}>
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
