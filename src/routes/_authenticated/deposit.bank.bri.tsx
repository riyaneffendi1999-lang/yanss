import { createFileRoute } from "@tanstack/react-router";
import { DepositPage } from "@/components/deposit/DepositPage";

export const Route = createFileRoute("/_authenticated/deposit/bank/bri")({
  head: () => ({ meta: [{ title: "Deposit BRI — Admin Console" }] }),
  component: () => (
    <DepositPage
      config={{
        channel: "BRI",
        kind: "bank",
        logoText: "BR",
        accentClass: "bg-gradient-to-br from-sky-600 to-blue-800",
        accounts: [
          { id: "1", holder: "ARYA WIJAYA", label: "BRI", number: "3421-01-012345-53-0", balance: 4_120_000, openingBalance: 600_000 },
        ],
      }}
    />
  ),
});
