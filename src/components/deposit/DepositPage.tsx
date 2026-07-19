import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  RefreshCcw,
  Plus,
  Search,
  ClipboardPaste,
  Calendar,
  Filter,
  Trash2,
  Wallet,
  Hash,
  User,
  ArrowLeftRight,
  Sparkles,
  Receipt,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export type DepositChannelKind = "bank" | "emoney" | "pulsa";

export interface DepositAccount {
  id: string;
  holder: string;
  number: string;
  label: string;
  balance: number;
  openingBalance: number;
}

export interface DepositPageConfig {
  channel: string;
  kind: DepositChannelKind;
  accentClass?: string;
  logoText?: string;
  accounts: DepositAccount[];
}

interface DepositRow {
  id: string;
  channel: string;
  date_str: string;
  iso_date: string;
  time_str: string;
  ticket: string;
  username: string;
  full_name: string;
  sender_name: string | null;
  sender_account: string | null;
  group_tier: string | null;
  amount: number;
  status: "Approved" | "Pending" | "Rejected";
  admin: string | null;
}

const rp = (n: number) =>
  "Rp " + n.toLocaleString("id-ID", { maximumFractionDigits: 0 });

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

/** Parse pasted deposit blob supporting the 3 documented formats.
 * Each entry has 7 logical tokens split by tabs / newlines:
 *   [date, time, ticket, username, fullName, group, amount]
 */
export function parseDepositPaste(text: string): Array<{
  date_str: string;
  iso_date: string;
  time_str: string;
  ticket: string;
  username: string;
  full_name: string;
  group_tier: string;
  amount: number;
}> {
  const tokens = text
    .split(/[\n\t]+/)
    .map((t) => t.trim())
    .filter(Boolean);
  const dateRe = /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/;
  const timeRe = /^\d{1,2}:\d{2}(:\d{2})?$/;
  const ticketRe = /^[A-Za-z]?\d{6,}$/;
  const starts: number[] = [];
  tokens.forEach((t, i) => {
    if (dateRe.test(t)) starts.push(i);
  });
  const out: ReturnType<typeof parseDepositPaste> = [];
  for (let s = 0; s < starts.length; s++) {
    const start = starts[s];
    const end = starts[s + 1] ?? tokens.length;
    const chunk = tokens.slice(start, end);
    if (chunk.length < 7) continue;
    const [date, time, ticket, username, fullName, group, amountRaw] = chunk;
    if (!timeRe.test(time)) continue;
    if (!ticketRe.test(ticket)) continue;
    const m = date.match(dateRe)!;
    const day = parseInt(m[1], 10);
    const mon = MONTHS[m[2].toLowerCase()];
    const year = parseInt(m[3], 10);
    if (!mon) continue;
    const iso = `${year}-${String(mon).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dateStr = `${day}/${mon}/${year}`;
    const amount = Number(amountRaw.replace(/[^\d.-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "")) || Number(amountRaw.replace(/[,\s]/g, ""));
    const cleanTime = time.length === 5 ? `${time}:00` : time;
    out.push({
      date_str: dateStr,
      iso_date: iso,
      time_str: cleanTime,
      ticket,
      username,
      full_name: fullName,
      group_tier: group,
      amount: isFinite(amount) ? amount : 0,
    });
  }
  return out;
}

const STAT_TONES = {
  blue: "from-sky-500/15 to-sky-500/0 border-sky-500/20 text-sky-300",
  amber: "from-amber-500/15 to-amber-500/0 border-amber-500/20 text-amber-300",
  emerald: "from-emerald-500/15 to-emerald-500/0 border-emerald-500/20 text-emerald-300",
  violet: "from-violet-500/15 to-violet-500/0 border-violet-500/20 text-violet-300",
  rose: "from-rose-500/15 to-rose-500/0 border-rose-500/20 text-rose-300",
} as const;

function StatTile({
  label, value, hint, tone, index,
}: { label: string; value: string; hint?: string; tone: keyof typeof STAT_TONES; index: number; }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className={cn("relative overflow-hidden rounded-xl border bg-gradient-to-br p-4 soft-shadow", STAT_TONES[tone])}
    >
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>}
    </motion.div>
  );
}

function StatusPill({ status }: { status: DepositRow["status"] }) {
  const map = {
    Approved: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    Pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    Rejected: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  } as const;
  const dot = {
    Approved: "bg-emerald-400",
    Pending: "bg-amber-400",
    Rejected: "bg-rose-400",
  } as const;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium", map[status])}>
      <span className={cn("h-1.5 w-1.5 rounded-full", dot[status])} />
      {status}
    </span>
  );
}

export function DepositPage({ config }: { config: DepositPageConfig }) {
  const qc = useQueryClient();
  const queryKey = ["deposits", config.channel];
  const [accountId, setAccountId] = useState(config.accounts[0]?.id ?? "");
  const [datePreset, setDatePreset] = useState<"today" | "yesterday" | "7d" | "30d" | "custom">("30d");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | DepositRow["status"]>("all");
  const [search, setSearch] = useState("");
  const [pasteData, setPasteData] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    ticket: "", username: "", full_name: "", sender_name: "",
    group_tier: "Low", amount: "", status: "Pending" as DepositRow["status"],
  });

  const { data: rows = [], isFetching, refetch } = useQuery<DepositRow[]>({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deposits" as never)
        .select("*")
        .eq("channel", config.channel)
        .order("iso_date", { ascending: false })
        .order("time_str", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as DepositRow[];
    },
  });

  const insertMut = useMutation({
    mutationFn: async (payload: Record<string, unknown>[]) => {
      const { error } = await supabase.from("deposits" as never).insert(payload as never);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("deposits" as never).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Record<string, unknown> }) => {
      const { error } = await supabase.from("deposits" as never).update(patch as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const account = config.accounts.find((a) => a.id === accountId) ?? config.accounts[0];

  const { effFrom, effTo } = useMemo(() => {
    if (datePreset === "custom") return { effFrom: dateFrom, effTo: dateTo };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const toIso = today.toISOString().slice(0, 10);
    const shift = (days: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() - days);
      return d.toISOString().slice(0, 10);
    };
    if (datePreset === "today") return { effFrom: toIso, effTo: toIso };
    if (datePreset === "yesterday") return { effFrom: shift(1), effTo: shift(1) };
    if (datePreset === "7d") return { effFrom: shift(6), effTo: toIso };
    return { effFrom: shift(29), effTo: toIso };
  }, [datePreset, dateFrom, dateTo]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (effFrom && r.iso_date < effFrom) return false;
      if (effTo && r.iso_date > effTo) return false;
      if (q && !(
        r.username.toLowerCase().includes(q) ||
        r.full_name.toLowerCase().includes(q) ||
        (r.sender_name ?? "").toLowerCase().includes(q) ||
        r.ticket.toLowerCase().includes(q)
      )) return false;
      return true;
    });
  }, [rows, statusFilter, search, effFrom, effTo]);

  const resetFilters = () => {
    setDatePreset("30d");
    setDateFrom(""); setDateTo("");
    setStatusFilter("all");
    setSearch("");
  };

  const totals = useMemo(() => {
    const total = rows.length;
    const approved = rows.filter((r) => r.status === "Approved").length;
    const pending = rows.filter((r) => r.status === "Pending").length;
    const totalAmount = rows.reduce((s, r) => s + Number(r.amount), 0);
    const unik = rows.filter((r) => Number(r.amount) % 1000 !== 0).length;
    return { total, approved, pending, totalAmount, unik };
  }, [rows]);

  const onSimpan = async () => {
    if (!pasteData.trim()) return toast.error("Tempel data terlebih dahulu");
    const parsed = parseDepositPaste(pasteData);
    if (parsed.length === 0) {
      return toast.error("Format tidak dikenali", {
        description: "Pastikan urutan: tanggal, jam, tiket, username, nama, group, jumlah.",
      });
    }
    const payload = parsed.map((p) => ({
      ...p,
      channel: config.channel,
      account_id: account?.id ?? null,
      status: "Pending",
    }));
    try {
      await insertMut.mutateAsync(payload);
      toast.success(`${parsed.length} transaksi ditambahkan`);
      setPasteData("");
    } catch (e: unknown) {
      toast.error("Gagal menyimpan", { description: (e as Error).message });
    }
  };

  const onRefresh = async () => {
    await refetch();
    toast.success("Data diperbarui");
  };

  const onAddSubmit = async () => {
    if (!form.ticket || !form.username || !form.full_name || !form.amount) {
      return toast.error("Lengkapi tiket, username, nama, dan jumlah");
    }
    const now = new Date();
    const iso = now.toISOString().slice(0, 10);
    const dateStr = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
    const timeStr = now.toTimeString().slice(0, 8);
    try {
      await insertMut.mutateAsync([{
        channel: config.channel,
        account_id: account?.id ?? null,
        date_str: dateStr,
        iso_date: iso,
        time_str: timeStr,
        ticket: form.ticket,
        username: form.username,
        full_name: form.full_name,
        sender_name: form.sender_name || null,
        group_tier: form.group_tier,
        amount: Number(form.amount.replace(/[^\d.-]/g, "")) || 0,
        status: form.status,
      }]);
      toast.success("Transaksi ditambahkan");
      setAddOpen(false);
      setForm({ ticket: "", username: "", full_name: "", sender_name: "", group_tier: "Low", amount: "", status: "Pending" });
    } catch (e: unknown) {
      toast.error("Gagal menambah", { description: (e as Error).message });
    }
  };

  const onDelete = async (id: string) => {
    try { await deleteMut.mutateAsync(id); toast.success("Transaksi dihapus"); }
    catch (e: unknown) { toast.error("Gagal hapus", { description: (e as Error).message }); }
  };

  const onApprove = (id: string) => updateMut.mutate({ id, patch: { status: "Approved" } });
  const onReject = (id: string) => updateMut.mutate({ id, patch: { status: "Rejected" } });

  const logo = config.logoText ?? config.channel.slice(0, 2).toUpperCase();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={cn("flex h-11 w-11 items-center justify-center rounded-lg text-sm font-bold text-white soft-shadow",
            config.accentClass ?? "bg-gradient-to-br from-sky-500 to-blue-700")}>
            {logo}
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Tracking Money</div>
            <h1 className="text-2xl font-semibold tracking-tight">{config.channel}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isFetching}>
            <RefreshCcw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah
          </Button>
        </div>
      </div>

      {/* Account cards */}
      <div className="grid gap-3 md:grid-cols-3">
        <div className="glass-panel soft-shadow rounded-xl p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <User className="h-3.5 w-3.5" /> Atas Nama
          </div>
          <Select value={accountId} onValueChange={setAccountId}>
            <SelectTrigger className="border-border/60 bg-secondary/40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {config.accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.holder} — {a.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="glass-panel soft-shadow rounded-xl p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Hash className="h-3.5 w-3.5" /> Nomor Rekening
          </div>
          <div className="font-mono text-lg tracking-wider">{account?.number}</div>
          <div className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">{account?.label}</div>
        </div>
        <div className="glass-panel soft-shadow rounded-xl p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Wallet className="h-3.5 w-3.5" /> Saldo Akhir
          </div>
          <div className="text-2xl font-semibold tracking-tight text-emerald-300">{rp(account?.balance ?? 0)}</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">Saldo awal {rp(account?.openingBalance ?? 0)}</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatTile index={0} tone="blue" label="Total Transaksi" value={String(totals.total)} hint={`${totals.approved} approved`} />
        <StatTile index={1} tone="amber" label="Total Pending" value={String(totals.pending)} hint="Perlu diproses" />
        <StatTile index={2} tone="emerald" label="Total Nominal" value={rp(totals.totalAmount)} hint="Akumulasi" />
        <StatTile index={3} tone="violet" label="Total Unik" value={String(totals.unik)} hint="trx" />
        <StatTile index={4} tone="rose" label="Approved" value={String(totals.approved)} hint="trx" />
      </div>

      {/* Toolbar + Table */}
      <div className="glass-panel soft-shadow rounded-xl">
        <div className="flex flex-wrap items-start gap-2 border-b border-border/60 p-3">
          <div className="flex flex-1 min-w-[300px] items-start gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary/60 text-muted-foreground">
              <ClipboardPaste className="h-4 w-4" />
            </div>
            <Textarea
              value={pasteData}
              onChange={(e) => setPasteData(e.target.value)}
              placeholder={"Paste data mutasi di sini...\nContoh:\n19-Jul-2026\n13:55:21\n\tD6590223\thusnul1\tHUSNUL RIDANIL\tLow\n100,000.00"}
              className="min-h-9 bg-secondary/40 font-mono text-xs"
              rows={2}
            />
            <Button size="sm" onClick={onSimpan} disabled={insertMut.isPending}>
              {insertMut.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={datePreset} onValueChange={(v) => setDatePreset(v as typeof datePreset)}>
              <SelectTrigger className="h-9 w-[150px] border-border/60 bg-secondary/40">
                <Calendar className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hari ini</SelectItem>
                <SelectItem value="yesterday">Kemarin</SelectItem>
                <SelectItem value="7d">7 hari terakhir</SelectItem>
                <SelectItem value="30d">30 hari terakhir</SelectItem>
                <SelectItem value="custom">Rentang khusus</SelectItem>
              </SelectContent>
            </Select>
            {datePreset === "custom" && (
              <>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 w-[150px] bg-secondary/40" />
                <span className="text-xs text-muted-foreground">—</span>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 w-[150px] bg-secondary/40" />
              </>
            )}
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="h-9 w-[150px] border-border/60 bg-secondary/40">
                <Filter className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama / username / tiket..." className="h-9 w-[260px] bg-secondary/40 pl-8" />
            </div>
            <Button variant="outline" size="sm" onClick={resetFilters}>Reset</Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">Tanggal</th>
                <th className="px-4 py-3 text-left font-medium">Jam</th>
                <th className="px-4 py-3 text-left font-medium">Tiket</th>
                <th className="px-4 py-3 text-left font-medium">Username</th>
                <th className="px-4 py-3 text-left font-medium">Nama Lengkap</th>
                <th className="px-4 py-3 text-left font-medium">Group</th>
                <th className="px-4 py-3 text-left font-medium">Jumlah</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Receipt className="h-8 w-8 opacity-40" />
                      Belum ada transaksi. Tekan <b>+Tambah</b> atau tempel data di kolom paste.
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-border/50 transition-colors hover:bg-secondary/30">
                  <td className="px-4 py-3 text-muted-foreground">{r.date_str}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3 opacity-60" />{r.time_str}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.ticket}</td>
                  <td className="px-4 py-3 font-semibold text-primary">{r.username}</td>
                  <td className="px-4 py-3">{r.full_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.group_tier}</td>
                  <td className="px-4 py-3 font-semibold">{rp(Number(r.amount))}</td>
                  <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {r.status !== "Approved" && (
                        <button onClick={() => onApprove(r.id)} title="Approve"
                          className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {r.status !== "Rejected" && (
                        <button onClick={() => onReject(r.id)} title="Reject"
                          className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-rose-400">
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button onClick={() => onDelete(r.id)} title="Hapus"
                        className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-rose-400">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-border/60 px-4 py-3 text-xs text-muted-foreground">
          <div>Menampilkan {filtered.length} dari {rows.length} transaksi</div>
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-3.5 w-3.5" />
            <Sparkles className="h-3.5 w-3.5" />
            Tersinkron dengan database
          </div>
        </div>
      </div>

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tambah Deposit — {config.channel}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tiket</Label>
              <Input value={form.ticket} onChange={(e) => setForm((f) => ({ ...f, ticket: e.target.value }))} placeholder="D6590223" />
            </div>
            <div className="space-y-1.5">
              <Label>Username</Label>
              <Input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Nama Lengkap</Label>
              <Input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Nama Pengirim (opsional)</Label>
              <Input value={form.sender_name} onChange={(e) => setForm((f) => ({ ...f, sender_name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Group</Label>
              <Select value={form.group_tier} onValueChange={(v) => setForm((f) => ({ ...f, group_tier: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Low", "Mid", "High", "VIP", "New Registration"].map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Jumlah</Label>
              <Input inputMode="numeric" value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="100000" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as DepositRow["status"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Batal</Button>
            <Button onClick={onAddSubmit} disabled={insertMut.isPending}>
              {insertMut.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
