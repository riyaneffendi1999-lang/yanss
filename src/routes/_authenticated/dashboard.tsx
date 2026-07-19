import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowUpRight,
  Banknote,
  CircleDollarSign,
  Clock,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DateRangeSelect, type DateRangeValue } from "@/components/common/DateRangeSelect";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Admin Console" }] }),
  component: DashboardPage,
});

const chartData = Array.from({ length: 14 }).map((_, i) => ({
  day: `D${i + 1}`,
  deposit: 8_500_000 + Math.round(Math.random() * 6_000_000),
  profit: 1_100_000 + Math.round(Math.random() * 900_000),
}));

const latestTx = [
  { id: "TRX-00891", member: "andi_88", bank: "BCA", amount: 1_500_000, status: "Approved" },
  { id: "TRX-00890", member: "rina_92", bank: "DANA", amount: 250_000, status: "Pending" },
  { id: "TRX-00889", member: "budi_z",  bank: "BRI",  amount: 3_200_000, status: "Approved" },
  { id: "TRX-00888", member: "siska",   bank: "OVO",  amount: 100_000,   status: "Rejected" },
  { id: "TRX-00887", member: "hendra",  bank: "MANDIRI", amount: 5_000_000, status: "Approved" },
];

const bankStatus = [
  { name: "BCA",     status: "Online",      balance: 128_500_000 },
  { name: "BNI",     status: "Online",      balance: 74_200_000 },
  { name: "BRI",     status: "Maintenance", balance: 55_900_000 },
  { name: "MANDIRI", status: "Online",      balance: 92_100_000 },
];

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}
function statusBadge(s: string) {
  if (s === "Approved" || s === "Online") return <Badge className="bg-success/15 text-success hover:bg-success/20">{s}</Badge>;
  if (s === "Pending" || s === "Maintenance") return <Badge className="bg-warning/15 text-warning hover:bg-warning/20">{s}</Badge>;
  return <Badge className="bg-destructive/15 text-destructive hover:bg-destructive/20">{s}</Badge>;
}

function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Ringkasan operasional realtime"
        actions={
          <Button size="sm" className="gap-1.5">
            <ArrowUpRight className="h-4 w-4" /> Live Report
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Deposit" value={fmt(148_920_000)} delta="+12.4% vs kemarin" trend="up" icon={CircleDollarSign} index={0} />
        <StatCard label="Today's Profit" value={fmt(18_450_000)}  delta="+4.1%"           trend="up" icon={TrendingUp}       index={1} />
        <StatCard label="Online Users"   value="1,284"            delta="+82 sesi aktif"   trend="up" icon={Users}            index={2} />
        <StatCard label="Pending Deposit" value="27"              delta="Perlu review"     trend="flat" icon={Clock}          index={3} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="glass-panel soft-shadow rounded-xl p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Realtime Deposit vs Profit</h3>
              <p className="text-xs text-muted-foreground">14 hari terakhir</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer>
              <AreaChart data={chartData} margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gDep" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gPro" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-success)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--color-success)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.4} />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false}
                  tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}jt`} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => fmt(v)}
                />
                <Area type="monotone" dataKey="deposit" stroke="var(--color-primary)" fill="url(#gDep)" strokeWidth={2} />
                <Area type="monotone" dataKey="profit"  stroke="var(--color-success)" fill="url(#gPro)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel soft-shadow rounded-xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Bank Status</h3>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </div>
          <ul className="space-y-3">
            {bankStatus.map((b) => (
              <li key={b.name} className="flex items-center justify-between rounded-lg border border-border/70 bg-secondary/50 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium">{b.name}</p>
                  <p className="text-xs text-muted-foreground">{fmt(b.balance)}</p>
                </div>
                {statusBadge(b.status)}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 glass-panel soft-shadow rounded-xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Latest Transactions</h3>
            <p className="text-xs text-muted-foreground">Update realtime</p>
          </div>
          <Button variant="ghost" size="sm">Lihat semua</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border/60">
              <TableHead>ID</TableHead>
              <TableHead>Member</TableHead>
              <TableHead>Bank</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {latestTx.map((t) => (
              <TableRow key={t.id} className="border-border/60">
                <TableCell className="font-mono text-xs">{t.id}</TableCell>
                <TableCell>{t.member}</TableCell>
                <TableCell>{t.bank}</TableCell>
                <TableCell className="text-right font-medium">{fmt(t.amount)}</TableCell>
                <TableCell className="text-right">{statusBadge(t.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
