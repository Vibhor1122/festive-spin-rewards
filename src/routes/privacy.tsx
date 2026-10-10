import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/festive/SiteShell";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Anushka Boutique" },
      { name: "description", content: "How Anushka Boutique collects, stores and protects your mobile number." },
      { property: "og:title", content: "Privacy Policy — Anushka Boutique" },
      { property: "og:description", content: "How we handle your mobile number for the festive promotion." },
    ],
  }),
  component: () => (
    <SiteShell>
      <article className="festive-card mx-auto max-w-2xl space-y-5 p-6 text-sm leading-relaxed text-muted-foreground sm:p-10">
        <h1 className="text-4xl font-semibold text-gold-gradient">Privacy Policy</h1>
        <section><h2 className="text-xl text-ivory">Why we collect your number</h2><p>Your mobile number verifies your identity, ensures one spin per customer, and links your coupon to you.</p></section>
        <section><h2 className="text-xl text-ivory">How it is stored</h2><p>Your number, spin result and coupon are stored on secure servers. Only you and authorised boutique staff can view them. Verification codes are stored only in scrambled form and expire within minutes.</p></section>
        <section><h2 className="text-xl text-ivory">Marketing</h2><p>We will not send you promotional SMS or WhatsApp messages without your explicit consent.</p></section>
        <section><h2 className="text-xl text-ivory">Deletion</h2><p>To have your data deleted, visit the boutique or contact us, and we will remove your number and coupon records.</p></section>
      </article>
    </SiteShell>
  ),
});
