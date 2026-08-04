/**
 * 카테고리 3단 트리 조회.
 *
 * 설정 › 카테고리 관리(`/settings/categories`)가 쓰는 유일한 읽기 경로다.
 *
 * 🔴 **P3의 지출 빠른입력은 이 함수를 재사용하지 않는다.** 그쪽이 필요한 것은 트리가 아니라
 * 평평한 선택지 목록(`{ categoryId, minorName, midName, majorKey }[]` + `is_archived = false`)이라
 * 모양이 다르다. 필요해지면 이 파일에 두 번째 선택자를 **추가**한다 — 화면마다 자기 쿼리를
 * 짜기 시작하면 보관 필터를 한 곳에서 빠뜨린다 (→ D-010의 데이터 경계).
 */

import { cache } from "react";

import type { CategoryLevel, MajorKey } from "@/lib/domain";
import { MAJORS } from "@/lib/domain";

import { isSupabaseConfigured } from "./env";
import { createClient } from "./server";

export type MinorCategory = {
  id: string;
  name: string;
  sortOrder: number;
  isArchived: boolean;
};

export type MidCategory = MinorCategory & {
  minors: MinorCategory[];
};

export type MajorCategory = {
  id: string;
  /** 이름과 무관한 고정 키. 색·집계가 여기 묶인다 — 이름을 바꿔도 이 값은 불변이다 (→ D-027). */
  majorKey: MajorKey;
  name: string;
  mids: MidCategory[];
};

export type CategoryTreeResult =
  /** `majors`는 언제나 길이 4다 — 하나라도 못 찾으면 `unavailable`로 간다(아래 주석). */
  | { status: "ok"; majors: MajorCategory[] }
  /**
   * `reason`을 나누는 이유는 문구가 갈리기 때문이다 — `unconfigured`는 로컬 클론이 목업만으로
   * 화면을 보는 정상 상태이고, `error`는 사용자가 다시 시도해야 하는 실패다.
   * `getSpaceContext()`의 `unavailable`과 같은 모양으로 맞췄다 (`space.ts:67-71`).
   */
  | { status: "unavailable"; reason: "unconfigured" | "error" };

type CategoryRow = {
  id: string;
  level: string;
  parent_id: string | null;
  name: string;
  major_key: string | null;
  sort_order: number;
  is_archived: boolean;
};

function toLevel(value: string): CategoryLevel | null {
  return value === "major" || value === "mid" || value === "minor" ? value : null;
}

/**
 * 형제 정렬 — **읽기와 순서변경 액션이 반드시 이 함수를 같이 쓴다.**
 * 다른 비교자를 쓰면 ↑ 버튼이 화면에서 보이는 위치가 아닌 곳으로 항목을 옮긴다.
 *
 * 1. **보관된 항목은 언제나 그룹 맨 뒤.** 활성 행 사이에 보관 행이 끼면, "보관 항목 표시"를
 *    끈 상태에서 ↓를 눌렀을 때 숨은 행과 자리를 바꿔 **화면상 아무 일도 일어나지 않는다.**
 *    꼬리로 몰아두면 보이는 집합이 언제나 접두사라 액션이 토글 상태를 알 필요조차 없다.
 * 2. `sort_order` — 0002의 인덱스는 **비-UNIQUE**라 동률이 가능하다. 시드는 부모 안에서
 *    1부터 유일하게 매기지만(0003) 그것을 보장하는 제약이 DB에 없다.
 * 3. 이름 → id 타이브레이크. `id`까지 내려가면 **두 사람의 화면이 반드시 같은 순서**가 된다.
 */
export function compareSiblings(
  a: { sortOrder: number; name: string; id: string; isArchived: boolean },
  b: { sortOrder: number; name: string; id: string; isArchived: boolean },
): number {
  if (a.isArchived !== b.isArchived) return a.isArchived ? 1 : -1;
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  return a.name.localeCompare(b.name, "ko") || a.id.localeCompare(b.id);
}

function toNode(row: CategoryRow): MinorCategory {
  return {
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order,
    isArchived: row.is_archived,
  };
}

/**
 * 트리 전체를 한 번의 `select`로 읽는다.
 *
 * 계층별 3쿼리로 나누지 않는 이유는 `space.ts`와 반대다 — 거기서는 멤버가 안 와도 예식일은
 * 보여줄 수 있어서 병렬로 나눴지만, 여기서는 중분류가 없으면 **그릴 것이 없다.**
 * 부분 실패에 의미가 없으므로 나눌 이유도 없다. 행 수는 시드 기준 40행이다.
 *
 * **`is_archived`로 거르지 않는다** — 화면 상단의 "보관 항목 표시" 토글이 클라이언트에서
 * 걸러야 서버 왕복 없이 켜고 끌 수 있고, 꺼진 상태에서도 "보관 3개" 같은 개수를 셀 수 있다.
 */
export const getCategoryTree = cache(async (): Promise<CategoryTreeResult> => {
  if (!isSupabaseConfigured) return { status: "unavailable", reason: "unconfigured" };

  const supabase = await createClient();
  // RLS가 이미 내 스페이스로 좁힌다 — couple_id를 조건에 넣지 않는다.
  const { data, error } = await supabase
    .from("categories")
    .select("id, level, parent_id, name, major_key, sort_order, is_archived");

  if (error || !data) return { status: "unavailable", reason: "error" };

  const midsByParent = new Map<string, MidCategory[]>();
  const minorsByParent = new Map<string, MinorCategory[]>();
  const majorRows = new Map<string, CategoryRow>();

  for (const row of data as CategoryRow[]) {
    const level = toLevel(row.level);
    // 3종 밖의 값은 어디에 놓을지 알 수 없다. 행 하나 때문에 화면 전체를 막지는 않는다.
    if (!level) continue;

    if (level === "major") {
      // major_key는 CHECK가 NOT NULL을 강제하지만 생성 타입은 nullable이다.
      if (row.major_key) majorRows.set(row.major_key, row);
      continue;
    }

    // parent_id는 `(level='major') = (parent_id is null)` CHECK가 강제한다.
    if (!row.parent_id) continue;

    if (level === "mid") {
      const siblings = midsByParent.get(row.parent_id) ?? [];
      siblings.push({ ...toNode(row), minors: [] });
      midsByParent.set(row.parent_id, siblings);
    } else {
      const siblings = minorsByParent.get(row.parent_id) ?? [];
      siblings.push(toNode(row));
      minorsByParent.set(row.parent_id, siblings);
    }
  }

  const majors: MajorCategory[] = [];

  /*
   * 🔴 대분류는 `sort_order`가 아니라 `MAJORS` 순서로 놓는다.
   *
   * 대분류에는 순서변경 UI가 없지만(→ D-027) `sort_order` 컬럼 자체는 여전히 쓰기 가능하다.
   * DB 값을 따르면 이 화면만 예산·결산(`MAJORS` 인덱스를 쓰는 곳)과 순서가 갈릴 수 있다.
   * `MAJORS`를 훑는 방식이라 "4개가 다 있는가" 검사도 공짜로 딸려온다.
   */
  for (const major of MAJORS) {
    const row = majorRows.get(major.key);
    /*
     * 대분류 하나가 안 잡히면 그 밑 중·소분류가 통째로 화면에서 사라진다.
     * 사용자는 "삭제됐다"고 읽고 다시 만들려 하는데, 실제로는 살아 있어서 예산·결산에는
     * 그대로 잡힌다 — 조회 실패가 유령 데이터를 만드는 경로다. `invite.ts:59`와 같은 판단이라
     * "없음"이 아니라 "못 읽음"으로 돌린다.
     */
    if (!row) return { status: "unavailable", reason: "error" };

    const mids = (midsByParent.get(row.id) ?? []).sort(compareSiblings);
    for (const mid of mids) {
      mid.minors = (minorsByParent.get(mid.id) ?? []).sort(compareSiblings);
    }

    majors.push({
      id: row.id,
      majorKey: major.key,
      // 표시는 DB의 `name`이다 — 사용자가 바꾼 이름이 `MAJOR_LABEL`(시드 사본)을 이긴다.
      name: row.name,
      mids,
    });
  }

  return { status: "ok", majors };
});
