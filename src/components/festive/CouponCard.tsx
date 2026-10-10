import { Copy, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CouponCard({ discount, code, expiresAt, status }: { discount: number; code: string; expiresAt: string; status?: string }) {
  const expiry = new Date(expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const share = `I just won ${discount}% OFF at Anushka Boutique's Festive Spin & Win! 🪔 My coupon: ${code}`;
  return (
    <div className="rounded-2xl border border-dashed border-gold/70 bg-background/60 p-5 text-center">
      <p className="font-brand text-4xl text-gold-gradient">{discount}% OFF</p>
      <p className="mt-3 text-xs uppercase tracking-[0.3em] text-muted-foreground">Your coupon code</p>
      <p className="mt-1 font-mono text-xl tracking-widest text-ivory">{code}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        {status === "redeemed" ? "Already redeemed" : `Valid until ${expiry}`}
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Button size="sm" onClick={() => navigator.clipboard.writeText(code).then(() => toast.success("Coupon copied"))}>
          <Copy /> Copy code
        </Button>
        <Button size="sm" variant="outline" asChild>
          <a href={`https://wa.me/?text=${encodeURIComponent(share)}`} target="_blank" rel="noreferrer">
            <MessageCircle /> Share on WhatsApp
          </a>
        </Button>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        To redeem, visit Anushka Boutique and show this code at billing. One-time use, valid on any purchase.
      </p>
    </div>
  );
}
