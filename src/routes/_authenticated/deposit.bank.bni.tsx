import { createFileRoute } from "@tanstack/react-router";
import { DepositPage } from "@/components/deposit/DepositPage";

export const Route = createFileRoute("/_authenticated/deposit/bank/bni")({
  head: () => ({ meta: [{ title: "Deposit BNI — Admin Console" }] }),
  component: () => (
    <DepositPage
      config={{
        channel: "BNI",
        kind: "bank",
        logoText: "BN",
        accentClass: "bg-gradient-to-br from-orange-500 to-red-700",
        accounts: [
          { id: "1", holder: "LINDA PERMATA", label: "BNI", number: "0287-6543-21", balance: 3_240_000, openingBalance: 400_000 },
        ],
      }}
    />
  ),
});
