import { createFileRoute } from "@tanstack/react-router";
import { DepositPage } from "@/components/deposit/DepositPage";

export const Route = createFileRoute("/_authenticated/deposit/pulsa/xl")({
  head: () => ({ meta: [{ title: "Deposit XL — Admin Console" }] }),
  component: () => (
    <DepositPage
      config={{
        channel: "XL",
        kind: "pulsa",
        logoText: "XL",
        accentClass: "bg-gradient-to-br from-cyan-500 to-teal-700",
        accounts: [
          { id: "1", holder: "ADMIN PULSA", label: "XL", number: "0817-1122-3344", balance: 425_000, openingBalance: 75_000 },
        ],
      }}
    />
  ),
});
