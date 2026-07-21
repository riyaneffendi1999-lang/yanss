import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Eye, EyeOff, KeyRound, Loader2, UserCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { RefreshButton } from "@/components/common/RefreshButton";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Admin Console" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const userId = u.user?.id;
      if (!userId) return null;
      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);
      return { user: u.user, profile, roles: roles?.map((r) => r.role) ?? [] };
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Detail akun admin Anda" actions={<RefreshButton queryKeys={[["me"]]} />} />
      <div className="glass-panel soft-shadow max-w-2xl rounded-xl p-6">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        ) : (
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary">
              <UserCircle className="h-8 w-8" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-semibold">
                {data?.profile?.full_name ?? "—"}
              </h2>
              <p className="truncate text-sm text-muted-foreground">
                @{(data?.user?.email ?? "").split("@")[0] || "—"}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {data?.roles.length ? (
                  data.roles.map((r) => (
                    <span key={r} className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {r}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">Belum ada role</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <ChangePasswordCard email={data?.user?.email ?? ""} />
    </div>
  );
}

function ChangePasswordCard({ email }: { email: string }) {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      toast.error("Sesi tidak valid, silakan login ulang");
      return;
    }
    if (newPw.length < 6) {
      toast.error("Password baru minimal 6 karakter");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("Konfirmasi password tidak cocok");
      return;
    }
    if (currentPw === newPw) {
      toast.error("Password baru harus berbeda dengan password saat ini");
      return;
    }

    setLoading(true);
    try {
      // Re-verify current password
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email,
        password: currentPw,
      });
      if (signErr) {
        toast.error("Password saat ini salah");
        return;
      }

      const { error: updErr } = await supabase.auth.updateUser({ password: newPw });
      if (updErr) {
        toast.error(updErr.message || "Gagal memperbarui password");
        return;
      }

      toast.success("Password berhasil diperbarui");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (err: any) {
      toast.error(err?.message ?? "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel soft-shadow max-w-2xl rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <KeyRound className="h-5 w-5 text-primary" />
        <div>
          <h3 className="text-base font-semibold">Reset Password</h3>
          <p className="text-xs text-muted-foreground">
            Ubah password akun Anda sendiri kapan saja.
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="current-pw">Password Saat Ini</Label>
          <div className="relative">
            <Input
              id="current-pw"
              type={show ? "text" : "password"}
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="new-pw">Password Baru</Label>
          <Input
            id="new-pw"
            type={show ? "text" : "password"}
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            autoComplete="new-password"
            minLength={6}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm-pw">Konfirmasi Password Baru</Label>
          <Input
            id="confirm-pw"
            type={show ? "text" : "password"}
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            autoComplete="new-password"
            minLength={6}
            required
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...
            </>
          ) : (
            "Perbarui Password"
          )}
        </Button>
      </div>
    </form>
  );
}
