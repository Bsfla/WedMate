/**
 * 예식 정보 화면의 상태 타입 + **사용자에게 보이는 문구 전부**.
 *
 * `actions.ts`가 아니라 여기 있는 이유: `"use server"` 파일은 **async 함수만** export할 수 있다.
 * 상수 하나라도 같이 내보내면 빌드가 `invalid-use-server-value`로 실패한다.
 * (온보딩·초대·로그인의 `types.ts`와 같은 이유·같은 구조다.)
 *
 * 🔴 **상한값을 여기 적지 않는다.** `@/lib/couple-limits`에서 받아 문장에 끼운다 —
 * 온보딩도 같은 상한을 쓰므로 두 벌로 적으면 한쪽만 고쳐진다. 그 모듈은 아무것도 import하지
 * 않아 클라이언트 폼이 이 파일을 가져가도 `next/headers`가 딸려오지 않는다. (→ D-064)
 */

import { MAX_GUEST_GUARANTEE, MAX_UNIT_AMOUNT } from "@/lib/couple-limits";
import { formatNumber } from "@/lib/format";

/** 에러를 귀속시킬 입력. **값이 곧 DOM의 `id`다** (`focusFieldControl`의 규약). */
export type WeddingInfoField =
  | "weddingDate"
  | "totalBudget"
  | "guestMinGuarantee"
  | "mealCostPerHead"
  | "avgGiftAmount";

/** 저장에 성공한 5값. 화면이 현재 입력값과 견줘 성공 블록을 계속 보일지 정한다. */
export type SavedWeddingInfo = {
  weddingDate: string;
  totalBudget: number;
  guestMinGuarantee: number;
  mealCostPerHead: number;
  avgGiftAmount: number;
};

export type WeddingInfoState = {
  status: "idle" | "error" | "saved";
  /**
   * 폼 상단 `FormAlert`에 뜨는 문구. **어느 입력을 고쳐야 할지 말할 수 없을 때**만 채운다. → D-037
   */
  alert?: string;
  /** 에러가 귀속되는 입력. 채우면 그 컨트롤 밑에 `fieldMessage`가 뜨고 포커스도 그리로 간다. */
  field?: WeddingInfoField;
  fieldMessage?: string;
  /**
   * 저장된 값. **`status: "saved"`일 때만 채운다.**
   *
   * 이 값이 있어야 성공 블록이 "지금 화면에 있는 값이 저장된 그 값인가"를 판정할 수 있다.
   * 사람이 저장 뒤 숫자를 다시 만지기 시작하면 낡은 "저장했어요"가 저절로 사라진다.
   * (조정 루프가 있는 화면이다 — 하객 탭을 보고 와서 다시 고친다.)
   */
  saved?: SavedWeddingInfo;
};

export const WEDDING_INFO_IDLE: WeddingInfoState = { status: "idle" };

/**
 * 화면 문구. "올바르지 않습니다" 류를 쓰지 않는다 — 무엇이 잘못됐고 어떻게 고치는지 쓴다.
 *
 * 도움말이 값마다 두 벌인 필드가 있다(`*Zero`). **0이 유효값이면서 결과를 바꾸는 필드**라
 * 0으로 두면 무슨 일이 생기는지 그 자리에서 말해 준다 — 조용히 두면 하객 탭의 손익이
 * 왜 마이너스인지 알 길이 없다.
 */
export const WEDDING_INFO_COPY = {
  title: "예식 정보",

  basicTitle: "기본",
  guestTitle: "하객 정산 기준",
  guestDescription:
    "계약서에 적힌 숫자를 그대로 넣어 주세요. 하객 탭의 경고와 최종 손익이 이 값으로 계산돼요.",

  weddingDateLabel: "예식일",
  totalBudgetLabel: "총 가용예산",
  guestMinGuaranteeLabel: "최소보증인원",
  mealCostPerHeadLabel: "1인 식대",
  avgGiftAmountLabel: "평균 축의금 (1인)",

  weddingDateHelp: "홈의 D-day와 설정 화면의 예식일이 이 날짜로 바뀌어요.",

  totalBudgetHelp: "홈의 소진율과 남은 예산이 이 금액을 기준으로 계산돼요.",
  totalBudgetZeroHelp:
    "비워 두면 홈에서 소진율과 남은 예산을 계산하지 않아요. 나중에 정해도 괜찮아요.",

  guestMinGuaranteeHelp:
    "예식장과 계약한 보증 인원이에요. 참석 예상이 이보다 적으면 하객 탭에 부족분이 뜹니다.",
  guestMinGuaranteeZeroHelp:
    "0명으로 두면 보증인원 부족 경고가 뜨지 않아요. 보증 없는 계약이면 그대로 두세요.",

  mealCostPerHeadHelp: "보증 인원에서 모자란 사람 수만큼 이 금액이 추가로 청구돼요.",
  mealCostPerHeadZeroHelp: "0원으로 두면 부족분 식대를 계산하지 않아요.",

  avgGiftAmountHelp:
    "하객 한 명이 낼 축의금의 평균이에요. 하객 탭의 예상 축의금과 최종 손익이 여기서 나와요.",
  avgGiftAmountZeroHelp:
    "0원으로 두면 예상 축의금이 0이 돼서, 하객 탭의 최종 손익이 결혼식 예산만큼 마이너스로 보여요.",

  submit: "예식 정보 저장",
  submitting: "저장하는 중…",

  savedTitle: "저장했어요",
  /**
   * 🔴 "즉시"·"바로"를 쓰지 않는다. `revalidatePath`는 **이 사용자의** 캐시만 무효화한다 —
   * 상대 브라우저는 다시 열어야 새 값을 받는다. 여기서 "바로 반영돼요"라고 하면 거짓말이다.
   */
  savedBody: "홈과 하객 탭에 반영됐어요. 상대 화면에는 다시 열었을 때 보여요.",

  weddingDateRequired: "예식일을 골라 주세요. 홈의 D-day가 이 날짜로 계산돼요.",
  weddingDateInvalid: "예식일을 달력에서 다시 골라 주세요. 2026-11-14 같은 형식이어야 해요.",
  /* 온보딩과 같은 상한이라 같은 문장을 쓴다 (`ONBOARDING_COPY.budgetTooLarge`). */
  totalBudgetTooLarge: "총 예산이 너무 커요. 1조 원 미만으로 입력해 주세요.",
  perHeadTooLarge: `1인당 금액이 너무 커요. ${formatNumber(MAX_UNIT_AMOUNT)}원 미만으로 입력해 주세요.`,
  guaranteeTooLarge: `최소보증인원은 ${formatNumber(MAX_GUEST_GUARANTEE)}명까지 넣을 수 있어요. 계약서의 보증 인원을 다시 확인해 주세요.`,
  /* UI로는 닿을 수 없다 — 위조된 제출과 DB CHECK 위반의 착지점이다. */
  negative: "0 이상으로 입력해 주세요.",

  noCouple: "스페이스를 찾지 못했어요. 설정으로 돌아갔다가 다시 들어와 주세요.",

  loadFailedTitle: "예식 정보를 불러오지 못했어요",
  loadFailedBody: "화면을 새로고침하면 다시 시도해요. 계속 안 되면 잠시 뒤에 다시 들어와 주세요.",
  unconfiguredBody:
    "Supabase가 연결되지 않은 환경이에요. 예식 정보는 실제 DB가 연결돼야 고칠 수 있어요.",
  backToSettings: "설정으로 돌아가기",
} as const;

/* 상한값 **자체**가 필요한 곳(서버 검증)은 `@/lib/couple-limits`를 직접 import한다.
   여기서 되내보내면 같은 상수에 import 경로가 두 개 생겨, 나중에 한쪽만 보고 고치게 된다.
   이 파일이 그 값을 쓰는 것은 문장에 숫자를 끼우기 위해서뿐이다. */
