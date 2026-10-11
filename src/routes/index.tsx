
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/festive/SiteShell";
import { Wheel } from "@/components/festive/Wheel";
import { Diya, Lantern, Confetti } from "@/components/festive/Decor";
import { CouponCard } from "@/components/festive/CouponCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { rotationForPrize } from "@/lib/wheel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Festive Spin & Win — Anushka Boutique" },
      {
        name: "description",
        content:
          "Celebrate the festive season with Anushka Boutique. Spin the wheel and unlock up to 80% off.",
      },
      {
        property: "og:title",
        content: "Festive Spin & Win — Anushka Boutique",
      },
      {
        property: "og:description",
        content:
          "Spin the wheel & unlock your festive surprise at Anushka Boutique.",
      },
    ],
  }),
  component: Home,
});

type Result = {
  already: boolean;
  prize_id: string;
  label: string;
  discount: number;
  code: string | null;
  expires_at: string | null;
};

type Guest = {
  phone: string;
  accessToken: string;
};

const SUPABASE_URL =
  "https://vtisonziihxmztxvnpcl.supabase.co";

function Home() {
  const [guest, setGuest] = useState<Guest | null>(null);
  const [loading, setLoading] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(true);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("anushka_guest");

      if (saved) {
        const parsed = JSON.parse(saved) as Guest;

        if (
          /^[6-9]\d{9}$/.test(parsed.phone) &&
          typeof parsed.accessToken === "string" &&
          parsed.accessToken.length > 0
        ) {
          setGuest(parsed);
        }
      }

      const previous = sessionStorage.getItem("anushka_reward");

      if (previous) {
        const savedResult = JSON.parse(previous) as Result;
        setResult(savedResult);
        setRotation(
          rotationForPrize(savedResult.prize_id, 0, 0)
        );
      }
    } catch {
      sessionStorage.removeItem("anushka_guest");
      sessionStorage.removeItem("anushka_reward");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase
      .from("campaigns")
      .select("is_active")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) =>
        setActive(data?.is_active ?? true)
      );
  }, []);

  const spin = async () => {
    if (!guest || spinning || result) return;

    setSpinning(true);

    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/guest-spin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey:
              import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ??
              import.meta.env["VITE_SUPABASE_ANON_KEY"] ??
              "",
          },
          body: JSON.stringify({
            phone: guest.phone,
            accessToken: guest.accessToken,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ?? "Could not complete spin."
        );
      }

      const reward = data as Result;

      setRotation((current) =>
        rotationForPrize(reward.prize_id, current, 7)
      );

      setTimeout(() => {
        setSpinning(false);
        setResult(reward);
        setOpen(true);

        sessionStorage.setItem(
          "anushka_reward",
          JSON.stringify(reward)
        );
      }, 6400);
    } catch (error) {
      setSpinning(false);

      toast.error(
        error instanceof Error
          ? error.message
          : "Could not spin. Please try again."
      );
    }
  };

  const hasSpun = !!result && !spinning;

  return (
    <SiteShell>
      <div className="pointer-events-none absolute inset-x-0 top-0 hidden justify-between px-6 sm:flex">
        <Lantern className="w-10" />
        <Lantern className="w-8" delay={1.2} />
      </div>

      <section className="mx-auto max-w-3xl px-4 pt-4 text-center sm:pt-8">
        <p className="font-brand text-xs tracking-[0.5em] text-gold">
          ✦ DIWALI CELEBRATION ✦
        </p>

        <h1 className="mt-3 text-4xl font-semibold leading-tight text-ivory sm:text-6xl">
          Celebrate This Festive Season With{" "}
          <span className="italic text-gold-gradient">
            Exclusive Rewards!
          </span>
        </h1>

        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          Spin the Wheel & Unlock Your Festive Surprise.
        </p>
      </section>

      <section className="mx-auto mt-10 max-w-xl px-4">
        <Wheel rotation={rotation} spinning={spinning} />

        <div className="mt-8 flex flex-col items-center gap-3">
          {loading ? (
            <div className="h-14" />
          ) : !active ? (
            <p className="text-muted-foreground">
              The promotion is currently paused.
              Please check back soon.
            </p>
          ) : !guest ? (
            <Button variant="default" size="lg" asChild>
              <Link to="/login">Sign in to Spin</Link>
            </Button>
          ) : hasSpun ? (
            <Button
              variant="default"
              size="lg"
              onClick={() => setOpen(true)}
            >
              View My Reward
            </Button>
          ) : (
            <Button
              variant="default"
              size="lg"
              onClick={spin}
              disabled={spinning}
            >
              {spinning ? "Spinning…" : "SPIN NOW"}
            </Button>
          )}

          <p className="text-xs text-muted-foreground">
            One spin per customer is requested, but not
            technically guaranteed.{" "}
            <Link
              to="/terms"
              className="underline hover:text-gold"
            >
              Promotion rules
            </Link>
          </p>
        </div>
      </section>

      <div className="mt-12 flex justify-center gap-6">
        {[0, 1, 2, 3, 4].map((i) => (
          <Diya
            key={i}
            className="h-10 w-10 sm:h-14 sm:w-14"
          />
        ))}
      </div>

      {open &&
        result &&
        result.discount > 0 &&
        !result.already && <Confetti />}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="festive-card max-w-md border-gold/50">
          {result &&
          result.discount > 0 &&
          result.code &&
          result.expires_at ? (
            <>
              <DialogTitle className="text-center font-display text-3xl text-gold-gradient">
                Congratulations! You've Won{" "}
                {result.discount}% OFF!
              </DialogTitle>

              <DialogDescription className="text-center text-muted-foreground">
                Thank you for celebrating with
                Anushka Boutique!
              </DialogDescription>

              <CouponCard
                discount={result.discount}
                code={result.code}
                expiresAt={result.expires_at}
              />
            </>
          ) : (
            <>
              <DialogTitle className="text-center font-display text-3xl">
                Better luck next time
              </DialogTitle>

              <DialogDescription className="text-center">
                Thank you for celebrating with
                Anushka Boutique!
              </DialogDescription>
            </>
          )}
        </DialogContent>
      </Dialog>
    </SiteShell>
  );
}
