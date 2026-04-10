// supabase/functions/notify-farmer/index.ts
// Deploy: supabase functions deploy notify-farmer
// Set secret: supabase secrets set RESEND_API_KEY=your_key

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL   = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  try {
    const payload = await req.json();
    const enquiry = payload.record;

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Get the listing + farmer details
    const { data: listing } = await supabase
      .from("listings")
      .select("*, profiles(name, email)")
      .eq("id", enquiry.listing_id)
      .single();

    if (!listing?.profiles?.email) {
      return new Response("No farmer email found", { status: 200 });
    }

    const farmerEmail = listing.profiles.email;
    const farmerName  = listing.profiles.name || "Farmer";

    // Send email via Resend (free 3000 emails/month)
    if (RESEND_API_KEY) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "KrishiConnect <noreply@krishiconnect.in>",
          to: [farmerEmail],
          subject: `🌾 New enquiry for your ${listing.commodity} listing!`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
              <div style="background:linear-gradient(135deg,#2d7a3a,#4a9c5a);padding:24px;border-radius:12px 12px 0 0">
                <h1 style="color:white;margin:0;font-size:22px">🌾 KrishiConnect</h1>
                <p style="color:#b8ddc0;margin:4px 0 0">New Buyer Enquiry</p>
              </div>
              <div style="background:#f7fbf8;padding:24px;border-radius:0 0 12px 12px;border:1px solid #d1e8d5">
                <p>Namaste <strong>${farmerName}</strong>,</p>
                <p>A UK buyer is interested in your <strong>${listing.commodity}</strong> listing!</p>
                
                <div style="background:white;border-radius:8px;padding:16px;margin:16px 0;border:1px solid #d1e8d5">
                  <p style="margin:0 0 8px"><strong>Buyer:</strong> ${enquiry.buyer_name}</p>
                  <p style="margin:0 0 8px"><strong>Company:</strong> ${enquiry.buyer_company || "—"}</p>
                  <p style="margin:0 0 8px"><strong>Email:</strong> <a href="mailto:${enquiry.buyer_email}">${enquiry.buyer_email}</a></p>
                  <p style="margin:0 0 8px"><strong>Quantity needed:</strong> ${enquiry.quantity_kg ? enquiry.quantity_kg + "kg" : "Not specified"}</p>
                  ${enquiry.message ? `<p style="margin:0"><strong>Message:</strong> "${enquiry.message}"</p>` : ""}
                </div>
                
                <p>Reply directly to the buyer at: <a href="mailto:${enquiry.buyer_email}">${enquiry.buyer_email}</a></p>
                
                <div style="background:#fff8e7;border-radius:8px;padding:12px;margin:16px 0;border:1px solid #f0dfa0">
                  <p style="margin:0;color:#b07a00;font-size:13px">✅ <strong>CETA reminder:</strong> UK buyers pay 0% import duty on your ${listing.commodity}. Use the price calculator on KrishiConnect to agree a fair price.</p>
                </div>
                
                <p style="color:#666;font-size:12px">This email was sent by KrishiConnect. Visit <a href="https://krish-exp-imp.vercel.app">krish-exp-imp.vercel.app</a> to manage your listings.</p>
              </div>
            </div>
          `,
        }),
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("notify-farmer error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
