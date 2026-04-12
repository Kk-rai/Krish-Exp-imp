import { useState, useEffect } from "react";
import { getAllCropPrices } from "../services/agmarknet";
import { getGBPtoINR } from "../services/fixer";

export default function PriceTicker() {
  const [prices, setPrices] = useState([]);
  const [fx, setFx]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAll = async () => {
    try {
      const [cropPrices, fxRate] = await Promise.all([getAllCropPrices(), getGBPtoINR()]);
      setPrices(cropPrices);
      setFx(fxRate);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Ticker fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center gap-2 py-4 text-sm text-green-700">
      <span className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full inline-block"
        style={{ animation:"spin 0.8s linear infinite" }}/>
      Loading live mandi prices...
    </div>
  );

  return (
    <div className="w-full overflow-hidden" style={{ background:"#1e5c2a" }}>
      <style>{`@keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
      <div className="flex items-center">
        {/* Label */}
        <div className="flex-shrink-0 px-4 py-2.5 flex items-center gap-2 z-10"
          style={{ background:"#f5a623" }}>
          <span className="text-white font-bold text-xs uppercase tracking-wider">🌾 Live Prices</span>
          {fx && <span className="text-white/80 text-xs">1 GBP = ₹{fx.INRperGBP}</span>}
        </div>

        {/* Scrolling ticker */}
        <div className="overflow-hidden flex-1">
          <div className="flex gap-8 whitespace-nowrap py-2.5 px-4"
            style={{ animation: prices.length ? "ticker 30s linear infinite" : "none", width: "max-content" }}>
            {[...prices, ...prices].map((p, i) => (
              <span key={i} className="flex items-center gap-2 text-sm">
                <span className="text-green-300 font-semibold">{p.commodity}</span>
                <span className="text-white font-bold">₹{p.modalPrice}/qtl</span>
                <span className="text-green-400 text-xs">{p.market}</span>
                {fx && (
                  <span className="text-yellow-300 text-xs">
                    (£{((p.modalPrice / 100) / fx.INRperGBP).toFixed(2)}/kg)
                  </span>
                )}
                <span className="text-green-700 mx-2">·</span>
              </span>
            ))}
          </div>
        </div>
      </div>
      {lastUpdated && (
        <div className="text-right text-green-500 text-xs px-4 pb-1">
          Updated {lastUpdated.toLocaleTimeString("en-IN")}
          {" · "}
          {prices.length === 0
            ? "Mandi: —"
            : prices.some(p => p.isMock)
              ? "Mandi: sample / API fallback"
              : "Mandi: live (data.gov.in)"}
          {fx && (
            <>
              {" · "}
              FX: {fx.source === "fixer" ? "Fixer.io" : fx.source === "open-er-api" ? "open.er-api" : "estimate"}
            </>
          )}
        </div>
      )}
    </div>
  );
}
