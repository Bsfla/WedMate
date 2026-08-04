/**
 * 카테고리 관리(추가 · 이름 변경 · 순서 변경 · 보관)의 상태 + 문구.
 *
 * `actions.ts`가 아니라 여기 있는 이유: `"use server"` 파일은 **async 함수만** export할 수 있다.
 *
 * 이 문구들을 클라이언트 컴포넌트(`category-tree.tsx`)가 import한다. 그래서 여기서 끌어오는 것은
 * `@/lib/domain`(아무것도 import하지 않는다)과 `@/lib/couple-limits`(같음)뿐이다 —
 * `lib/supabase/*`를 스치면 `next/headers`가 클라이언트 그래프로 딸려와 빌드가 깨진다. (→ D-064)
 */

import { MAX_CATEGORY_NAME_LENGTH } from "@/lib/couple-limits";

/**
 * 실패가 착지하는 표면이 둘뿐이라 액션 넷이 한 타입을 공유한다 —
 * **시트 안 입력**(`field`)과 **행 위 인라인**(`alert`). `settings/types.ts`의
 * `SpaceActionState`가 세 액션을 한 타입으로 쓰는 것과 같은 이유다.
 *
 * 🔴 `categoryId`가 이 타입의 존재 이유다. 트리에 행이 40개라 "실패했다"만으로는
 * **어느 행에서** 실패했는지 화면이 말할 수 없다.
 */
export type CategoryActionState = {
  status: "idle" | "error" | "done";
  /** 이 결과가 어느 행의 것인가. 행 컴포넌트가 자기 것만 골라 그린다. */
  categoryId?: string;
  /** 귀속시킬 입력이 없는 실패 — 순서 변경 · 보관 (→ D-037) */
  alert?: string;
  /** 시트 안 이름 입력에 귀속되는 실패 */
  field?: "name";
  fieldMessage?: string;
};

export const CATEGORY_ACTION_IDLE: CategoryActionState = { status: "idle" };

export const CATEGORY_COPY = {
  title: "카테고리 관리",

  /* ── 상단 ── */
  hint: "카테고리를 누르면 이름을 바꾸거나 보관할 수 있어요.",
  showArchived: "보관 항목 표시",
  archivedCount: (n: number) => `보관 ${n}개`,
  majorMeta: (mids: number, minors: number) => `중 ${mids} · 소 ${minors}`,

  /* ── 행 ── */
  archivedBadge: "보관됨",
  moveUp: (name: string) => `${name} 위로`,
  moveDown: (name: string) => `${name} 아래로`,
  editAria: (levelLabel: string, name: string) => `${levelLabel} ${name} 이름 변경 · 보관`,
  addMinor: "소분류 추가",
  addMinorAria: (midName: string) => `${midName}에 소분류 추가`,
  addMid: "중분류 추가",
  addMidAria: (majorName: string) => `${majorName}에 중분류 추가`,

  /* ── 그룹 빈 상태 ──
     `EmptyState`(200px 상자)를 쓰지 않는다 — 중분류마다 최대 11번 나올 수 있다. */
  minorsEmpty: "아직 소분류가 없어요. 지출은 소분류에 기록돼요.",
  minorsAllArchived: (n: number) =>
    `소분류 ${n}개가 모두 보관돼 있어요. 위에서 '보관 항목 표시'를 켜면 보여요.`,
  midsEmpty: "아직 중분류가 없어요.",
  midsAllArchived: (n: number) =>
    `중분류 ${n}개가 모두 보관돼 있어요. 위에서 '보관 항목 표시'를 켜면 보여요.`,

  /* ── 추가 · 이름 변경 시트 ── */
  addTitle: (levelLabel: string) => `${levelLabel} 추가`,
  renameTitle: (levelLabel: string) => `${levelLabel} 이름 변경`,
  path: (parts: string[]) => parts.join(" › "),
  nameLabel: "이름",
  namePlaceholder: "예: 본식 DVD",
  nameHelp: `${MAX_CATEGORY_NAME_LENGTH}자까지 쓸 수 있어요.`,
  /** 대분류 시트에만 붙는다 — `major_key`가 불변이라 색·집계는 이름을 따라가지 않는다 (→ D-027). */
  majorNameHelp: "이름만 바꿔요. 예산·결산의 색과 집계는 그대로예요.",
  save: "저장",
  saving: "저장하는 중…",
  cancel: "취소",

  /* ── 시트 안 보관 진입 ── */
  archiveAction: "보관하기",
  restoreAction: "다시 꺼내기",
  archiveActionHint: "보관하면 새 지출 목록에서 빠져요. 이미 기록한 지출은 그대로 남아요.",

  /* ── 필드 에러 ── */
  nameEmpty: "이름을 입력해 주세요.",
  nameTooLong: (len: number) =>
    `이름은 ${MAX_CATEGORY_NAME_LENGTH}자까지 쓸 수 있어요. 지금 ${len}자예요.`,
  /** 보관된 형제까지 포함해 막는다 — 보관은 삭제가 아니라서, 꺼내는 순간 동명이인이 생긴다. */
  nameDuplicate: (levelLabel: string) =>
    `같은 이름의 ${levelLabel}가 이미 있어요. 다른 이름을 써 주세요.`,

  /* ── 알림(귀속 필드 없음) ── */
  saveFailed: "저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.",
  notFound: "이미 없는 항목이에요. 화면을 새로고침하면 최신 목록이 보여요.",
  reorderFailed: "순서를 바꾸지 못했어요. 잠시 뒤 다시 눌러 주세요.",
  /**
   * 🔴 "바뀌지 않았어요"라고 말하지 않는다. 순서변경은 형제 전체를 1..N으로 다시 매기므로
   * 부분 실패해도 DB는 움직여 있다. 화면에 **지금 저장된 순서**를 보여주고 그렇게 말해야
   * 다음 조작이 복구가 된다.
   */
  reorderStale: "다른 기기에서 순서가 바뀌었어요. 화면을 새로고침하면 최신 순서가 보여요.",
  reorderAtTop: "이미 맨 위예요. 화면을 새로고침하면 최신 순서가 보여요.",
  reorderAtBottom: "이미 맨 아래예요. 화면을 새로고침하면 최신 순서가 보여요.",
  archiveFailed: "보관하지 못했어요. 잠시 뒤 다시 시도해 주세요.",
  restoreFailed: "다시 꺼내지 못했어요. 잠시 뒤 다시 시도해 주세요.",

  /* ── 보관 확인 ──
     🔴 제목·본문에서 **이름 뒤에 조사를 붙이지 않는다.** 이름 끝 받침이 매번 달라
     '폐백을 / 드레스를'이 갈린다. 제목은 단계로 고정하고, 이름은 본문 맨 앞에
     따옴표 + 줄표로 얹는다. (금액 뒤 조사를 금지한 것과 같은 이유) */
  archiveTitle: (levelLabel: string) => `${levelLabel}를 보관할까요?`,
  archiveMinorBody: (name: string) =>
    `'${name}' — 새 지출을 기록할 때 목록에서 빠져요. 이미 기록한 지출은 그대로 남고, 언제든 다시 꺼낼 수 있어요.`,
  archiveMidBody: (name: string, children: number) =>
    children > 0
      ? `'${name}' — 그 아래 소분류 ${children}개도 함께 숨겨져요. 새 지출을 기록할 때 목록에서 빠지고, 이미 기록한 지출은 그대로 남아요. 언제든 다시 꺼낼 수 있어요.`
      : `'${name}' — 새 지출을 기록할 때 목록에서 빠져요. 이미 기록한 지출은 그대로 남고, 언제든 다시 꺼낼 수 있어요.`,
  archiveConfirm: "보관할게요",
  archivePending: "보관하는 중…",

  /* 해제도 보관과 대칭이다 — 자식까지 함께 꺼낸다. `categories`에는 "부모 때문에 보관됐는가"를
     적을 컬럼이 없어서, 부모만 꺼내면 **자식이 전부 보관된 빈 중분류**가 남는다.
     사용자는 왜 비었는지 알 수 없고(토글을 켜야 보인다) 여섯 번을 더 눌러야 한다.
     반대로 과잉 복구는 눈에 보이고 한 번에 되돌릴 수 있다 — 되돌릴 수 있는 실수를 골랐다.
     그래서 아래 문구가 개수를 **미리** 말한다. */
  restoreTitle: (levelLabel: string) => `${levelLabel}를 다시 꺼낼까요?`,
  restoreMinorBody: (name: string) => `'${name}' — 새 지출을 기록할 때 목록에 다시 나타나요.`,
  restoreMidBody: (name: string, children: number) =>
    children > 0
      ? `'${name}' — 그 아래 소분류 ${children}개도 함께 다시 나타나요.`
      : `'${name}' — 새 지출을 기록할 때 목록에 다시 나타나요.`,
  restoreConfirm: "다시 꺼낼게요",
  restorePending: "꺼내는 중…",
  keep: "그대로 둘게요",

  /* ── 화면 단위 실패 ── */
  loadFailedTitle: "카테고리를 불러오지 못했어요",
  loadFailedBody:
    "화면을 새로고침하면 다시 시도해요. 계속 안 되면 잠시 뒤에 다시 들어와 주세요.",
  unconfiguredBody:
    "Supabase가 연결되지 않은 환경이에요. 카테고리는 실제 DB가 연결돼야 보여요.",
  backToSettings: "설정으로 돌아가기",
} as const;
