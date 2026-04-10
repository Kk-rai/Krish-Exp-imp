const SYSTEM = `You are KrishiAI, an expert trade assistant for Indian farmers exporting agricultural products to the UK under the India-UK CETA (signed July 2025, zero duty on 99% agri products). You help farmers understand: export documents needed, current market prices, how to find UK buyers, what CETA means for them, shipping process, and how to use this platform. Keep answers under 4 sentences. Be warm, practical, and encouraging. If asked in Hindi, reply in Hindi. If the farmer seems confused, offer to explain step by step.`;

export const QUICK_REPLIES = {
  "Documents needed?": "UK export ke liye chahiye: 1) Phytosanitary Certificate (Agriculture Dept), 2) Certificate of Origin (CETA ke liye), 3) Commercial Invoice, 4) Packing List, 5) Bill of Lading. CETA ke saath 0% customs duty hai! 🌾",
  "Current garlic price?": "Mandsor mandi mein aaj lahsun approx ₹5,500/quintal (₹55/kg) hai. UK mein yahi £2.80-3.20/kg bikta hai — direct export mein kaafi zyada milega! Calculator use karein. 📊",
  "How does CETA help me?": "India-UK CETA (July 2025) se 99% agri products par UK import duty ZERO ho gayi. Pehle buyers 12-15% duty bharate the — ab nahi! Aapka product UK mein sasta padega aur zyada orders milenge. 🇮🇳🤝🇬🇧",
};

export async function sendToKrishiAI(messages) {
  // Calls /api/chat serverless proxy — API key lives on server only (set in Vercel env vars)
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: SYSTEM,
      messages: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
    }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e?.error?.message || e?.error || `API ${res.status}`);
  }
  const data = await res.json();
  return data.content?.map(b => b.text || "").join("") || "No response.";
}
