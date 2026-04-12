import { createContext, useContext, useEffect, useState } from "react";
import { supabase, getProfile } from "../services/supabase";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      else setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      else { setProfile(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(userId) {
    try {
      const p = await getProfile(userId);
      setProfile(p);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  const isAdmin   = profile?.role === "admin";
  const isFarmer  = profile?.role === "farmer";
  const isBuyer   = profile?.role === "buyer";
  const isVerified = profile?.verified === true;

  async function reloadProfile() {
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user?.id;
    if (uid) await loadProfile(uid);
  }

  return (
    <AuthCtx.Provider value={{ user, profile, loading, isAdmin, isFarmer, isBuyer, isVerified, reloadProfile }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
