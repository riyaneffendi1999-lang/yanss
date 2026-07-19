import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DateRangeSelect, type DateRangeValue } from "@/components/common/DateRangeSelect";

export const Route = createFileRoute("/_authenticated/bonus/gebyar-turnover")({
  head: () => ({ meta: [{ title: "Gebyar Turnover — Admin Console" }] }),
  component: GebyarTurnoverPage,
});

function GebyarTurnoverPage() {
  const [dateRange, setDateRange] = useState<DateRangeValue>({ preset: "current_month", from: "", to: "" });
  return (
    <div>
      <PageHeader
        title="Gebyar Turnover"
        description="Bonus adjustment Gebyar Turnover"
        actions={<DateRangeSelect value={dateRange} onChange={setDateRange} />}
      />
      <div className="glass-panel soft-shadow rounded-xl p-10 text-center text-sm text-muted-foreground">
        Data Gebyar Turnover untuk rentang terpilih akan tampil di sini.
      </div>
    </div>
  );
}
