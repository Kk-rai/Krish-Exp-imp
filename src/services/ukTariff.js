// ─── UK Trade Tariff API — No key needed ─────────────────────────────────────
const BASE = "https://api.trade-tariff.service.gov.uk/api/v2";

const HS = {
  Garlic:   "07032000",
  Onion:    "07031010",
  Potato:   "07019000",
  Turmeric: "09103010",
  Ginger:   "09101110",
  Chilli:   "09042110",
};

// All listed crops are CETA zero-duty (India-UK CETA July 2025)
const CETA_ZERO = new Set(Object.keys(HS));

const _cache = new Map();
const TTL = 24 * 60 * 60 * 1000; // 24 hr (duty rates don't change daily)

export async function getUKDutyRate(commodity) {
  const hsCode = HS[commodity];
  if (!hsCode) return { commodity, hsCode: null, dutyPercent: 0, isCETAZero: true, description: commodity };

  const cached = _cache.get(commodity);
  if (cached && Date.now() - cached.ts < TTL) return cached.data;

  try {
    const res = await fetch(`${BASE}/commodities/${hsCode}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    const description = json?.data?.attributes?.formatted_description || commodity;
    const result = {
      commodity,
      hsCode,
      dutyPercent: CETA_ZERO.has(commodity) ? 0 : 12, // MFN default if CETA not applicable
      isCETAZero: CETA_ZERO.has(commodity),
      description,
      cetaSaving: CETA_ZERO.has(commodity) ? 12 : 0, // % saved vs MFN
    };
    _cache.set(commodity, { data: result, ts: Date.now() });
    return result;
  } catch (err) {
    console.warn("UK tariff fallback:", err.message);
    return { commodity, hsCode, dutyPercent: 0, isCETAZero: true, description: commodity, isFallback: true };
  }
}
