
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { normalizeIndianPhone } from "@/lib/wheel";
import { sendMsg91Otp, verifyMsg91Otp } from "@/lib/msg91";
import { SiteShell } from "@/components/festive/SiteShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Diya } from "@/components/festive/Decor";

const WIDGET_ID = "366a6a675369323434383730";

// Replace this with the tokenAuth from your working msg91-test.html
const TOKEN_AUTH = "580271T4IEtpkd6ac9eec4P1";

const SUPABASE_URL = "https://vtisonziihxmztxvnpcl.supabase.co";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Anushka Boutique Spin & Win" },
      {
        name: "description",
        content: "Verify your mobile number to spin the Anushka Boutique festive wheel.",
      },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initialize = () => {
      if (!window.initSendOTP) {
        toast.error("MSG91 could not load.");
        return;
      }

      window.initSendOTP({
        widgetId: WIDGET_ID,
        tokenAuth: TOKEN_AUTH,
        exposeMethods: true,
        success: () => {},
        failure: () => {
          toast.error("MSG91 verification failed.");
        },
      });

      setReady(true);
    };

    if (window.initSendOTP) {
      initialize();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://verify.msg91.com/otp-provider.js";
    script.async = true;
    script.onload = initialize;
    script.onerror = () => toast.error("Could not load MSG91.");

    document.body.appendChild(script);

    return () => {
      // Keep the SDK script loaded for subsequent visits.
    };
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setTimeout(() => {
      setCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [cooldown]);

  const requestCode = async () => {
    const normalizedPhone = normalizeIndianPhone(phone);

    if (!normalizedPhone) {
      toast.error("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (!ready) {
      toast.error("MSG91 is still loading.");
      return;
    }

    setBusy(true);

    try {
      await sendMsg91Otp(normalizedPhone);

      setStep("code");
      setCode("");
      setVerified(false);
      setCooldown(30);

      toast.success("OTP sent successfully!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not send OTP."
      );
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!/^\d{6}$/.test(code)) {
      toast.error("Enter a valid 6-digit OTP.");
      return;
    }

    setBusy(true);

    try {
      const accessToken = await verifyMsg91Otp(code);

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/verify-msg91-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
  accessToken,
  phone: normalizeIndianPhone(phone),
}),
        }
      );

      const result = await response.json();

   if (typeof result.spinTicket !== "string") {
  throw new Error("Supabase did not issue a spin ticket.");
}

sessionStorage.removeItem("anushka_reward");

sessionStorage.setItem(
  "anushka_guest",
  JSON.stringify({
    phone: normalizeIndianPhone(phone),
    spinTicket: result.spinTicket,
  })
);
toast.success("Mobile OTP verified successfully!");

navigate({ to: "/" });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Verification failed."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <SiteShell>
      <div className="mx-auto mt-6 max-w-md px-4">
        <div className="festive-card p-6 sm:p-8">
          <div className="flex justify-center">
            <Diya className="h-14 w-14" />
          </div>

          <h1 className="mt-2 text-center text-3xl font-semibold text-gold-gradient">
            Verify your number
          </h1>

          <p className="mt-2 text-center text-sm text-muted-foreground">
            We'll send a 6-digit OTP to your mobile number.
          </p>

          {verified ? (
            <div className="mt-6 space-y-4 text-center">
              <p className="text-gold">
                OTP verified successfully!
              </p>
              <p className="text-sm text-muted-foreground">
                MSG91 verification is connected. Supabase customer
                login still needs to be connected before spinning.
              </p>
            </div>
          ) : step === "phone" ? (
            <form
              className="mt-6 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void requestCode();
              }}
            >
              <div className="flex items-center gap-2">
                <span className="rounded-md border border-input bg-background/60 px-3 py-2 text-sm">
                  +91
                </span>

                <Input
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value.replace(/\D/g, ""))
                  }
                  className="bg-background/60"
                />
              </div>

              <Button
                variant="default"
                className="w-full"
                size="lg"
                disabled={busy || !ready}
              >
                {busy
                  ? "Sending..."
                  : !ready
                    ? "Loading..."
                    : "Send OTP"}
              </Button>
            </form>
          ) : (
            <form
              className="mt-6 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void confirm();
              }}
            >
              <p className="text-center text-sm">
                Code sent to{" "}
                <span className="text-gold">+91 {phone}</span>
              </p>

              <Input
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, ""))
                }
                className="bg-background/60 text-center font-mono text-lg tracking-[0.5em]"
              />

              <Button
                variant="default"
                className="w-full"
                size="lg"
                disabled={busy || code.length !== 6}
              >
                {busy ? "Verifying..." : "Verify & Continue"}
              </Button>

              <div className="flex justify-between text-xs">
                <button
                  type="button"
                  className="text-muted-foreground hover:text-gold"
                  disabled={busy}
                  onClick={() => {
                    setStep("phone");
                    setCode("");
                    setVerified(false);
                  }}
                >
                  Change number
                </button>

                <button
                  type="button"
                  disabled={cooldown > 0 || busy}
                  className="text-gold disabled:text-muted-foreground"
                  onClick={() => void requestCode()}
                >
                  {cooldown > 0
                    ? `Resend in ${cooldown}s`
                    : "Resend OTP"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </SiteShell>
  );
}
