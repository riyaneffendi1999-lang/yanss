import { createFileRoute } from "@tanstack/react-router";
import { DepositPage } from "@/components/deposit/DepositPage";

export const Route = createFileRoute("/_authenticated/deposit/emoney/ovo")({
  head: () => ({ meta: [{ title: "Deposit OVO — Admin Console" }] }),
  component: () => (
    <DepositPage
      config={{
        channel: "OVO",
        kind: "emoney",
        logoText: "OV",
        accentClass: "bg-gradient-to-br from-violet-500 to-purple-700",
        accounts: [
          { id: "1", holder: "LINDA PERMATA", label: "OVO", number: "0821-4455-6677", balance: 2_150_000, openingBalance: 320_000 },
          { id: "2", holder: "ARYA WIJAYA", label: "OVO", number: "0813-7788-9900", balance: 875_000, openingBalance: 100_000 },
        ],
      }}
    />
  ),
});
