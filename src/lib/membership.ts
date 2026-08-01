/**
 * 커플 스페이스 멤버십의 **시간 규칙**. DB와 화면이 같은 숫자를 봐야 하는 값들이다.
 *
 * `lib/supabase/*`가 아니라 여기 있는 이유는 **번들 경계**다. 이 값들은 화면 문구에 박히고
 * (`"48시간 동안 한 번만"`, `"24시간 안에 내보낼 수 있어요"`), 그 문구 모듈을 클라이언트
 * 컴포넌트가 import한다. `lib/supabase/*`는 `./server` → `next/headers`에 닿아 있어
 * 클라이언트 그래프에 들어가는 순간 빌드가 깨진다.
 *
 * 그래서 이 파일은 **아무것도 import하지 않는다.** 서버·클라이언트 어디서든 안전하다.
 * 새 상수를 여기 넣을 때도 그 조건을 지킨다. (같은 처방 → D-054)
 *
 * 🔴 값을 바꾸면 **마이그레이션도 같이 바꿔야 한다.** 여기는 DB의 사본이지 진실이 아니다.
 */

/**
 * 초대 코드 유효기간(시간).
 * → `create_invite()`의 `expires_at = now() + interval '48 hours'` (0008)
 */
export const INVITE_TTL_HOURS = 48;

/**
 * 오참여를 되돌릴 수 있는 창(시간). 이 시간이 지나면 상대를 내보낼 수 없다.
 * → `remove_member()`의 `created_at <= now() - interval '24 hours'` 검사 (0008, → D-058)
 *
 * 화면의 `canRemove`는 이 값으로 버튼을 그릴지만 정한다. **최종 판정은 언제나 DB다** —
 * 렌더와 제출 사이에 창이 닫히면 RPC가 `REMOVE_WINDOW_CLOSED`로 막는다.
 */
export const REMOVE_WINDOW_HOURS = 24;
