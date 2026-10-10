import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { normalizeIndianPhone } from "./wheel";

// DEMO MODE: no SMS provider is connected yet, so the code is returned to the
// screen instead of being texted. Connect an SMS provider and stop returning
// `demoCode` before running the real campaign.
const DEMO_MODE = true;
const OTP_TTL_MIN = 5;
const RESEND_COOLDOWN_SEC = 30;
const MAX_SENDS_PER_10_MIN = 3;
const MAX_ATTEMPTS = 5;

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const phoneEmail = (phone: string) => `91${phone}@phone.anushkaboutique.app`;

export const sendOtp = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ phone: z.string().max(20), website: z.string().max(0).optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const phone = normalizeIndianPhone(data.phone);
    if (!phone) throw new Error("Please enter a valid 10-digit Indian mobile number.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const since = new Date(Date.now() - 10 * 60_000).toISOString();
    const { data: recent } = await supabaseAdmin
      .from("otp_codes")
      .select("created_at")
      .eq("phone", phone)
      .gte("created_at", since)
      .order("created_at", { ascending: false });
    if (recent && recent.length >= MAX_SENDS_PER_10_MIN)
      throw new Error("Too many requests. Please try again in a few minutes.");
    if (recent?.[0] && Date.now() - new Date(recent[0].created_at).getTime() < RESEND_COOLDOWN_SEC * 1000)
      throw new Error(`Please wait ${RESEND_COOLDOWN_SEC} seconds before requesting a new code.`);

    const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
    const code = n.toString().padStart(6, "0");
    await supabaseAdmin.from("otp_codes").update({ used: true }).eq("phone", phone).eq("used", false);
    const { error } = await supabaseAdmin.from("otp_codes").insert({
      phone,
      code_hash: await sha256(`${phone}:${code}`),
      expires_at: new Date(Date.now() + OTP_TTL_MIN * 60_000).toISOString(),
    });
    if (error) throw new Error("Could not send code. Please try again.");

    // Production: send `code` via the SMS provider here.
    return { ok: true, cooldown: RESEND_COOLDOWN_SEC, demoCode: DEMO_MODE ? code : undefined };
  });

export const verifyOtp = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ phone: z.string().max(20), code: z.string().regex(/^\d{6}$/) }).parse(d),
  )
  .handler(async ({ data }) => {
    const phone = normalizeIndianPhone(data.phone);
    if (!phone) throw new Error("Invalid mobile number.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: otp } = await supabaseAdmin
      .from("otp_codes")
      .select("*")
      .eq("phone", phone)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!otp || new Date(otp.expires_at) < new Date()) throw new Error("Code expired. Please request a new one.");
    if (otp.attempts >= MAX_ATTEMPTS) throw new Error("Too many wrong attempts. Please request a new code.");

    if ((await sha256(`${phone}:${data.code}`)) !== otp.code_hash) {
      await supabaseAdmin.from("otp_codes").update({ attempts: otp.attempts + 1 }).eq("id", otp.id);
      throw new Error("Incorrect code. Please try again.");
    }
    await supabaseAdmin.from("otp_codes").update({ used: true }).eq("id", otp.id);

    const email = phoneEmail(phone);
    const { data: existing } = await supabaseAdmin.from("profiles").select("id").eq("phone", phone).maybeSingle();
    let userId = existing?.id;
    if (!userId) {
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { phone: `+91${phone}` },
      });
      if (error || !created.user) throw new Error("Could not create your account. Please try again.");
      userId = created.user.id;
      await supabaseAdmin.from("profiles").insert({ id: userId, phone });
    }

    const { data: admin } = await supabaseAdmin.from("admin_phones").select("phone").eq("phone", phone).maybeSingle();
    if (admin) await supabaseAdmin.from("user_roles").upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });

    const { data: link, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email });
    if (linkErr || !link.properties?.hashed_token) throw new Error("Could not sign you in. Please try again.");
    return { tokenHash: link.properties.hashed_token };
  });
