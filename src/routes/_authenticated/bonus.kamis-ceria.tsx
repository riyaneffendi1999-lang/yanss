import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DateRangeSelect, type DateRangeValue } from "@/components/common/DateRangeSelect";

export const Route = createFileRoute("/_authenticated/bonus/kamis-ceria")({
  head: () => ({ meta: [{ title: "Kamis Ceria — Admin Console" }] }),
  component: KamisCeriaPage,
});

function KamisCeriaPage() {
  const [dateRange, setDateRange] = useState<DateRangeValue>({ preset: "today", from: "", to: "" });
  return (
    <div>
      <PageHeader
        title="Kamis Ceria"
        description="Bonus adjustment Kamis Ceria"
        actions={<DateRangeSelect value={dateRange} onChange={setDateRange} />}
      />
      <div className="glass-panel soft-shadow rounded-xl p-10 text-center text-sm text-muted-foreground">
        Data Kamis Ceria untuk rentang terpilih akan tampil di sini.
      </div>
    </div>
  );
}
