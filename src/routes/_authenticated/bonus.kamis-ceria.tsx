import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Users, Wallet, Plus, Search, Trash2, Info } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DateRangeSelect, resolveDateRange, type DateRangeValue } from "@/components/common/DateRangeSelect";
import { supabase } from "@/integrations/supabase/client";
import { useConfirmDelete } from "@/components/common/ConfirmDelete";
import { RefreshButton } from "@/components/common/RefreshButton";

export const Route = createFileRoute("/_authenticated/bonus/kamis-ceria")({
  head: () => ({ meta: [{ title: "Kamis Ceria — Admin Console" }] }),
  component: KamisCeriaPage,
});

type ClaimRow = {
  id: string;
  username: string;
  bonus: number;
  iso_date: string;
  created_at: string;
};

const BONUS_AMOUNT = 50000;
const PAGE_SIZE = 10;
const QK = ["kamis-ceria-claims"] as const;

function KamisCeriaPage() {
  const qc = useQueryClient();
  const confirmDelete = useConfirmDelete();
  const askDelete = async (id: string) => {
    const ok = await confirmDelete({ title: "Hapus klaim ini?", description: "Yakin untuk hapus?." });
    if (ok) delMut.mutate(id);
  };
  const [username, setUsername] = useState("");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRangeValue>({ preset: "today", from: "", to: "" });
  const [page, setPage] = useState(1);

  const { data: rows = [] } = useQuery({
    queryKey: QK,
    queryFn: async (): Promise<ClaimRow[]> => {
      const { data, error } = await supabase
        .from("kamis_ceria_claims")
        .select("id,username,bonus,iso_date,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ClaimRow[];
    },
  });

  const addMut = useMutation({
    mutationFn: async (u: string) => {
      const { data: sess } = await supabase.auth.getUser();
      const { error } = await supabase.from("kamis_ceria_claims").insert({
        username: u,
        bonus: BONUS_AMOUNT,
        created_by: sess.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_d, u) => {
      qc.invalidateQueries({ queryKey: QK });
      toast.success(`Bonus Kamis Ceria untuk ${u} tercatat`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("kamis_ceria_claims").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
    onError: (e: Error) => toast.error(e.message),
  });

  const handleAdd = () => {
    const u = username.trim();
    if (!u) return toast.error("Username wajib diisi");
    addMut.mutate(u);
    setUsername("");
  };

  const { effFrom, effTo } = useMemo(() => {
    const r = resolveDateRange(dateRange);
    return { effFrom: r.from, effTo: r.to };
  }, [dateRange]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (effFrom && r.iso_date < effFrom) return false;
      if (effTo && r.iso_date > effTo) return false;
      if (q && !r.username.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, search, effFrom, effTo]);

  const totalMember = new Set(rows.map((r) => r.username)).size;
  const totalBonus = rows.reduce((s, r) => s + Number(r.bonus), 0);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("id-ID");
  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
        <div className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-sky-500/20 to-primary/20 ring-1 ring-sky-500/30">
          <CalendarDays className="size-6 text-sky-400" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">Kamis Ceria</h1>
          <p className="text-sm text-muted-foreground">Rekap program bonus Kamis Ceria</p>
        </div>
        <RefreshButton queryKeys={[QK]} />
      </motion.div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Users className="size-4" />}
          label="Total Member"
          value={String(totalMember)}
          tone="from-sky-500/15 to-sky-500/0 ring-sky-500/25 text-sky-300"
        />
        <StatCard
          icon={<Wallet className="size-4" />}
          label="Total Inject Bonus"
          value={`Rp ${totalBonus.toLocaleString("id-ID")}`}
          tone="from-emerald-500/15 to-emerald-500/0 ring-emerald-500/25 text-emerald-300"
        />
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-xs text-amber-200/90">
        <Info className="mt-0.5 size-4 shrink-0" />
        <div>
          <b>Syarat Bonus Kamis Ceria:</b> Member dapat melakukan klaim apabila sudah melakukan deposit selama{" "}
          <b>1 minggu</b> dengan minimal akumulasi deposit <b>Rp 1.500.000</b>, ditambah target minimal{" "}
          <b>5 hari aktif deposit</b> dalam seminggu.
        </div>
      </div>

      <div className="glass-panel soft-shadow rounded-2xl border border-border/60 bg-card/60 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2 border-b border-border/60 p-3">
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
            }}
            placeholder="Masukkan username…"
            className="h-9 flex-1 min-w-[240px] bg-secondary/40"
          />
          <Badge className="h-9 rounded-md bg-emerald-500/15 px-3 text-sm text-emerald-300 ring-1 ring-emerald-500/30">
            Rp {BONUS_AMOUNT.toLocaleString("id-ID")}
          </Badge>
          <Button size="sm" className="h-9 gap-1.5" onClick={handleAdd} disabled={addMut.isPending}>
            <Plus className="size-4" /> Tambah
          </Button>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari username…"
              className="h-9 w-[200px] bg-secondary/40 pl-8"
            />
          </div>
          <DateRangeSelect
            value={dateRange}
            onChange={(v) => {
              setDateRange(v);
              setPage(1);
            }}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">Tanggal</th>
                <th className="px-4 py-3 text-left font-medium">Jam</th>
                <th className="px-4 py-3 text-left font-medium">Username</th>
                <th className="px-4 py-3 text-left font-medium">Inject Bonus</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Belum ada data untuk periode ini
                  </td>
                </tr>
              ) : (
                paged.map((r) => (
                  <tr key={r.id} className="border-b border-border/40 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(r.created_at)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{fmtTime(r.created_at)}</td>
                    <td className="px-4 py-3 font-medium">{r.username}</td>
                    <td className="px-4 py-3 text-emerald-300">Rp {Number(r.bonus).toLocaleString("id-ID")}</td>
                    <td className="px-4 py-3">
                      <Badge
                        className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs text-emerald-300 ring-1 ring-emerald-500/30"
                        variant="secondary"
                      >
                        Complete
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 text-destructive hover:bg-destructive/10"
                        onClick={() => askDelete(r.id)}
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

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 px-4 py-3 text-xs text-muted-foreground">
          <span>
            Showing {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1} to{" "}
            {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} entries
          </span>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7"
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
            >
              ‹
            </Button>
            <Button size="sm" className="h-7 min-w-7 bg-primary text-primary-foreground">
              {currentPage}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7"
              disabled={currentPage >= totalPages}
              onClick={() => setPage(currentPage + 1)}
            >
              ›
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: string }) {
  return (
    <div className={cn("rounded-xl bg-gradient-to-br p-4 ring-1", tone)}>
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider opacity-80">
        {icon} {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-foreground">{value}</div>
    </div>
  );
}
