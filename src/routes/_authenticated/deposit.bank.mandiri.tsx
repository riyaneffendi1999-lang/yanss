import { createFileRoute } from "@tanstack/react-router";
import { DepositPage } from "@/components/deposit/DepositPage";

export const Route = createFileRoute("/_authenticated/deposit/bank/mandiri")({
  head: () => ({ meta: [{ title: "Deposit Mandiri — Admin Console" }] }),
  component: () => (
    <DepositPage
      config={{
        channel: "MANDIRI",
        kind: "bank",
        logoText: "MD",
        accentClass: "bg-gradient-to-br from-yellow-500 to-amber-700",
        accounts: [
          { id: "1", holder: "PT SEJAHTERA ABADI", label: "MANDIRI", number: "1400-0123-4567-8", balance: 8_650_000, openingBalance: 1_200_000 },
        ],
      }}
    />
  ),
});
