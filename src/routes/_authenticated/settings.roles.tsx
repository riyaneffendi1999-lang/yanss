import { Fragment, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Shield, Save, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshButton } from "@/components/common/RefreshButton";

export const Route = createFileRoute("/_authenticated/settings/roles")({
  head: () => ({ meta: [{ title: "Role & Akses — Admin Console" }] }),
  component: RolesPage,
});

type RoleKey = "head" | "supervisor" | "ast_spv" | "staff";
type Page = { key: string; label: string; group: string };

const roles: { key: RoleKey; label: string; tone: string; desc: string }[] = [
  { key: "head", label: "Head", tone: "bg-red-500/10 text-red-600 dark:text-red-300 border-red-500/20", desc: "Akses semua halaman" },
  { key: "supervisor", label: "Supervisor", tone: "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/20", desc: "Kelola tim & approval" },
  { key: "ast_spv", label: "Ast. Spv", tone: "bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/20", desc: "Bantu supervisor" },
  { key: "staff", label: "Staff", tone: "bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20", desc: "Operasional harian" },
];

const pages: Page[] = [
  { group: "Utama", key: "/dashboard", label: "Dashboard" },
  { group: "Deposit Bank", key: "/deposit/bank/bca", label: "BCA" },
  { group: "Deposit Bank", key: "/deposit/bank/bni", label: "BNI" },
  { group: "Deposit Bank", key: "/deposit/bank/bri", label: "BRI" },
  { group: "Deposit Bank", key: "/deposit/bank/mandiri", label: "MANDIRI" },
  { group: "Deposit E-money", key: "/deposit/emoney/dana", label: "DANA" },
  { group: "Deposit E-money", key: "/deposit/emoney/ovo", label: "OVO" },
  { group: "Deposit E-money", key: "/deposit/emoney/gopay", label: "GOPAY" },
  { group: "Deposit E-money", key: "/deposit/emoney/linkaja", label: "LINKAJA" },
  { group: "Deposit Pulsa", key: "/deposit/pulsa/telkomsel", label: "TELKOMSEL" },
  { group: "Deposit Pulsa", key: "/deposit/pulsa/xl", label: "XL" },
  { group: "Bonus Adjustment", key: "/bonus/lucky-spin", label: "Lucky Spin" },
  { group: "Bonus Adjustment", key: "/bonus/kamis-ceria", label: "Kamis Ceria" },
  { group: "Bonus Adjustment", key: "/bonus/gebyar-turnover", label: "Gebyar Turnover" },
  { group: "Settings", key: "/settings/admin", label: "Manage Admin" },
  { group: "Settings", key: "/settings/bank", label: "Manage Bank" },
  { group: "Settings", key: "/settings/roles", label: "Role & Akses" },
  { group: "Akun", key: "/profile", label: "Profile" },
];

const allKeys = pages.map((p) => p.key);
const depositKeys = pages.filter((p) => p.group.startsWith("Deposit")).map((p) => p.key);
const bonusKeys = pages.filter((p) => p.group === "Bonus Adjustment").map((p) => p.key);

const defaults: Record<RoleKey, string[]> = {
  head: allKeys,
  supervisor: allKeys.filter((k) => k !== "/settings/roles" && k !== "/settings/admin"),
  ast_spv: ["/dashboard", ...depositKeys, ...bonusKeys, "/settings/bank", "/profile"],
  staff: ["/dashboard", ...depositKeys, ...bonusKeys, "/profile"],
};

function RolesPage() {
  const qc = useQueryClient();

  const { data: dbAccess, isLoading } = useQuery<Record<string, string[]>>({
    queryKey: ["role-page-access"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_page_access" as never)
        .select("role,page_key");
      if (error) throw error;
      const map: Record<string, string[]> = {};
      ((data ?? []) as unknown as { role: string; page_key: string }[]).forEach((r) => {
        (map[r.role] ??= []).push(r.page_key);
      });
      return map;
    },
  });

  const [matrix, setMatrix] = useState<Record<RoleKey, Set<string>>>(() => ({
    head: new Set(defaults.head),
    supervisor: new Set(defaults.supervisor),
    ast_spv: new Set(defaults.ast_spv),
    staff: new Set(defaults.staff),
  }));

  useEffect(() => {
    if (!dbAccess) return;
    setMatrix({
      head: new Set(dbAccess.head ?? defaults.head),
      supervisor: new Set(dbAccess.supervisor ?? defaults.supervisor),
      ast_spv: new Set(dbAccess.ast_spv ?? defaults.ast_spv),
      staff: new Set(dbAccess.staff ?? defaults.staff),
    });
  }, [dbAccess]);

  const grouped = useMemo(() => {
    const g: Record<string, Page[]> = {};
    pages.forEach((p) => { (g[p.group] ??= []).push(p); });
    return g;
  }, []);

  function toggle(role: RoleKey, key: string, checked: boolean) {
    if (role === "head") { toast.info("Head selalu memiliki akses penuh"); return; }
    setMatrix((prev) => {
      const next = { ...prev, [role]: new Set(prev[role]) };
      if (checked) next[role].add(key); else next[role].delete(key);
      return next;
    });
  }

  function toggleGroup(role: RoleKey, groupPages: Page[], checked: boolean) {
    if (role === "head") { toast.info("Head selalu memiliki akses penuh"); return; }
    setMatrix((prev) => {
      const next = { ...prev, [role]: new Set(prev[role]) };
      groupPages.forEach((p) => { if (checked) next[role].add(p.key); else next[role].delete(p.key); });
      return next;
    });
  }

  function reset() {
    setMatrix({
      head: new Set(defaults.head),
      supervisor: new Set(defaults.supervisor),
      ast_spv: new Set(defaults.ast_spv),
      staff: new Set(defaults.staff),
    });
    toast.success("Matriks di-reset ke default (belum disimpan)");
  }

  const saveMut = useMutation({
    mutationFn: async () => {
      const rolesToSave: RoleKey[] = ["head", "supervisor", "ast_spv", "staff"];
      // Delete existing for these roles
      const { error: delErr } = await supabase
        .from("role_page_access" as never)
        .delete()
        .in("role", rolesToSave as unknown as string[]);
      if (delErr) throw delErr;
      const rows: { role: RoleKey; page_key: string }[] = [];
      rolesToSave.forEach((r) => {
        matrix[r].forEach((k) => rows.push({ role: r, page_key: k }));
      });
      if (rows.length === 0) return;
      const { error: insErr } = await supabase
        .from("role_page_access" as never)
        .insert(rows as never);
      if (insErr) throw insErr;
    },
    onSuccess: async () => {
      toast.success("Akses halaman berhasil disimpan");
      await qc.invalidateQueries({ queryKey: ["role-page-access"] });
    },
    onError: (e: Error) => toast.error(e.message || "Gagal menyimpan"),
  });

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Shield className="h-6 w-6 text-primary" /> Role & Akses
          </h1>
          <p className="text-sm text-muted-foreground">
            Atur halaman sidebar yang dapat diakses tiap role. Perubahan berlaku untuk semua admin dengan role tersebut setelah disimpan.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={reset} disabled={isLoading || saveMut.isPending}>
            <RotateCcw className="mr-2 h-4 w-4" /> Reset Default
          </Button>
          <Button onClick={() => saveMut.mutate()} disabled={isLoading || saveMut.isPending}>
            {saveMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Simpan Perubahan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {roles.map((r) => (
          <Card key={r.key}>
            <CardContent className="p-4">
              <Badge variant="outline" className={r.tone}>{r.label}</Badge>
              <p className="mt-2 text-xs text-muted-foreground">{r.desc}</p>
              <p className="mt-2 text-2xl font-semibold">
                {matrix[r.key].size}
                <span className="ml-1 text-xs text-muted-foreground">/ {pages.length} halaman</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Akses Halaman Sidebar</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[280px]">Halaman</TableHead>
                {roles.map((r) => (
                  <TableHead key={r.key} className="text-center">{r.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(grouped).map(([group, groupPages]) => (
                <Fragment key={group}>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableCell className="py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {group}
                    </TableCell>
                    {roles.map((r) => {
                      const total = groupPages.length;
                      const active = groupPages.filter((p) => matrix[r.key].has(p.key)).length;
                      const all = active === total;
                      return (
                        <TableCell key={r.key} className="text-center">
                          <Checkbox
                            checked={all ? true : active > 0 ? "indeterminate" : false}
                            disabled={r.key === "head"}
                            onCheckedChange={(v) => toggleGroup(r.key, groupPages, Boolean(v))}
                            aria-label={`Toggle grup ${group} untuk ${r.label}`}
                          />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  {groupPages.map((p) => (
                    <TableRow key={p.key}>
                      <TableCell>
                        <div className="font-medium">{p.label}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">{p.key}</div>
                      </TableCell>
                      {roles.map((r) => (
                        <TableCell key={r.key} className="text-center">
                          <Checkbox
                            checked={matrix[r.key].has(p.key)}
                            disabled={r.key === "head"}
                            onCheckedChange={(v) => toggle(r.key, p.key, Boolean(v))}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
