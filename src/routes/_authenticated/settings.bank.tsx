import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search, Landmark, Wallet, Smartphone, Power } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useConfirmDelete } from "@/components/common/ConfirmDelete";

export const Route = createFileRoute("/_authenticated/settings/bank")({
  head: () => ({ meta: [{ title: "Manage Bank — Admin Console" }] }),
  component: ManageBankPage,
});

type Channel = "bank" | "emoney" | "pulsa";
type BankRow = {
  id: string;
  channel_kind: Channel;
  channel_name: string;
  code: string | null;
  account_name: string;
  account_number: string;
  opening_balance: number;
  balance: number;
  daily_limit: number;
  online: boolean;
};

const channelMeta: Record<Channel, { label: string; icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  bank: { label: "Bank", icon: Landmark, tone: "bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/20" },
  emoney: { label: "E-money", icon: Wallet, tone: "bg-violet-500/10 text-violet-600 dark:text-violet-300 border-violet-500/20" },
  pulsa: { label: "Pulsa", icon: Smartphone, tone: "bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-500/20" },
};

const CHANNEL_NAMES: Record<Channel, string[]> = {
  bank: ["BCA", "BNI", "BRI", "MANDIRI"],
  emoney: ["DANA", "OVO", "GOPAY", "LINKAJA"],
  pulsa: ["TELKOMSEL", "XL"],
};

const fmt = (n: number) => new Intl.NumberFormat("id-ID").format(n);
const emptyForm = () => ({
  channel_kind: "bank" as Channel,
  channel_name: "",
  code: "",
  account_name: "",
  account_number: "",
  opening_balance: 0,
  balance: 0,
  daily_limit: 0,
  online: true,
});

function ManageBankPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | Channel>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BankRow | null>(null);
  const [form, setForm] = useState(emptyForm());

  const { data: rows = [] } = useQuery<BankRow[]>({
    queryKey: ["bank_accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_accounts" as never)
        .select("*")
        .order("channel_kind")
        .order("channel_name");
      if (error) throw error;
      return (data ?? []) as unknown as BankRow[];
    },
  });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["bank_accounts"] });
  };

  const upsertMut = useMutation({
    mutationFn: async (payload: Partial<BankRow> & { id?: string }) => {
      if (payload.id) {
        const { error } = await supabase.from("bank_accounts" as never).update(payload as never).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("bank_accounts" as never).insert(payload as never);
        if (error) throw error;
      }
    },
    onSuccess: invalidateAll,
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bank_accounts" as never).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidateAll,
  });

  const toggleMut = useMutation({
    mutationFn: async ({ id, online }: { id: string; online: boolean }) => {
      const { error } = await supabase.from("bank_accounts" as never).update({ online } as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidateAll,
  });

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchTab = tab === "all" || r.channel_kind === tab;
      const query = q.trim().toLowerCase();
      const matchQ = !query || [r.channel_name, r.code ?? "", r.account_name, r.account_number]
        .some((v) => v.toLowerCase().includes(query));
      return matchTab && matchQ;
    });
  }, [rows, q, tab]);

  const stats = useMemo(() => ({
    total: rows.length,
    online: rows.filter((r) => r.online).length,
    balance: rows.reduce((a, b) => a + Number(b.balance), 0),
    limit: rows.reduce((a, b) => a + Number(b.daily_limit), 0),
  }), [rows]);

  function openCreate() { setEditing(null); setForm(emptyForm()); setDialogOpen(true); }
  function openEdit(r: BankRow) {
    setEditing(r);
    setForm({
      channel_kind: r.channel_kind,
      channel_name: r.channel_name,
      code: r.code ?? "",
      account_name: r.account_name,
      account_number: r.account_number,
      opening_balance: Number(r.opening_balance),
      balance: Number(r.balance),
      daily_limit: Number(r.daily_limit),
      online: r.online,
    });
    setDialogOpen(true);
  }
  async function save() {
    if (!form.channel_name || !form.account_number) {
      toast.error("Nama Bank & Nomor Rekening wajib diisi"); return;
    }
    try {
      await upsertMut.mutateAsync({ ...(editing ? { id: editing.id } : {}), ...form });
      toast.success(editing ? `${form.channel_name} diperbarui` : `${form.channel_name} ditambahkan`);
      setDialogOpen(false);
    } catch (e: unknown) {
      toast.error("Gagal menyimpan", { description: (e as Error).message });
    }
  }
  async function remove(r: BankRow) {
    const ok = await confirmDelete({ title: `Hapus ${r.channel_name}?`, description: "Data bank akan dihapus permanen. Tekan Enter untuk konfirmasi." });
    if (!ok) return;
    try { await deleteMut.mutateAsync(r.id); toast.success(`${r.channel_name} dihapus`); }
    catch (e: unknown) { toast.error("Gagal hapus", { description: (e as Error).message }); }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Manage Bank</h1>
          <p className="text-sm text-muted-foreground">Kelola bank, e-money & pulsa: saldo awal, status online/offline, dan limit harian.</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Tambah Metode</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total Metode" value={String(stats.total)} />
        <StatCard label="Aktif Online" value={`${stats.online}/${stats.total}`} tone="success" />
        <StatCard label="Total Saldo" value={`Rp ${fmt(stats.balance)}`} tone="primary" />
        <StatCard label="Total Limit Harian" value={`Rp ${fmt(stats.limit)}`} tone="warning" />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-base">Daftar Metode Pembayaran</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            {(["all", "bank", "emoney", "pulsa"] as const).map((t) => (
              <Button key={t} size="sm" variant={tab === t ? "default" : "outline"} onClick={() => setTab(t)}>
                {t === "all" ? "Semua" : channelMeta[t].label}
              </Button>
            ))}
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama/kode/rekening…" className="h-9 w-64 pl-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Channel</TableHead>
                <TableHead>Nama Bank</TableHead>
                <TableHead>Atas Nama</TableHead>
                <TableHead>Nomor Rekening</TableHead>
                <TableHead className="text-right">Saldo Awal</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => {
                const m = channelMeta[r.channel_kind];
                const Icon = m.icon;
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Badge variant="outline" className={`gap-1 ${m.tone}`}>
                        <Icon className="h-3 w-3" /> {m.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {r.channel_name}
                      {r.code && <span className="ml-1 text-xs text-muted-foreground">({r.code})</span>}
                    </TableCell>
                    <TableCell>{r.account_name}</TableCell>
                    <TableCell className="font-mono text-xs">{r.account_number}</TableCell>
                    <TableCell className="text-right font-semibold">Rp {fmt(Number(r.opening_balance))}</TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex items-center gap-2">
                        <Switch checked={r.online} onCheckedChange={(v) => toggleMut.mutate({ id: r.id, online: v })} />
                        <span className={`text-xs ${r.online ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                          {r.online ? "Online" : "Offline"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => toggleMut.mutate({ id: r.id, online: !r.online })} title="Toggle">
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => openEdit(r)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => remove(r)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                    Belum ada data. Klik <b>Tambah Metode</b>.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Metode" : "Tambah Metode"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Channel">
              <Select
                value={form.channel_kind}
                onValueChange={(v) =>
                  setForm({ ...form, channel_kind: v as Channel, channel_name: "" })
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="emoney">E-money</SelectItem>
                  <SelectItem value="pulsa">Pulsa</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Nama Bank">
              <Select
                value={form.channel_name}
                onValueChange={(v) => setForm({ ...form, channel_name: v })}
              >
                <SelectTrigger><SelectValue placeholder={`Pilih ${channelMeta[form.channel_kind].label}…`} /></SelectTrigger>
                <SelectContent>
                  {CHANNEL_NAMES[form.channel_kind].map((n) => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Kode"><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} /></Field>
            <Field label="Atas Nama"><Input value={form.account_name} onChange={(e) => setForm({ ...form, account_name: e.target.value })} /></Field>
            <Field label="Nomor Rekening" className="col-span-2"><Input value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} /></Field>
            <Field label="Saldo Awal" className="col-span-2"><Input type="number" value={form.opening_balance} onChange={(e) => setForm({ ...form, opening_balance: Number(e.target.value), balance: Number(e.target.value) })} /></Field>
            <div className="col-span-2 flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">Status Online</p>
                <p className="text-xs text-muted-foreground">Hanya rekening aktif yang tampil di halaman deposit.</p>
              </div>
              <Switch checked={form.online} onCheckedChange={(v) => setForm({ ...form, online: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={save} disabled={upsertMut.isPending}>{editing ? "Simpan" : "Tambah"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: "primary" | "success" | "warning" }) {
  const toneClass = tone === "primary" ? "text-primary" : tone === "success" ? "text-emerald-600 dark:text-emerald-400" : tone === "warning" ? "text-amber-600 dark:text-amber-400" : "";
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`mt-1 text-xl font-semibold ${toneClass}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
