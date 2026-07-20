import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logoUrl from "@/assets/maxslot88-logo.png";

const authSearchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: authSearchSchema,
  component: AuthPage,
});

const loginSchema = z.object({
  email: z.string().min(3, "Wajib diisi"),
  password: z.string().min(6, "Minimal 6 karakter"),
});
type LoginValues = z.infer<typeof loginSchema>;

type Coin = {
  id: number;
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
  drift: number;
  rotate: number;
  opacity: number;
};

function useCoins(count = 22): Coin[] {
  return useMemo(() => {
    // Deterministic pseudo-random so SSR/CSR match (route is ssr:false anyway)
    let seed = 42;
    const rnd = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: rnd() * 100,
      top: rnd() * 100,
      size: 28 + rnd() * 40,
      delay: rnd() * 6,
      duration: 7 + rnd() * 8,
      drift: -20 + rnd() * 40,
      rotate: -25 + rnd() * 50,
      opacity: 0.18 + rnd() * 0.35,
    }));
  }, [count]);
}

function CoinField() {
  const coins = useCoins(24);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {coins.map((c) => (
        <motion.div
          key={c.id}
          initial={{ y: 0, x: 0, rotate: 0, opacity: 0 }}
          animate={{
            y: [0, -18, 0, 18, 0],
            x: [0, c.drift * 0.4, 0, -c.drift * 0.4, 0],
            rotate: [0, c.rotate, 0, -c.rotate, 0],
            opacity: [c.opacity * 0.5, c.opacity, c.opacity * 0.7, c.opacity, c.opacity * 0.5],
          }}
          transition={{
            duration: c.duration,
            delay: c.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            left: `${c.left}%`,
            top: `${c.top}%`,
            width: c.size,
            height: c.size,
          }}
        >
          <div
            className="flex h-full w-full items-center justify-center rounded-full"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, #d9b26a 0%, #a97e34 45%, #6b4a15 100%)",
              boxShadow:
                "inset 0 -2px 6px rgba(0,0,0,0.55), inset 0 2px 4px rgba(255,220,150,0.35), 0 4px 14px rgba(0,0,0,0.45)",
              border: "1px solid rgba(255, 210, 140, 0.35)",
            }}
          >
            <span
              className="font-serif font-bold"
              style={{
                color: "#2b1d05",
                fontSize: c.size * 0.42,
                textShadow: "0 1px 0 rgba(255,220,150,0.5)",
                lineHeight: 1,
              }}
            >
              Rp
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onLogin(values: LoginValues) {
    setLoading(true);
    // Accept email or username@ shorthand
    const email = values.email.includes("@")
      ? values.email
      : `${values.email}@maxslot88.local`;
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: values.password,
    });
    setLoading(false);
    if (error) return toast.error("Login gagal", { description: error.message });
    toast.success("Selamat datang");
    navigate({ to: (search.redirect as "/dashboard") || "/dashboard" });
  }

  return (
    <div
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4 py-10"
      style={{
        background:
          "radial-gradient(ellipse at 50% 40%, #10233f 0%, #071224 45%, #03080f 100%)",
      }}
    >
      {/* Subtle grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
        }}
      />

      {/* Animated Rp coins */}
      <CoinField />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <img
            src={logoUrl}
            alt="MaxSlot88"
            className="h-auto w-[280px] select-none"
            style={{ filter: "drop-shadow(0 0 24px rgba(229,9,20,0.35))" }}
            draggable={false}
          />
        </div>

        <div
          className="rounded-2xl border p-6 backdrop-blur-xl"
          style={{
            background: "rgba(16, 20, 32, 0.72)",
            borderColor: "rgba(255,255,255,0.06)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.55)",
          }}
        >
          <div className="mb-5 text-center">
            <div className="text-lg font-semibold text-white">Selamat Datang</div>
            <div className="mt-1 text-xs text-white/50">Masuk ke panel admin</div>
          </div>

          <form onSubmit={form.handleSubmit(onLogin)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs text-white/70">
                Username
              </Label>
              <Input
                id="email"
                autoComplete="username"
                placeholder="username"
                className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/30"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs text-white/70">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="border-white/10 bg-white/[0.04] pr-10 text-white placeholder:text-white/30"
                  {...form.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-white/50 hover:text-white"
                  aria-label={showPass ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full font-semibold text-black hover:brightness-105"
              style={{
                background: "linear-gradient(180deg, #ffc93c 0%, #f5a623 100%)",
                boxShadow: "0 8px 24px rgba(245,166,35,0.35)",
              }}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Masuk
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-white/40">
          © {new Date().getFullYear()} MaxSlot88. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}
