import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, KeyRound, Loader2, UserCircle, Upload, Settings2, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { RefreshButton } from "@/components/common/RefreshButton";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Admin Console" }] }),
  component: ProfilePage,
});

type MeData = {
  user: { id: string; email?: string | null } | null;
  profile: { id: string; full_name: string | null; avatar_url: string | null; is_active: boolean } | null;
  roles: string[];
  avatarSignedUrl: string | null;
};

async function fetchMe(): Promise<MeData | null> {
  const { data: u } = await supabase.auth.getUser();
  const user = u.user;
  if (!user) return null;
  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);
  let avatarSignedUrl: string | null = null;
  if (profile?.avatar_url) {
    const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(profile.avatar_url, 3600);
    avatarSignedUrl = signed?.signedUrl ?? null;
  }
  return { user, profile: profile ?? null, roles: roles?.map((r) => r.role) ?? [], avatarSignedUrl };
}

function ProfilePage() {
  const { data, isLoading } = useQuery({ queryKey: ["me"], queryFn: fetchMe });

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Detail akun admin Anda" actions={<RefreshButton queryKeys={[["me"]]} />} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <IdentityCard data={data ?? null} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <EditProfileCard data={data ?? null} isLoading={isLoading} />
          <PreferencesCard />
          <ChangePasswordCard email={data?.user?.email ?? ""} />
        </div>
      </div>
    </div>
  );
}

function IdentityCard({ data, isLoading }: { data: MeData | null; isLoading: boolean }) {
  return (
    <div className="glass-panel soft-shadow rounded-xl p-6">
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-20 rounded-full" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
      ) : (
        <div className="flex flex-col items-center text-center">
          <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-primary/30 bg-primary/10">
            {data?.avatarSignedUrl ? (
              <img src={data.avatarSignedUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-primary">
                <UserCircle className="h-14 w-14" />
              </div>
            )}
          </div>
          <h2 className="mt-3 truncate text-lg font-semibold">{data?.profile?.full_name ?? "—"}</h2>
          <p className="truncate text-sm text-muted-foreground">
            @{(data?.user?.email ?? "").split("@")[0] || "—"}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
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
      )}
    </div>
  );
}

function EditProfileCard({ data, isLoading }: { data: MeData | null; isLoading: boolean }) {
  const qc = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (data?.profile) setFullName(data.profile.full_name ?? "");
  }, [data?.profile?.id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!data?.user) return;
    if (fullName.trim().length < 2) {
      toast.error("Nama minimal 2 karakter");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName.trim() }).eq("id", data.user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profil diperbarui");
    qc.invalidateQueries({ queryKey: ["me"] });
  }

  async function handleUpload(file: File) {
    if (!data?.user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran maksimal 2MB");
      return;
    }
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast.error("Format harus PNG, JPG, atau WEBP");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `${data.user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) {
      setUploading(false);
      toast.error(upErr.message);
      return;
    }
    // remove old
    if (data.profile?.avatar_url && data.profile.avatar_url !== path) {
      await supabase.storage.from("avatars").remove([data.profile.avatar_url]);
    }
    const { error: updErr } = await supabase.from("profiles").update({ avatar_url: path }).eq("id", data.user.id);
    setUploading(false);
    if (updErr) {
      toast.error(updErr.message);
      return;
    }
    toast.success("Avatar diperbarui");
    qc.invalidateQueries({ queryKey: ["me"] });
  }

  async function handleRemoveAvatar() {
    if (!data?.user || !data.profile?.avatar_url) return;
    setUploading(true);
    await supabase.storage.from("avatars").remove([data.profile.avatar_url]);
    const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", data.user.id);
    setUploading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Avatar dihapus");
    qc.invalidateQueries({ queryKey: ["me"] });
  }

  return (
    <form onSubmit={handleSave} className="glass-panel soft-shadow rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <UserCircle className="h-5 w-5 text-primary" />
        <div>
          <h3 className="text-base font-semibold">Edit Profil</h3>
          <p className="text-xs text-muted-foreground">Ubah nama tampilan dan avatar akun Anda.</p>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        <>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 overflow-hidden rounded-full border border-border/60 bg-muted">
              {data?.avatarSignedUrl ? (
                <img src={data.avatarSignedUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <UserCircle className="h-8 w-8" />
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(f);
                  e.target.value = "";
                }}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Upload Avatar
              </Button>
              {data?.profile?.avatar_url ? (
                <Button type="button" variant="ghost" size="sm" onClick={handleRemoveAvatar} disabled={uploading}>
                  <Trash2 className="mr-2 h-4 w-4" /> Hapus
                </Button>
              ) : null}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">PNG, JPG, atau WEBP. Maks 2MB.</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="full-name">Nama Tampilan</Label>
              <Input id="full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={80} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={(data?.user?.email ?? "").split("@")[0]} disabled />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> : <><Save className="mr-2 h-4 w-4" /> Simpan Perubahan</>}
            </Button>
          </div>
        </>
      )}
    </form>
  );
}

const PREF_KEY = "admin.preferences.v1";
type Prefs = { language: "id" | "en"; timezone: string; density: "comfortable" | "compact" };
const DEFAULT_PREFS: Prefs = { language: "id", timezone: "Asia/Jakarta", density: "comfortable" };

function loadPrefs(): Prefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<Prefs>) };
  } catch {
    return DEFAULT_PREFS;
  }
}

function PreferencesCard() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const timezones = useMemo(
    () => ["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura", "Asia/Singapore", "Asia/Kuala_Lumpur", "UTC"],
    [],
  );

  useEffect(() => setPrefs(loadPrefs()), []);

  function save(next: Prefs) {
    setPrefs(next);
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent("admin:prefs-changed", { detail: next }));
      toast.success("Preferensi disimpan");
    } catch {
      toast.error("Gagal menyimpan preferensi");
    }
  }

  return (
    <div className="glass-panel soft-shadow rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Settings2 className="h-5 w-5 text-primary" />
        <div>
          <h3 className="text-base font-semibold">Preferensi</h3>
          <p className="text-xs text-muted-foreground">Atur bahasa, zona waktu, dan kepadatan tampilan.</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Bahasa</Label>
          <Select value={prefs.language} onValueChange={(v) => save({ ...prefs, language: v as Prefs["language"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="id">Bahasa Indonesia</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Zona Waktu</Label>
          <Select value={prefs.timezone} onValueChange={(v) => save({ ...prefs, timezone: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {timezones.map((tz) => (
                <SelectItem key={tz} value={tz}>{tz}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Kepadatan Tampilan</Label>
          <Select value={prefs.density} onValueChange={(v) => save({ ...prefs, density: v as Prefs["density"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="comfortable">Nyaman</SelectItem>
              <SelectItem value="compact">Ringkas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
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
      const { error: signErr } = await supabase.auth.signInWithPassword({ email, password: currentPw });
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
    <form onSubmit={handleSubmit} className="glass-panel soft-shadow rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <KeyRound className="h-5 w-5 text-primary" />
        <div>
          <h3 className="text-base font-semibold">Reset Password</h3>
          <p className="text-xs text-muted-foreground">Ubah password akun Anda sendiri kapan saja.</p>
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
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</>
          ) : (
            "Perbarui Password"
          )}
        </Button>
      </div>
    </form>
  );
}
