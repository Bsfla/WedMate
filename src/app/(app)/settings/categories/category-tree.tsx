"use client";

import { ArrowDown, ArrowUp, Ellipsis, Plus } from "lucide-react";
import { useActionState, useEffect, useId, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";

import { InlineError } from "@/components/data/error-state";
import { ListRow } from "@/components/data/list-row";
import { Panel } from "@/components/data/panel";
import { SectionHeader } from "@/components/data/section-header";
import { FormAlert } from "@/components/form/form-alert";
import { TextField } from "@/components/form/text-field";
import { BottomSheet } from "@/components/layout/bottom-sheet";
import { ConfirmSheet } from "@/components/layout/confirm-sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  CATEGORY_LEVEL_LABEL,
  majorColor,
  type CategoryLevel,
} from "@/lib/domain";
import { focusFieldControl } from "@/lib/focus-field";
/* 타입만 가져온다 — `import type`은 컴파일 시 통째로 사라지므로 `next/headers`가
   클라이언트 그래프로 딸려오지 않는다. 값(상수·함수)을 가져오면 그때 깨진다 (→ D-064). */
import type {
  MajorCategory,
  MidCategory,
  MinorCategory,
} from "@/lib/supabase/categories";
import { cn } from "@/lib/utils";

import {
  createCategoryAction,
  renameCategoryAction,
  reorderSiblingsAction,
  setCategoryArchivedAction,
} from "./actions";
import {
  CATEGORY_ACTION_IDLE,
  CATEGORY_COPY,
  type CategoryActionState,
} from "./types";

/**
 * 카테고리 3단 트리 — 추가 · 이름 변경 · 순서 변경 · 보관.
 *
 * 🔴 **행에는 조작부를 두지 않는다** (→ D-075). 이전에는 행 우측에 ↑↓ 두 개가 상시로 붙어
 * 있었다(D-066·D-067). 실사용에서 두 가지가 무너졌다.
 *
 * 1. **이름 변경 진입이 보이지 않았다.** 화살표가 오른쪽 끝을 쓰고 있어 `›`를 지웠더니,
 *    "행이 눌린다"는 신호가 스크린리더 전용 `actionLabel`에만 남았다. 상단 안내문으로
 *    덮으려 했지만 **글로 설명해야 하는 어포던스는 실패한 어포던스다.**
 * 2. **순서변경은 y를 바꾸는 동작이라 한 번 누르면 손가락 아래 항목이 바뀐다.** D-067이
 *    x좌표를 고정했지만 y는 원리상 고정할 수 없다. 연타하면 엉뚱한 항목이 움직인다.
 *    게다가 96px 고정 열이 소분류 이름을 179px(한글 11자)로 눌러, 쓸 수 있는 20자의
 *    절반이 상시 잘렸다.
 *
 * → **행은 뜻이 하나뿐이다.** 소분류 행은 `›`, 그룹 헤더(대·중분류)는 `⋯` — 표식은 자리에
 * 따라 다르되 **여는 것은 같은 편집 시트 하나**다 (→ D-076). 그룹 헤더에 `›`를 달면
 * "안으로 들어간다"로 읽혀 거짓이 된다.
 *
 * 편집 시트가 계층별로 줄을 켜고 끈다 — 이름 입력(항상) · 자식 순서 변경(활성 자식 2개
 * 이상) · 보관(중·소분류). 보관이 소분류에선 버튼, 중분류에선 메뉴 항목이면 같은 동작을
 * 계층마다 다시 배워야 한다. 대분류에 보관·추가가 붙게 되면 **같은 시트에 줄이 하나 느는
 * 것으로 끝난다** — 통합안을 고른 이유가 그것이다.
 *
 * 순서변경은 **형제 목록 전체를 담은 시트**에서 로컬로 재배열하고 한 번에 저장한다.
 * D-066이 시트를 물린 이유("오버레이가 목록을 덮어 이동을 볼 수 없다")는 **행 하나의
 * 액션 시트**를 가정한 말이었다. 형제 전체가 들어오면 이동이 시트 안에서 그대로 보이고,
 * 최대 6행이라 스크롤도 없다.
 *
 * 계층 표현은 D-021이다: 대분류는 섹션 헤더(색 점 + 이름), 중분류는 그룹 헤더,
 * **소분류만 `ListRow`**. 들여쓰기는 소분류 한 단계(16px)뿐이다.
 *
 * 접지 않는다. 시드 기준 전개 높이가 ~3,100px이지만, 이 화면의 목적은 예산 화면(D-051)의
 * **조망**이 아니라 **찾아서 고치기**다. 접으면 모든 작업이 "이게 어느 대분류였지"를 먼저
 * 풀어야 하고, 기억이 틀리면 네 번 열고 닫는다.
 */

/** 보관/해제 확인에 필요한 것 전부. 편집 시트가 이 값을 그대로 확인 시트로 넘긴다. */
type ArchiveTarget = {
  level: "mid" | "minor";
  categoryId: string;
  name: string;
  /** 이 동작이 만들 상태. `true`면 보관, `false`면 해제 */
  nextArchived: boolean;
  /** 함께 움직이는 소분류 수. 소분류가 대상이면 0 */
  childCount: number;
};

/** 한 형제 그룹의 순서를 통째로 다루는 데 필요한 것 전부. */
type ReorderTarget = {
  /** 형제들의 부모 — 대분류 id(중분류 재배열) 또는 중분류 id(소분류 재배열) */
  parentId: string;
  /** 재배열되는 **자식**의 단계. 서버가 부모 단계를 되짚어 검증한다 */
  childLevel: "mid" | "minor";
  path: string;
  /** 활성 형제만. 보관은 언제나 꼬리라 그들끼리의 순서에는 의미가 없다 (→ D-068) */
  items: { id: string; name: string }[];
  archivedCount: number;
};

type SheetTarget =
  | { kind: "add"; level: "mid" | "minor"; parentId: string; path: string }
  | {
      kind: "edit";
      level: CategoryLevel;
      categoryId: string;
      name: string;
      path: string;
      /** 대분류는 지금 보관이 없다 — 이름 변경과 자식 순서만 열려 있다. */
      archive: ArchiveTarget | null;
      /** 활성 자식이 2개 미만이면 `null` — 옮길 곳이 없는 줄은 그리지 않는다 (→ D-061). */
      reorder: ReorderTarget | null;
    }
  | ({ kind: "archive" } & ArchiveTarget)
  | ({ kind: "reorder" } & ReorderTarget);

/** 시트 안 이름 입력의 고정 id. 제출 실패 시 여기로 포커스를 옮겨 에러를 낭독시킨다. */
const NAME_FIELD_ID = "category-name";

export function CategoryTree({ majors }: { majors: MajorCategory[] }) {
  /* 서버 왕복이 없는 순수 표시 상태다. 꺼져 있어도 보관 개수는 셀 수 있어야 해서
     `getCategoryTree()`가 보관 항목까지 전부 내려준다. */
  const [showArchived, setShowArchived] = useState(false);
  const [sheet, setSheet] = useState<SheetTarget | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  /* 같은 행을 다시 열었을 때 지난 실패가 남아 있으면 안 된다. 열 때마다 올려서
     시트 컴포넌트의 `key`를 바꾸고 `useActionState`를 통째로 새로 만든다. */
  const [openSeq, setOpenSeq] = useState(0);
  const switchId = useId();

  /* 순서 저장은 시트가 아니라 **트리가** 들고 있다 — 성공하든 실패하든 시트를 닫기
     때문이다. 실패 문구가 "지금 목록이 저장된 순서예요"라서, 그 목록을 오버레이가 덮고
     있으면 문장이 거짓이 된다. 액션이 결과에 `parentId`를 실어 주므로 인라인 실패가
     그 그룹 헤더 아래에 정확히 착지한다. */
  const [reorderState, reorderSubmit, reorderPending] = useActionState<
    CategoryActionState,
    FormData
  >(async (prev, formData) => {
    const next = await reorderSiblingsAction(prev, formData);
    closeSheet();
    return next;
  }, CATEGORY_ACTION_IDLE);

  const archivedTotal = useMemo(
    () =>
      majors.reduce(
        (total, major) =>
          total +
          major.mids.reduce(
            (sum, mid) =>
              sum +
              (mid.isArchived ? 1 : 0) +
              mid.minors.filter((minor) => minor.isArchived).length,
            0,
          ),
        0,
      ),
    [majors],
  );

  // 제출 중에는 직전 실패를 감춘다 — 지금 보내는 조작의 결과로 읽힌다.
  const reorderError =
    !reorderPending && reorderState.status === "error" ? reorderState : null;

  function openSheet(next: SheetTarget) {
    setOpenSeq((seq) => seq + 1);
    setSheet(next);
    setSheetOpen(true);
  }

  /* 닫을 때 `sheet`를 비우지 않는다. 비우면 컴포넌트가 즉시 사라져 내려가는 애니메이션이
     생략되고, 마지막 프레임에 빈 시트가 번쩍인다. */
  function closeSheet() {
    setSheetOpen(false);
  }

  const rowProps = { onOpen: openSheet, reorderError, showArchived };

  return (
    <>
      {archivedTotal > 0 && (
        /* 보관이 0개면 토글을 그리지 않는다 — 켜도 아무 변화가 없는 스위치다 (→ D-061).
           시드 직후의 기본 상태라 첫 진입에서는 이 블록이 통째로 없다.
           예전에는 여기 "카테고리를 누르면…" 안내문이 붙어 있었다. 이제 행의 `›`와
           그룹 헤더의 `⋯`가 그 일을 하므로 문장을 지웠다 (→ D-075). */
        <Panel>
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Switch
                checked={showArchived}
                id={switchId}
                onCheckedChange={setShowArchived}
              />
              <Label className="font-normal" htmlFor={switchId}>
                {CATEGORY_COPY.showArchived}
              </Label>
            </div>
            <span className="num shrink-0 text-body-sm text-muted-foreground">
              {CATEGORY_COPY.archivedCount(archivedTotal)}
            </span>
          </div>
        </Panel>
      )}

      {majors.map((major) => (
        <MajorSection key={major.id} major={major} {...rowProps} />
      ))}

      {/* 🔴 마지막 대분류 **아래**다. "+ 대분류 추가"를 찾아 끝까지 스크롤한 사람이
          질문이 생긴 바로 그 지점에서 답을 만난다. **없는 것은 설명이 아니다** — 화면이
          침묵하면 "못 찾는 것"과 "없는 것"을 구분할 방법이 없어 계속 찾게 된다 (→ D-074).
          4개 고정 자체는 자유화를 재 보고 남긴 결정이다 (→ D-073 · D-027).
          `Panel`(bg-card) 안에 두는 이유는 대비다: `--muted-foreground`는 앱 배경
          (#f6f5f6) 위에서 4.44:1로 AA 미달이고 흰 면 위에서만 4.83:1이다. */}
      <Panel>
        <p className="text-body-sm text-muted-foreground">
          {CATEGORY_COPY.majorFixedNote}
        </p>
      </Panel>

      {sheet?.kind === "edit" || sheet?.kind === "add" ? (
        <EditSheet
          key={`edit-${sheetKey(sheet)}-${openSeq}`}
          onArchive={(target) => setSheet({ kind: "archive", ...target })}
          onDone={closeSheet}
          onOpenChange={setSheetOpen}
          onReorder={(target) => setSheet({ kind: "reorder", ...target })}
          open={sheetOpen}
          target={sheet}
        />
      ) : null}

      {sheet?.kind === "archive" && (
        <ArchiveSheet
          key={`archive-${sheet.categoryId}-${openSeq}`}
          onDone={closeSheet}
          onOpenChange={setSheetOpen}
          open={sheetOpen}
          target={sheet}
        />
      )}

      {sheet?.kind === "reorder" && (
        <ReorderSheet
          key={`reorder-${sheet.parentId}-${openSeq}`}
          onOpenChange={setSheetOpen}
          open={sheetOpen}
          pending={reorderPending}
          submit={reorderSubmit}
          target={sheet}
        />
      )}
    </>
  );
}

function sheetKey(
  target: Extract<SheetTarget, { kind: "add" | "edit" }>,
): string {
  return target.kind === "add" ? `add-${target.parentId}` : target.categoryId;
}

/* ────────────────────────────────────────────────────────────── 트리 */

type RowProps = {
  showArchived: boolean;
  reorderError: CategoryActionState | null;
  onOpen: (target: SheetTarget) => void;
};

function MajorSection({ major, ...rest }: { major: MajorCategory } & RowProps) {
  const { showArchived, reorderError, onOpen } = rest;

  const activeMids = major.mids.filter((mid) => !mid.isArchived);
  const visibleMids = showArchived ? major.mids : activeMids;

  const visibleMinorCount = visibleMids.reduce(
    (sum, mid) =>
      sum +
      (showArchived
        ? mid.minors.length
        : mid.minors.filter((m) => !m.isArchived).length),
    0,
  );

  /* 🔴 자기 그룹의 결과만 그린다. 트리에 그룹이 15개라 다른 그룹의 실패가 여기로 새면
     사용자는 방금 건드리지도 않은 대분류가 실패했다고 읽는다. */
  const majorAlert =
    reorderError && reorderError.categoryId === major.id
      ? reorderError.alert
      : undefined;

  return (
    <>
      <SectionHeader
        action={
          <MoreButton
            label={CATEGORY_COPY.moreAria(
              CATEGORY_LEVEL_LABEL.major,
              major.name,
            )}
            onClick={() =>
              onOpen({
                kind: "edit",
                level: "major",
                categoryId: major.id,
                name: major.name,
                path: major.name,
                archive: null,
                reorder: buildReorder(
                  major.id,
                  "mid",
                  major.name,
                  major.mids,
                  activeMids,
                ),
              })
            }
          />
        }
        actionAlign="center"
        meta={CATEGORY_COPY.majorMeta(visibleMids.length, visibleMinorCount)}
        title={
          <span className="flex min-w-0 items-center gap-2">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: majorColor(major.majorKey) }}
            />
            <span className="truncate">{major.name}</span>
          </span>
        }
      />

      <Panel flush>
        <ul>
          {majorAlert && (
            <li className="px-4 pt-3">
              <InlineError message={majorAlert} />
            </li>
          )}

          {visibleMids.length === 0 ? (
            <li className="flex min-h-11 items-center px-4 py-2 text-body-sm text-muted-foreground">
              {major.mids.length > 0
                ? CATEGORY_COPY.midsAllArchived(major.mids.length)
                : CATEGORY_COPY.midsEmpty}
            </li>
          ) : (
            visibleMids.map((mid) => (
              <MidGroup key={mid.id} majorName={major.name} mid={mid} {...rest} />
            ))
          )}

          <li>
            <AddRow
              ariaLabel={CATEGORY_COPY.addMidAria(major.name)}
              label={CATEGORY_COPY.addMid}
              onClick={() =>
                onOpen({
                  kind: "add",
                  level: "mid",
                  parentId: major.id,
                  path: major.name,
                })
              }
            />
          </li>
        </ul>
      </Panel>
    </>
  );
}

function MidGroup({
  mid,
  majorName,
  showArchived,
  reorderError,
  onOpen,
}: { mid: MidCategory; majorName: string } & RowProps) {
  const activeMinors = mid.minors.filter((minor) => !minor.isArchived);
  const visibleMinors = showArchived ? mid.minors : activeMinors;
  const archivedMinorCount = mid.minors.length - activeMinors.length;
  const midPath = CATEGORY_COPY.path([majorName, mid.name]);

  const midAlert =
    reorderError && reorderError.categoryId === mid.id
      ? reorderError.alert
      : undefined;

  const midArchive: ArchiveTarget = {
    level: "mid",
    categoryId: mid.id,
    name: mid.name,
    nextArchived: !mid.isArchived,
    // 보관은 "지금 보이는 것이 몇 개 숨는가", 해제는 "몇 개가 돌아오는가"다.
    childCount: mid.isArchived ? archivedMinorCount : activeMinors.length,
  };

  return (
    <li className="border-b border-border/60 last:border-b-0">
      {/* 중분류는 그룹 헤더다 — `ListRow`를 쓰지 않는다 (→ D-021). 소분류와 같은
          컴포넌트를 쓰면 `<li>` 안에 `<li>`가 생기기도 한다.

          🔴 이름은 **라벨이지 버튼이 아니다.** 그룹 제목이 눌리는 관례가 없어서, 버튼으로
          두면 소분류 행보다 오히려 더 안 눌려 보였다 — 조작은 우측 `⋯`가 진다.
          색도 `text-muted-foreground`에서 올렸다: `bg-muted`(#f4f4f5) 위 4.40:1로 AA
          미달이었다. `--muted-foreground`의 4.83:1은 **흰 배경 기준**이다. */}
      <div className="flex min-h-12 items-center bg-muted pr-1.5 pl-4">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 py-2">
          <span className="truncate text-body-sm font-bold" title={mid.name}>
            {mid.name}
          </span>
          {mid.isArchived && <ArchivedBadge />}
        </div>

        <MoreButton
          label={CATEGORY_COPY.moreAria(CATEGORY_LEVEL_LABEL.mid, mid.name)}
          onClick={() =>
            onOpen({
              kind: "edit",
              level: "mid",
              categoryId: mid.id,
              name: mid.name,
              path: midPath,
              archive: midArchive,
              reorder: buildReorder(
                mid.id,
                "minor",
                midPath,
                mid.minors,
                activeMinors,
              ),
            })
          }
        />
      </div>

      {midAlert && (
        <div className="px-4 py-2">
          <InlineError message={midAlert} />
        </div>
      )}

      <ul>
        {visibleMinors.length === 0 ? (
          <li className="flex min-h-11 items-center py-2 pr-4 pl-8 text-body-sm text-muted-foreground">
            {archivedMinorCount > 0
              ? CATEGORY_COPY.minorsAllArchived(archivedMinorCount)
              : CATEGORY_COPY.minorsEmpty}
          </li>
        ) : (
          visibleMinors.map((minor) => (
            <MinorRow
              key={minor.id}
              minor={minor}
              onOpen={onOpen}
              path={CATEGORY_COPY.path([majorName, mid.name, minor.name])}
            />
          ))
        )}

        <li>
          <AddRow
            ariaLabel={CATEGORY_COPY.addMinorAria(mid.name)}
            indent
            label={CATEGORY_COPY.addMinor}
            onClick={() =>
              onOpen({
                kind: "add",
                level: "minor",
                parentId: mid.id,
                path: midPath,
              })
            }
          />
        </li>
      </ul>
    </li>
  );
}

function MinorRow({
  minor,
  path,
  onOpen,
}: {
  minor: MinorCategory;
  path: string;
  onOpen: (target: SheetTarget) => void;
}) {
  return (
    <ListRow
      actionLabel={CATEGORY_COPY.editAria(
        CATEGORY_LEVEL_LABEL.minor,
        minor.name,
      )}
      /* 좌측 패딩이 `<li>`로 올라간다 — 행 버튼의 px-4에 16px을 더해 한 단계(16px)
         들여쓴다. 우측은 덧대지 않는다: `›`가 행 버튼의 px-4 안에 있어 중분류 `⋯`,
         대분류 `⋯`와 화면 오른쪽 끝에서 거의 같은 세로선에 선다(41 · 45 · 40px). */
      className="pl-4"
      onClick={() =>
        onOpen({
          kind: "edit",
          level: "minor",
          categoryId: minor.id,
          name: minor.name,
          path,
          archive: {
            level: "minor",
            categoryId: minor.id,
            name: minor.name,
            nextArchived: !minor.isArchived,
            childCount: 0,
          },
          reorder: null,
        })
      }
      title={
        /* 보관 표시를 `opacity`로 만들지 않는다 — 알파는 자식의 대비를 계산 불가능하게
           만든다(`text-muted-foreground` 4.83:1이 2.3:1로 내려앉는다). (→ D-069) */
        <span
          className={cn(minor.isArchived && "text-muted-foreground")}
          title={minor.name}
        >
          {minor.name}
        </span>
      }
      /* 🔴 `meta`(제목 아래)가 아니라 `titleBadge`(제목 옆)다. `meta`에 두면 배지가 붙은
         행만 56 → 66px로 자라 목록의 세로 리듬이 두 종류로 쪼개진다. (→ D-075) */
      titleBadge={minor.isArchived ? <ArchivedBadge /> : undefined}
    />
  );
}

/** 활성 형제가 2개 미만이면 `null` — 옮길 곳이 없는 줄은 시트에 그리지 않는다 (→ D-061). */
function buildReorder(
  parentId: string,
  childLevel: "mid" | "minor",
  path: string,
  all: { id: string }[],
  active: { id: string; name: string }[],
): ReorderTarget | null {
  if (active.length < 2) return null;
  return {
    parentId,
    childLevel,
    path,
    items: active.map((row) => ({ id: row.id, name: row.name })),
    archivedCount: all.length - active.length,
  };
}

function ArchivedBadge() {
  return (
    <span className="shrink-0 rounded-lg border border-border bg-muted px-2 py-0.5 text-caption text-muted-foreground">
      {CATEGORY_COPY.archivedBadge}
    </span>
  );
}

/**
 * 그룹 헤더(대·중분류)의 편집 진입.
 *
 * 소분류 행의 `›`와 **같은 시트**를 열지만 표식이 다르다 — 그룹 헤더에 `›`를 달면
 * "안으로 들어간다"로 읽혀 거짓이 된다. `⋯`는 "이 항목에 할 수 있는 일들"이다. (→ D-076)
 */
function MoreButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      aria-label={label}
      className="shrink-0 text-muted-foreground"
      onClick={onClick}
      size="icon"
      type="button"
      variant="ghost"
    >
      <Ellipsis aria-hidden strokeWidth={2} />
    </Button>
  );
}

function AddRow({
  label,
  ariaLabel,
  onClick,
  indent = false,
}: {
  label: string;
  ariaLabel: string;
  onClick: () => void;
  indent?: boolean;
}) {
  return (
    <button
      aria-label={ariaLabel}
      /* 13px 뮤티드였다. 이 화면이 존재하는 이유가 "우리 예산에만 있는 항목을 넣을 수
         없었다"인데 그 동작이 목록에서 가장 흐렸다. 15px 본문색으로 올리고, 카테고리
         행과는 좌측 `+`가 있고 우측에 `›`가 없다는 것으로 갈린다. */
      className={cn(
        "flex min-h-12 w-full items-center gap-2 py-2 pr-4 text-left",
        "text-body font-medium transition-colors active:bg-muted",
        "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:-outline-offset-2 focus-visible:outline-none",
        indent ? "pl-8" : "pl-4",
      )}
      onClick={onClick}
      type="button"
    >
      <Plus aria-hidden className="size-4 shrink-0" strokeWidth={2} />
      {label}
    </button>
  );
}

/* ────────────────────────────────────────────────────────────── 시트 */

/**
 * 추가 · 편집. **대·중·소가 전부 이 시트 하나를 연다** (→ D-076).
 * 계층 차이는 줄이 나타나고 사라지는 것으로만 표현한다:
 *
 * | | 이름 입력 | 자식 순서 변경 | 보관 |
 * |---|---|---|---|
 * | 대분류 | ○ | 중분류 2개 이상일 때 | — |
 * | 중분류 | ○ | 소분류 2개 이상일 때 | ○ |
 * | 소분류 | ○ | — | ○ |
 *
 * 저장은 **명시적 버튼**이다 (→ D-019) — 설정의 자동 저장 규칙은 폼 화면에 걸리고,
 * 시트는 한 벌을 채워 커밋하는 자리다.
 */
function EditSheet({
  target,
  open,
  onOpenChange,
  onDone,
  onArchive,
  onReorder,
}: {
  target: Extract<SheetTarget, { kind: "add" | "edit" }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
  onArchive: (target: ArchiveTarget) => void;
  onReorder: (target: ReorderTarget) => void;
}) {
  const isAdd = target.kind === "add";
  const levelLabel = CATEGORY_LEVEL_LABEL[target.level];
  const formId = useId();
  const alertRef = useRef<HTMLDivElement>(null);

  const [state, submit, pending] = useActionState<
    CategoryActionState,
    FormData
  >(async (prev, formData) => {
    const next = isAdd
      ? await createCategoryAction(prev, formData)
      : await renameCategoryAction(prev, formData);
    // 성공하면 새 트리가 revalidate로 내려온다. 시트는 그때 닫는다.
    if (next.status === "done") onDone();
    return next;
  }, CATEGORY_ACTION_IDLE);

  /* 포커스 이동이 곧 낭독이다(→ D-037). 고칠 입력이 있으면 거기로, 없으면 알림으로. */
  useEffect(() => {
    if (state.status !== "error") return;
    if (state.field === "name" && focusFieldControl(NAME_FIELD_ID)) return;
    alertRef.current?.focus();
  }, [state]);

  // 제출 중에는 직전 실패를 감춘다.
  const shown = pending ? CATEGORY_ACTION_IDLE : state;
  const archive = target.kind === "edit" ? target.archive : null;
  const reorder = target.kind === "edit" ? target.reorder : null;
  const isMajor = !isAdd && target.level === "major";

  return (
    <BottomSheet
      description={
        isAdd ? target.path : CATEGORY_COPY.moreAria(levelLabel, target.name)
      }
      footer={
        <div className="flex flex-col gap-2">
          {/* 저장 버튼은 시트 하단 고정 영역이라 폼 바깥이다. `form` 속성으로 잇는다. */}
          <Button
            className="w-full"
            disabled={pending}
            form={formId}
            size="lg"
            type="submit"
          >
            {pending ? CATEGORY_COPY.saving : CATEGORY_COPY.save}
          </Button>
          <Button
            className="w-full"
            disabled={pending}
            onClick={() => onOpenChange(false)}
            type="button"
            variant="ghost"
          >
            {CATEGORY_COPY.cancel}
          </Button>
        </div>
      }
      onOpenChange={(next) => {
        // 제출 중에는 닫히지 않는다 — 왕복 중에 시트가 사라지면 취소된 줄 안다.
        if (pending) return;
        onOpenChange(next);
      }}
      open={open}
      /* 제목이 곧 대상이다. `renameTitle`("소분류 이름 변경")을 쓰면 **무엇을** 고치는지가
         부제로 밀리는데, 40행짜리 트리에서 헷갈리는 것은 동작이 아니라 대상이다.
         동작은 `description`(sr-only)이 낭독한다. */
      title={isAdd ? CATEGORY_COPY.addTitle(levelLabel) : target.name}
    >
      <p className="text-body-sm text-muted-foreground">{target.path}</p>

      {shown.alert && <FormAlert ref={alertRef}>{shown.alert}</FormAlert>}

      <form action={submit} id={formId}>
        {isAdd ? (
          <>
            <input name="level" type="hidden" value={target.level} />
            <input name="parentId" type="hidden" value={target.parentId} />
          </>
        ) : (
          <input name="categoryId" type="hidden" value={target.categoryId} />
        )}

        <TextField
          autoComplete="off"
          defaultValue={isAdd ? "" : target.name}
          error={shown.field === "name" ? shown.fieldMessage : undefined}
          /* `maxLength`를 걸지 않는다 — 걸면 붙여넣기를 브라우저가 **먼저 잘라** 무엇이
             사라졌는지 알 수 없다. 길이는 제출 시 몇 자인지까지 말해 준다. */
          help={
            target.level === "major"
              ? CATEGORY_COPY.majorNameHelp
              : CATEGORY_COPY.nameHelp
          }
          id={NAME_FIELD_ID}
          label={CATEGORY_COPY.nameLabel}
          name="name"
          placeholder={isAdd ? CATEGORY_COPY.namePlaceholder : undefined}
        />
      </form>

      {reorder && (
        /* 시트 좌우 패딩 밖으로 빼서 전폭 행을 만든다 — 제목과 같은 16px에서 글이 시작해
           "시트 안의 또 다른 카드"가 아니라 "이 시트가 가진 다음 갈림길"로 읽힌다. */
        <ul className="-mx-4 border-y border-border">
          <ListRow
            chevron
            onClick={() => onReorder(reorder)}
            title={CATEGORY_COPY.menuReorder(
              CATEGORY_LEVEL_LABEL[reorder.childLevel],
            )}
            trailing={
              <span className="num text-body-sm text-muted-foreground">
                {CATEGORY_COPY.menuReorderMeta(reorder.items.length)}
              </span>
            }
          />
        </ul>
      )}

      {archive && (
        <div className="flex flex-col gap-1.5">
          <Separator className="mb-1.5" />
          <Button
            className="w-full"
            disabled={pending}
            onClick={() => onArchive(archive)}
            type="button"
            variant="secondary"
          >
            {archive.nextArchived
              ? CATEGORY_COPY.archiveAction
              : CATEGORY_COPY.restoreAction}
          </Button>
          {archive.nextArchived && (
            <p className="px-0.5 text-caption text-muted-foreground">
              {CATEGORY_COPY.archiveActionHint}
            </p>
          )}
        </div>
      )}

      {isMajor && (
        /* 보관 버튼이 있어야 할 자리다. 비워 두면 "왜 여기만 없지"가 남는다 —
           그 질문이 곧 "대분류 추가는 어디서 하지"와 같은 구멍이다 (→ D-074). */
        <div className="flex flex-col gap-1.5">
          <Separator className="mb-1.5" />
          <p className="px-0.5 text-body-sm text-muted-foreground">
            {CATEGORY_COPY.majorFixedHint}
          </p>
        </div>
      )}
    </BottomSheet>
  );
}

/**
 * 형제 그룹의 순서 — **로컬로 재배열하고 한 번에 저장한다.**
 *
 * ↑↓를 목록에서 걷어내 여기로 모은 이유는 D-075이다. 이 표면에서는 같은 화살표가 잘
 * 동작한다: 최대 6행이라 스크롤이 없고, 재배열이 로컬이라 왕복 없이 즉시 움직이며,
 * 목록이 짧아 이동 전후가 한 화면에 들어온다. 왕복은 저장 때 한 번뿐이다.
 *
 * 🔴 **없는 화살표는 버튼만 지우고 자리는 남긴다.** D-067의 원칙은 폐기가 아니라 이사했다 —
 * 첫 행의 ↑와 마지막 행의 ↓는 렌더하지 않지만 `size-11` 빈 칸은 유지한다. 자리까지
 * 접으면 ↓의 x좌표가 행마다 달라져 연타가 빗나간다.
 */
function ReorderSheet({
  target,
  open,
  onOpenChange,
  submit,
  pending,
}: {
  target: ReorderTarget;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submit: (formData: FormData) => void;
  pending: boolean;
}) {
  const formId = useId();
  const scope = useId();
  const [order, setOrder] = useState(target.items);

  const childLabel = CATEGORY_LEVEL_LABEL[target.childLevel];
  const dirty = order.some((row, index) => row.id !== target.items[index]?.id);

  function move(index: number, direction: "up" | "down") {
    const to = direction === "up" ? index - 1 : index + 1;
    if (to < 0 || to >= order.length) return;

    const next = [...order];
    next[index] = order[to];
    next[to] = order[index];
    const movedId = order[index].id;

    /* 🔴 재배열 뒤 **같은 항목의 같은 방향 버튼**을 다시 잡는다. `flushSync`가 필요한
       이유는 DOM이 이미 바뀐 뒤에 조회해야 하기 때문이다. 경계에 닿아 그 버튼이
       사라졌으면 반대쪽을 잡는다 — 안 그러면 포커스가 `body`로 떨어져 키보드·AT
       사용자가 목록을 통째로 잃는다. 포커스 이동은 곧 낭독이라(→ D-037)
       `aria-describedby`가 가리키는 "4개 중 2번째"가 그때 다시 읽힌다.
       `getElementById`를 쓴다 — `useId()` 값에는 CSS 선택자로 못 쓰는 글자가 들어 있다. */
    flushSync(() => setOrder(next));
    const same = document.getElementById(arrowId(scope, movedId, direction));
    const other = document.getElementById(
      arrowId(scope, movedId, direction === "up" ? "down" : "up"),
    );
    (same ?? other)?.focus();
  }

  return (
    <BottomSheet
      description={target.path}
      footer={
        <div className="flex flex-col gap-2">
          {/* 자리를 늘 차지한다 — 첫 이동에서 문구가 사라질 때 푸터가 줄어들면
              바닥에 붙은 시트가 통째로 아래에서 위로 튄다. */}
          <p className="min-h-[17px] px-0.5 text-center text-caption text-muted-foreground">
            {dirty ? "" : CATEGORY_COPY.reorderUnchanged}
          </p>
          <Button
            className="w-full"
            disabled={pending || !dirty}
            form={formId}
            size="lg"
            type="submit"
          >
            {pending ? CATEGORY_COPY.reorderSaving : CATEGORY_COPY.reorderSave}
          </Button>
          <Button
            className="w-full"
            disabled={pending}
            onClick={() => onOpenChange(false)}
            type="button"
            variant="ghost"
          >
            {CATEGORY_COPY.cancel}
          </Button>
        </div>
      }
      onOpenChange={(next) => {
        if (pending) return;
        onOpenChange(next);
      }}
      open={open}
      title={CATEGORY_COPY.reorderTitle(childLabel)}
    >
      <p className="text-body-sm text-muted-foreground">{target.path}</p>

      <ul className="-mx-4 border-y border-border">
        {order.map((item, index) => {
          const posId = `${scope}-${item.id}-pos`;
          return (
            <li
              className="flex min-h-14 items-center gap-2 border-b border-border/60 pr-2 pl-4 last:border-b-0"
              key={item.id}
            >
              {/* 순번이 결과를 **숫자로도** 말한다 — 위치라는 시각 단서에만 기대지 않는다. */}
              <span
                aria-hidden
                className="num w-5 shrink-0 text-body-sm font-medium text-muted-foreground"
              >
                {index + 1}
              </span>
              <span
                className="min-w-0 flex-1 truncate text-body"
                title={item.name}
              >
                {item.name}
              </span>
              {/* `sr-only`는 absolute라 flex 레이아웃에 끼어들지 않는다(gap을 먹지 않는다). */}
              <span className="sr-only" id={posId}>
                {CATEGORY_COPY.reorderPositionAria(
                  index + 1,
                  order.length,
                  item.name,
                )}
              </span>

              <ArrowSlot
                describedBy={posId}
                direction="up"
                disabled={pending}
                id={arrowId(scope, item.id, "up")}
                name={item.name}
                onMove={() => move(index, "up")}
                shown={index > 0}
              />
              <ArrowSlot
                describedBy={posId}
                direction="down"
                disabled={pending}
                id={arrowId(scope, item.id, "down")}
                name={item.name}
                onMove={() => move(index, "down")}
                shown={index < order.length - 1}
              />
            </li>
          );
        })}
      </ul>

      {target.archivedCount > 0 && (
        <p className="px-0.5 text-caption text-muted-foreground">
          {CATEGORY_COPY.reorderArchivedNote}
        </p>
      )}

      {/* 폼은 숨은 입력 셋뿐이라 자리를 차지하면 안 된다(시트 본문의 `gap-3.5`가 붙는다).
          `display:none`이어도 hidden 입력은 그대로 직렬화된다. */}
      <form action={submit} className="hidden" id={formId}>
        <input name="parentId" type="hidden" value={target.parentId} />
        <input name="level" type="hidden" value={target.childLevel} />
        <input
          name="orderedIds"
          type="hidden"
          value={order.map((row) => row.id).join(",")}
        />
      </form>
    </BottomSheet>
  );
}

function arrowId(scope: string, id: string, direction: "up" | "down"): string {
  return `${scope}-${id}-${direction}`;
}

function ArrowSlot({
  shown,
  direction,
  name,
  id,
  describedBy,
  disabled,
  onMove,
}: {
  shown: boolean;
  direction: "up" | "down";
  name: string;
  id: string;
  describedBy: string;
  disabled: boolean;
  onMove: () => void;
}) {
  if (!shown) return <span aria-hidden className="size-11 shrink-0" />;

  const Icon = direction === "up" ? ArrowUp : ArrowDown;
  const label =
    direction === "up"
      ? CATEGORY_COPY.moveUp(name)
      : CATEGORY_COPY.moveDown(name);

  return (
    <Button
      aria-describedby={describedBy}
      aria-label={label}
      className="shrink-0 text-muted-foreground"
      disabled={disabled}
      id={id}
      onClick={onMove}
      size="icon"
      type="button"
      variant="ghost"
    >
      <Icon aria-hidden strokeWidth={2} />
    </Button>
  );
}

/**
 * 보관 · 해제 확인.
 *
 * 삭제 UI가 없어서(→ D-016) 이 화면에서 되돌리기 가장 어려운 동작이 보관이다.
 * 다만 **되돌릴 수 있으므로** `acknowledge` 게이트는 붙이지 않는다 — 남발하면
 * 체크가 습관이 되어 정작 삭제에서 아무것도 막지 못한다.
 */
function ArchiveSheet({
  target,
  open,
  onOpenChange,
  onDone,
}: {
  target: ArchiveTarget;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const [state, submit, pending] = useActionState<
    CategoryActionState,
    FormData
  >(async (prev, formData) => {
    const next = await setCategoryArchivedAction(prev, formData);
    if (next.status === "done") onDone();
    return next;
  }, CATEGORY_ACTION_IDLE);

  const levelLabel = CATEGORY_LEVEL_LABEL[target.level];
  const isMid = target.level === "mid";

  const body = target.nextArchived
    ? isMid
      ? CATEGORY_COPY.archiveMidBody(target.name, target.childCount)
      : CATEGORY_COPY.archiveMinorBody(target.name)
    : isMid
      ? CATEGORY_COPY.restoreMidBody(target.name, target.childCount)
      : CATEGORY_COPY.restoreMinorBody(target.name);

  return (
    <ConfirmSheet
      action={submit}
      // 실패해도 닫지 않는다. 무엇을 확인하던 중이었는지가 시트 안에 남아 있어야 한다.
      alert={!pending && state.status === "error" ? state.alert : undefined}
      body={body}
      cancelLabel={CATEGORY_COPY.keep}
      confirmLabel={
        target.nextArchived
          ? CATEGORY_COPY.archiveConfirm
          : CATEGORY_COPY.restoreConfirm
      }
      hidden={{
        categoryId: target.categoryId,
        archived: String(target.nextArchived),
      }}
      onOpenChange={onOpenChange}
      open={open}
      pending={pending}
      pendingLabel={
        target.nextArchived
          ? CATEGORY_COPY.archivePending
          : CATEGORY_COPY.restorePending
      }
      title={
        target.nextArchived
          ? CATEGORY_COPY.archiveTitle(levelLabel)
          : CATEGORY_COPY.restoreTitle(levelLabel)
      }
    />
  );
}
