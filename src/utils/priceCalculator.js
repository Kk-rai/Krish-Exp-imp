// ─── KrishiConnect Price Calculator ─────────────────────────────────────────
// Calculates full landed cost for Indian agri exports to UK under CETA

import { getMandiPrice } from "../services/agmarknet";
import { getGBPtoINR }   from "../services/fixer";
import { getUKDutyRate } from "../services/ukTariff";

// Shipping cost estimate (INR per kg) by source state → UK city
const SHIPPING_RATES = {
  "Madhya Pradesh": { London: 18, Birmingham: 19, Manchester: 20, default: 19 },
  "Maharashtra":    { London: 16, Birmingham: 17, Manchester: 18, default: 17 },
  "Uttar Pradesh":  { London: 17, Birmingham: 17, Manchester: 18, default: 17 },
  "Telangana":      { London: 19, Birmingham: 20, Manchester: 21, default: 20 },
  "Kerala":         { London: 21, Birmingham: 22, Manchester: 23, default: 22 },
  "Andhra Pradesh": { London: 19, Birmingham: 20, Manchester: 21, default: 20 },
  default:          { London: 20, Birmingham: 20, Manchester: 21, default: 20 },
};

// Platform fee %
const PLATFORM_FEE_PERCENT = 2;
// Traditional broker margin %
const BROKER_MARGIN_PERCENT = 19;
// Cold chain / packaging add-on INR per kg
const PACKAGING_INR_PER_KG = 3.5;
// UK VAT on fresh produce (zero-rated)
const UK_VAT_PERCENT = 0;

function fmt(n, currency = "INR") {
  if (currency === "GBP") return `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export async function calculateLandedCost({ crop, quantityKg, sourceState, ukCity = "London" }) {
  // Parallel fetch all 3 data sources
  const [mandiData, fxData, dutyData] = await Promise.all([
    getMandiPrice(crop, sourceState),
    getGBPtoINR(),
    getUKDutyRate(crop),
  ]);

  const { INRperGBP } = fxData;
  const pricePerKg = mandiData.perKg; // INR/kg at mandi

  // ── Cost breakdown ────────────────────────────────────────────────────────
  const mandiCostINR       = pricePerKg * quantityKg;
  const shippingRateINR    = (SHIPPING_RATES[sourceState] || SHIPPING_RATES.default)[ukCity] || 20;
  const shippingCostINR    = shippingRateINR * quantityKg;
  const packagingCostINR   = PACKAGING_INR_PER_KG * quantityKg;
  const platformFeeINR     = mandiCostINR * (PLATFORM_FEE_PERCENT / 100);
  const totalCostINR       = mandiCostINR + shippingCostINR + packagingCostINR + platformFeeINR;

  // UK duty (CETA = 0)
  const dutyPercent        = dutyData.isCETAZero ? 0 : dutyData.dutyPercent;
  const dutyAmountINR      = totalCostINR * (dutyPercent / 100);
  const totalWithDutyINR   = totalCostINR + dutyAmountINR;

  // GBP conversions
  const totalGBP           = totalWithDutyINR / INRperGBP;
  const perKgGBP           = totalGBP / quantityKg;

  // Farmer payout (mandi cost minus platform fee — no broker cut)
  const farmerPayoutINR    = mandiCostINR - platformFeeINR;

  // What farmer would get via broker (broker takes 19%)
  const brokerPayoutINR    = mandiCostINR * (1 - BROKER_MARGIN_PERCENT / 100);
  const brokerSavingINR    = farmerPayoutINR - brokerPayoutINR;
  const brokerSavingPercent = ((brokerSavingINR / brokerPayoutINR) * 100).toFixed(1);

  return {
    // Inputs
    crop, quantityKg, sourceState, ukCity,

    // Mandi data
    mandiPricePerKg:         pricePerKg,
    mandiMarket:             mandiData.market,
    mandiDataSource:         mandiData.isMock ? "mock" : "live",

    // FX
    INRperGBP,
    fxSource:                fxData.source,

    // UK duty
    dutyPercent,
    isCETAZero:              dutyData.isCETAZero,
    hsCode:                  dutyData.hsCode,

    // Cost breakdown (INR)
    mandiCostINR:            Math.round(mandiCostINR),
    shippingCostINR:         Math.round(shippingCostINR),
    packagingCostINR:        Math.round(packagingCostINR),
    platformFeeINR:          Math.round(platformFeeINR),
    dutyAmountINR:           Math.round(dutyAmountINR),
    totalCostINR:            Math.round(totalWithDutyINR),

    // GBP
    totalGBP:                parseFloat(totalGBP.toFixed(2)),
    perKgGBP:                parseFloat(perKgGBP.toFixed(3)),

    // Farmer
    farmerPayoutINR:         Math.round(farmerPayoutINR),
    brokerSavingINR:         Math.round(brokerSavingINR),
    brokerSavingPercent:     parseFloat(brokerSavingPercent),

    // Formatted strings
    totalGBPFormatted:       fmt(totalGBP, "GBP"),
    perKgGBPFormatted:       fmt(perKgGBP, "GBP"),
    farmerPayoutFormatted:   fmt(farmerPayoutINR),
    totalCostINRFormatted:   fmt(totalWithDutyINR),
    brokerSavingFormatted:   fmt(brokerSavingINR),
  };
}
