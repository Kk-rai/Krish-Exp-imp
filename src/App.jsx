import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import PublicApp from "./panels/PublicApp";
import FarmerPanel from "./panels/FarmerPanel";
import BuyerPanel from "./panels/BuyerPanel";
import AdminPanel from "./panels/AdminPanel";

export default function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}

function Router() {
  const { user, profile, loading } = useAuth();
  const [showLogin, setShowLogin]  = useState(false);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:"#f0f2f5" }}>
      <div className="text-center">
        <div className="text-5xl mb-4" style={{ animation:"spin 2s linear infinite", display:"inline-block" }}>🌾</div>
        <div className="font-semibold text-green-700 mt-2">Loading KrishiConnect...</div>
      </div>
    </div>
  );

  // Not logged in → public landing + login
  if (!user || !profile) {
    if (showLogin) return <LoginPage onDone={() => setShowLogin(false)} />;
    return <PublicApp onLogin={() => setShowLogin(true)} />;
  }

  // Route to correct panel by role
  if (profile.role === "admin")  return <AdminPanel />;
  if (profile.role === "buyer")  return <BuyerPanel />;
  return <FarmerPanel />;         // default: farmer
}
