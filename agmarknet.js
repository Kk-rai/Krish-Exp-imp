// ─── Agmarknet — data.gov.in Live Mandi Prices ───────────────────────────────
// Resource ID: 9ef84268-d588-465a-a308-a864a43d0070
// Docs: https://data.gov.in/resource/current-daily-price-various-commodities-various-markets-mandi

const BASE = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";

// Smart cache: 30 min TTL per commodity+state key
const _cache = new Map();
const CACHE_TTL = 30 * 60 * 1000;

// Realistic mock with today's approximate mandi prices
const MOCK = {
  Garlic:   { commodity:"Garlic",   modalPrice:5500, minPrice:4800, maxPrice:6200, market:"Mandsor, MP",    state:"Madhya Pradesh", perKg:55   },
  Onion:    { commodity:"Onion",    modalPrice:2200, minPrice:1800, maxPrice:2800, market:"Lasalgaon, MH",  state:"Maharashtra",    perKg:22   },
  Potato:   { commodity:"Potato",   modalPrice:1400, minPrice:1100, maxPrice:1700, market:"Agra, UP",       state:"Uttar Pradesh",  perKg:14   },
  Turmeric: { commodity:"Turmeric", modalPrice:9800, minPrice:8500, maxPrice:11000,market:"Nizamabad, TS",  state:"Telangana",      perKg:98   },
  Ginger:   { commodity:"Ginger",   modalPrice:4200, minPrice:3600, maxPrice:5100, market:"Wayanad, KL",    state:"Kerala",         perKg:42   },
  Chilli:   { commodity:"Chilli",   modalPrice:7600, minPrice:6800, maxPrice:9200, market:"Guntur, AP",     state:"Andhra Pradesh", perKg:76   },
};

export async function getMandiPrice(commodity, state) {
  const apiKey = import.meta.env.VITE_DATAGOV_API_KEY;
  const cacheKey = `${commodity}-${state}`;

  // Return cached if fresh
  const cached = _cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  // No API key → return mock
  if (!apiKey || apiKey === "your_datagov_key_here") {
    const mock = MOCK[commodity] || MOCK.Garlic;
    return { ...mock, isMock: true };
  }

  try {
    const params = new URLSearchParams({
      "api-key": apiKey,
      format: "json",
      limit: "10",
      "filters[commodity]": commodity,
      "filters[state]": state,
    });
    const res = await fetch(`${BASE}?${params}`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    if (!json.records?.length) throw new Error("No records");

    // Use the most recent record (sort by date descending)
    const sorted = json.records.sort((a, b) =>
      new Date(b.arrival_date || b.date || 0) - new Date(a.arrival_date || a.date || 0)
    );
    const r = sorted[0];

    const result = {
      commodity:  r.commodity,
      modalPrice: Math.round(Number(r.modal_price)),
      minPrice:   Math.round(Number(r.min_price)),
      maxPrice:   Math.round(Number(r.max_price)),
      market:     `${r.market}, ${r.district || r.state}`,
      state:      r.state,
      date:       r.arrival_date || r.date,
      perKg:      Math.round(Number(r.modal_price)) / 100,
      isMock:     false,
    };

    _cache.set(cacheKey, { data: result, ts: Date.now() });
    return result;
  } catch (err) {
    console.warn(`Agmarknet live fail (${commodity}): ${err.message} — using mock`);
    const mock = MOCK[commodity] || MOCK.Garlic;
    return { ...mock, isMock: true, error: err.message };
  }
}

export async function getAllCropPrices() {
  const crops = [
    { commodity: "Garlic",   state: "Madhya Pradesh" },
    { commodity: "Onion",    state: "Maharashtra" },
    { commodity: "Potato",   state: "Uttar Pradesh" },
    { commodity: "Turmeric", state: "Telangana" },
    { commodity: "Ginger",   state: "Kerala" },
    { commodity: "Chilli",   state: "Andhra Pradesh" },
  ];
  const results = await Promise.allSettled(crops.map(c => getMandiPrice(c.commodity, c.state)));
  return results
    .filter(r => r.status === "fulfilled")
    .map(r => r.value);
}
