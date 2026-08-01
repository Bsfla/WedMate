/**
 * 초대 코드 발급 폼의 상태 + **사용자에게 보이는 문구 전부**.
 *
 * `actions.ts`가 아니라 여기 있는 이유: `"use server"` 파일은 **async 함수만** export할 수 있다.
 * 상수 하나라도 같이 내보내면 빌드가 `invalid-use-server-value`로 실패한다. (온보딩과 같은 구조)
 */

/* 이 문구들을 클라이언트 컴포넌트(`invite-block.tsx`)가 import한다.
   상수를 `lib/supabase/*`에서 가져오면 `next/headers`가 클라이언트 그래프로 딸려 들어와
   빌드가 깨지므로, 아무것도 import하지 않는 `@/lib/membership`에서 받는다. */
import { INVITE_TTL_HOURS, REMOVE_WINDOW_HOURS } from "@/lib/membership";

export type InviteState = {
  status: "idle" | "error";
  /**
   * 입력이 하나도 없는 화면이라 **모든 실패가 상단 알림으로 간다** (→ D-037).
   * 귀속시킬 필드가 없으면 필드 에러를 쓰지 않는다.
   */
  alert?: string;
  /** 발급이 구조적으로 불가능해졌다(이미 2명). 화면이 발급 버튼을 걷어낸다. */
  full?: boolean;
  /** 재발급이었는가. 성공 직후 "이전 코드는 못 써요" 배너를 띄울지 가른다. */
  regenerated?: boolean;
};

export const INVITE_IDLE: InviteState = { status: "idle" };

/**
 * 급함 표시로 넘어가는 임계값(시간).
 *
 * 만료가 48시간뿐이라 "1일 남음"은 눈금이 두 칸이라 정보가 되지 않는다. 이 표시가 답해야 하는
 * 질문은 하나다 — **"지금 새 코드를 다시 보내야 하나?"** 6시간 이하로 남았는데 상대가 아직
 * 안 들어왔다면 그렇다. 20시간이 남았다면 할 일이 없으므로 굳이 재촉하지 않는다.
 */
export const INVITE_URGENT_HOURS = 6;

export const INVITE_COPY = {
  title: "커플 초대",
  codeLabel: "초대 코드",
  /** 역할은 남은 쪽으로 **자동 고정**된다. 고르게 하는 문제가 아니라 결과를 알리는 문제다. */
  sideSlot: (sideLabel: string) => `${sideLabel} 자리`,

  /** 미발급과 만료를 구분하지 않는다 — `active_invite()`가 둘 다 null로 돌려주기 때문이다. */
  noneTitle: "지금 쓸 수 있는 초대 코드가 없어요",
  noneBody: `코드를 만들어 상대를 불러 주세요. 코드는 ${INVITE_TTL_HOURS}시간 동안 한 번만 쓸 수 있고, 지나면 저절로 없어져요.`,
  create: "초대 코드 만들기",
  creating: "코드 만드는 중…",
  regenerate: "새 코드 만들기",
  regenerateHint: "지금 코드는 즉시 쓸 수 없게 돼요",

  /**
   * D-058 이후 문구다. 이전 "한 번 연결되면 뺄 수 없어요"는 더 이상 참이 아니다 —
   * 다만 창이 24시간이라 **무제한으로 되돌릴 수 있다고 말해서도 안 된다.**
   */
  shareWarning: `코드를 받은 사람은 우리 가계부를 함께 보게 돼요. 실수로 다른 사람이 들어왔다면 ${REMOVE_WINDOW_HOURS}시간 안에 설정에서 내보낼 수 있어요.`,

  copy: "복사",
  copied: "복사됨",
  share: "공유",
  copyFailed: "복사가 안 됐어요. 위 코드를 길게 눌러 직접 복사하거나 상대에게 불러 주세요.",
  shareText: (code: string) =>
    `WedMate 결혼 준비 가계부에 초대할게요.\n초대 코드: ${code}\n${INVITE_TTL_HOURS}시간 안에 한 번만 쓸 수 있어요.`,

  /** 조회 실패. 이 상태에서 발급을 누르면 살아 있는 코드를 죽일 수 있다 (→ D-059). */
  lookupFailed: "지금 발급된 코드가 있는지 확인하지 못했어요. 새로고침하면 다시 시도합니다.",
  lookupFailedConfirm:
    "지금 발급된 코드가 있는지 확인하지 못했어요. 이미 보낸 코드가 있다면 그 코드는 즉시 무효가 돼요.",

  full: "이미 두 사람이 연결돼 있어 새 코드를 만들 수 없어요. 아래 목록에서 확인해 주세요.",
  bothConnected: "두 사람이 모두 연결됐어요",
  bothConnectedBody: "초대 코드는 더 이상 필요하지 않아요.",
  noCouple: "스페이스를 찾지 못했어요. 설정으로 돌아갔다가 다시 들어와 주세요.",

  regeneratedTitle: "새 코드를 만들었어요",
  regeneratedBody: "이전 코드는 더 이상 쓸 수 없어요. 상대에게 새 코드를 다시 보내 주세요.",

  /* ── 만료 표기 ── 절대 시각은 화면이 `Intl`(Asia/Seoul)로 만들어 문자열로 넘긴다. */
  expires: (when: string) => `${when}까지 · 1회용`,
  /** 6시간 이하. 색(`text-warning-strong`)과 문구가 **같이** 바뀐다 — 색만으로 말하지 않는다(D-006). */
  expiresUrgent: (hours: number) => `${hours}시간 뒤 만료 · 1회용`,

  /* ── 멤버 목록에서 빈 자리 ── */
  memberPending: "초대 중",
  memberPendingHint: "지금 코드가 이 자리로 연결돼요",

  /* ── 재발급 확인 ── */
  regenerateTitle: "새 코드를 만들까요?",
  regenerateBody: (code: string) =>
    `지금 코드 ${code}는 즉시 쓸 수 없게 돼요. 이미 상대에게 보냈다면 그 코드로는 들어올 수 없어요.`,
  cancel: "그대로 둘게요",

  /* ── 화면 단위 실패 ── */
  spaceFailedTitle: "스페이스 정보를 불러오지 못했어요",
  spaceFailedBody:
    "화면을 새로고침하면 다시 시도해요. 계속 안 되면 잠시 뒤에 다시 들어와 주세요.",
  unconfiguredBody:
    "Supabase가 연결되지 않은 환경이에요. 초대 코드는 실제 DB가 연결돼야 만들 수 있어요.",
  backToSettings: "설정으로 돌아가기",
} as const;
