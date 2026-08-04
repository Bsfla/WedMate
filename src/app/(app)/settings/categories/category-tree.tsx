"use client";

import { ArrowDown, ArrowUp, LoaderCircle, Plus } from "lucide-react";
import { useActionState, useEffect, useId, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

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
import { CATEGORY_LEVEL_LABEL, majorColor, type CategoryLevel } from "@/lib/domain";
import { focusFieldControl } from "@/lib/focus-field";
/* 타입만 가져온다 — `import type`은 컴파일 시 통째로 사라지므로 `next/headers`가
   클라이언트 그래프로 딸려오지 않는다. 값(상수·함수)을 가져오면 그때 깨진다 (→ D-064). */
import type { MajorCategory, MidCategory } from "@/lib/supabase/categories";
import { cn } from "@/lib/utils";

import {
  createCategoryAction,
  moveCategoryAction,
  renameCategoryAction,
  setCategoryArchivedAction,
} from "./actions";
import { CATEGORY_ACTION_IDLE, CATEGORY_COPY, type CategoryActionState } from "./types";

/**
 * 카테고리 3단 트리 — 추가 · 이름 변경 · 순서 변경 · 보관.
 *
 * 🔴 **행 하나가 지는 동작이 넷인데 375px에는 44px 타깃 둘밖에 안 들어간다** (→ D-066).
 * 그래서 **행 전체 = 편집 시트(이름 변경 + 보관)** 이고 **행 우측 = ↑↓** 다.
 * 순서 변경만 인라인에 남긴 이유는 그것만이 **움직이는 것을 눈으로 봐야 하는 동작**이기
 * 때문이다 — 시트 안에서 ↑를 누르면 항목이 어디로 갔는지 오버레이에 가려 볼 수 없다.
 *
 * 계층 표현은 D-021이다: 대분류는 섹션 헤더(색 점 + 이름), 중분류는 그룹 헤더,
 * **소분류만 `ListRow`**. 들여쓰기는 소분류 한 단계(16px)뿐이다.
 *
 * 접지 않는다 (→ D-068). 시드 기준 전개 높이가 ~3,100px이지만, 이 화면의 목적은
 * 예산 화면(D-051)의 **조망**이 아니라 **찾아서 고치기**다. 접으면 모든 작업이
 * "이게 어느 대분류였지"를 먼저 풀어야 하고, 기억이 틀리면 네 번 열고 닫는다.
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

type SheetTarget =
  | { kind: "add"; level: "mid" | "minor"; parentId: string; path: string }
  | {
      kind: "rename";
      level: CategoryLevel;
      categoryId: string;
      name: string;
      path: string;
      /** 대분류는 보관이 없다 — 이름 변경만 열려 있다 (→ D-027). */
      archive: ArchiveTarget | null;
    }
  | ({ kind: "archive" } & ArchiveTarget);

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

  /* 순서 변경은 트리 전체가 액션 하나를 공유한다 — 두 화살표가 동시에 날아가면
     같은 형제 그룹을 두 번 재번호해 순서가 뒤엉킨다. `movePending`이 트리의 모든
     화살표를 잠근다. 어느 버튼이 눌렸는지는 각 폼의 `useFormStatus`가 안다. */
  const [moveState, moveSubmit, movePending] = useActionState<CategoryActionState, FormData>(
    moveCategoryAction,
    CATEGORY_ACTION_IDLE,
  );

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
  const moveError = !movePending && moveState.status === "error" ? moveState : null;

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

  const rowProps = { moveError, movePending, moveSubmit, onOpen: openSheet, showArchived };

  return (
    <>
      {archivedTotal > 0 ? (
        <Panel>
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Switch checked={showArchived} id={switchId} onCheckedChange={setShowArchived} />
              <Label className="font-normal" htmlFor={switchId}>
                {CATEGORY_COPY.showArchived}
              </Label>
            </div>
            <span className="num shrink-0 text-body-sm text-muted-foreground">
              {CATEGORY_COPY.archivedCount(archivedTotal)}
            </span>
          </div>
          <p className="text-body-sm text-muted-foreground">{CATEGORY_COPY.hint}</p>
        </Panel>
      ) : (
        /* 보관이 0개면 토글을 그리지 않는다 — 켜도 아무 변화가 없는 스위치다 (→ D-061).
           시드 직후의 기본 상태라 첫 진입에서는 안내 한 줄만 남는다. */
        <p className="px-0.5 text-body-sm text-muted-foreground">{CATEGORY_COPY.hint}</p>
      )}

      {majors.map((major) => (
        <MajorSection key={major.id} major={major} {...rowProps} />
      ))}

      {sheet && sheet.kind !== "archive" && (
        <NameSheet
          key={`name-${sheetKey(sheet)}-${openSeq}`}
          onArchive={(target) => setSheet({ kind: "archive", ...target })}
          onDone={closeSheet}
          onOpenChange={setSheetOpen}
          open={sheetOpen}
          target={sheet}
        />
      )}

      {sheet?.kind === "archive" && (
        <ArchiveSheet
          key={`archive-${sheet.categoryId}-${openSeq}`}
          onDone={closeSheet}
          onOpenChange={setSheetOpen}
          open={sheetOpen}
          target={sheet}
        />
      )}
    </>
  );
}

function sheetKey(target: SheetTarget): string {
  return target.kind === "add" ? `add-${target.parentId}` : target.categoryId;
}

/* ────────────────────────────────────────────────────────────── 트리 */

type RowProps = {
  showArchived: boolean;
  moveSubmit: (formData: FormData) => void;
  movePending: boolean;
  moveError: CategoryActionState | null;
  onOpen: (target: SheetTarget) => void;
};

function MajorSection({ major, ...rest }: { major: MajorCategory } & RowProps) {
  const { showArchived, onOpen } = rest;

  const activeMids = major.mids.filter((mid) => !mid.isArchived);
  const visibleMids = showArchived ? major.mids : activeMids;
  /* 활성 형제가 하나뿐이면 옮길 곳이 없다 — 화살표 열 자체를 그리지 않는다. */
  const reorderable = activeMids.length >= 2;

  const visibleMinorCount = visibleMids.reduce(
    (sum, mid) =>
      sum + (showArchived ? mid.minors.length : mid.minors.filter((m) => !m.isArchived).length),
    0,
  );

  return (
    <>
      <SectionHeader
        meta={CATEGORY_COPY.majorMeta(visibleMids.length, visibleMinorCount)}
        title={
          <button
            /* 대분류에 열려 있는 동작은 이름 변경 하나뿐이다 (→ D-027).
               제목이 22px이라 위아래 6px씩 먹어 44px 타깃을 만든다. */
            aria-label={CATEGORY_COPY.editAria(CATEGORY_LEVEL_LABEL.major, major.name)}
            className="-my-1.5 flex min-h-11 max-w-full min-w-0 items-center gap-2 rounded-lg py-1.5 text-left focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            onClick={() =>
              onOpen({
                kind: "rename",
                level: "major",
                categoryId: major.id,
                name: major.name,
                path: major.name,
                archive: null,
              })
            }
            type="button"
          >
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: majorColor(major.majorKey) }}
            />
            <span className="truncate">{major.name}</span>
          </button>
        }
      />

      <Panel flush>
        <ul>
          {visibleMids.length === 0 ? (
            <li className="flex min-h-11 items-center px-4 py-2 text-body-sm text-muted-foreground">
              {major.mids.length > 0
                ? CATEGORY_COPY.midsAllArchived(major.mids.length)
                : CATEGORY_COPY.midsEmpty}
            </li>
          ) : (
            visibleMids.map((mid, index) => (
              <MidGroup
                canDown={reorderable && !mid.isArchived && index < activeMids.length - 1}
                canUp={reorderable && !mid.isArchived && index > 0}
                key={mid.id}
                majorName={major.name}
                mid={mid}
                reorderable={reorderable}
                {...rest}
              />
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
  reorderable,
  canUp,
  canDown,
  showArchived,
  moveSubmit,
  movePending,
  moveError,
  onOpen,
}: {
  mid: MidCategory;
  majorName: string;
  reorderable: boolean;
  canUp: boolean;
  canDown: boolean;
} & RowProps) {
  const activeMinors = mid.minors.filter((minor) => !minor.isArchived);
  const visibleMinors = showArchived ? mid.minors : activeMinors;
  const archivedMinorCount = mid.minors.length - activeMinors.length;
  const minorsReorderable = activeMinors.length >= 2;

  /* 🔴 자기 행의 결과만 그린다. 트리에 행이 40개라 다른 행의 실패가 여기로 새면
     사용자는 방금 누르지도 않은 항목이 실패했다고 읽는다. */
  const midAlert = moveError && moveError.categoryId === mid.id ? moveError.alert : undefined;

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
      {/* 중분류는 그룹 헤더다 — `ListRow`를 쓰지 않는다 (→ D-021).
          소분류와 같은 컴포넌트를 쓰면 `<li>` 안에 `<li>`가 생기기도 한다. */}
      <div className="flex items-center bg-muted pr-4">
        <button
          aria-label={CATEGORY_COPY.editAria(CATEGORY_LEVEL_LABEL.mid, mid.name)}
          className="flex min-h-12 min-w-0 flex-1 items-center gap-2 px-4 py-2 text-left transition-colors active:bg-border/70 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:-outline-offset-2 focus-visible:outline-none"
          onClick={() =>
            onOpen({
              kind: "rename",
              level: "mid",
              categoryId: mid.id,
              name: mid.name,
              path: CATEGORY_COPY.path([majorName, mid.name]),
              archive: midArchive,
            })
          }
          type="button"
        >
          <span className="truncate text-body-sm font-bold text-muted-foreground" title={mid.name}>
            {mid.name}
          </span>
          {mid.isArchived && <ArchivedBadge />}
        </button>

        {reorderable && (
          <ReorderColumn
            canDown={canDown}
            canUp={canUp}
            categoryId={mid.id}
            disabled={movePending}
            name={mid.name}
            submit={moveSubmit}
          />
        )}
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
          visibleMinors.map((minor, index) => (
            <MinorRow
              canDown={minorsReorderable && !minor.isArchived && index < activeMinors.length - 1}
              canUp={minorsReorderable && !minor.isArchived && index > 0}
              key={minor.id}
              minor={minor}
              moveError={moveError}
              movePending={movePending}
              moveSubmit={moveSubmit}
              onOpen={onOpen}
              path={CATEGORY_COPY.path([majorName, mid.name, minor.name])}
              reorderable={minorsReorderable}
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
                path: CATEGORY_COPY.path([majorName, mid.name]),
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
  reorderable,
  canUp,
  canDown,
  moveSubmit,
  movePending,
  moveError,
  onOpen,
}: {
  minor: MidCategory["minors"][number];
  path: string;
  reorderable: boolean;
  canUp: boolean;
  canDown: boolean;
} & Omit<RowProps, "showArchived">) {
  const rowAlert = moveError && moveError.categoryId === minor.id ? moveError.alert : undefined;

  return (
    <>
      <ListRow
        actionLabel={CATEGORY_COPY.editAria(CATEGORY_LEVEL_LABEL.minor, minor.name)}
        // 화살표가 이미 오른쪽 끝을 쓰고 있어 › 까지 두면 표식이 셋이 된다.
        chevron={false}
        // 좌우 패딩이 `<li>`로 올라간다 — 행 버튼의 px-4에 16px을 더해 한 단계(16px) 들여쓴다.
        className="pr-4 pl-4"
        meta={minor.isArchived ? <ArchivedBadge /> : undefined}
        onClick={() =>
          onOpen({
            kind: "rename",
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
          })
        }
        title={
          /* 보관 표시를 `opacity`로 만들지 않는다 — 알파는 자식의 대비를 계산 불가능하게
             만든다(`text-muted-foreground` 4.83:1이 2.3:1로 내려앉는다). (→ D-069) */
          <span className={cn(minor.isArchived && "text-muted-foreground")} title={minor.name}>
            {minor.name}
          </span>
        }
        trailingAction={
          reorderable ? (
            <ReorderColumn
              canDown={canDown}
              canUp={canUp}
              categoryId={minor.id}
              disabled={movePending}
              name={minor.name}
              submit={moveSubmit}
            />
          ) : undefined
        }
      />

      {rowAlert && (
        <li className="px-4 pb-2 pl-8">
          <InlineError message={rowAlert} />
        </li>
      )}
    </>
  );
}

function ArchivedBadge() {
  return (
    <span className="shrink-0 rounded-lg border border-border bg-muted px-2 py-0.5 text-caption text-muted-foreground">
      {CATEGORY_COPY.archivedBadge}
    </span>
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
      className={cn(
        "flex min-h-12 w-full items-center gap-2 py-2 pr-4 text-left",
        "text-body-sm font-medium text-muted-foreground transition-colors active:bg-muted",
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

/* ──────────────────────────────────────────────────────── 순서 변경 */

/**
 * 행 우측 96px 고정 열(44 + 8 + 44).
 *
 * 🔴 **없는 화살표는 버튼만 지우고 자리는 남긴다** (→ D-067). 자리까지 접으면 ↓의 x좌표가
 * 행마다 달라져 연타가 빗나간다. D-061이 금지한 것은 눌러도 아무 일 없는 **비활성 버튼**이지
 * 빈 자리가 아니다. 보관된 행에는 둘 다 없다 — `compareSiblings`가 보관을 꼬리로 몰아
 * 활성 집합이 언제나 접두사라, 보관 항목 사이의 순서에는 의미가 없다.
 */
function ReorderColumn({
  categoryId,
  name,
  canUp,
  canDown,
  disabled,
  submit,
}: {
  categoryId: string;
  name: string;
  canUp: boolean;
  canDown: boolean;
  disabled: boolean;
  submit: (formData: FormData) => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2 pl-1">
      {canUp ? (
        <MoveForm
          categoryId={categoryId}
          direction="up"
          disabled={disabled}
          label={CATEGORY_COPY.moveUp(name)}
          submit={submit}
        />
      ) : (
        <span aria-hidden className="size-11 shrink-0" />
      )}
      {canDown ? (
        <MoveForm
          categoryId={categoryId}
          direction="down"
          disabled={disabled}
          label={CATEGORY_COPY.moveDown(name)}
          submit={submit}
        />
      ) : (
        <span aria-hidden className="size-11 shrink-0" />
      )}
    </div>
  );
}

function MoveForm({
  categoryId,
  direction,
  label,
  disabled,
  submit,
}: {
  categoryId: string;
  direction: "up" | "down";
  label: string;
  disabled: boolean;
  submit: (formData: FormData) => void;
}) {
  return (
    <form action={submit}>
      <input name="categoryId" type="hidden" value={categoryId} />
      <input name="direction" type="hidden" value={direction} />
      <MoveButton direction={direction} disabled={disabled} label={label} />
    </form>
  );
}

/** `useFormStatus`는 **자기 폼의 제출만** 본다. 그래서 눌린 화살표만 스피너가 된다. */
function MoveButton({
  direction,
  label,
  disabled,
}: {
  direction: "up" | "down";
  label: string;
  disabled: boolean;
}) {
  const { pending } = useFormStatus();
  const Icon = direction === "up" ? ArrowUp : ArrowDown;

  return (
    <Button
      aria-label={label}
      className="text-muted-foreground"
      disabled={disabled}
      size="icon"
      type="submit"
      variant="ghost"
    >
      {pending ? (
        <LoaderCircle
          aria-hidden
          className="animate-spin motion-reduce:animate-none"
          strokeWidth={2}
        />
      ) : (
        <Icon aria-hidden strokeWidth={2} />
      )}
    </Button>
  );
}

/* ────────────────────────────────────────────────────────────── 시트 */

/**
 * 추가 · 이름 변경. **명시적 저장 버튼**이다 (→ D-019) — 설정의 자동 저장 규칙은
 * 폼 화면에 걸리고, 시트는 한 벌을 채워 커밋하는 자리다.
 */
function NameSheet({
  target,
  open,
  onOpenChange,
  onDone,
  onArchive,
}: {
  target: Extract<SheetTarget, { kind: "add" | "rename" }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
  onArchive: (target: ArchiveTarget) => void;
}) {
  const isAdd = target.kind === "add";
  const levelLabel = CATEGORY_LEVEL_LABEL[target.level];
  const formId = useId();
  const alertRef = useRef<HTMLDivElement>(null);

  const [state, submit, pending] = useActionState<CategoryActionState, FormData>(
    async (prev, formData) => {
      const next = isAdd
        ? await createCategoryAction(prev, formData)
        : await renameCategoryAction(prev, formData);
      // 성공하면 새 트리가 revalidate로 내려온다. 시트는 그때 닫는다.
      if (next.status === "done") onDone();
      return next;
    },
    CATEGORY_ACTION_IDLE,
  );

  /* 포커스 이동이 곧 낭독이다(→ D-037). 고칠 입력이 있으면 거기로, 없으면 알림으로. */
  useEffect(() => {
    if (state.status !== "error") return;
    if (state.field === "name" && focusFieldControl(NAME_FIELD_ID)) return;
    alertRef.current?.focus();
  }, [state]);

  // 제출 중에는 직전 실패를 감춘다.
  const shown = pending ? CATEGORY_ACTION_IDLE : state;
  const archive = target.kind === "rename" ? target.archive : null;

  return (
    <BottomSheet
      footer={
        <div className="flex flex-col gap-2">
          {/* 저장 버튼은 시트 하단 고정 영역이라 폼 바깥이다. `form` 속성으로 잇는다. */}
          <Button className="w-full" disabled={pending} form={formId} size="lg" type="submit">
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
      title={isAdd ? CATEGORY_COPY.addTitle(levelLabel) : CATEGORY_COPY.renameTitle(levelLabel)}
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
          help={target.level === "major" ? CATEGORY_COPY.majorNameHelp : CATEGORY_COPY.nameHelp}
          id={NAME_FIELD_ID}
          label={CATEGORY_COPY.nameLabel}
          name="name"
          placeholder={isAdd ? CATEGORY_COPY.namePlaceholder : undefined}
        />
      </form>

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
            {archive.nextArchived ? CATEGORY_COPY.archiveAction : CATEGORY_COPY.restoreAction}
          </Button>
          {archive.nextArchived && (
            <p className="px-0.5 text-caption text-muted-foreground">
              {CATEGORY_COPY.archiveActionHint}
            </p>
          )}
        </div>
      )}
    </BottomSheet>
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
  const [state, submit, pending] = useActionState<CategoryActionState, FormData>(
    async (prev, formData) => {
      const next = await setCategoryArchivedAction(prev, formData);
      if (next.status === "done") onDone();
      return next;
    },
    CATEGORY_ACTION_IDLE,
  );

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
        target.nextArchived ? CATEGORY_COPY.archiveConfirm : CATEGORY_COPY.restoreConfirm
      }
      hidden={{ categoryId: target.categoryId, archived: String(target.nextArchived) }}
      onOpenChange={onOpenChange}
      open={open}
      pending={pending}
      pendingLabel={
        target.nextArchived ? CATEGORY_COPY.archivePending : CATEGORY_COPY.restorePending
      }
      title={
        target.nextArchived
          ? CATEGORY_COPY.archiveTitle(levelLabel)
          : CATEGORY_COPY.restoreTitle(levelLabel)
      }
    />
  );
}
