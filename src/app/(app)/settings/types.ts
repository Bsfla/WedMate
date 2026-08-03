/**
 * 스페이스 관리(나가기 · 내보내기 · 삭제)의 상태 + 문구.
 *
 * `actions.ts`가 아니라 여기 있는 이유: `"use server"` 파일은 **async 함수만** export할 수 있다.
 *
 * 세 동작은 조건이 배타적이라 화면에 **동시에 셋이 뜨지 않는다** (→ D-058):
 *   혼자              → 스페이스 삭제
 *   둘 · 상대 24h 이내 → 내보내기 + 나가기
 *   둘 · 24h 지남      → 나가기
 */

/* 이 문구들을 클라이언트 컴포넌트(`member-list.tsx` · `space-actions.tsx`)가 import한다.
   상수를 `lib/supabase/*`에서 가져오면 `next/headers`가 클라이언트 그래프로 딸려 들어와
   빌드가 깨지므로, 아무것도 import하지 않는 `@/lib/membership`에서 받는다. */
import { REMOVE_WINDOW_HOURS } from "@/lib/membership";

export type SpaceActionState = {
  status: "idle" | "error";
  /** 이 화면의 동작들은 귀속시킬 입력이 없다. 실패는 전부 상단 알림이다 (→ D-037). */
  alert?: string;
};

export const SPACE_ACTION_IDLE: SpaceActionState = { status: "idle" };

export const SPACE_COPY = {
  /* ── 멤버 목록 (설정 홈 · 초대 화면 공용) ── */
  membersTitle: "함께 쓰는 사람",
  memberNone: "아직 연결 안 됨",
  membersFailed: "함께 쓰는 사람을 불러오지 못했어요. 화면을 새로고침하면 다시 시도합니다.",

  /* ── 내보내기 ── */
  remove: "내보내기",
  removing: "내보내는 중…",
  /**
   * 내보내기 버튼 옆 한 줄. 버튼만 덩그러니 있으면 **누구를 왜 뺄 수 있는지**가 없어
   * 잘못 누르기 쉽다. `canRemove`가 참인 시간이 최대 24시간이라 평소엔 이 줄도 없다.
   */
  removeStripHint: `방금 들어온 사람은 ${REMOVE_WINDOW_HOURS}시간 안에 내보낼 수 있어요`,
  removeTitle: (name: string) => `${name} 님을 내보낼까요?`,
  removeBody:
    "이 사람은 우리 가계부를 더 이상 볼 수 없게 돼요. 지금까지 입력된 지출과 예산은 그대로 남아요.",
  /**
   * 렌더 시점엔 열려 있던 창이 제출 시점에 닫힐 수 있다. `canRemove`는 화면을 그리는 근거일 뿐
   * 최종 판정은 DB가 한다 — 그래서 이 문구가 필요하다.
   */
  removeWindowClosed: `내보낼 수 있는 시간(${REMOVE_WINDOW_HOURS}시간)이 지났어요. 상대에게 직접 나가 달라고 요청해 주세요.`,
  removeNotAllowed:
    "이 사람은 나보다 먼저 스페이스에 있었어요. 내가 나가려면 아래 '스페이스에서 나가기'를 써 주세요.",
  removeNotMember: "이미 나간 사람이에요. 화면을 새로고침하면 최신 목록이 보여요.",
  removeSelf: "자기 자신은 이 방법으로 뺄 수 없어요. '스페이스에서 나가기'를 써 주세요.",

  /* ── 나가기 ── */
  leave: "스페이스에서 나가기",
  leaving: "나가는 중…",
  leaveTitle: "이 스페이스에서 나갈까요?",
  leaveBody:
    "예산·지출·하객 기록을 더 이상 볼 수 없게 돼요. 기록 자체는 남아 있어서 상대는 그대로 쓸 수 있어요. 다시 들어오려면 상대에게 초대 코드를 다시 받아야 해요.",
  /** 혼자일 때 나가면 아무도 접근 못 하는 스페이스가 남는다. 그래서 이름부터 다른 동작으로 보낸다. */
  leaveLastMember:
    "혼자 남아 있어 나갈 수 없어요. 처음부터 다시 시작하려면 아래 '스페이스 삭제'를 써 주세요.",

  /* ── 삭제 ── */
  delete: "스페이스 삭제",
  deleting: "삭제하는 중…",
  deleteTitle: "스페이스를 삭제할까요?",
  deleteBody:
    "예산·지출·하객·카테고리가 모두 지워져요. 되돌릴 수 없어요. 삭제하면 처음 화면으로 돌아가 새로 시작하게 돼요.",
  deleteNotAlone:
    "둘이 함께 쓰는 스페이스는 삭제할 수 없어요. 내 기록만 정리하려면 '스페이스에서 나가기'를 써 주세요.",
  /** 🔴 유일한 게이트 체크박스 문구. 삭제만 cascade로 원장 전체가 사라진다. */
  deleteAcknowledge: "예산·지출·하객 기록이 모두 지워지는 걸 이해했어요",

  /* ── 섹션 ── */
  sectionTitle: "스페이스 관리",
  leaveCaption: "내 계정에서 이 가계부를 뗍니다",
  deleteCaption: "기록이 모두 지워져요. 되돌릴 수 없어요",

  cancel: "그대로 둘게요",
  noCouple: "스페이스를 찾지 못했어요. 화면을 새로고침하면 다시 시도합니다.",
} as const;
