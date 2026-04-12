// ─── KrishiAI — Anthropic via /api/chat proxy ────────────────────────────────
// We never call api.anthropic.com from the browser (CORS block + key exposure).
// All requests go to /api/chat.js (Vercel serverless) which holds the real key.

const SYSTEM = `You are KrishiAI, an expert trade assistant for Indian farmers exporting agricultural products to the UK under the India-UK CETA (signed July 2025, zero duty on 99% agri products).

You help farmers and UK buyers understand:
- Export documents required (Phytosanitary cert, Certificate of Origin, Invoice, Packing List, Bill of Lading)
- CETA benefits and what zero duty means in practice  
- How to find UK buyers and negotiate
- Current market prices and how to use the price calculator
- Shipping process: freight forwarders, port of exit (JNPT/Mundra/Chennai), UK port of entry
- How to use the KrishiConnect platform (post listings, send enquiries)

Rules:
- Keep answers under 5 sentences, warm and practical
- If the user writes in Hindi, reply in Hindi
- Always encourage the farmer — they deserve better margins
- For UK buyers, explain the CETA savings clearly
- If asked anything outside agriculture/trade, politely redirect`;

export const QUICK_REPLIES = {
  "Documents needed?":
    "UK export ke liye chahiye: 1) Phytosanitary Certificate (Agriculture Dept se), 2) Certificate of Origin (CETA ke liye — Chamber of Commerce se), 3) Commercial Invoice, 4) Packing List, 5) Bill of Lading. CETA ke saath 0% customs duty hai! 🌾",
  "Current garlic price?":
    "Mandsor mandi mein aaj lahsun approx ₹5,500/quintal (₹55/kg) hai. UK mein yahi £2.80-3.20/kg bikta hai — direct export mein kaafi zyada milega! Upar Calculator use karein exact figure ke liye. 📊",
  "How does CETA help me?":
    "India-UK CETA (July 2025) se 99% agri products par UK import duty ZERO ho gayi. Pehle UK buyers 12-15% duty bharate the — ab nahi! Aapka product UK mein sasta padega aur zyada orders milenge. 🇮🇳🤝🇬🇧",
};

export async function sendToKrishiAI(messages) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 400,
      system: SYSTEM,
      messages: messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${res.status}`);
  }

  const data = await res.json();
  return data.content?.map((b) => b.text || "").join("") || "No response.";
}
