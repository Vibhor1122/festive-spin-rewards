import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/festive/SiteShell";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Anushka Boutique Spin & Win" },
      { name: "description", content: "Promotion rules, winning odds and coupon terms for the Anushka Boutique festive Spin & Win." },
      { property: "og:title", content: "Spin & Win Terms — Anushka Boutique" },
      { property: "og:description", content: "Eligibility, odds and coupon validity for the festive promotion." },
    ],
  }),
  component: Terms,
});

function Terms() {
  const [prizes, setPrizes] = useState<{ id: string; label: string; probability: number }[]>([]);
  const [days, setDays] = useState(7);
  useEffect(() => {
    supabase.from("prizes").select("id,label,probability").order("sort_order").then(({ data }) => setPrizes(data ?? []));
    supabase.from("campaigns").select("coupon_validity_days").eq("id", 1).maybeSingle().then(({ data }) => data && setDays(data.coupon_validity_days));
  }, []);
  return (
    <SiteShell>
      <article className="festive-card mx-auto max-w-2xl space-y-5 p-6 text-sm leading-relaxed text-muted-foreground sm:p-10">
        <h1 className="text-4xl font-semibold text-gold-gradient">Terms & Conditions</h1>
        <section><h2 className="text-xl text-ivory">Eligibility</h2><p>Open to customers with a valid Indian (+91) mobile number. Each verified mobile number may spin the wheel once during the campaign.</p></section>
        <section>
          <h2 className="text-xl text-ivory">Actual winning odds</h2>
          <table className="mt-2 w-full">
            <tbody>{prizes.map((p) => <tr key={p.id} className="border-b border-border/50"><td className="py-1.5">{p.label}</td><td className="text-right text-gold">{Number(p.probability)}%</td></tr>)}</tbody>
          </table>
          <p className="mt-2">Segments shown with 0% odds (such as "100% OFF" and "Better Luck Next Time") are decorative and cannot be won. Results are decided securely on our server.</p>
        </section>
        <section><h2 className="text-xl text-ivory">Coupon validity</h2><p>Coupons are valid for {days} days from the date of the spin. No minimum purchase is required.</p></section>
        <section><h2 className="text-xl text-ivory">Redemption</h2><p>Coupons can be redeemed only at Anushka Boutique, only once, and cannot be exchanged for cash, combined with other offers, or transferred after redemption. Anushka Boutique may end or change this promotion at any time.</p></section>
      </article>
    </SiteShell>
  );
}
