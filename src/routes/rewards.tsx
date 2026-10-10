import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteShell } from "@/components/festive/SiteShell";
import { CouponCard } from "@/components/festive/CouponCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/rewards")({
  head: () => ({
    meta: [
      { title: "My Rewards — Anushka Boutique" },
      { name: "description", content: "View your festive Spin & Win coupon from Anushka Boutique." },
      { property: "og:title", content: "My Rewards — Anushka Boutique" },
      { property: "og:description", content: "Your festive coupons from Anushka Boutique." },
    ],
  }),
  component: Rewards,
});

type Coupon = { id: string; code: string; discount: number; expires_at: string; status: string };

function Rewards() {
  const { user, phone, loading } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[] | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("coupons").select("id, code, discount, expires_at, status").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setCoupons(data ?? []));
  }, [user]);

  return (
    <SiteShell>
      <div className="mx-auto max-w-md px-4 pt-6">
        <h1 className="text-center text-4xl font-semibold text-gold-gradient">My Rewards</h1>
        {phone && <p className="mt-2 text-center text-sm text-muted-foreground">{phone}</p>}
        <div className="mt-8 space-y-4">
          {loading ? null : !user ? (
            <div className="text-center"><Button variant="festive" asChild><Link to="/login">Sign in to see your rewards</Link></Button></div>
          ) : coupons === null ? (
            <p className="text-center text-muted-foreground">Loading…</p>
          ) : coupons.length === 0 ? (
            <div className="festive-card p-6 text-center">
              <p className="text-muted-foreground">You haven't won a coupon yet.</p>
              <Button variant="festive" className="mt-4" asChild><Link to="/">Spin the wheel</Link></Button>
            </div>
          ) : (
            coupons.map((c) => <div key={c.id} className="festive-card p-4"><CouponCard discount={c.discount} code={c.code} expiresAt={c.expires_at} status={c.status} /></div>)
          )}
        </div>
      </div>
    </SiteShell>
  );
}
