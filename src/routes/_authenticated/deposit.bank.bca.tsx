import { createFileRoute } from "@tanstack/react-router";
import { DepositPage } from "@/components/deposit/DepositPage";

export const Route = createFileRoute("/_authenticated/deposit/bank/bca")({
  head: () => ({ meta: [{ title: "Deposit BCA — Admin Console" }] }),
  component: () => (
    <DepositPage
      config={{
        channel: "BCA",
        kind: "bank",
        logoText: "BC",
        accentClass: "bg-gradient-to-br from-blue-600 to-indigo-800",
        accounts: [
          { id: "1", holder: "PT SEJAHTERA ABADI", label: "BCA", number: "6820-1122-334", balance: 12_500_000, openingBalance: 2_400_000 },
          { id: "2", holder: "RIYAN ANUGRAH", label: "BCA", number: "6820-9988-776", balance: 5_875_000, openingBalance: 500_000 },
        ],
      }}
    />
  ),
});
