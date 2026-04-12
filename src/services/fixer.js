// ─── GBP/INR — Fixer.io (optional key) + open.er-api.com (no key) ────────────

let _cache = null;
let _cacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000;

async function fetchFromOpenEr() {
  const r2 = await fetch("https://open.er-api.com/v6/latest/GBP", { signal: AbortSignal.timeout(5000) });
  const d2 = await r2.json();
  if (!d2.rates?.INR) throw new Error("open-er-api: no INR rate");
  const INRperGBP = parseFloat(Number(d2.rates.INR).toFixed(2));
  return {
    INRperGBP,
    GBPperINR: parseFloat((1 / INRperGBP).toFixed(6)),
    source: "open-er-api",
    timestamp: Date.now(),
  };
}

function mockRate(reason) {
  return {
    INRperGBP: 107.42,
    GBPperINR: 0.00931,
    source: reason === "error" ? "mock-fallback" : "mock",
    timestamp: Date.now(),
  };
}

export async function getGBPtoINR() {
  if (_cache && Date.now() - _cacheTime < CACHE_TTL) return _cache;

  const apiKey = import.meta.env.VITE_FIXER_API_KEY;
  const hasFixer = apiKey && apiKey !== "your_fixer_key_here";

  if (!hasFixer) {
    try {
      _cache = await fetchFromOpenEr();
      _cacheTime = Date.now();
      return _cache;
    } catch (err) {
      console.warn("GBP/INR (no Fixer key):", err.message);
      return mockRate("error");
    }
  }

  try {
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
    console.warn("Fixer failed:", err.message);
    try {
      _cache = await fetchFromOpenEr();
      _cacheTime = Date.now();
      return _cache;
    } catch (err2) {
      console.warn("open-er-api failed:", err2.message);
      return mockRate("error");
    }
  }
}
