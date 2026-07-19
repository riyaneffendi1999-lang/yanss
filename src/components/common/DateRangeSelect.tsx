import { useMemo } from "react";
import { Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type DatePreset =
  | "today"
  | "yesterday"
  | "current_week"
  | "current_month"
  | "anothers";

export const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  today: "Today",
  yesterday: "Yesterday",
  current_week: "Current Week",
  current_month: "Current Month",
  anothers: "Anothers",
};

export interface DateRangeValue {
  preset: DatePreset;
  from: string; // yyyy-mm-dd
  to: string;
}

const iso = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};

/** Resolve preset -> {from, to} ISO strings. For "anothers" caller provides from/to. */
export function resolveDateRange(v: DateRangeValue): { from: string; to: string } {
  if (v.preset === "anothers") return { from: v.from, to: v.to };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const t = iso(today);
  if (v.preset === "today") return { from: t, to: t };
  if (v.preset === "yesterday") {
    const y = new Date(today);
    y.setDate(y.getDate() - 1);
    return { from: iso(y), to: iso(y) };
  }
  if (v.preset === "current_week") {
    const day = today.getDay(); // 0=Sun..6=Sat
    const diff = day === 0 ? 6 : day - 1; // Monday as week start
    const start = new Date(today);
    start.setDate(start.getDate() - diff);
    return { from: iso(start), to: t };
  }
  // current_month
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  return { from: iso(start), to: t };
}

interface Props {
  value: DateRangeValue;
  onChange: (v: DateRangeValue) => void;
  className?: string;
}

export function DateRangeSelect({ value, onChange, className }: Props) {
  const showCustom = value.preset === "anothers";
  const resolved = useMemo(() => resolveDateRange(value), [value]);
  return (
    <div className={"flex flex-wrap items-center gap-2 " + (className ?? "")}>
      <Select
        value={value.preset}
        onValueChange={(p) =>
          onChange({
            ...value,
            preset: p as DatePreset,
            from: p === "anothers" ? value.from || resolved.from : value.from,
            to: p === "anothers" ? value.to || resolved.to : value.to,
          })
        }
      >
        <SelectTrigger className="h-9 w-[160px] border-border/60 bg-secondary/40">
          <Calendar className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(DATE_PRESET_LABELS) as DatePreset[]).map((k) => (
            <SelectItem key={k} value={k}>
              {DATE_PRESET_LABELS[k]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {showCustom && (
        <>
          <Input
            type="date"
            value={value.from}
            onChange={(e) => onChange({ ...value, from: e.target.value })}
            className="h-9 w-[150px] bg-secondary/40"
          />
          <span className="text-xs text-muted-foreground">—</span>
          <Input
            type="date"
            value={value.to}
            onChange={(e) => onChange({ ...value, to: e.target.value })}
            className="h-9 w-[150px] bg-secondary/40"
          />
        </>
      )}
    </div>
  );
}
