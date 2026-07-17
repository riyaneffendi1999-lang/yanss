import { createFileRoute } from "@tanstack/react-router";
import { DepositPage } from "@/components/deposit/DepositPage";

export const Route = createFileRoute("/_authenticated/deposit/emoney/dana")({
  head: () => ({ meta: [{ title: "Deposit DANA — Admin Console" }] }),
  component: () => (
    <DepositPage
      config={{
        channel: "DANA",
        kind: "emoney",
        logoText: "DN",
        accentClass: "bg-gradient-to-br from-sky-500 to-blue-700",
        accounts: [
          { id: "1", holder: "VICKY AJI DWI PENGESTU", label: "DANA", number: "0878-3413-6568", balance: 957000, openingBalance: 44875 },
          { id: "2", holder: "RIYAN ANUGRAH", label: "DANA", number: "0812-9911-2233", balance: 1_240_000, openingBalance: 180_000 },
        ],
      }}
    />
  ),
});
