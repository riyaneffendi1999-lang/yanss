import { createFileRoute } from "@tanstack/react-router";
import { DepositPage } from "@/components/deposit/DepositPage";

export const Route = createFileRoute("/_authenticated/deposit/emoney/gopay")({
  head: () => ({ meta: [{ title: "Deposit GoPay — Admin Console" }] }),
  component: () => (
    <DepositPage
      config={{
        channel: "GOPAY",
        kind: "emoney",
        logoText: "GP",
        accentClass: "bg-gradient-to-br from-emerald-500 to-teal-700",
        accounts: [
          { id: "1", holder: "MADAN SYAHPUTRA", label: "GOPAY", number: "0822-1122-3344", balance: 1_650_000, openingBalance: 220_000 },
        ],
      }}
    />
  ),
});
