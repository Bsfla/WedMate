"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { MAX_CATEGORY_NAME_LENGTH } from "@/lib/couple-limits";
import { CATEGORY_LEVEL_LABEL, type CategoryLevel } from "@/lib/domain";
import { unexpectedMessage } from "@/lib/rpc-error";
import { compareSiblings } from "@/lib/supabase/categories";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCoupleId } from "@/lib/supabase/space";

import { CATEGORY_COPY, type CategoryActionState } from "./types";

/* ⚠️ 이 파일은 `"use server"`다. **async 함수만** export할 수 있다 — 문구·타입은 `./types`에 있다.
 *
 * RPC를 쓰지 않는다 — `categories`에 `for all` 정책과 4종 GRANT가 이미 있고(`0002`),
 * RLS가 `couple_id = current_couple_id()`로 좁히므로 `.eq("couple_id", …)`도 필요 없다.
 * 그래서 `rpcCode()`도 쓰지 않는다: PostgREST 오류에는 토큰이 없어 항상 null이 나온다.
 * (같은 처방 → `settings/wedding/actions.ts:39-41`)
 */

type SiblingRow = {
  id: string;
  name: string;
  sort_order: number;
  is_archived: boolean;
};

type TargetRow = {
  id: string;
  level: string;
  parent_id: string | null;
  name: string;
  is_archived: boolean;
};

function fieldFail(categoryId: string | undefined, message: string): CategoryActionState {
  return { status: "error", categoryId, field: "name", fieldMessage: message };
}

function alertFail(categoryId: string | undefined, message: string): CategoryActionState {
  return { status: "error", categoryId, alert: message };
}

function toLevel(value: string): CategoryLevel | null {
  return value === "major" || value === "mid" || value === "minor" ? value : null;
}

function levelLabel(level: CategoryLevel): string {
  return CATEGORY_LEVEL_LABEL[level];
}

/**
 * 이름 검증. `maxLength`를 입력에 걸지 않기로 했으므로(붙여넣기가 조용히 잘린다)
 * **여기가 유일한 관문**이다.
 */
function validateName(raw: FormDataEntryValue | null): { name: string } | { message: string } {
  const name = String(raw ?? "").trim();
  if (!name) return { message: CATEGORY_COPY.nameEmpty };
  // 코드 포인트로 센다 — 이모지 한 글자가 `.length` 2로 잡혀 19자에서 걸리는 일을 막는다.
  const length = [...name].length;
  if (length > MAX_CATEGORY_NAME_LENGTH) {
    return { message: CATEGORY_COPY.nameTooLong(length) };
  }
  return { name };
}

/** 세션이 끊긴 것이라 이 화면에서 사용자가 할 수 있는 일이 없다. 문구를 띄우지 않는다. */
async function requireClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return supabase;
}

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * 같은 부모 아래 형제를 읽는다. **대분류는 `parent_id`가 NULL**이라 `.eq`가 아니라 `.is`다.
 * `.eq("parent_id", null)`은 PostgREST에서 0건을 돌려주므로 조용히 중복 검사를 무력화한다.
 */
async function readSiblings(supabase: Supabase, parentId: string | null) {
  const query = supabase.from("categories").select("id, name, sort_order, is_archived");
  return parentId === null ? query.is("parent_id", null) : query.eq("parent_id", parentId);
}

/**
 * 형제 이름 중복 검사.
 *
 * 🔴 **보관된 형제까지 포함해 막는다.** 보관은 삭제가 아니라서, 중복을 허용하면 나중에
 * 꺼내는 순간 같은 이름 둘이 생긴다. 스키마에 UNIQUE가 없으므로(`0002:30`은 비-UNIQUE 인덱스)
 * 이 검사가 유일한 방어다. 동시 삽입 경합은 남지만 **이름 변경으로 고칠 수 있는 상태**라
 * 부분 UNIQUE 인덱스까지 가지 않는다.
 */
function hasDuplicate(siblings: SiblingRow[], name: string, exceptId?: string): boolean {
  const target = name.normalize("NFC");
  return siblings.some(
    (row) => row.id !== exceptId && row.name.trim().normalize("NFC") === target,
  );
}

async function readTarget(
  supabase: Supabase,
  categoryId: string,
): Promise<TargetRow | null> {
  const { data } = await supabase
    .from("categories")
    .select("id, level, parent_id, name, is_archived")
    .eq("id", categoryId)
    .maybeSingle();
  return data ?? null;
}

/* ──────────────────────────────────────────────────────────────── 추가 */

/**
 * 중/소분류 추가. 대분류는 만들 수 없다 — `unique(couple_id, major_key)`에 쓸 다섯 번째 키가
 * 없어서 DB가 막고, 색·집계가 4키에 묶여 있다 (→ D-027).
 */
export async function createCategoryAction(
  _prev: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const level = toLevel(String(formData.get("level") ?? ""));
  const parentId = String(formData.get("parentId") ?? "").trim();

  if ((level !== "mid" && level !== "minor") || !parentId) {
    return alertFail(undefined, CATEGORY_COPY.saveFailed);
  }

  const checked = validateName(formData.get("name"));
  if ("message" in checked) return fieldFail(undefined, checked.message);

  const supabase = await requireClient();
  const coupleId = await getCurrentCoupleId();
  if (!coupleId) return alertFail(undefined, CATEGORY_COPY.notFound);

  // 부모가 실제로 한 단계 위인지 확인한다. FormData는 위조되고, DB의 CHECK는
  // `(level='major') = (parent_id is null)`까지만 보므로 소분류를 대분류에 매다는 것을 막지 못한다.
  const parent = await readTarget(supabase, parentId);
  const expectedParentLevel = level === "mid" ? "major" : "mid";
  if (!parent || parent.level !== expectedParentLevel) {
    return alertFail(undefined, CATEGORY_COPY.notFound);
  }

  const { data: siblings, error: siblingError } = await readSiblings(supabase, parentId);
  if (siblingError) return alertFail(undefined, CATEGORY_COPY.saveFailed);

  const rows = (siblings ?? []) as SiblingRow[];
  if (hasDuplicate(rows, checked.name)) {
    return fieldFail(undefined, CATEGORY_COPY.nameDuplicate(levelLabel(level)));
  }

  // 형제 중 최대값 + 1. 새 항목은 언제나 활성이라 꼬리(보관 구역) 앞에 놓이는 것이 맞고,
  // 그 위치는 `compareSiblings`가 보관 여부를 먼저 보기 때문에 저절로 지켜진다.
  const nextSort = rows.reduce((max, row) => Math.max(max, row.sort_order), 0) + 1;

  const { data, error } = await supabase
    .from("categories")
    .insert({
      couple_id: coupleId,
      level,
      parent_id: parentId,
      name: checked.name,
      sort_order: nextSort,
    })
    .select("id");

  if (error) {
    // 23514 = CHECK 위반. 공백만인 이름은 위에서 걸리므로 위조된 제출만 여기 온다.
    if (error.code === "23514") {
      return fieldFail(undefined, CATEGORY_COPY.nameEmpty);
    }
    return alertFail(undefined, unexpectedMessage("분류를 추가하지", error.code || error.message));
  }
  if (!data || data.length === 0) return alertFail(undefined, CATEGORY_COPY.notFound);

  revalidatePath("/", "layout");
  return { status: "done" };
}

/* ──────────────────────────────────────────────────────────── 이름 변경 */

/** 대·중·소 공용. `major_key`는 payload에 넣지 않는다 — 이름이 바뀌어도 키는 불변이다 (→ D-027). */
export async function renameCategoryAction(
  _prev: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  if (!categoryId) return alertFail(undefined, CATEGORY_COPY.saveFailed);

  const checked = validateName(formData.get("name"));
  if ("message" in checked) return fieldFail(categoryId, checked.message);

  const supabase = await requireClient();
  const target = await readTarget(supabase, categoryId);
  if (!target) return alertFail(categoryId, CATEGORY_COPY.notFound);

  const level = toLevel(target.level);
  if (!level) return alertFail(categoryId, CATEGORY_COPY.saveFailed);

  const { data: siblings, error: siblingError } = await readSiblings(supabase, target.parent_id);
  if (siblingError) return alertFail(categoryId, CATEGORY_COPY.saveFailed);

  if (hasDuplicate((siblings ?? []) as SiblingRow[], checked.name, categoryId)) {
    return fieldFail(categoryId, CATEGORY_COPY.nameDuplicate(levelLabel(level)));
  }

  const { data, error } = await supabase
    .from("categories")
    .update({ name: checked.name })
    .eq("id", categoryId)
    .select("id");

  if (error) {
    if (error.code === "23514") return fieldFail(categoryId, CATEGORY_COPY.nameEmpty);
    return alertFail(
      categoryId,
      unexpectedMessage("이름을 바꾸지", error.code || error.message),
    );
  }
  if (!data || data.length === 0) return alertFail(categoryId, CATEGORY_COPY.notFound);

  revalidatePath("/", "layout");
  return { status: "done", categoryId };
}

/* ──────────────────────────────────────────────────────────── 순서 변경 */

/**
 * 형제 안에서 한 칸 이동.
 *
 * 🔴 **두 행의 `sort_order`를 맞바꾸지 않는다.** `0002:30`의 인덱스가 비-UNIQUE라 형제 둘이
 * 같은 값을 가질 수 있고, 그때 swap은 **무동작**이 된다 — 사용자는 ↑를 눌러도 아무 일도
 * 일어나지 않는 화면을 본다. 대신 **형제 전체를 1..N으로 다시 매긴다.** 재번호는 그 자체가
 * 복구 동작이라, 중복·구멍·이전 부분 실패가 다음 한 번의 조작으로 저절로 정상화된다.
 *
 * 정렬은 반드시 `compareSiblings`(읽기 경로와 **같은 함수**)를 쓴다. 다른 비교자를 쓰면
 * 화살표가 눈에 보인 곳이 아닌 데로 항목을 옮긴다.
 *
 * 트랜잭션이 없어 부분 실패가 남을 수 있다. 그래도 실패 시에도 `revalidatePath`를 부른다 —
 * 화면이 DB의 실제 상태를 보여줘야 다음 조작이 복구가 된다.
 */
export async function moveCategoryAction(
  _prev: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const direction = String(formData.get("direction") ?? "");
  if (!categoryId || (direction !== "up" && direction !== "down")) {
    return alertFail(categoryId || undefined, CATEGORY_COPY.reorderFailed);
  }

  const supabase = await requireClient();
  // parent_id·level의 출처는 **DB지 FormData가 아니다.** 위조된 parentId를 믿으면
  // 남의 그룹을 재번호할 수 있다(RLS가 커플은 막지만 그룹은 안 막는다).
  const target = await readTarget(supabase, categoryId);
  if (!target) return alertFail(categoryId, CATEGORY_COPY.notFound);

  // 대분류는 순서변경 UI가 없다 — 표시 순서가 `MAJORS` 고정이라 옮겨도 화면이 안 바뀐다.
  if (target.level === "major" || target.is_archived) {
    return alertFail(categoryId, CATEGORY_COPY.reorderFailed);
  }

  const { data: siblings, error: siblingError } = await readSiblings(supabase, target.parent_id);
  if (siblingError || !siblings) return alertFail(categoryId, CATEGORY_COPY.reorderFailed);

  const sorted = (siblings as SiblingRow[])
    .map((row) => ({
      id: row.id,
      name: row.name,
      sortOrder: row.sort_order,
      isArchived: row.is_archived,
    }))
    .sort(compareSiblings);

  /* 보관 항목은 `compareSiblings`가 이미 꼬리로 몰아놨다. 활성 집합이 언제나 접두사라
     이동은 그 접두사 안에서만 일어난다 — 액션이 "보관 항목 표시" 토글 상태를 알 필요가 없다. */
  const active = sorted.filter((row) => !row.isArchived);
  const archived = sorted.filter((row) => row.isArchived);

  const index = active.findIndex((row) => row.id === categoryId);
  if (index === -1) return alertFail(categoryId, CATEGORY_COPY.reorderStale);

  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0) return alertFail(categoryId, CATEGORY_COPY.reorderAtTop);
  if (swapWith >= active.length) return alertFail(categoryId, CATEGORY_COPY.reorderAtBottom);

  [active[index], active[swapWith]] = [active[swapWith], active[index]];

  const ordered = [...active, ...archived];
  const changed = ordered
    .map((row, position) => ({ id: row.id, sortOrder: position + 1, previous: row.sortOrder }))
    .filter((row) => row.sortOrder !== row.previous);

  const results = await Promise.all(
    changed.map((row) =>
      supabase.from("categories").update({ sort_order: row.sortOrder }).eq("id", row.id),
    ),
  );

  // 어느 하나라도 실패하면 순서가 흐트러진 채 남는다. 그래도 화면은 갱신한다 —
  // 지금 저장된 순서를 봐야 다음 ↑↓ 한 번이 전체를 재번호해 고칠 수 있다.
  revalidatePath("/", "layout");

  const failed = results.find((result) => result.error);
  if (failed?.error) {
    return alertFail(
      categoryId,
      unexpectedMessage("순서를 바꾸지", failed.error.code || failed.error.message),
    );
  }

  return { status: "done", categoryId };
}

/* ──────────────────────────────────────────────────────────── 보관 · 해제 */

/**
 * 보관/해제. 중분류면 **자식 소분류까지 함께**, 해제도 대칭이다.
 *
 * 근거는 View다 — `0006_views.sql`의 `v_budget_lines`는 소분류의 `is_archived`만 싣고
 * 중분류 플래그는 어디에도 없다. 부모만 끄고 조회 시 조상 체인으로 판정하게 하면
 * 예산·결산·빠른입력이 각자 트리를 다시 조인해야 하고, 한 곳만 빠뜨리면 보관이 조용히 샌다.
 * 자식까지 쓰면 소분류 자신의 플래그가 언제나 진실이라 **View도 마이그레이션도 손댈 필요가 없다.**
 *
 * 대분류는 대상이 아니다 — `budget_allocations`가 4행을 물고 있고 보관할 의미도 없다.
 */
export async function setCategoryArchivedAction(
  _prev: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const archived = String(formData.get("archived") ?? "") === "true";
  if (!categoryId) return alertFail(undefined, CATEGORY_COPY.archiveFailed);

  const failMessage = archived ? CATEGORY_COPY.archiveFailed : CATEGORY_COPY.restoreFailed;

  const supabase = await requireClient();
  const target = await readTarget(supabase, categoryId);
  if (!target) return alertFail(categoryId, CATEGORY_COPY.notFound);
  if (target.level === "major") return alertFail(categoryId, failMessage);

  const ids = [categoryId];
  if (target.level === "mid") {
    const { data: children, error: childError } = await supabase
      .from("categories")
      .select("id")
      .eq("parent_id", categoryId);
    if (childError) return alertFail(categoryId, failMessage);
    for (const child of children ?? []) ids.push(child.id);
  }

  /* `.in()` 한 문장이라 원자적이다 — 반쪽만 보관된 가지가 생기지 않는다.
     `.or("id.eq.…,parent_id.eq.…")`로 쓰면 필터 문자열을 손으로 조립하게 되어
     uuid 검증 없이는 주입 면이 열린다. `.in()`은 postgrest-js가 인코딩한다. */
  const { data, error } = await supabase
    .from("categories")
    .update({ is_archived: archived })
    .in("id", ids)
    .select("id");

  if (error) {
    return alertFail(
      categoryId,
      unexpectedMessage(archived ? "보관하지" : "다시 꺼내지", error.code || error.message),
    );
  }
  if (!data || data.length === 0) return alertFail(categoryId, CATEGORY_COPY.notFound);

  revalidatePath("/", "layout");
  return { status: "done", categoryId };
}
