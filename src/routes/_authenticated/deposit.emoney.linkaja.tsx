import { createFileRoute } from "@tanstack/react-router";
import { DepositPage } from "@/components/deposit/DepositPage";

export const Route = createFileRoute("/_authenticated/deposit/emoney/linkaja")({
  head: () => ({ meta: [{ title: "Deposit LinkAja — Admin Console" }] }),
  component: () => (
    <DepositPage
      config={{
        channel: "LINKAJA",
        kind: "emoney",
        logoText: "LA",
        accentClass: "bg-gradient-to-br from-rose-500 to-red-700",
        accounts: [
          { id: "1", holder: "NURUL HIDAYAH", label: "LINKAJA", number: "0812-5566-7788", balance: 435_000, openingBalance: 50_000 },
        ],
      }}
    />
  ),
});
