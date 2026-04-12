// ─── Fixer.io GBP/INR Exchange Rate ──────────────────────────────────────────
// Free plan: EUR base only, 100 calls/day. We cache aggressively (1 hr).

let _cache = null;
let _cacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function getGBPtoINR() {
  if (_cache && Date.now() - _cacheTime < CACHE_TTL) return _cache;

  const apiKey = import.meta.env.VITE_FIXER_API_KEY;

  if (!apiKey || apiKey === "your_fixer_key_here") {
    return { INRperGBP: 107.42, GBPperINR: 0.00931, source: "mock", timestamp: Date.now() };
  }

  try {
    // Free Fixer uses EUR base — we derive GBP/INR from EUR/GBP and EUR/INR
    const res = await fetch(
      `https://data.fixer.io/api/latest?access_key=${apiKey}&symbols=GBP,INR`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.info || "Fixer error");

    const INRperGBP = data.rates.INR / data.rates.GBP;
    _cache = {
      INRperGBP: parseFloat(INRperGBP.toFixed(2)),
      GBPperINR: parseFloat((1 / INRperGBP).toFixed(6)),
      source: "fixer",
      timestamp: Date.now(),
    };
    _cacheTime = Date.now();
    return _cache;
  } catch (err) {
    console.warn("Fixer fallback:", err.message);
    // Try open exchange rate as secondary fallback (no key needed for some endpoints)
    try {
      const r2 = await fetch("https://open.er-api.com/v6/latest/GBP", { signal: AbortSignal.timeout(5000) });
      const d2 = await r2.json();
      if (d2.rates?.INR) {
        _cache = { INRperGBP: parseFloat(d2.rates.INR.toFixed(2)), GBPperINR: parseFloat((1/d2.rates.INR).toFixed(6)), source: "open-er-api", timestamp: Date.now() };
        _cacheTime = Date.now();
        return _cache;
      }
    } catch {}
    return { INRperGBP: 107.42, GBPperINR: 0.00931, source: "mock-fallback", timestamp: Date.now() };
  }
}
