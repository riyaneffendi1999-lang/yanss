import { Construction } from "lucide-react";
import { PageHeader } from "./PageHeader";

export function PlaceholderPage({ title, description }: { title: string; description?: string }) {
  return (
    <div>
      <PageHeader title={title} description={description ?? "Modul ini akan dibangun pada batch berikutnya."} />
      <div className="glass-panel soft-shadow flex min-h-[280px] flex-col items-center justify-center rounded-xl p-10 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Construction className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium">Sedang dalam pengembangan</p>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
          Fondasi dashboard sudah siap. Modul <span className="text-foreground">{title}</span> akan diaktifkan pada iterasi berikutnya.
        </p>
      </div>
    </div>
  );
}
