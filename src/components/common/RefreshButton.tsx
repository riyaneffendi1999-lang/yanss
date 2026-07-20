import { useState } from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function RefreshButton({
  queryKeys,
  className,
  label = "Refresh",
}: {
  queryKeys?: QueryKey[];
  className?: string;
  label?: string;
}) {
  const qc = useQueryClient();
  const [spinning, setSpinning] = useState(false);

  const onClick = async () => {
    setSpinning(true);
    try {
      if (queryKeys && queryKeys.length > 0) {
        await Promise.all(queryKeys.map((k) => qc.invalidateQueries({ queryKey: k })));
      } else {
        await qc.invalidateQueries();
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setTimeout(() => setSpinning(false), 400);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={onClick} disabled={spinning} className={cn("h-9 gap-2", className)}>
      <RefreshCcw className={cn("size-4", spinning && "animate-spin")} />
      {label}
    </Button>
  );
}
