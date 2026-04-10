import { useState } from "react";
import { calculateLandedCost } from "../utils/priceCalculator";

const CROPS  = ["Garlic","Onion","Potato","Turmeric","Ginger","Chilli"];
const STATES = ["Madhya Pradesh","Maharashtra","Uttar Pradesh","Telangana","Kerala","Andhra Pradesh"];
const CITIES = ["London","Birmingham","Manchester","Leeds","Bristol"];

export default function PriceCalculator() {
  const [form, setForm] = useState({ crop:"Garlic", quantityKg:500, sourceState:"Madhya Pradesh", ukCity:"London" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleCalculate = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const r = await calculateLandedCost({ ...form, quantityKg: Number(form.quantityKg) });
      setResult(r);
    } catch (err) {
      setError(err.message || "Calculation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-green-100">
        {/* Header */}
        <div className="px-6 py-4" style={{ background:"linear-gradient(135deg,#1e5c2a,#2d7a3a)" }}>
          <h2 className="text-white text-xl font-bold">🧮 Export Price Calculator</h2>
          <p className="text-green-200 text-sm mt-0.5">See exactly what you earn — zero brokers, full transparency</p>
        </div>

        {/* CETA notice */}
        <div className="flex items-center gap-2 px-6 py-2 text-sm font-medium" style={{ background:"#fffbf0", borderBottom:"1px solid #f0dfa0", color:"#b07a00" }}>
          ✅ India-UK CETA active — 0% import duty on all listed crops
        </div>

        {/* Form */}
        <div className="px-6 py-5 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Crop / Commodity</label>
            <select name="crop" value={form.crop} onChange={handleChange}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 transition-colors bg-gray-50">
              {CROPS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Quantity (kg)</label>
            <input type="number" name="quantityKg" value={form.quantityKg} onChange={handleChange} min={1}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 transition-colors bg-gray-50"/>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Source State</label>
            <select name="sourceState" value={form.sourceState} onChange={handleChange}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 transition-colors bg-gray-50">
              {STATES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Destination (UK)</label>
            <select name="ukCity" value={form.ukCity} onChange={handleChange}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 transition-colors bg-gray-50">
              {CITIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="px-6 pb-5">
          <button onClick={handleCalculate} disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all"
            style={{ background: loading ? "#9dc5a3" : "linear-gradient(135deg,#2d7a3a,#4a9c5a)", cursor: loading ? "not-allowed" : "pointer", boxShadow: loading ? "none" : "0 4px 14px rgba(45,122,58,.3)" }}>
            {loading ? "Fetching live prices..." : "Calculate Landed Cost →"}
          </button>
          {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}
        </div>

        {/* Result */}
        {result && (
          <div className="border-t border-green-100 px-6 py-5 bg-green-50">
            {/* Key figures */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white rounded-xl p-4 border border-green-100 text-center">
                <div className="text-2xl font-bold" style={{ color:"#1e5c2a" }}>{result.totalGBPFormatted}</div>
                <div className="text-xs text-gray-500 mt-0.5">Total UK landed cost</div>
                <div className="text-xs text-gray-400">{result.perKgGBPFormatted}/kg</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-green-100 text-center">
                <div className="text-2xl font-bold" style={{ color:"#e8650a" }}>{result.farmerPayoutFormatted}</div>
                <div className="text-xs text-gray-500 mt-0.5">Your payout (farmer)</div>
                <div className="text-xs text-green-600 font-medium">+{result.brokerSavingPercent}% vs broker</div>
              </div>
            </div>

            {/* CETA badge */}
            {result.isCETAZero && (
              <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 mb-3 border border-green-200">
                <span className="text-green-600 font-bold text-sm">✅ CETA Zero Duty</span>
                <span className="text-gray-500 text-xs">HS Code: {result.hsCode} — 0% import duty saved</span>
              </div>
            )}

            {/* Breakdown */}
            <div className="bg-white rounded-xl border border-green-100 overflow-hidden">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">Cost Breakdown</div>
              {[
                ["Mandi price ({0}, {1})".replace("{0}", result.mandiMarket).replace("{1}", result.mandiDataSource==="mock"?"mock":"live"), `₹${result.mandiPricePerKg}/kg`, result.mandiCostINR],
                ["Shipping & logistics", null, result.shippingCostINR],
                ["Packaging / cold chain", null, result.packagingCostINR],
                [`Platform fee (${2}%)`, null, result.platformFeeINR],
                ["UK Import Duty", `${result.dutyPercent}%`, result.dutyAmountINR],
              ].map(([label, sub, amt]) => (
                <div key={label} className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50 last:border-0">
                  <div>
                    <span className="text-sm text-gray-700">{label}</span>
                    {sub && <span className="text-xs text-gray-400 ml-1.5">({sub})</span>}
                  </div>
                  <span className="text-sm font-medium text-gray-800">₹{amt.toLocaleString("en-IN")}</span>
                </div>
              ))}
              <div className="flex items-center justify-between px-4 py-3 bg-green-50">
                <span className="font-semibold text-sm text-green-800">Total (INR equivalent)</span>
                <span className="font-bold text-green-800">{result.totalCostINRFormatted}</span>
              </div>
            </div>

            <div className="mt-3 text-xs text-gray-400 text-center">
              Exchange rate: 1 GBP = ₹{result.INRperGBP} ({result.fxSource}) · {result.quantityKg}kg {result.crop}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
