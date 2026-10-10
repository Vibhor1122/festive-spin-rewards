import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Sparkles } from "./Decor";
import bg from "@/assets/festive-bg.jpg";

export function SiteShell({ children }: { children: ReactNode }) {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  };
  const link = "text-sm text-muted-foreground transition-colors hover:text-gold";
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center opacity-55" style={{ backgroundImage: `url(${bg})` }} />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-background/40 via-background/60 to-background/90" />
      <Sparkles />
      <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4">
        <Link to="/" className="font-brand text-base tracking-[0.25em] text-gold-gradient sm:text-lg">
          ANUSHKA BOUTIQUE
        </Link>
        <nav className="flex items-center gap-3 sm:gap-5">
          {user && <Link to="/rewards" className={link}>My Rewards</Link>}
          {isAdmin && <Link to="/admin" className={link}>Admin</Link>}
          {user ? (
            <button onClick={signOut} className={link}>Sign out</button>
          ) : (
            <Link to="/login" className={link}>Sign in</Link>
          )}
        </nav>
      </header>
      <main className="relative z-10">{children}</main>
      <footer className="relative z-10 mx-auto mt-16 max-w-5xl px-4 pb-10 text-center text-xs text-muted-foreground">
        <div className="ornament-divider mb-6" />
        <div className="flex justify-center gap-5">
          <Link to="/terms" className="hover:text-gold">Terms & Conditions</Link>
          <Link to="/privacy" className="hover:text-gold">Privacy Policy</Link>
        </div>
        <p className="mt-3">© {new Date().getFullYear()} Anushka Boutique. Wishing you a bright Diwali.</p>
      </footer>
    </div>
  );
}
