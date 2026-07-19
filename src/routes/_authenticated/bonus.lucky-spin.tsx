import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Trash2, Check, Search, Calendar, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DateRangeSelect, resolveDateRange, type DateRangeValue } from "@/components/common/DateRangeSelect";

export const Route = createFileRoute("/_authenticated/bonus/lucky-spin")({
  head: () => ({ meta: [{ title: "Lucky Spin — Admin Console" }] }),
  component: LuckySpinPage,
});

type InputRow = {
  id: string;
  username: string;
  ticket: string;
  bonus: string;
  status: "pending" | "complete" | "idle";
};

type CompleteRow = {
  id: string;
  date: string;
  iso_date: string;
  time: string;
  username: string;
  ticket: string;
  bonus: number;
  status: "complete";
};

const MAX_INPUT_TICKETS = 10;
const PAGE_SIZE = 10;

function randomTicket() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function makeEmptyRows(count: number): InputRow[] {
  return Array.from({ length: count }, () => ({
    id: crypto.randomUUID(),
    username: "",
    ticket: randomTicket(),
    bonus: "",
    status: "idle",
  }));
}

function parseTickets(raw: string): string[] {
  return raw
    .split(/[\s,;\n\r\t]+/)
    .map((t) => t.trim().toUpperCase())
    .filter((t) => t.length >= 9 && t.length <= 12 && /^[A-Z0-9]+$/.test(t));
}

function LuckySpinPage() {
  const [inputRows, setInputRows] = useState<InputRow[]>(() => makeEmptyRows(MAX_INPUT_TICKETS));
  const [pasteValue, setPasteValue] = useState("");
  const [completeRows, setCompleteRows] = useState<CompleteRow[]>([]);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<"today" | "7d" | "30d" | "all">("today");
  const [page, setPage] = useState(1);

  const filledCount = inputRows.filter((r) => r.ticket && r.username).length;

  const updateRow = (id: string, patch: Partial<InputRow>) => {
    setInputRows((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const deleteRow = (id: string) => {
    setInputRows((rows) => rows.filter((r) => r.id !== id));
  };

  const addRow = () => {
    if (inputRows.length >= MAX_INPUT_TICKETS + 20) {
      toast.error("Maksimum baris tercapai");
      return;
    }
    setInputRows((rows) => [
      ...rows,
      { id: crypto.randomUUID(), username: "", ticket: randomTicket(), bonus: "", status: "idle" },
    ]);
  };

  const handleAddFromPaste = () => {
    const tickets = parseTickets(pasteValue);
    if (tickets.length === 0) {
      toast.error("Tiket tidak valid. Minimal 9 karakter alfanumerik per tiket.");
      return;
    }
    setInputRows((rows) => {
      const next = [...rows];
      let ti = 0;
      // fill empty ticket slots first
      for (let i = 0; i < next.length && ti < tickets.length; i++) {
        if (!next[i].username && next[i].status === "idle") {
          next[i] = { ...next[i], ticket: tickets[ti++], status: "pending" };
        }
      }
      // add remaining as new rows
      while (ti < tickets.length) {
        next.push({
          id: crypto.randomUUID(),
          username: "",
          ticket: tickets[ti++],
          bonus: "",
          status: "pending",
        });
      }
      return next;
    });
    setPasteValue("");
    toast.success(`${tickets.length} tiket ditambahkan`);
  };

  const processRow = (row: InputRow) => {
    if (!row.username.trim()) return toast.error("Username wajib diisi");
    if (!row.ticket.trim() || row.ticket.length < 9) return toast.error("Tiket minimal 9 karakter");
    const bonusNum = Number(row.bonus.replace(/[^\d]/g, ""));
    if (!bonusNum || bonusNum <= 0) return toast.error("Nominal bonus tidak valid");

    const now = new Date();
    const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const complete: CompleteRow = {
      id: row.id,
      date: now.toLocaleDateString("id-ID"),
      iso_date: iso,
      time: now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      username: row.username,
      ticket: row.ticket,
      bonus: bonusNum,
      status: "complete",
    };
    setCompleteRows((prev) => [complete, ...prev]);
    setInputRows((rows) => rows.filter((r) => r.id !== row.id));
    toast.success(`Bonus untuk ${row.username} berhasil diproses`);
  };

  const { effFrom, effTo } = useMemo(() => {
    const r = resolveDateRange(dateRange);
    return { effFrom: r.from, effTo: r.to };
  }, [dateRange]);

  const filteredComplete = useMemo(() => {
    const q = search.trim().toLowerCase();
    return completeRows.filter((r) => {
      if (effFrom && r.iso_date < effFrom) return false;
      if (effTo && r.iso_date > effTo) return false;
      if (!q) return true;
      return r.username.toLowerCase().includes(q) || r.ticket.toLowerCase().includes(q);
    });
  }, [completeRows, search, effFrom, effTo]);

  const totalPages = Math.max(1, Math.ceil(filteredComplete.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedComplete = filteredComplete.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const totalMember = new Set(completeRows.map((r) => r.username)).size;
  const totalBonus = completeRows.reduce((s, r) => s + r.bonus, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-amber-500/20 to-primary/20 ring-1 ring-amber-500/30">
          <Sparkles className="size-6 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Lucky Spin</h1>
          <p className="text-sm text-muted-foreground">
            Data kiri = input baru • Data kanan = sudah Complete
          </p>
        </div>
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* ================= INPUT DATA ================= */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel soft-shadow rounded-2xl border border-border/60 bg-card/60 backdrop-blur"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
            <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">INPUT DATA</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Textarea
                  value={pasteValue}
                  onChange={(e) => setPasteValue(e.target.value)}
                  placeholder="Ketik/paste tiket... (min 9 karakter, pisahkan dengan spasi/baris)"
                  className="h-10 min-h-10 w-64 resize-none rounded-lg border-border/60 bg-background/60 py-2 pr-14 text-sm"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {parseTickets(pasteValue).length}/{MAX_INPUT_TICKETS}
                </span>
              </div>
              <Button onClick={handleAddFromPaste} size="sm" className="gap-1.5">
                <Plus className="size-4" />
                Tambah
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 text-left">Username</th>
                  <th className="px-3 py-3 text-left">Tiket</th>
                  <th className="px-3 py-3 text-left">Inject Bonus</th>
                  <th className="px-3 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {inputRows.map((row) => (
                  <tr key={row.id} className="border-b border-border/40 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-5 py-2.5">
                      <Input
                        value={row.username}
                        onChange={(e) => updateRow(row.id, { username: e.target.value })}
                        placeholder="username"
                        className="h-9 bg-background/40"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="font-mono text-xs tracking-wider text-foreground/90">
                        {row.ticket}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <Input
                        value={row.bonus}
                        onChange={(e) =>
                          updateRow(row.id, { bonus: e.target.value.replace(/[^\d.,]/g, "") })
                        }
                        placeholder="Nominal, Enter untuk simpan"
                        className="h-9 bg-background/40"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") processRow(row);
                        }}
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusPill status={row.status} />
                    </td>
                    <td className="px-5 py-2.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                          onClick={() => processRow(row)}
                          title="Proses"
                        >
                          <Check className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 text-destructive hover:bg-destructive/10"
                          onClick={() => deleteRow(row.id)}
                          title="Hapus"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-border/60 px-5 py-3 text-xs text-muted-foreground">
            <span>
              {filledCount} terisi dari {inputRows.length} baris
            </span>
            <Button size="sm" variant="ghost" onClick={addRow} className="h-7 gap-1 text-xs">
              <Plus className="size-3.5" />
              Baris baru
            </Button>
          </div>
        </motion.section>

        {/* ================= DATA COMPLETE ================= */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-panel soft-shadow rounded-2xl border border-border/60 bg-card/60 backdrop-blur"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
            <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">DATA COMPLETE</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Cari username / tiket..."
                  className="h-9 w-56 bg-background/60 pl-9"
                />
              </div>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as typeof period)}
                className="h-9 rounded-md border border-border/60 bg-background/60 px-3 text-sm"
              >
                <option value="today">Today</option>
                <option value="7d">7 hari</option>
                <option value="30d">30 hari</option>
                <option value="all">Semua</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-2">
            <StatCard
              label="Total Member Claim"
              value={`${totalMember}`}
              suffix="member"
              accent="from-sky-500/15 to-sky-500/5 ring-sky-500/20 text-sky-300"
            />
            <StatCard
              label="Total Claim Bonus"
              value={`Rp ${totalBonus.toLocaleString("id-ID")}`}
              accent="from-emerald-500/15 to-emerald-500/5 ring-emerald-500/20 text-emerald-300"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-border/60 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 text-left">Tanggal</th>
                  <th className="px-3 py-3 text-left">Jam</th>
                  <th className="px-3 py-3 text-left">Username</th>
                  <th className="px-3 py-3 text-left">Tiket</th>
                  <th className="px-3 py-3 text-left">Inject Bonus</th>
                  <th className="px-3 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pagedComplete.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-sm text-muted-foreground">
                      <Calendar className="mx-auto mb-2 size-5 opacity-50" />
                      Belum ada data complete untuk periode ini
                    </td>
                  </tr>
                ) : (
                  pagedComplete.map((r) => (
                    <tr key={r.id} className="border-b border-border/40 last:border-0 hover:bg-white/[0.02]">
                      <td className="px-5 py-3 text-muted-foreground">{r.date}</td>
                      <td className="px-3 py-3 text-muted-foreground">{r.time}</td>
                      <td className="px-3 py-3 font-medium">{r.username}</td>
                      <td className="px-3 py-3 font-mono text-xs">{r.ticket}</td>
                      <td className="px-3 py-3 text-emerald-300">
                        Rp {r.bonus.toLocaleString("id-ID")}
                      </td>
                      <td className="px-3 py-3">
                        <StatusPill status="complete" />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 text-destructive hover:bg-destructive/10"
                          onClick={() =>
                            setCompleteRows((rows) => rows.filter((x) => x.id !== r.id))
                          }
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 px-5 py-3 text-xs text-muted-foreground">
            <span>
              Showing {filteredComplete.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1} to{" "}
              {Math.min(currentPage * PAGE_SIZE, filteredComplete.length)} of{" "}
              {filteredComplete.length} entries
            </span>
            <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
          </div>
        </motion.section>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: InputRow["status"] }) {
  const map = {
    pending: { label: "Pending", cls: "bg-amber-500/15 text-amber-300 ring-amber-500/30" },
    complete: { label: "Complete", cls: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30" },
    idle: { label: "Belum Digunakan", cls: "bg-white/5 text-muted-foreground ring-border/60" },
  } as const;
  const s = map[status];
  return (
    <Badge className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium ring-1", s.cls)} variant="secondary">
      {s.label}
    </Badge>
  );
}

function StatCard({
  label,
  value,
  suffix,
  accent,
}: {
  label: string;
  value: string;
  suffix?: string;
  accent: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl bg-gradient-to-br p-4 ring-1",
        accent,
      )}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-foreground">{value}</span>
        {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  const pages = useMemo(() => {
    const arr: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + 4);
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  }, [page, totalPages]);

  return (
    <div className="flex items-center gap-1">
      <Button
        size="icon"
        variant="ghost"
        className="size-7"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft className="size-4" />
      </Button>
      {pages.map((p) => (
        <Button
          key={p}
          size="sm"
          variant={p === page ? "default" : "ghost"}
          className={cn("h-7 min-w-7 px-2 text-xs", p === page && "bg-primary text-primary-foreground")}
          onClick={() => onChange(p)}
        >
          {p}
        </Button>
      ))}
      <Button
        size="icon"
        variant="ghost"
        className="size-7"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
