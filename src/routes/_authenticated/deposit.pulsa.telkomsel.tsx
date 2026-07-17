import { createFileRoute } from "@tanstack/react-router";
import { DepositPage } from "@/components/deposit/DepositPage";

export const Route = createFileRoute("/_authenticated/deposit/pulsa/telkomsel")({
  head: () => ({ meta: [{ title: "Deposit Telkomsel — Admin Console" }] }),
  component: () => (
    <DepositPage
      config={{
        channel: "TELKOMSEL",
        kind: "pulsa",
        logoText: "TS",
        accentClass: "bg-gradient-to-br from-red-500 to-rose-700",
        accounts: [
          { id: "1", holder: "ADMIN PULSA", label: "TELKOMSEL", number: "0812-3456-7890", balance: 685_000, openingBalance: 100_000 },
        ],
      }}
    />
  ),
});
