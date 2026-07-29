import { Search } from "lucide-react";

import { AppHeader, HeaderIconLink } from "@/components/layout/app-header";
import { Screen } from "@/components/layout/screen";
import { formatWon } from "@/lib/format";
import { getMockExpenses, resolveFixtureKey } from "@/lib/mock/fixtures";

import { ExpenseLedger } from "./expense-ledger";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const expenses = getMockExpenses(resolveFixtureKey(params.fixture));

  return (
    <Screen
      header={
        <AppHeader
          title="지출"
          subtitle={
            expenses.isEmpty
              ? "아직 기록이 없어요"
              : `총 ${expenses.count}건 · 확정 ${formatWon(expenses.confirmedTotal)}`
          }
          action={
            <HeaderIconLink href="/expenses" label="지출 검색">
              <Search aria-hidden className="size-[21px]" strokeWidth={1.9} />
            </HeaderIconLink>
          }
        />
      }
    >
      <ExpenseLedger groups={expenses.groups} />
    </Screen>
  );
}
