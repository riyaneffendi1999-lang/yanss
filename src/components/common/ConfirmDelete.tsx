import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ConfirmOptions = {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
};

type Ctx = (opts?: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<Ctx | null>(null);

export function ConfirmDeleteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<ConfirmOptions>({});
  const resolverRef = useRef<((v: boolean) => void) | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  const confirm: Ctx = useCallback((o) => {
    setOpts(o ?? {});
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  useEffect(() => {
    if (open) {
      // Focus confirm button so Enter triggers deletion
      const t = setTimeout(() => confirmBtnRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  const handle = (v: boolean) => {
    setOpen(false);
    resolverRef.current?.(v);
    resolverRef.current = undefined;
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog open={open} onOpenChange={(o) => !o && handle(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{opts.title ?? "Hapus data ini?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {opts.description ??
                "Tindakan ini tidak dapat dibatalkan. Tekan Enter untuk menghapus."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handle(false)}>
              {opts.cancelText ?? "Batal"}
            </AlertDialogCancel>
            <AlertDialogAction
              ref={confirmBtnRef}
              onClick={() => handle(true)}
              className="bg-rose-500 text-white hover:bg-rose-600"
            >
              {opts.confirmText ?? "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirmDelete() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirmDelete must be used within ConfirmDeleteProvider");
  return ctx;
}
