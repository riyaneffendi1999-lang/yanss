import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Search, Landmark, Wallet, Smartphone, Power } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/settings/bank")({
  head: () => ({ meta: [{ title: "Manage Bank — Admin Console" }] }),
  component: ManageBankPage,
});

type Channel = "bank" | "emoney" | "pulsa";
type BankRow = {
  id: string;
  channel: Channel;
  name: string;
  code: string;
  accountName: string;
  accountNumber: string;
  balance: number;
  dailyLimit: number;
  online: boolean;
};

const seed: BankRow[] = [
  { id: "1", channel: "bank", name: "BCA", code: "BCA", accountName: "PT MAXSLOT MEDIA", accountNumber: "1234567890", balance: 152_450_000, dailyLimit: 500_000_000, online: true },
  { id: "2", channel: "bank", name: "MANDIRI", code: "MDR", accountName: "PT MAXSLOT MEDIA", accountNumber: "1400012345678", balance: 88_320_000, dailyLimit: 500_000_000, online: true },
  { id: "3", channel: "bank", name: "BNI", code: "BNI", accountName: "PT MAXSLOT MEDIA", accountNumber: "0223344556", balance: 62_100_000, dailyLimit: 300_000_000, online: false },
  { id: "4", channel: "bank", name: "BRI", code: "BRI", accountName: "PT MAXSLOT MEDIA", accountNumber: "0987655544", balance: 45_800_000, dailyLimit: 300_000_000, online: true },
  { id: "5", channel: "emoney", name: "DANA", code: "DANA", accountName: "MAXSLOT", accountNumber: "081234567890", balance: 18_450_000, dailyLimit: 100_000_000, online: true },
  { id: "6", channel: "emoney", name: "OVO", code: "OVO", accountName: "MAXSLOT", accountNumber: "081298765432", balance: 12_900_000, dailyLimit: 100_000_000, online: true },
  { id: "7", channel: "emoney", name: "GOPAY", code: "GOPAY", accountName: "MAXSLOT", accountNumber: "081211112222", balance: 9_720_000, dailyLimit: 80_000_000, online: false },
  { id: "8", channel: "pulsa", name: "TELKOMSEL", code: "TSEL", accountName: "PPOB", accountNumber: "081377778888", balance: 3_500_000, dailyLimit: 25_000_000, online: true },
];

const channelMeta: Record<Channel, { label: string; icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  bank: { label: "Bank", icon: Landmark, tone: "bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/20" },
  emoney: { label: "E-money", icon: Wallet, tone: "bg-violet-500/10 text-violet-600 dark:text-violet-300 border-violet-500/20" },
  pulsa: { label: "Pulsa", icon: Smartphone, tone: "bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-500/20" },
};

const fmt = (n: number) => new Intl.NumberFormat("id-ID").format(n);
const emptyForm = (): Omit<BankRow, "id"> => ({
  channel: "bank", name: "", code: "", accountName: "", accountNumber: "", balance: 0, dailyLimit: 0, online: true,
});

function ManageBankPage() {
  const [rows, setRows] = useState<BankRow[]>(seed);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | Channel>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BankRow | null>(null);
  const [form, setForm] = useState<Omit<BankRow, "id">>(emptyForm());

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchTab = tab === "all" || r.channel === tab;
      const query = q.trim().toLowerCase();
      const matchQ = !query || [r.name, r.code, r.accountName, r.accountNumber].some((v) => v.toLowerCase().includes(query));
      return matchTab && matchQ;
    });
  }, [rows, q, tab]);

  const stats = useMemo(() => ({
    total: rows.length,
    online: rows.filter((r) => r.online).length,
    balance: rows.reduce((a, b) => a + b.balance, 0),
    limit: rows.reduce((a, b) => a + b.dailyLimit, 0),
  }), [rows]);

  function openCreate() { setEditing(null); setForm(emptyForm()); setDialogOpen(true); }
  function openEdit(r: BankRow) { setEditing(r); setForm({ ...r }); setDialogOpen(true); }
  function save() {
    if (!form.name || !form.accountNumber) { toast.error("Nama & Nomor Rekening wajib diisi"); return; }
    if (editing) {
      setRows((rs) => rs.map((r) => (r.id === editing.id ? { ...editing, ...form } : r)));
      toast.success(`${form.name} diperbarui`);
    } else {
      setRows((rs) => [...rs, { ...form, id: crypto.randomUUID() }]);
      toast.success(`${form.name} ditambahkan`);
    }
    setDialogOpen(false);
  }
  function remove(r: BankRow) {
    if (!confirm(`Hapus ${r.name}?`)) return;
    setRows((rs) => rs.filter((x) => x.id !== r.id));
    toast.success(`${r.name} dihapus`);
  }
  function toggleOnline(r: BankRow, v: boolean) {
    setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, online: v } : x)));
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Manage Bank</h1>
          <p className="text-sm text-muted-foreground">Kelola bank, e-money & pulsa: saldo, status online/offline, dan limit harian.</p>
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
                <TableHead>Nama</TableHead>
                <TableHead>Atas Nama</TableHead>
                <TableHead>No. Rekening</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead className="text-right">Limit Harian</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => {
                const m = channelMeta[r.channel];
                const Icon = m.icon;
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Badge variant="outline" className={`gap-1 ${m.tone}`}>
                        <Icon className="h-3 w-3" /> {m.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{r.name} <span className="text-xs text-muted-foreground">({r.code})</span></TableCell>
                    <TableCell>{r.accountName}</TableCell>
                    <TableCell className="font-mono text-xs">{r.accountNumber}</TableCell>
                    <TableCell className="text-right font-semibold">Rp {fmt(r.balance)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">Rp {fmt(r.dailyLimit)}</TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex items-center gap-2">
                        <Switch checked={r.online} onCheckedChange={(v) => toggleOnline(r, v)} />
                        <span className={`text-xs ${r.online ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                          {r.online ? "Online" : "Offline"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => toggleOnline(r, !r.online)} title="Toggle">
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
                  <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                    Tidak ada data.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild><span className="hidden" /></DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Metode" : "Tambah Metode"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Channel">
              <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v as Channel })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="emoney">E-money</SelectItem>
                  <SelectItem value="pulsa">Pulsa</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Nama"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value.toUpperCase() })} /></Field>
            <Field label="Kode"><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} /></Field>
            <Field label="Atas Nama"><Input value={form.accountName} onChange={(e) => setForm({ ...form, accountName: e.target.value })} /></Field>
            <Field label="No. Rekening" className="col-span-2"><Input value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} /></Field>
            <Field label="Saldo Awal"><Input type="number" value={form.balance} onChange={(e) => setForm({ ...form, balance: Number(e.target.value) })} /></Field>
            <Field label="Limit Harian"><Input type="number" value={form.dailyLimit} onChange={(e) => setForm({ ...form, dailyLimit: Number(e.target.value) })} /></Field>
            <div className="col-span-2 flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">Status Online</p>
                <p className="text-xs text-muted-foreground">Aktifkan agar tampil di halaman deposit.</p>
              </div>
              <Switch checked={form.online} onCheckedChange={(v) => setForm({ ...form, online: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={save}>{editing ? "Simpan" : "Tambah"}</Button>
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
