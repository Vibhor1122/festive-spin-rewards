import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { sendOtp, verifyOtp } from "@/lib/otp.functions";
import { normalizeIndianPhone } from "@/lib/wheel";
import { SiteShell } from "@/components/festive/SiteShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Diya } from "@/components/festive/Decor";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Anushka Boutique Spin & Win" },
      { name: "description", content: "Verify your mobile number to spin the Anushka Boutique festive wheel." },
      { property: "og:title", content: "Sign in — Anushka Boutique" },
      { property: "og:description", content: "Verify your mobile number to join the festive Spin & Win." },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const send = useServerFn(sendOtp);
  const verify = useServerFn(verifyOtp);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const requestCode = async () => {
    if (!normalizeIndianPhone(phone)) return toast.error("Enter a valid 10-digit Indian mobile number");
    setBusy(true);
    try {
      const r = await send({ data: { phone, website: honeypot } });
      setStep("code");
      setCooldown(r.cooldown);
      setDemoCode(r.demoCode ?? null);
      toast.success("Code sent");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    setBusy(true);
    try {
      const { tokenHash } = await verify({ data: { phone, code } });
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
      if (error) throw error;
      toast.success("Verified! Let's spin.");
      navigate({ to: "/" });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SiteShell>
      <div className="mx-auto mt-6 max-w-md px-4">
        <div className="festive-card p-6 sm:p-8">
          <div className="flex justify-center"><Diya className="h-14 w-14" /></div>
          <h1 className="mt-2 text-center text-3xl font-semibold text-gold-gradient">Verify your number</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">We'll send a 6-digit code to your mobile.</p>

          <div className="mt-4 rounded-lg border border-gold/40 bg-accent/60 px-3 py-2 text-center text-xs text-accent-foreground">
            DEMO MODE — no SMS is sent yet. Your code appears on screen.
          </div>

          {step === "phone" ? (
            <form className="mt-6 space-y-4" onSubmit={(e) => { e.preventDefault(); requestCode(); }}>
              <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} className="hidden" aria-hidden name="website" />
              <div className="flex items-center gap-2">
                <span className="rounded-md border border-input bg-background/60 px-3 py-2 text-sm">+91</span>
                <Input inputMode="numeric" maxLength={10} placeholder="10-digit mobile number" value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} className="bg-background/60" />
              </div>
              <Button variant="festive" className="w-full" size="lg" disabled={busy}>{busy ? "Sending…" : "Send OTP"}</Button>
            </form>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={(e) => { e.preventDefault(); confirm(); }}>
              <p className="text-center text-sm">Code sent to <span className="text-gold">+91 {phone}</span></p>
              {demoCode && <p className="text-center text-sm text-muted-foreground">Demo code: <span className="font-mono text-lg tracking-widest text-gold">{demoCode}</span></p>}
              <Input inputMode="numeric" maxLength={6} placeholder="Enter 6-digit code" value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className="bg-background/60 text-center font-mono text-lg tracking-[0.5em]" />
              <Button variant="festive" className="w-full" size="lg" disabled={busy || code.length !== 6}>{busy ? "Verifying…" : "Verify & Continue"}</Button>
              <div className="flex justify-between text-xs">
                <button type="button" className="text-muted-foreground hover:text-gold" onClick={() => { setStep("phone"); setCode(""); }}>Change number</button>
                <button type="button" disabled={cooldown > 0 || busy} className="text-gold disabled:text-muted-foreground" onClick={requestCode}>
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </SiteShell>
  );
}
