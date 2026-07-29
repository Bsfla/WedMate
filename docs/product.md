# 기획안 — 결혼준비 예산관리 가계부 웹앱

> **이 문서의 역할**: 무엇을 왜 만드는가(제품 정의 · 정보구조 · 데이터 모델).
> 언제 만드는가는 [roadmap.md](./roadmap.md), 어떻게 생겼는가는 [design-system.md](./design-system.md),
> 왜 그렇게 정했는가는 [decisions.md](./decisions.md)에 있다.
>
> 새 기능을 추가할 때는 **이 문서의 해당 절을 먼저 갱신하고** 구현에 들어간다.

## Context

참고 자료인 구글 시트(weddingreceipt 템플릿, 7개 탭)를 전수 분석한 결과, 이 시트는 단순 가계부가 아니라
**「예산 수립 → 지출 기록 → 자동 결산」 3단 파이프라인 + 하객/축의금·체크리스트·업체비교 부가 도구**의 구조를 갖는다.
스프레드시트는 모바일에서 사실상 쓸 수 없고(가로 20+ 컬럼, 셀 수식 파손 위험, "행 추가/삭제 금지" 같은 제약),
정작 예비부부가 입력해야 하는 순간은 대부분 이동 중·상담 현장이다.

**목표**: 시트의 계산 모델을 그대로 보존하면서, 모바일에서 한 손으로 입력·확인 가능한 커플 공유형 웹앱을 만든다.

**확정된 방향** (사용자 결정)
| 항목 | 결정 |
|---|---|
| 사용자 범위 | 커플 2인 공유 스페이스 (예랑/예신 각자 로그인) |
| MVP 범위 | 카테고리 · 예산 · 지출 · 결산 + 하객/축의금 |
| 가계부 성격 | 결혼준비 전용 + 저축 목표 추적 (일상 생활비 제외) |
| 기술 스택 | Next.js (App Router) + Supabase |

---

## 1단계 — 원본 시트 기능 분석 (완료)

| 탭 | 역할 | 앱에서의 대응 |
|---|---|---|
| `0.카테고리` | 대분류(결혼식/신혼여행/혼수/신혼집) → 중분류 12개 → 소분류 약 60개 + **지출방법 마스터**(예랑/예신 × 현금·카드·상품권, 공동계좌) | 카테고리 트리 + 결제수단 마스터 (설정 화면) |
| `1.예산` | 총 가용예산 → 대분류 배분 → 소분류별 예산액. 항목별 **후보업체·후기링크·전달사항** 메모 | 예산 화면 (소분류 카드에 업체/링크/메모 내장) |
| `2.지출` | `연/월/일 · 중분류 · 소분류 · 금액 · 지출방식 · 업체 · 메모 · 확정체크`. **일(日) 미입력 시 = 예상 지출**로 취급, 결산의 월별 예상금액에 반영 | 지출 원장 + 빠른입력 (예상/확정 플래그) |
| `3.결산` | 대분류별 예산·지출·소진율 / 소분류별 예산-지출-잔액-진행률 / **지출자별(예랑·예신·기타) 합계** / **연·월별 지출 타임라인** | 결산 화면 (4개 섹션 그대로) |
| `보증인원` | 하객 명단 + 동행인원, **3개 신호**(과거 경조사 참석·청첩장 모임·친분)로 참석 예측, 최소보증인원 산출, 당일 축의금(계좌이체/현금) 기록, 사후 보답 체크 | 하객 화면 |
| `체크리스트` | D-365 / 5~6개월 / 4개월 / 2~3개월 / D-30 / D-7 / D-1 / 본식후 × 6트랙 | **2차 백로그** |
| `웨딩홀` | 최대 5개 홀을 20여 항목(대관료·식대·최소보증·부가세·단독홀 등)으로 점수화 비교 | **2차 백로그** |

### 시트에서 발견한 설계 포인트
1. **예산 이중 구조의 불일치**: 결혼식 대분류 배분액 13,000,000 vs 소분류 합계 13,380,000 → 시트는 이 차이를 경고하지 않는다. → **앱에서는 배분액 대비 세부 예산 합 초과를 실시간 경고**한다.
2. **"누가 냈는가"가 결제수단에 인코딩됨** (`예신 현금`, `예랑 카드`…). 이는 결혼 준비의 실제 니즈인 **커플 간 분담 정산**을 위한 것. → payer와 method를 분리한 정규화 모델로 승격.
3. **계약금/중도금/잔금이 메모 텍스트로만 존재** → `payment_stage` enum으로 승격해 "잔금 미납 항목" 추적 가능하게 한다.
4. **축의금(수입)과 지출이 끊겨 있음** → 앱에서 연결해 **최종 손익(축의금 − 결혼식 지출)** 을 산출한다. 이 앱의 핵심 차별점.

---

## 2단계 — 제품 정의

### 한 줄 정의
> 예비부부 둘이 함께 쓰는, 결혼 준비 예산 전용 모바일 가계부.

### 3대 차별 기능 (일반 가계부 대비)
1. **분담 정산** — 예랑/예신/공동 지출을 집계해 "누가 얼마를 더 냈고, 정산하려면 얼마를 보내야 하는지" 산출
2. **예상 지출 타임라인** — 날짜 미확정 지출을 "예상"으로 등록하면 월별 현금 흐름 예측에 반영 (시트의 빨간색 로직)
3. **축의금 연동 손익** — 하객 명단 기반 예상 축의금 → 실제 축의금 → 결혼식 지출 대비 최종 손익

---

## 3단계 — 정보구조 & 화면 (모바일 우선)

### 하단 탭 5개
| 탭 | 화면 | 핵심 요소 |
|---|---|---|
| 🏠 홈 | 대시보드 | D-day, 총예산 소진 게이지, 남은 예산, 이번 달 지출/예상, 최근 지출 5건, 잔금 미납 알림, 저축 목표 진척 |
| 💰 예산 | 예산 수립 | 총 가용예산 입력 → 대분류 4개 배분 카드 → 탭하면 소분류 리스트(예산액·후보업체·후기링크·메모 편집) / **배분 초과 경고 배너** |
| 🧾 지출 | 지출 원장 | 월 단위 그룹 리스트, 필터(중분류·결제자·확정/예상·잔금상태), 우하단 FAB → 바텀시트 빠른입력 |
| 📊 결산 | 자동 집계 | ①대분류 소진율 바 ②소분류 예산-지출-잔액-진행률 테이블 ③**결제자별 분담 정산 카드** ④월별 지출 타임라인 차트 |
| 👥 하객 | 하객/축의금 | 예랑/예신 세그먼트, 명단+동행인원, 예상 참석 vs 최소보증인원 비교 게이지, 당일 축의금 입력, 보답 체크 |

설정(우상단): 카테고리 관리 · 결제수단 관리 · 커플 초대 · 저축 목표 · 예식 정보 → 아래 「인증 · 온보딩 · 설정」 절 참조

### 모바일 UI 원칙
- 뷰포트 **375px 기준 설계**, 최대 폭 480px 컨테이너 (데스크톱에서는 중앙 정렬 + 좌측 사이드 요약)
- 터치 타깃 최소 44px, safe-area-inset 대응, 하단 탭 고정
- 모든 생성/편집은 **바텀시트**로 (풀스크린 모달 지양)
- 금액 입력은 `inputMode="numeric"` + 천단위 자동 콤마 + `+1만/+10만` 퀵버튼
- 지출 리스트는 스와이프로 수정/삭제
- 낙관적 업데이트(optimistic update)로 입력 즉시 반영
- PWA (manifest + 홈화면 추가), 다크모드 지원

### 빠른입력 바텀시트 (가장 중요한 화면)
```
[ 금액 ₩ ______ ]  ← 자동 포커스, 숫자 키패드
[ 중분류 ▾ ] [ 소분류 ▾ ]   ← 최근 사용 3개 칩 우선 노출
[ 결제자: 예랑 | 예신 | 공동 ]  [ 수단: 현금|카드|상품권|계좌 ]
[ 단계: 계약금|중도금|잔금|전액 ]
[ 날짜: 2026-07-27 ]  [ □ 날짜 미정(예상) ]
[ 업체 ______ ] [ 메모 ______ ]
                              [ 저장 ]
```

---

## 인증 · 온보딩 · 설정 (P1)

5탭이 **읽는** 데이터를 실제로 만들어내는 층이다. 이게 없으면 P2(예산)·P3(지출)에서 고를 선택지가 없다.

### 의존 순서

```
예식 정보(총 가용예산·예식일)  ┐
카테고리 트리(소분류)          ├→ P2 예산 → P3 지출 → P4 결산(자동)
결제수단(결제자×수단)          ┘
```

### 화면 목록

| 화면 | 경로 | 셸 |
|---|---|---|
| 로그인 | `/login` | 탭 없음 |
| 온보딩 — 스페이스 만들기/참여 | `/onboarding` | 탭 없음 |
| 온보딩 — 예식 정보 | `/onboarding/wedding` | 탭 없음 |
| 설정 홈 | `/settings` | 탭 있음 (구현됨) |
| 예식 정보 | `/settings/wedding` | 탭 있음 |
| 카테고리 관리 | `/settings/categories` | 탭 있음 |
| 결제수단 관리 | `/settings/payment-methods` | 탭 있음 |
| 커플 초대 | `/settings/invite` | 탭 있음 |
| 저축 목표 | `/settings/savings` | 탭 있음 |

### 1) 로그인

이메일 매직링크 **하나로 시작한다**. 카카오 OAuth는 개발자 앱 등록·리다이렉트 URI·심사가 선행되어야 해서
P1을 막는다 — 백로그로 미루고, `couple_members`가 `user_id`만 참조하므로 나중에 붙여도 스키마 변경이 없다.

```
        웨딩 가계부
  둘이 함께 쓰는 결혼 준비 가계부

  [ 이메일 ____________________ ]
  [        매직링크 받기         ]

  메일함의 링크를 누르면 로그인됩니다.
  비밀번호는 없습니다.
```

전송 후에는 같은 화면이 "메일을 보냈어요" 상태로 바뀐다(재전송 60초 쿨다운). 링크는 Supabase가
`/auth/callback`으로 돌려보내고, 콜백이 세션을 심은 뒤 아래 규칙으로 분기한다.

- `couple_members`에 행이 있음 → `/` (홈)
- 없음 → `/onboarding`

### 2) 온보딩

첫 로그인 사용자가 **반드시 통과해야 하는 2단계**다. 스페이스가 없으면 5탭은 보여줄 데이터가 없다.

**Step 1 — 스페이스 만들기 / 참여하기**

```
  [ 새로 시작하기 ]   내가 먼저 만들고 상대를 초대
  [ 초대 코드로 참여 ] 상대가 이미 만들었을 때
```

- *새로 시작하기* → 내 역할 선택(예랑 / 예신) → `couples` + `couple_members` 생성 + **카테고리·결제수단 시드**
- *초대 코드로 참여* → 6자리 코드 입력 → 검증 후 `couple_members`에 **남은 역할로** 추가 (시드는 이미 있으므로 건너뜀)

**Step 2 — 예식 정보** (참여로 들어온 쪽은 이미 값이 있으므로 확인만 하고 넘어간다)

예식일과 총 가용예산만 필수, 나머지 3개는 기본값을 제안하고 나중에 고칠 수 있게 한다.

### 3) 예식 정보 — 앱 전체 계산의 기준값

| 필드 | 기본값 | 이 값이 없으면 안 되는 것 |
|---|---|---|
| 예식일 `wedding_date` | — (필수) | 홈 D-day |
| 총 가용예산 `total_budget` | — (필수) | 예산 화면 전체, 홈 소진율 게이지 |
| 최소보증인원 `guest_min_guarantee` | 200 | 하객 게이지 기준선, 부족 경고 |
| 평균 축의금 `avg_gift_amount` | 80,000 | 예상 축의금 |
| 1인 식대 `meal_cost_per_head` | 70,000 | 보증인원 미달 시 추가 청구액 |

지금은 이 값들이 `lib/mock/fixtures.ts`에 하드코딩되어 있다(그래서 D-day가 항상 D-108).

### 4) 카테고리 관리

**3단 트리.** 소분류가 예산의 단위이자 지출의 귀속 단위다.

```
결혼식 (대분류, 고정 4개)
  └ 스드메 (중분류)
      ├ 스튜디오 스냅 (소분류)  ← 예산·지출이 붙는 곳
      ├ 드레스
      └ 신부 메이크업
```

- 가입 시 기본 트리를 **커플 소유로 복사 시드**한다(전역 템플릿 참조가 아니라). 커플마다 항목을 고쳐야 하기 때문.
- 대분류 4개는 **추가·삭제하지 않는다** — 배분·차트 색·결산 구조가 4개에 묶여 있다. 이름 변경만 허용.
- 중·소분류는 추가 / 이름변경 / 순서변경 / **보관(archive)** 가능.
- **삭제 대신 보관**한다. 지출이 이미 참조 중인 카테고리를 지우면 과거 기록이 깨진다.
  보관된 항목은 새 지출의 선택지에서 빠지되 기존 기록과 결산에는 남는다.

### 5) 결제수단 관리

`결제자 3 × 수단 4 = 12` 조합. 시트에서는 `예신 현금`처럼 한 문자열이었으나 두 축으로 쪼갰다(→ D-002).
**결제자를 따로 떼야 분담 정산이 계산되기 때문**이다.

- 안 쓰는 조합은 비활성화(`is_active = false`)해 빠른입력의 선택지를 줄인다.
- `label`에 실제 이름을 붙인다 — `공동 계좌` → "신한 공동통장".
- 여기서도 삭제가 아니라 비활성화다. 이유는 카테고리와 같다.

### 6) 커플 초대

```
  초대 코드
  ┌───────────────┐
  │   K7X2M9      │   [ 복사 ]  [ 공유 ]
  └───────────────┘
  2026년 8월 5일까지 유효 · 1회용

  현재 멤버
  · 예랑  나
  · 예신  아직 참여 안 함
```

- 6자리 영숫자(혼동 문자 `0/O/1/I` 제외), 유효기간 7일, **1회용**.
- 이미 2명이면 코드 발급·사용을 막는다.
- 재발급하면 이전 코드는 즉시 무효.

### 7) 저축 목표

목록 + 바텀시트 편집. 홈 하단 카드에 진행률이 뜬다. 필드는 `savings_goals` 그대로.
**P1 범위에서 가장 덜 급하다** — 홈 카드가 없어도 예산·지출은 돈다.

---

## 4단계 — 데이터 모델 (Supabase / Postgres)

```
couples            id, name, wedding_date, total_budget, guest_min_guarantee,
                   avg_gift_amount, meal_cost_per_head, created_at
                   -- meal_cost_per_head: 보증인원 미달 시 1인당 추가 식대.
                   --   하객 화면의 부족분 계산에 쓰이며 구현(fixtures)에는 이미 있다.
couple_members     couple_id, user_id, side('groom'|'bride'), display_name  (PK: couple_id+user_id)
                   -- 한 couple에 side당 1명. UNIQUE(couple_id, side)로 3인 진입을 막는다.
couple_invites     id, couple_id, code UNIQUE, side('groom'|'bride'),
                   expires_at, used_by, used_at, created_by
                   -- side: 초대받는 쪽의 역할. 발급 시점에 남은 역할로 고정한다.
                   -- 1회용 — used_by가 차면 재사용 불가. 재발급 시 이전 코드는 즉시 만료.

categories         id, couple_id, level('major'|'mid'|'minor'), parent_id(self FK),
                   name, sort_order, is_archived
                   -- 가입 시 기본 트리(대4/중11/소25)를 커플 소유로 복사 시드
                   -- 삭제하지 않고 is_archived로 감춘다 (지출이 참조 중이므로)
payment_methods    id, couple_id, payer('groom'|'bride'|'joint'),
                   method('cash'|'card'|'voucher'|'account'), label, is_active
                   -- ⚠️ 원본 시트에는 '기타'(부모님 등 제3자) 결제자가 있었으나
                   --    현재 구현은 3종뿐이다 → decisions.md O-005 참조

budget_allocations couple_id, category_id(major), amount           -- 대분류 배분
budgets            id, couple_id, category_id(minor), amount,
                   vendor_candidate, reference_url, note           -- 소분류 예산

expenses           id, couple_id, category_id(minor), amount,
                   spent_year, spent_month, spent_day NULL,
                   is_estimated GENERATED (spent_day IS NULL),
                   payment_method_id, stage('deposit'|'interim'|'balance'|'full'),
                   vendor, memo, is_confirmed, created_by, created_at

guests             id, couple_id, side, name, companion_count,
                   sig_event_attended bool, sig_invite_meeting bool, sig_close bool,
                   expected_attend GENERATED (신호 1개 이상 TRUE),
                   actual_attend_count, gift_amount, gift_method('transfer'|'cash'),
                   repay_done bool, memo

savings_goals      id, couple_id, label, target_amount, monthly_amount,
                   months, account_name, current_amount
```

**RLS**: 모든 테이블은 `couple_id IN (SELECT couple_id FROM couple_members WHERE user_id = auth.uid())` 정책 적용.

예외 두 가지가 있고, 둘 다 P1에서 다뤄야 한다.

- `couple_members` 자신에게 같은 정책을 걸면 **자기 참조 무한 재귀**가 난다.
  `SECURITY DEFINER` 헬퍼 함수(`current_couple_id()`)를 만들어 정책에서 호출한다.
- `couple_invites`는 **코드 소유자가 아닌 사람이 조회**해야 한다(참여하려는 쪽은 아직 멤버가 아니다).
  코드로 조회·사용하는 경로는 `SECURITY DEFINER` RPC(`redeem_invite(code)`) 하나로만 열고,
  테이블 자체는 직접 SELECT를 막는다. 그래야 코드 목록을 긁어가지 못한다.

**Realtime**: `expenses`, `budgets`, `guests` 구독 → 커플 양쪽 화면 동시 반영.

### 집계 로직 (Postgres View 또는 RPC로 구현 — 클라이언트 계산 금지)
| 지표 | 산식 |
|---|---|
| 소분류 잔액 | `budget.amount − Σ(확정 지출)` |
| 소분류 진행률 | `Σ확정지출 / budget.amount` |
| 대분류 소진율 | `Σ(하위 소분류 지출) / allocation.amount` |
| **배분 초과 경고** | `Σ(하위 소분류 예산) > allocation.amount` 이면 경고 |
| **분담 정산** | payer별 지출 합 → `개인부담 목표 = 총지출/2` → `정산액 = 목표 − 본인 지출액` (공동계좌 지출은 1/2씩 귀속) |
| 월별 타임라인 | `GROUP BY spent_year, spent_month`, 확정/예상 2계열 분리 |
| 예상 참석 인원 | `Σ(expected_attend가 true인 하객의 1 + companion_count)` |
| 보증인원 갭 | `guest_min_guarantee − 예상 참석 인원` (양수면 경고) |
| 예상 축의금 | `예상 참석 인원 × avg_gift_amount` |
| **최종 손익** | `Σ(실제 축의금) − Σ(결혼식 대분류 지출)` |

---

## 5단계 — 기술 아키텍처

- **Next.js 16 App Router + TypeScript** / **Tailwind CSS v4 + shadcn-ui(radix-nova)** / **Recharts**(월별 타임라인 전용)
- **Supabase**: Postgres, Auth(카카오 OAuth + 이메일 매직링크), RLS, Realtime
- 서버 상태는 **Server Component + Server Actions** 우선, 실시간 필요한 목록만 클라이언트 구독
- 폼: `react-hook-form` + `zod`
- 통화 포맷 유틸 1개소 집중 (`lib/format.ts`) — 전 화면 `₩` 표기 통일

실제 디렉터리 구조는 아래와 같다. **화면은 `lib/mock/fixtures.ts`의 선택자 함수 하나만 호출**하고,
그 함수 본문이 목업에서 Supabase 쿼리로 바뀌는 것이 P2~P5의 작업이다.

```
src/
  app/(auth)/login/            로그인·커플 초대 수락            [P1]
  app/(app)/page.tsx           홈 대시보드
  app/(app)/budget/            예산      (+ major-card.tsx)
  app/(app)/expenses/          지출 원장 (+ expense-ledger.tsx, quick-add-sheet.tsx)
  app/(app)/report/            결산
  app/(app)/guests/            하객·축의금 (+ guest-list.tsx)
  app/(app)/settings/          카테고리·결제수단·저축목표·예식정보  [P1]
  app/design/                  스타일가이드 (하단 탭 밖 독립 라우트)
  components/ui/               shadcn (button, card)
  components/layout/           AppHeader, BottomNav, Screen, BottomSheet,
                               SegmentedControl, Fab
  components/money/            MoneyText, AmountInput, PayerChip,
                               StageBadge, EstimateBadge
  components/data/             Panel, StatTile, ListRow, ProgressBar,
                               DualProgressBar, Gauge, SectionHeader,
                               WarningBanner, EmptyState
  components/charts/           MonthlyTimeline (Recharts를 쓰는 유일한 자리)
  lib/domain.ts                대분류·결제자·수단·단계 어휘 + 라벨
  lib/format.ts                통화·비율·날짜 포맷 (금액은 반드시 여기를 경유)
  lib/mock/fixtures.ts         목업 데이터 + 집계 선택자 → P2~P5에서 교체
  lib/supabase/                client.ts, server.ts, types.ts, env.ts, session.ts
  proxy.ts                     Next 16 규약 (middleware.ts 아님)
supabase/migrations/           스키마 SQL                        [P1]
supabase/seed/categories.sql   시트 기본 카테고리 트리 시드        [P1]
```
