import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  RefreshCcw,
  Plus,
  Search,
  ClipboardPaste,
  Calendar,
  Filter,
  Pencil,
  Trash2,
  Wallet,
  Hash,
  User,
  ArrowLeftRight,
  Sparkles,
  Receipt,
  Clock,
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
import { cn } from "@/lib/utils";

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
  channel: string; // "DANA", "BCA", ...
  kind: DepositChannelKind;
  accentClass?: string; // tailwind gradient class for the channel logo tile
  logoText?: string; // fallback initials shown in the tile
  accounts: DepositAccount[];
}

interface DepositRow {
  id: string;
  date: string; // dd/M/yyyy
  iso: string; // yyyy-mm-dd for range filtering
  time: string; // HH:mm:ss
  ticket: string;
  username: string;
  fullName: string;
  senderName: string;
  senderAccount: string;
  group: "Low" | "Mid" | "High" | "VIP";
  amount: number;
  status: "Approved" | "Pending" | "Rejected";
  admin: string;
}

const rp = (n: number) =>
  "Rp " + n.toLocaleString("id-ID", { maximumFractionDigits: 0 });

// ------ deterministic mock rows so SSR + client match ------
const NAMES = [
  ["yuhendri48", "YUHENDRI"],
  ["memen73", "ENTANG SUHENDA"],
  ["riko91", "RIKO PRATAMA"],
  ["dedi22", "DEDI SUPRIADI"],
  ["andi_p", "ANDI PRASETYO"],
  ["sinta09", "SINTA DEWI"],
  ["bagas77", "BAGAS SAPUTRA"],
  ["nurul12", "NURUL HIDAYAH"],
  ["fikri", "FIKRI RAMADHAN"],
  ["wahyu", "WAHYU KURNIA"],
] as const;
const AMOUNTS = [10000, 20000, 25000, 30000, 50000, 75000, 100000, 150000];
const ADMINS = ["madan", "riyan", "arya", "linda"];

const SENDER_BANKS = ["BCA", "BRI", "BNI", "MANDIRI", "CIMB", "PERMATA"];

function seedRows(channel: string, count = 24): DepositRow[] {
  // simple deterministic hash from channel
  let s = 0;
  for (let i = 0; i < channel.length; i++) s = (s * 31 + channel.charCodeAt(i)) >>> 0;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
  const rows: DepositRow[] = [];
  let baseTicket = 6570000 + Math.floor(rand() * 999);
  let mins = 20 * 60 + 3; // start at ~20:03
  // spread rows across last 14 days ending 17/7/2026
  const end = new Date(Date.UTC(2026, 6, 17));
  for (let i = 0; i < count; i++) {
    const [uname, fname] = NAMES[Math.floor(rand() * NAMES.length)];
    const amount = AMOUNTS[Math.floor(rand() * AMOUNTS.length)];
    const admin = ADMINS[Math.floor(rand() * ADMINS.length)];
    const statusR = rand();
    const status: DepositRow["status"] =
      statusR > 0.94 ? "Rejected" : statusR > 0.88 ? "Pending" : "Approved";
    mins -= Math.floor(rand() * 12) + 2;
    if (mins < 0) mins = 20 * 60 + Math.floor(rand() * 60);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const sec = Math.floor(rand() * 60);
    const dayOffset = Math.floor(rand() * 14);
    const d = new Date(end);
    d.setUTCDate(d.getUTCDate() - dayOffset);
    const iso = d.toISOString().slice(0, 10);
    const dateStr = `${d.getUTCDate()}/${d.getUTCMonth() + 1}/${d.getUTCFullYear()}`;
    // sender: use another random name + generated bank account number
    const [, senderFull] = NAMES[Math.floor(rand() * NAMES.length)];
    const bank = SENDER_BANKS[Math.floor(rand() * SENDER_BANKS.length)];
    const acctNum =
      String(1000 + Math.floor(rand() * 8999)) +
      String(1000 + Math.floor(rand() * 8999)) +
      String(10 + Math.floor(rand() * 89));
    rows.push({
      id: `${channel}-${i}`,
      date: dateStr,
      iso,
      time: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`,
      ticket: "D" + baseTicket--,
      username: uname,
      fullName: fname,
      senderName: `${senderFull} (${bank})`,
      senderAccount: acctNum,
      group: (["Low", "Low", "Low", "Mid", "High", "VIP"] as const)[
        Math.floor(rand() * 6)
      ],
      amount,
      status,
      admin,
    });
  }
  return rows;
}

const STAT_TONES = {
  blue: "from-sky-500/15 to-sky-500/0 border-sky-500/20 text-sky-300",
  amber: "from-amber-500/15 to-amber-500/0 border-amber-500/20 text-amber-300",
  emerald: "from-emerald-500/15 to-emerald-500/0 border-emerald-500/20 text-emerald-300",
  violet: "from-violet-500/15 to-violet-500/0 border-violet-500/20 text-violet-300",
  rose: "from-rose-500/15 to-rose-500/0 border-rose-500/20 text-rose-300",
} as const;

function StatTile({
  label,
  value,
  hint,
  tone,
  index,
}: {
  label: string;
  value: string;
  hint?: string;
  tone: keyof typeof STAT_TONES;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className={cn(
        "relative overflow-hidden rounded-xl border bg-gradient-to-br p-4 soft-shadow",
        STAT_TONES[tone],
      )}
    >
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-2xl font-semibold tracking-tight", "text-foreground")}>{value}</div>
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
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        map[status],
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dot[status])} />
      {status}
    </span>
  );
}

export function DepositPage({ config }: { config: DepositPageConfig }) {
  const [accountId, setAccountId] = useState(config.accounts[0]?.id ?? "");
  const [datePreset, setDatePreset] = useState<"today" | "yesterday" | "7d" | "30d" | "custom">("30d");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | DepositRow["status"]>("all");
  const [search, setSearch] = useState("");
  const [accountSearch, setAccountSearch] = useState("");
  const [pasteData, setPasteData] = useState("");
  const [rows, setRows] = useState<DepositRow[]>(() => seedRows(config.channel));

  const account = config.accounts.find((a) => a.id === accountId) ?? config.accounts[0];

  // Compute effective from/to based on preset (unless custom)
  const { effFrom, effTo } = useMemo(() => {
    if (datePreset === "custom") return { effFrom: dateFrom, effTo: dateTo };
    const today = new Date("2026-07-17T00:00:00Z");
    const toIso = today.toISOString().slice(0, 10);
    const shift = (days: number) => {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - days);
      return d.toISOString().slice(0, 10);
    };
    if (datePreset === "today") return { effFrom: toIso, effTo: toIso };
    if (datePreset === "yesterday") return { effFrom: shift(1), effTo: shift(1) };
    if (datePreset === "7d") return { effFrom: shift(6), effTo: toIso };
    return { effFrom: shift(29), effTo: toIso };
  }, [datePreset, dateFrom, dateTo]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const qa = accountSearch.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (effFrom && r.iso < effFrom) return false;
      if (effTo && r.iso > effTo) return false;
      if (
        q &&
        !(
          r.username.toLowerCase().includes(q) ||
          r.fullName.toLowerCase().includes(q) ||
          r.senderName.toLowerCase().includes(q) ||
          r.ticket.toLowerCase().includes(q)
        )
      )
        return false;
      if (qa && !r.senderAccount.toLowerCase().includes(qa)) return false;
      return true;
    });
  }, [rows, statusFilter, search, accountSearch, effFrom, effTo]);

  const resetFilters = () => {
    setDatePreset("30d");
    setDateFrom("");
    setDateTo("");
    setStatusFilter("all");
    setSearch("");
    setAccountSearch("");
  };


  const totals = useMemo(() => {
    const total = rows.length;
    const approved = rows.filter((r) => r.status === "Approved").length;
    const pending = rows.filter((r) => r.status === "Pending").length;
    const pindah = Math.max(1, Math.floor(total * 0.05));
    const unik = rows.filter((r) => r.amount % 1000 !== 0).length;
    const admin = rows.reduce((s, r) => s + (r.amount > 100000 ? 1000 : 0), 0);
    return { total, approved, pending, pindah, unik, admin };
  }, [rows]);

  const onSimpan = () => {
    if (!pasteData.trim()) return toast.error("Tempel data terlebih dahulu");
    toast.success("Data mutasi berhasil diproses", {
      description: `${pasteData.trim().split("\n").length} baris ditambahkan ke antrian`,
    });
    setPasteData("");
  };

  const onRefresh = () => toast.success("Data diperbarui");
  const onAdd = () => toast.info("Form tambah deposit akan tersedia segera");
  const onEdit = (id: string) => toast.info(`Edit ${id}`);
  const onDelete = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
    toast.success("Transaksi dihapus");
  };

  const logo = config.logoText ?? config.channel.slice(0, 2).toUpperCase();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-lg text-sm font-bold text-white soft-shadow",
              config.accentClass ?? "bg-gradient-to-br from-sky-500 to-blue-700",
            )}
          >
            {logo}
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Tracking Money
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">{config.channel}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" onClick={onAdd}>
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
            <SelectTrigger className="border-border/60 bg-secondary/40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {config.accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.holder} — {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="glass-panel soft-shadow rounded-xl p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Hash className="h-3.5 w-3.5" /> Nomor Rekening
          </div>
          <div className="font-mono text-lg tracking-wider">{account?.number}</div>
          <div className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
            {account?.label}
          </div>
        </div>
        <div className="glass-panel soft-shadow rounded-xl p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Wallet className="h-3.5 w-3.5" /> Saldo Akhir
          </div>
          <div className="text-2xl font-semibold tracking-tight text-emerald-300">
            {rp(account?.balance ?? 0)}
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            Saldo awal {rp(account?.openingBalance ?? 0)}
          </div>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatTile
          index={0}
          tone="blue"
          label="Total Transaksi"
          value={String(totals.total)}
          hint={`${totals.approved} approved`}
        />
        <StatTile
          index={1}
          tone="amber"
          label="Total Pending"
          value={String(totals.pending)}
          hint="Perlu diproses"
        />
        <StatTile
          index={2}
          tone="emerald"
          label="Total Pindah Dana"
          value={String(totals.pindah)}
          hint="trx"
        />
        <StatTile
          index={3}
          tone="violet"
          label="Total Unik"
          value={String(totals.unik)}
          hint="trx"
        />
        <StatTile
          index={4}
          tone="rose"
          label="Total Biaya Admin"
          value={rp(totals.admin)}
          hint="trx"
        />
      </div>

      {/* Toolbar + Table */}
      <div className="glass-panel soft-shadow rounded-xl">
        <div className="flex flex-wrap items-center gap-2 border-b border-border/60 p-3">
          <div className="flex flex-1 items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary/60 text-muted-foreground">
              <ClipboardPaste className="h-4 w-4" />
            </div>
            <Input
              value={pasteData}
              onChange={(e) => setPasteData(e.target.value)}
              placeholder="Paste data di sini..."
              className="h-9 max-w-sm bg-secondary/40"
            />
            <Button size="sm" onClick={onSimpan}>
              Simpan
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={datePreset}
              onValueChange={(v) => setDatePreset(v as typeof datePreset)}
            >
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
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-9 w-[150px] bg-secondary/40"
                  aria-label="Dari tanggal"
                />
                <span className="text-xs text-muted-foreground">—</span>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-9 w-[150px] bg-secondary/40"
                  aria-label="Sampai tanggal"
                />
              </>
            )}
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
            >
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
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama pengirim / username..."
                className="h-9 w-[240px] bg-secondary/40 pl-8"
              />
            </div>
            <div className="relative">
              <Hash className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={accountSearch}
                onChange={(e) => setAccountSearch(e.target.value)}
                placeholder="No. rekening pengirim..."
                className="h-9 w-[200px] bg-secondary/40 pl-8"
                inputMode="numeric"
              />
            </div>
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Reset
            </Button>
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
                <th className="px-4 py-3 text-left font-medium">Pengirim</th>
                <th className="px-4 py-3 text-left font-medium">No. Rek Pengirim</th>
                <th className="px-4 py-3 text-left font-medium">Group</th>
                <th className="px-4 py-3 text-left font-medium">Jumlah Deposit</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Aksi</th>
                <th className="px-4 py-3 text-left font-medium">Admin</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Receipt className="h-8 w-8 opacity-40" />
                      Tidak ada transaksi ditemukan
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-border/50 transition-colors hover:bg-secondary/30"
                >
                  <td className="px-4 py-3 text-muted-foreground">{r.date}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3 opacity-60" />
                      {r.time}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.ticket}</td>
                  <td className="px-4 py-3 font-semibold text-primary">{r.username}</td>
                  <td className="px-4 py-3">{r.fullName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.group}</td>
                  <td className="px-4 py-3 font-semibold">{rp(r.amount)}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={r.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEdit(r.id)}
                        className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(r.id)}
                        className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.admin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-border/60 px-4 py-3 text-xs text-muted-foreground">
          <div>
            Menampilkan {filtered.length} dari {rows.length} transaksi
          </div>
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-3.5 w-3.5" />
            <Sparkles className="h-3.5 w-3.5" />
            Realtime sync aktif
          </div>
        </div>
      </div>
    </div>
  );
}
