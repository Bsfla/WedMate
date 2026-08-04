import Link from "next/link";

import { ErrorState } from "@/components/data/error-state";
import { AppHeader } from "@/components/layout/app-header";
import { Screen } from "@/components/layout/screen";
import { Button } from "@/components/ui/button";
import { getCategoryTree } from "@/lib/supabase/categories";

import { CategoryTree } from "./category-tree";
import { CATEGORY_COPY } from "./types";

/**
 * 카테고리 관리 — 대분류 이름 변경 · 중/소분류 추가 · 이름 변경 · 순서 변경 · 보관.
 *
 * 지금까지 카테고리는 `seed_couple_defaults()`가 깔아준 대4/중11/소25가 전부였고
 * **사용자가 손댈 방법이 없었다.** 스몰웨딩이라 폐백이 없어도 뺄 수 없고, 우리 예산에만 있는
 * 소분류를 넣을 수도 없었다. 이 화면이 그 첫 경로다.
 *
 * **삭제는 없다.** `expenses`·`budgets`·`budget_allocations`가 전부 `ON DELETE RESTRICT`라
 * 삭제 버튼은 "누를 때까지 결과를 알 수 없는 버튼"이 된다 — 대분류는 `budget_allocations`가
 * 4행을 물고 있어 **항상** 실패하고, 중분류는 CASCADE가 자식을 지우려다 그 자식이 지출을
 * 물고 있으면 트랜잭션 전체가 실패한다. `is_archived` 단일 경로가 이 스키마의 의도다 (→ D-016).
 *
 * 셸은 `/settings/invite`·`/settings/wedding`이 굳힌 규격 그대로다 (→ D-063).
 */
export default async function CategoriesPage() {
  const result = await getCategoryTree();

  const header = <AppHeader action={null} back="/settings" title={CATEGORY_COPY.title} />;

  /* `getSpaceContext()`를 따로 부르지 않는다 — 레이아웃 가드가 `none`·`anonymous`를 이미
     걸러냈고, 이 화면이 쓰는 값은 트리뿐이다. 스페이스가 없으면 RLS가 0건을 주고
     `getCategoryTree()`가 대분류 4개를 못 찾아 `unavailable`로 떨어진다.

     🔴 빈 트리를 그리지 않는 이유: 대분류 하나가 안 잡혔을 뿐인데 "카테고리가 없어요"를
     그리면 사용자는 삭제됐다고 읽고 다시 만들려 한다. 실제로는 살아 있어서 예산·결산에는
     그대로 잡히므로, 조회 실패가 유령 데이터를 만드는 경로가 된다. */
  if (result.status !== "ok") {
    return (
      <Screen header={header}>
        <ErrorState
          description={
            result.reason === "unconfigured"
              ? CATEGORY_COPY.unconfiguredBody
              : CATEGORY_COPY.loadFailedBody
          }
          secondaryAction={
            <Button asChild size="sm" variant="secondary">
              <Link href="/settings">{CATEGORY_COPY.backToSettings}</Link>
            </Button>
          }
          title={CATEGORY_COPY.loadFailedTitle}
        />
      </Screen>
    );
  }

  return (
    <Screen header={header}>
      <CategoryTree majors={result.majors} />
    </Screen>
  );
}
