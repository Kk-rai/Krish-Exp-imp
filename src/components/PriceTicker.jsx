import { useState, useEffect } from "react";
import { getAllCropPrices } from "../services/agmarknet";
import { getGBPtoINR } from "../services/fixer";

export default function PriceTicker() {
  const [prices, setPrices]     = useState([]);
  const [fx, setFx]             = useState(null);
  const [loading, setLoading]   = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAll = async () => {
    try {
      const [cropPrices, fxRate] = await Promise.all([getAllCropPrices(), getGBPtoINR()]);
      setPrices(cropPrices); setFx(fxRate); setLastUpdated(new Date());
    } catch(err) { console.error("Ticker:", err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center gap-2 py-1.5 text-xs" style={{ background:"#1e5c2a", color:"#a7d9b0" }}>
      <span style={{ animation:"spin .8s linear infinite", display:"inline-block", borderRadius:"50%", width:10, height:10, border:"2px solid #4ade80", borderTopColor:"transparent" }}/>
      Loading live prices...
    </div>
  );

  return (
    <div className="w-full overflow-hidden" style={{ background:"#1e5c2a" }}>
      <div className="flex items-stretch">
        {/* Label */}
        <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2" style={{ background:"#f5a623" }}>
          <span className="text-white font-bold text-xs uppercase tracking-wide whitespace-nowrap">🌾 Live</span>
          {fx && <span className="text-white/90 text-xs font-medium whitespace-nowrap">£1 = ₹{fx.INRperGBP}</span>}
        </div>

        {/* Scrolling */}
        <div className="overflow-hidden flex-1">
          <div className="ticker-scroll flex gap-6 whitespace-nowrap py-2 px-4" style={{ width:"max-content" }}>
            {[...prices,...prices].map((p,i) => (
              <span key={i} className="flex items-center gap-1.5 text-xs">
                <span className="text-green-300 font-semibold">{p.commodity}</span>
                <span className="text-white font-bold">₹{p.modalPrice.toLocaleString("en-IN")}/qtl</span>
                <span className="text-green-400 hidden sm:inline text-xs">{p.market}</span>
                {fx && <span className="text-yellow-300 font-medium">£{((p.modalPrice/100)/fx.INRperGBP).toFixed(2)}/kg</span>}
                {p.isMock && <span className="text-green-700 text-xs">~</span>}
                <span className="text-green-700 mx-1">·</span>
              </span>
            ))}
          </div>
        </div>

        {/* Updated time */}
        {lastUpdated && (
          <div className="hidden md:flex items-center px-3 text-green-500 text-xs whitespace-nowrap flex-shrink-0">
            {prices[0]?.isMock?"mock":"live"} · {lastUpdated.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}
          </div>
        )}
      </div>
    </div>
  );
}
