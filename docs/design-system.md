# 디자인 시스템

> **이 문서의 역할**: 화면이 어떻게 생겨야 하는가(토큰 · 타이포 · 밀도 · 컴포넌트 규칙).
> **상태: 구현 완료** (Phase PD, 2026-07-29). 아래 규칙은 전부 코드에 반영되어 있다.
>
> - 살아 있는 참조는 **`/design` 라우트** — 앱과 같은 컴포넌트를 그대로 렌더하므로 어긋날 수 없다.
> - 검토용 시안 보드는 [design-review.html](./design-review.html) (브라우저로 직접 열면 된다).
> - **새 화면·컴포넌트를 만들 때 이 문서의 규칙을 따르고, 새 규칙이 생기면 여기에 추가한 뒤 `/design`에도 반영한다.**

## 배경 — 이 작업이 필요했던 이유

P0에서 Next.js 셸(하단 5탭 · Supabase 스캐폴드 · PWA)까지 끝났지만 화면에는 디자인이 없었다. 5탭 모두 자리표시 카드에 shadcn 기본 무채색 토큰이었다. 이 상태로 P2(예산)부터 화면을 채우면 화면마다 금액 크기·색·간격이 제각각으로 굳어져 되돌리는 비용이 커진다.

그래서 **P1(인증) 앞에 디자인 단계를 넣어** 토큰·타이포·컴포넌트를 먼저 확정했다. 시안은 버려지는 목업이 아니라 **P2~P6이 그대로 이어받는 뼈대**이고, 이후 각 Phase는 목업 데이터를 Supabase 쿼리로 갈아끼우는 일만 한다.

출발점이 된 실제 결함 두 가지 — 둘 다 해결됨:

1. **터치 타깃 미달** — `components/ui/button.tsx`의 radix-nova 프리셋은 데스크톱 밀도였다. 기본 `h-8`(32px), 최대 `lg`도 `h-9`(36px)로 "터치 타깃 최소 44px" 원칙을 지킬 수 없었다.
2. **차트 색 부재** — `globals.css`의 `--chart-1~5`가 전부 무채색(`oklch(… 0 0)`)이었다. 구분 축이 세 개인 앱에서 그대로 쓸 수 없었다.

**확정된 방향**

| 항목 | 결정 |
|---|---|
| 폰트 | Pretendard (요구사항) |
| 산출 형태 | 5탭 실제 화면 적용 + `/design` 스타일가이드 |
| 비주얼 톤 | 뉴트럴 잉크 + 로즈 액센트 |
| 범위 | 하단 5탭 + 빠른입력 바텀시트 |

---

## 1. 타이포그래피 — Pretendard

`pretendard@1.3.9` npm 패키지를 설치하고 **variable dynamic-subset** CSS를 `globals.css`에서 import 한다.

```css
/* src/app/globals.css 최상단 */
@import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
```

- 검증 완료: family `'Pretendard Variable'`, `font-weight: 45 920`, `font-display: swap`, 한글 unicode-range별로 woff2가 쪼개져 **필요한 글자 조각만 내려받는다**(전체 다운로드 아님).
- `next/font/local`은 서브셋 파일이 수백 개라 부적합하다. CSS import가 정석이다.
- node_modules가 ~98MB 늘어난다(모든 포맷 포함). 배포 번들에는 실제 참조되는 woff2만 들어가므로 런타임 영향은 없다. 이게 부담되면 대안은 `public/fonts/`에 variable subset만 복사해 self-host 하는 것 — 다만 복사 스크립트가 하나 늘어난다.
- **Geist / Geist Mono는 제거한다.** `src/app/layout.tsx`의 `next/font/google` 호출 2개를 지우고, `--font-sans`를 Pretendard 스택으로 교체한다. 빌드마다 Google Fonts를 때리지 않게 되는 부수 효과가 있다.

```css
--font-sans: 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont,
             system-ui, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
--font-mono: ui-monospace, SFMono-Regular, 'SF Mono', Consolas, monospace;
```

### 타입 스케일

한글은 라틴보다 크게 잡아야 읽힌다. 본문 기준을 15px로 두고, 금액은 별도 스케일을 갖는다.

| 토큰 | 크기/행간 | 굵기 | 자간 | 용도 |
|---|---|---|---|---|
| `display` | 32 / 1.15 | 700 | -0.02em | 홈 총예산, 최종 손익 |
| `title` | 20 / 1.30 | 600 | -0.02em | 화면 제목(AppHeader) |
| `section` | 16 / 1.40 | 600 | -0.01em | 섹션 헤더 |
| `body` | 15 / 1.55 | 400 | -0.01em | 본문·리스트 |
| `body-sm` | 13 / 1.45 | 400 | 0 | 보조 설명 |
| `caption` | 12 / 1.40 | 500 | 0 | 라벨·배지 |
| `money-lg` | 24 / 1.20 | 700 | -0.02em | 카드 대표 금액 |
| `money-md` | 17 / 1.30 | 600 | -0.01em | 리스트 행 금액 |
| `money-sm` | 15 / 1.30 | 500 | -0.01em | 보조 금액 |

**한글 조판 규칙 (전역):**
- `word-break: keep-all` — 한글이 단어 중간에서 끊기는 것을 막는다. `@layer base`에 전역 적용.
- 금액·수량은 전부 `font-variant-numeric: tabular-nums`. Pretendard가 tnum을 지원하므로 별도 모노 폰트 없이 리스트에서 자릿수가 정렬된다.

🔴 **스케일을 추가하면 `lib/utils.ts`의 `cn()`에도 같이 등록한다 (→ D-044).**
tailwind-merge는 모르는 `text-*`를 색 클래스로 분류해서, 같은 `cn()` 안의 색이 크기를 밀어낸다.
등록을 빠뜨리면 **크기가 조용히 사라지고 빌드도 린트도 잡아주지 않는다.**

**문구 규칙 — 금액·사용자 입력 이름 뒤에 조사를 붙이지 않는다.**
받침 유무에 따라 조사가 갈리는데 금액은 끝자리가, 이름은 마지막 글자가 매번 달라진다
(`₩250,002이` ✗ / `₩250,000이` ✓ · `폐백을` vs `드레스를`).
`{금액} 남았어요`처럼 조사 없이 끊거나, `남은 예산 {금액}`처럼 어순을 바꾼다.
이름은 **제목에서 빼서 단계로 고정**하고(`소분류를 보관할까요?`) 본문 맨 앞에
따옴표 + 줄표로 얹는다(`'폐백' — 새 지출을 기록할 때…`).

---

## 2. 컬러 토큰

`src/app/globals.css`의 `:root` / `.dark` 블록을 확장한다. 앱 고유 토큰은 **hex로 적고** 원본 의도를 주석에 남긴다 (기존 shadcn 뉴트럴은 oklch 유지 — Tailwind v4는 두 표기를 모두 처리한다).

```
액센트    --primary            #E11D48   로즈. CTA · 활성 탭 · 진행 바
경고      --warning            #D97706   배분 초과 · 보증인원 갭 · 잔금 미납
성공      --success            #059669   잔액 여유 · 최종 손익 +
결제자    --payer-groom        #0EA5E9   예랑
          --payer-bride        #E11D48   예신
          --payer-joint        #71717A   공동 (커플 공동계좌)
          --payer-other        #8B5CF6   기타 (제3자) — chart-5와 같은 색 (→ D-023)
대분류    --chart-1  #E11D48  결혼식
          --chart-2  #F59E0B  신혼여행
          --chart-3  #0EA5E9  혼수
          --chart-4  #10B981  신혼집
          --chart-5  #8B5CF6  기타
```

**색만으로 정보를 전달하지 않는다** — 이 앱은 구분해야 할 축이 세 개(확정/예상, 결제자 4종, 대분류 4종)라 색에만 기대면 색각 이상 사용자에게 무너진다.

- 확정 지출 = 실선 테두리 + 채운 막대 / 예상 지출 = **점선 테두리 + 사선 패턴 + "예상" 배지**
- 결제자 = 색 + **텍스트 라벨(예랑/예신/공동/기타)** 병기
- 대분류 = 색 + 카테고리명 항상 노출

**다크 모드**는 `.dark` 블록에 대응값을 지금 정의해 둔다. 토글(next-themes) 자체는 기획안대로 P6에 붙인다. 시안 확인은 라이트 기준.

**대비 검증**은 구현 후 필수 단계로 넣는다(아래 "검증" 5번). `#E11D48` on `#FFFFFF`는 AA 경계선이라 **본문 텍스트색으로는 쓰지 않고** 면·테두리·큰 숫자에만 쓴다.

---

## 2-b. 브랜드 — WedMate 마크 (→ D-035)

마크는 **진행률 링**이다. 결혼반지이면서 동시에 예산 소진율 게이지 — 앱 전체가 진행률 바·게이지로
말하므로 아이콘과 제품이 같은 시각 언어를 쓴다.

```
viewBox 512 · 링 cx=256 cy=256 r=150 stroke-width=64 · 호 = 둘레의 70%, 12시 시작
바깥 반지름 182 ≤ 204.8  (maskable 안전영역 = 512 × 80% ÷ 2)
```

**round cap 보정** — round cap은 dash 양 끝에 `stroke-width/2`씩 **더** 그린다.
`dasharray`에서 `stroke-width`를 빼야 실제 비율이 된다. 빼먹으면 0.70이 0.77로 보인다.

**같은 기하가 세 곳에 있다.** 색 모델이 달라 코드를 공유할 수 없고 비율만 공유한다 —
**하나를 고치면 셋 다 고친다.**

| 파일 | 용도 | 색 |
|---|---|---|
| `components/brand/brand-mark.tsx` | 앱 내부 | 트랙 `stroke-muted`, 호 `stroke-primary` (테마 따라감) |
| `lib/brand/app-icon.tsx` | `ImageResponse` 래스터 원본 | 로즈 면 + 흰 링(트랙 32%) |
| `app/icon.svg` | 정적 파비콘 | 같음 |

`BrandLockup`(마크 + 워드마크 + 보조 문구)은 로그인과 온보딩이 같이 쓴다. **좌측 정렬을 유지한다** —
한글 태그라인이 `keep-all`로 2줄이 되면 중앙 정렬은 래그가 깨지고, 마크 좌변과 입력 좌변이
만드는 수직선도 사라진다. 워드마크는 SVG가 아니라 `text-display` 텍스트다(전용 서체가 없다).

마크 뒤의 카드 플레이트는 장식이 아니라 **기능**이다 — 웨시 위에 마크를 직접 얹으면 `--muted`
트랙이 배경과 붙어 링이 사라진다.

### `auth-wash` — 인증 화면의 온기 (→ D-038)

```css
@utility auth-wash {
  background-image: radial-gradient(130% 90% at 50% 0%,
    var(--primary-soft) 0%, var(--background) 68%);
}
```

정지점 **둘 다 미리 섞어 둔 불투명 토큰**이다. `color-mix()`도 `transparent` 알파 보간도 쓰지 않는다 —
D-012의 지뢰가 정확히 여기다. 끝 정지점이 `--background`와 같은 값이라 이음매가 없다.
`(auth)/layout.tsx`에 `aria-hidden` div로 얹는다(컨테이너에 `isolate`, 웨시는 `-z-10`).

---

## 3. 밀도 — 44px 규칙

`src/components/ui/button.tsx`의 `size` variant를 모바일 밀도로 **교체**한다.

| size | 기존 | 변경 | 용도 |
|---|---|---|---|
| `default` | h-8 (32px) | **h-11 (44px)** | 일반 버튼 |
| `lg` | h-9 (36px) | **h-12 (48px)** | 바텀시트 저장 |
| `sm` | h-7 (28px) | **h-9 (36px)** | 칩·필터 (탭 영역은 패딩으로 44px 확보) |
| `icon` | size-8 | **size-11** | 헤더·행 액션 |

> ⚠️ 이 파일은 shadcn 업스트림 파일이다. 나중에 `npx shadcn add button`을 다시 돌리면 덮어써진다. 파일 상단에 그 경고 주석을 남기고 `/design`에도 명시한다.

기타 밀도 규칙: 리스트 행 최소 높이 56px · 아이콘 버튼 44px · 인접 터치 타깃 간 최소 8px · 입력 필드 폰트 16px 이상(iOS 포커스 시 자동 확대 방지 — 이 때문에 `maximum-scale=1`로 확대를 막지 않아도 된다).

### 세로 리듬 — 간격은 화면이 아니라 컴포넌트가 갖는다 (→ D-039)

| 자리 | 값 | 누가 정하나 |
|---|---|---|
| 본문 직계 자식 사이 | **16px** | `layout/screen.tsx`의 `gap-4` |
| 섹션 헤더 **위** | 20px | `SectionHeader`의 `mt-1` |
| 섹션 헤더 **아래** | **8px** | `SectionHeader`의 `-mb-2` |
| 패널 내부 요소 사이 | 12px | `Panel`의 `gap-3` |
| 패널 패딩 | 16px (`StatTile`은 14px) | `Panel`의 `p-4` |
| 좌우 화면 패딩 | 16px (인증 셸만 24px) | `Screen`의 `px-4` |

**화면 파일에서 `mt-*` · `pt-*`로 간격을 덧대지 않는다.** 헤더가 위아래 같은 간격으로 뜨면
어느 블록의 제목인지 읽히지 않는다 — 그래서 헤더가 스스로 아래쪽에 붙는다. 화면이 여기에
`pt-1`을 더하기 시작하면 탭마다 리듬이 다시 어긋난다.

### 표면 높이(elevation) — `--elevation-*` (→ D-041)

이 앱의 기본 표면은 그림자가 아니라 **1px 테두리**다. 그림자는 **떠 있는 것**에만 쓴다.

| 유틸 | 쓰는 곳 |
|---|---|
| `shadow-raised` | 세그먼트의 선택된 알약, 팝오버 |
| `shadow-float` | 바텀시트, FAB |

**그림자 값을 클래스에 직접 적지 않는다.** 라이트의 검정 알파는 어두운 바탕에서 사라져
선택 상태가 색으로만 남는다(D-006 위반). 다크 값은 `inset 0 0 0 1px rgba(255,255,255,.08)`을
앞에 둬 안쪽 하이라이트가 "떠 있음"을 만들게 한다.

### 틴트 면(`Panel tone`) 위에 무엇을 얹을 때 (→ D-048)

| 얹는 것 | 쓰는 값 | 쓰면 안 되는 값 |
|---|---|---|
| 구분선 | `border-current/12` | `border-border/70` — 틴트 면에서 사라진다 |
| 배지 면 | `bg-card` + `border-{tone}/45` | `bg-warning/15` — 불투명 폴백에서 뒤집힌다 (D-012) |
| 목록 | 톤을 벗기고 `bg-card` | 톤 유지 — 다크에서 행 구분선이 사라진다 |

톤은 **"이 블록에 문제가 있다"는 요약의 신호**이지 항목 하나하나의 상태가 아니다.
초과된 대분류 카드에서도 앰버는 요약 블록까지고, 소분류 목록은 `bg-card`로 되돌린다.

---

## 4. 만들 컴포넌트

shadcn에서 추가로 받을 것: `input`, `label`, `separator`, `select`, `checkbox`, `switch`, `skeleton`
— **7종. P1에서 수령 완료** (2026-07-31, 아래 6-b절).

`badge`는 받지 않았다. `money/estimate-badge`·`money/stage-badge`가 이미 도메인 규칙(점선·사선 패턴·
잔금 승격)을 담고 있어 범용 badge를 얹으면 두 벌이 된다.

**바텀시트는 shadcn `drawer`를 쓰지 않는다.** 현재 shadcn drawer는 Base UI 기반으로 바뀌어, `-b radix`로 init한 이 프로젝트에 두 번째 프리미티브 라이브러리를 끌고 들어온다. 이미 설치된 `radix-ui`(v1.6.7)의 Dialog 위에 직접 만든다 — 새 의존성 0개, 44px·safe-area·드래그 핸들을 우리가 통제할 수 있다.

```
src/components/
  layout/
    bottom-sheet.tsx      Radix Dialog 기반. 하단 슬라이드업, 드래그 핸들,
                          safe-area 패딩, 최대높이 85dvh, 내부 스크롤
    segmented-control.tsx 예랑|예신|공동, 확정|예상 등 2~4분기 선택
    fab.tsx               우하단 플로팅 버튼 (하단 탭 위 16px)
  money/
    money-text.tsx        금액 렌더 단일 통로. size·부호·예상 배지 처리
    amount-input.tsx      inputMode=numeric + 천단위 콤마 + +1만/+10만 퀵버튼
    payer-chip.tsx        결제자 색 + 라벨
    stage-badge.tsx       계약금·중도금·잔금·전액
    estimate-badge.tsx    "예상" (점선)
  data/
    stat-tile.tsx         라벨 + 큰 금액 + 보조 수치
    progress-bar.tsx      단일 진행률 (role=progressbar, aria-valuenow)
    dual-progress-bar.tsx 확정(실선) + 예상(사선 패턴) 2계열
    gauge.tsx             예상 참석 vs 최소보증인원 갭
    list-row.tsx          좌 아이콘/카테고리 · 중앙 설명 · 우 금액
    section-header.tsx    섹션 제목 + 우측 액션
    warning-banner.tsx    배분 초과 · 보증인원 부족
    empty-state.tsx       빈 상태
  charts/
    monthly-timeline.tsx  Recharts. 월별 확정/예상 2계열 막대
```

**공용 레이어 2차 (2026-07-31)** — 5탭이 같은 조립을 손으로 다시 짜던 것들을 뽑았다.

```
data/
  panel.tsx           tone="default|accent|success|warning|muted" 추가.
                      화면이 `bg-success-soft border-success/35`를 손으로 적지 않는다
  section-header.tsx  meta(우측 보조 수치) · description · level="section|sub" 추가.
                      간격(위 20 / 아래 8)을 스스로 갖는다 (→ D-039)
  list-row.tsx        href/onClick 추가 — 행 전체가 터치 타깃이 되고 › 표식이 붙는다.
                      설정·카테고리 관리가 56px 행을 다시 짜지 않는다
                      + actionLabel — 제목이 곧 대상 이름이라 "폐백, 버튼"으로만 읽히는 자리
                      + titleBadge — 제목 **옆**의 짧은 배지("보관됨"). `meta`는 제목
                        아래 줄이라 배지 하나로 행이 56 → 66px가 된다 (→ D-075)
                      ✗ trailingAction — 걷어냈다. 행 우측 ↑↓(D-066)가 사라지면서
                        쓰는 곳이 0이 됐다. 남겨두면 화살표 벽이 다시 자란다
  section-header.tsx  + actionAlign="center" — action에 44px 아이콘 버튼(⋯)을 넣는 자리.
                      기본 baseline은 "전체 보기" 같은 텍스트 링크용이다 (→ D-075)
  data-row.tsx        ★신규 DataRow / DataRowGroup — "라벨 — 값" 한 줄 (→ D-040)
  error-state.tsx     ★신규 ErrorState(화면 단위) / InlineError(부분 실패) (→ D-043)
  skeletons.tsx       ★신규 Header/HeroPanel/StatGrid/List/ChipRow/ScreenSkeleton (→ D-043)
  empty-state.tsx     action 강조 · bordered(점선) 추가 (→ D-042)
  warning-banner.tsx  action 슬롯 추가 (→ D-042)
layout/
  chip.tsx            ★신규 Chip / ChipRow / ChipDivider — 필터·선택 칩 단일 규격
  screen.tsx          블록 리듬 16px (→ D-039)
app/(app)/
  loading.tsx         ★신규 그룹 기본 로딩 골격
  error.tsx           ★신규 그룹 에러 경계 — 하단 탭이 살아남는다
```

**칩은 `layout/chip.tsx` 하나만 쓴다.** 지출 필터(h-9 소프트)와 빠른입력 최근분류(h-8 솔리드)가
각자 다른 칩을 들고 있었다. 같은 제스처인데 생김새가 다르면 학습이 이어지지 않는다.
`variant="soft"`(필터) / `"solid"`(선택이 곧 입력값)로만 가른다.

### 상태 설계 — 기본 상태만 그린 화면은 미완성이다 (→ D-042 · D-043)

| 상태 | 무엇을 쓰나 | 확인 |
|---|---|---|
| 빈 상태 | `EmptyState` + **`action` 필수** | `?fixture=empty`로 5탭 |
| 로딩 | `data/skeletons.tsx` 조각. 라우트별 `loading.tsx` | 레이아웃 점프 없을 것 |
| 화면 단위 에러 | `ErrorState` + 라우트별 `error.tsx` | 하단 탭이 남는가 |
| 부분 실패 | `InlineError` — 그 자리에만 | 나머지가 계속 동작하는가 |
| 제출 중 | 버튼 비활성 + 문구 변경 + 이전 에러 제거 | `login-form.tsx`가 기준선 |

에러 문구는 **무엇이 잘못됐고 어떻게 고치는지** 쓴다. "오류가 발생했습니다"는 쓰지 않는다.

**Recharts는 월별 타임라인 하나에만 쓴다.** 소진율 바·게이지·진행률은 전부 div + `role="progressbar"`로 만든다 — 더 가볍고, 스크린리더가 값을 읽고, 다크모드 대응이 자동이다. `recharts@3.10.1`은 React 19 peer를 공식 지원한다(확인 완료).

기존 `src/lib/format.ts`를 그대로 재사용한다 — `formatWon` / `formatCompactWon`(차트 축·좁은 칩 전용) / `formatPercent` / `formatDday` / `clampedPercent`. 새 포맷 함수를 만들지 않는다.

**좁은 칸의 큰 금액** — `MoneyText compact="auto"`는 **1억 이상일 때만** 축약한다.
타입 스케일이 9단 고정이라 글자를 줄여 맞출 수 없고, 375px 2칸 그리드의 내부 폭은
≈138px이라 `money-lg`(24px)로 11자를 넘기면 잘린다. `StatTile`은 이미 `auto`가 기본이다.
축약해도 정확한 금액은 `title` 속성에 남는다 — 표시상의 타협이지 정보를 버리는 게 아니다.

---

## 5. 목업 데이터

`src/lib/mock/fixtures.ts` 한 파일에 모으고, 각 화면은 `getMockHome()` 같은 **함수 하나**를 통해서만 데이터를 받는다. P2~P5에서 이 함수 본문만 Supabase 쿼리로 바꾸면 화면 코드는 손대지 않는다.

세 가지 세트를 두고 `?fixture=` 쿼리로 전환한다.

| 세트 | 목적 | 내용 |
|---|---|---|
| `rich` (기본) | 시안 밀도 확인 | 여러 달 지출, 예상 지출 혼재, 예랑/예신/공동 섞임 |
| `sheet` | **DoD 재현** | 기획안 검증 항목의 시트 실측치 그대로 |
| `empty` | 빈 상태 | 데이터 0건 |

`sheet` 세트는 기획안 "검증 방법"의 수치를 그대로 쓴다 — 총예산 26,000,000 / 결혼식 배분 13,000,000 / 소분류 합 13,380,000 / 지출 1건(2026-07-27 · 스튜디오 스냅 · 220,000 · 예신 현금 · 모스앤코튼 · 계약금) / 하객 예상 참석 207명. 결혼식은 **배분 13,000,000 < 세부 합 13,380,000이라 초과 경고가 떠야 한다** — 시안이 이 경고의 실제 생김새를 보여주는 자리가 된다.

> 결혼식 외 3개 대분류 배분액은 기획안에 없어 시안용으로 가정한다(신혼여행 5,000,000 / 혼수 5,000,000 / 신혼집 3,000,000 = 총 26,000,000). 파일 주석에 "가정값" 표기.

---

## 6. 화면 시안

각 화면은 `PlaceholderScreen`을 걷어내고 실제 레이아웃으로 교체한다. `src/components/layout/placeholder-screen.tsx`는 이 단계 종료 시 삭제한다.

**홈** `src/app/(app)/page.tsx`
D-day 헤더 → 총예산 소진 StatTile(dual-progress: 확정+예상) → 남은 예산 → 이번 달 확정/예상 2칸 → 최근 지출 5건 → 잔금 미납 경고 → 저축 목표 진행률

**예산** `src/app/(app)/budget/page.tsx`
총 가용예산 카드 → 배분 초과 WarningBanner → 대분류 4장(각 소진율 바 + 배분액 대비 세부합) → 카드 탭 시 소분류 리스트(예산액·후보업체·후기링크·메모)

**지출** `src/app/(app)/expenses/page.tsx`
필터 바(중분류·결제자·확정/예상·잔금) → 월 그룹 헤더(월 합계) → ListRow들(카테고리·업체·결제자칩·단계배지·금액, 예상은 점선) → FAB → **빠른입력 바텀시트**

바텀시트는 기획안의 순서 그대로: 금액(자동 포커스·숫자패드·퀵버튼) → 중분류/소분류(최근 3개 칩 먼저) → 결제자 세그먼트 → 수단 세그먼트 → 단계 세그먼트 → 날짜 + "날짜 미정(예상)" 체크 → 업체 → 메모 → 저장. 시안 단계에서는 저장이 로컬 상태만 갱신한다.

**결산** `src/app/(app)/report/page.tsx`
①대분류 소진율 바 4개 → ②소분류 예산-지출-잔액-진행률 테이블(가로 스크롤 없이 2행 구성) → ③**분담 정산 카드**(예랑/예신 각 지출액 + "OO가 △△에게 ₩X 보내면 정산 완료") → ④월별 타임라인 차트(확정 실선 / 예상 사선)

**하객** `src/app/(app)/guests/page.tsx`
예랑/예신 세그먼트 → 예상 참석 vs 최소보증인원 Gauge(갭 경고) → 예상 축의금 → 명단 리스트(동행인원·3신호 체크·축의금·보답) → 최종 손익 카드(축의금 − 결혼식 지출)

**스타일가이드** `src/app/design/page.tsx` (하단 탭 밖의 독립 라우트)
① 컬러 토큰 스와치(라이트/다크 + 대비비 수치) ② Pretendard 타입 스케일 실물 ③ 간격·라디우스·그림자 ④ **금액 표기 규칙** 예시 ⑤ 컴포넌트 갤러리(위 전 컴포넌트의 모든 상태) ⑥ 44px 밀도 규칙과 button.tsx 오버라이드 경고 ⑦ fixture 세트 전환 링크

---

## 6-b. P1 화면 규격 (인증 · 온보딩 · 설정)

PD에서 만든 5탭은 전부 **읽기 화면**이라 폼 규격이 없다. P1은 앱의 첫 쓰기 화면이므로
아래 규격을 먼저 정하고 들어간다. 화면 목록과 기능 정의는 [product.md](./product.md)에 있다.

### 인증·온보딩 셸 — 5탭과 다른 구조

`/login`, `/onboarding/*`은 하단 탭이 **없다**. 아직 스페이스가 없어 갈 곳이 없기 때문이다.

셸의 실체는 **`components/layout/auth-shell.tsx` 하나다.** `(auth)/layout.tsx`와
`onboarding/layout.tsx`가 같은 컴포넌트를 쓴다 — `isolate` + `-z-10` + `inset-x-0` + `sm:border-x`의
상호작용이 미묘해서 복사하면 반드시 한쪽이 어긋난다. 하단 슬롯(`footer`)은 `mt-auto`로 바닥에 붙는다.

- 컨테이너는 동일하게 `max-w-[480px]` 중앙 정렬, 좌우 패딩 24px(탭 화면의 16px보다 넓게 — 폼 한 벌만 놓이므로)
- 세로 중앙 정렬이 아니라 **상단에서 시작**한다. 키보드가 올라올 때 필드가 가려지지 않게.
- 하단 CTA는 `Button size="lg"`(48px) 전폭 고정, `pb-[max(1.5rem,env(safe-area-inset-bottom))]`
- 온보딩은 2단계뿐이라 진행 표시를 **점 2개**로만 둔다. 숫자 스텝퍼는 과하다.

### 폼 필드 규격

빠른입력 시트의 `FieldBox`를 정식 컴포넌트로 승격시킨다. 지금은 `quick-add-sheet.tsx` 안의
로컬 헬퍼라 재사용이 안 된다.

| 항목 | 값 | 이유 |
|---|---|---|
| 높이 | 48px (`min-h-12`) | 44px 규칙 + 여유 |
| 폰트 | **16px 이상** | 16px 미만이면 iOS가 포커스 시 자동 확대한다. 확대 봉인은 접근성 위반이라 폰트로 푼다 |
| 라디우스 | 12px (`--radius`) | 버튼과 동일 |
| 라벨 | `text-caption text-muted-foreground`, 필드 위 6px | |
| 도움말 | `text-body-sm text-muted-foreground`, 필드 아래 | |
| 에러 | `text-body-sm text-primary` + 테두리 `border-primary` | `--warning`은 대비 미달이라 텍스트로 못 쓴다(D-007) |
| 포커스 | `ring-3 ring-ring/50` | 기존 컴포넌트와 동일 |

**에러 문구 규칙** — 무엇이 잘못됐고 어떻게 고치는지 쓴다. "올바르지 않습니다" 같은 문구는 쓰지 않는다.
`"초대 코드를 찾을 수 없어요. 6자리를 다시 확인해 주세요."`

**금액 입력은 `AmountInput`을 그대로 쓴다** — 총 가용예산·저축 목표·축의금 전부. 새로 만들지 않는다.
퀵버튼 단위만 `steps`로 가른다: `expense`(기본, +1만/+10만/+100만) · `budget`(+100만/+500만/+1,000만).
`expense`로 2,600만 원을 채우려면 +100만을 26번 눌러야 한다.

### 히어로 입력 — 58px 단일 규격

화면당 **하나뿐인** 주인공 입력의 높이는 58px로 통일한다(`min-h-[58px]`). 지금은 두 개다.

| 컴포넌트 | 쓰는 화면 | 글자 |
|---|---|---|
| `money/amount-input` | 빠른입력 · 온보딩 총예산 | 26px 볼드 · `.num` |
| `form/code-input` | 온보딩 코드 입력 | `text-display`(32) · `.num` · 자간 0.28em |

둘 다 테두리 `border-primary` + `ring-3 ring-primary-soft`를 **항상** 켜 둔다 — 포커스 여부가 아니라
"이 화면에서 칠 곳은 여기"를 말하는 표식이다. 일반 필드(48px)와 높이로 위계가 갈린다.
`Field`와 붙일 때는 `id`·`describedBy`·`invalid` 세 통로로 접근성 속성을 **안쪽 `<input>`까지** 내린다
(래퍼가 들고 있으면 포커스가 input에 있을 때 에러가 낭독되지 않는다).

### 코드 입력 — 분할 6칸을 쓰지 않는다

주 경로가 **카카오톡에서 받은 코드 붙여넣기**다. 분할 칸은 붙여넣기 분배·백스페이스 역이동·중간 글자
정정·IME·스크린리더 낭독을 전부 직접 구현해야 하고 정확히 거기서 깨진다. 한 칸이면 브라우저가 해 준다.
"6칸이 보여서 6자리인 줄 안다"는 자간 + 라벨로 대신한다.

- **정규화는 관대하게, 검증은 제출 때.** `toUpperCase()` + **공백·하이픈만** 제거 + 6자 자르기.
  알파벳 밖 문자를 지우지 않는다 — 방금 친 글자가 화면에 안 나타나면 오타가 아니라 **입력창 고장**으로 읽힌다.
  제출 시 `^[2-9A-HJ-NP-Z]{6}$`(DB CHECK와 같은 식)로 보고 **가르치는 문구**를 준다:
  `"코드는 숫자와 영문 6자리예요. 0 · O · 1 · I는 쓰이지 않으니 다시 확인해 주세요."`
- `maxLength`를 걸지 않는다. 걸면 브라우저가 **붙여넣기를 먼저 자른다** — `"BK7-QX2"`가 6자로 잘린 뒤
  하이픈이 빠져 5자가 된다. 길이는 하이픈·공백을 지운 **뒤에** 자른다.
- `autoComplete="one-time-code"`를 쓰지 않는다. SMS 자동완성을 부르는데 코드는 카톡으로 온다.
  `autoCapitalize="characters"` · `autoCorrect="off"` · `spellCheck={false}` · `inputMode="text"`.
- 모노스페이스를 쓰지 않는다. 알파벳에 `0 O 1 I`가 없어 혼동 글리프 문제가 애초에 없다.
- 클립보드 읽기 버튼을 두지 않는다 — iOS 권한 프롬프트 + 브라우저 지원 편차. 롱프레스 붙여넣기로 충분하다.
- 자간은 마지막 글자 **뒤에도** 붙어 `text-center`를 왼쪽으로 민다. 같은 값을 `padding-left`로 되돌린다.

### 날짜 필드 — 막지 말고 다시 읽어 준다

네이티브 `input[type=date]` + `Input` 규격(h-12 · 16px). **`min`/`max`로 막지 않는다** —
"아직 안 정했지만 대충 내년 봄"도, "이미 치르고 정산 중"도 정상 사용이다.

- 값이 들어오면 필드 아래에 리드아웃: **`2027년 3월 20일 토요일 · D-232`**
  (`text-body-sm text-muted-foreground` + `.num`). **요일이 핵심이다** — 예식일 오타는 자릿수가 아니라
  요일에서 잡힌다. `Field`의 help 슬롯에 태워 `aria-describedby`로 낭독되게 한다.
- 지난 날짜는 같은 자리에서 `text-warning-strong`으로 `지난 날짜예요 · D+12`. **제출은 막지 않는다.**
  (`--warning`은 흰 배경 3.18:1로 텍스트 대비 미달 → 반드시 `-strong`. D-007)
- D-day는 **하이드레이션 뒤에** 붙인다. 서버(UTC)와 브라우저(KST)의 "오늘"이 갈리면 텍스트가 어긋난다.
  날짜 문자열 자체는 시간대와 무관하므로 첫 페인트부터 보인다.
- iOS Safari는 값을 `::-webkit-date-and-time-value` 안에 그리고 그 의사요소가 가운데 정렬 + 행높이 0이라
  값이 위로 몰린다. `text-left` + `min-h-[1.5em]` + `leading-[1.5]`로 되돌린다.

### 미선택 세그먼트 — 기본값을 정할 근거가 없을 때

`SegmentedControl`의 `value`는 `T | null`이다. 온보딩의 역할(예랑/예신)처럼 **필수인데 기본값의 근거가
없는** 자리는 `null`로 시작한다. 미리 하나를 켜 두면 그냥 넘기는 사람의 절반이 잘못 배정된다.

- 미선택은 **색으로 말하지 않는다** — 알약(`bg-card shadow-raised`)이 없다는 사실이 곧 신호다(D-006).
- 제출 시 미선택이면 `invalid`로 컨테이너에 `ring-3 ring-destructive/20`(다크 `/40`)을 얹고
  `Field`의 에러 문구로 무엇을 해야 하는지 쓴다.
- `Field` 안에 넣을 때 `id`·`describedBy`를 **반드시 내려보낸다.** 컨테이너가 `div`(radiogroup)라
  보이는 라벨의 `for`로 포커스가 옮겨가지는 않지만, 에러가 그룹에 붙고 `aria-invalid`가 선다.
  그룹 이름은 `aria-label`이 따로 준다.

### `Field` 안에 프리미티브가 아닌 컨트롤을 넣을 때 — 3구 규약

`AmountInput` · `CodeInput` · `SegmentedControl` · `DateField` **네 곳에서 같은 모양이 반복된다.**
`Field`의 렌더 프롭이 주는 것을 **컨트롤이 직접 받아 안쪽 요소까지 내려보내야** 한다.

```tsx
<Field error={...} id="quick-amount" label="금액">
  {(control) => (
    <AmountInput
      id={control.id}
      describedBy={control["aria-describedby"]}
      invalid={Boolean(error)}
    />
  )}
</Field>
```

**래퍼가 대신 들면 안 된다.** `aria-describedby`는 **포커스된 요소의 것만 낭독된다** — 바깥
`div[role=group]`이 들고 있으면 포커스가 안쪽 `input`에 있을 때 에러 문구가 읽히지 않는다.
실제로 빠른입력 시트의 금액·결제자·수단·단계 네 필드가 이 방식으로 끊겨 있었다.

### 온보딩 폼의 실패 상태 — 2슬롯

폼 상태는 **알림(`alert`)** 과 **필드 귀속(`field` + `fieldMessage`)** 두 슬롯을 갖는다. 둘 중 하나만 찬다.

| 무엇을 고쳐야 하나 | 어디에 |
|---|---|
| 특정 입력의 값 | 그 `Field`의 `error` + 그 컨트롤로 포커스 + `.select()` |
| 입력이 아닌 것 (이미 참여함 · 스페이스가 꽉 참) | `FormAlert` + 포커스, 필요하면 **[홈으로 가기]** 같은 다음 행동 |

`aria-live`를 쓰지 않는다(→ D-037). 포커스가 옮겨갈 때 `aria-describedby`가 낭독되므로 중복이다.
**계정 존재 여부가 새어 나갈 수 있는 실패는 필드에 붙이지 않는다** — 어느 쪽이 틀렸는지 모를 때는 알림이다.

### 인증·온보딩 셸의 푸터 슬롯

`AuthShell`은 `children` 외에 **`footer`**를 받는다. 온보딩에는 하단 탭이 없어 **잘못 들어온 사람이
나갈 길이 화면 안에 있어야 한다.**

```
Separator · pt-8 · 이메일(text-caption text-muted-foreground) · Button variant="ghost" size="sm"
```

`mt-auto`로 바닥에 붙고 본문이 길면 뒤를 따라온다. `footer`를 넘기지 않으면 DOM에서 완전히
사라지므로 `/login`은 이전과 **1px도 다르지 않다.**

### 설정 하위 화면 패턴 — ✅ `/settings/invite`가 선례다 (→ D-063)

설정 홈의 각 항목은 `/settings/*`로 들어간다. 하위 화면은 공통으로:

- **`<AppHeader back="/settings" action={null} title="…" />`**. 좌측 뒤로가기 44px,
  **우측은 반드시 비운다** — 기본 액션(설정 아이콘)은 지금 있는 곳으로 가는 링크라 무의미하다.
  `back`은 history가 아니라 **경로**를 받는다. 딥링크로 바로 들어온 사람에게도 올라갈 곳이 필요하고
  `router.back()`은 그 경우 앱 밖으로 나간다.
- 하단 탭이 있어도 뒤로가기를 빼지 않는다 — iOS PWA에는 하드웨어 뒤로가기가 없다.
- 하단 탭은 **유지**한다(설정도 탭 셸 안이다). 온보딩과 구분되는 지점.
- 저장은 **자동 저장**을 기본으로 한다. 명시적 저장 버튼은 온보딩과 바텀시트에만 둔다 —
  설정은 한 항목씩 고치는 화면이라 매번 저장을 누르게 하면 번거롭다.
  **다만 폼이 아니라 액션 화면(발급·내보내기·삭제)은 명시적 버튼이다** — 자동 저장할 값이 없다.
- 라우트마다 **자기 `loading.tsx`**를 둔다. 부모(`settings/loading.tsx`)를 물려받으면
  설정 홈의 골격(스페이스 카드 + 메뉴 5행)이 잠깐 떴다가 통째로 갈린다.
  `HeaderSkeleton`에 **`back` 을 켜는 것을 빠뜨리지 않는다** — 빼면 제목이 44px 튄다.

### 되돌리기 어려운 동작 — `layout/confirm-sheet.tsx`

확인이 필요한 자리가 넷이다(코드 재발급 · 상대 내보내기 · 스페이스 나가기 · 삭제).
`window.confirm`을 쓰지 않는 이유는 스타일이 아니라 **문구다** — 무엇을 잃는지 두 문장으로
설명할 자리가 없다.

| 규칙 | 왜 |
|---|---|
| **잃는 것을 구체적으로 쓴다** | "정말 하시겠습니까?"는 확인이 아니라 소음이다. 죽을 코드는 시트 본문에 문자로 박는다 |
| **제출 중에는 닫히지 않는다** | ESC·바깥 탭·취소 전부 막는다. 왕복 중에 시트가 사라지면 취소된 줄 안다 |
| **실패해도 닫히지 않는다** | `alert` 슬롯에 문구를 띄우고 포커스를 옮긴다. 닫으면 무엇을 확인하던 중이었는지가 사라진다. `body`는 `<p>` 안이라 배너를 못 끼워 슬롯이 따로 있다 |
| `acknowledge` 게이트는 **삭제에만** | 되돌릴 수 없는 것에만 체크박스를 건다. 남발하면 체크가 습관이 되어 아무것도 막지 못한다 |
| 확인 버튼은 `variant="default"` | `destructive`(로즈 10% 틴트 위 로즈 글자)는 16px 본문 대비가 AA 경계다. 위험 신호는 색이 아니라 게이트·아이콘·문구가 진다 |

**확인 비용은 잃을 것이 있을 때만 낸다.** 초대 코드 *최초* 발급에는 확인이 없고 *재발급*에만 있다.

### 값 하나를 크게 보여주고 복사시키는 자리 — `data/copy-field.tsx`

**폴백의 본체는 버튼이 아니라 값이다** (→ D-062). `navigator.clipboard`·`navigator.share`는
비-HTTPS·데스크톱·권한 거부에서 통째로 없거나 예외를 던진다.

- 값은 타입 스케일 최대치 `text-display`(32px) + `.num` + `select-all`. 전부 실패해도
  사람이 읽거나 한 번 눌러 선택해 옮길 수 있다.
- 공유는 **지원될 때만** 렌더한다. 미지원이면 복사가 전폭이 되는데 둘 다 `size="lg"` 한 줄이라
  **세로 높이가 변하지 않는다** — 하이드레이션 뒤 버튼이 생겨도 점프가 없다.
- 능력 감지에 `useEffect` + `setState`를 쓰지 않는다(이 저장소는 `set-state-in-effect`가 error).
  `useSyncExternalStore`가 서버 스냅샷(false)과 클라이언트 스냅샷을 나눠 준다.
- `navigator.share`의 `AbortError`(사용자가 시트를 닫음)는 **실패가 아니다.** 문구를 띄우지 않는다.
- 값 블록은 `bg-primary-soft` + `border-primary/25`이고 담는 패널은 `tone="default"`다.
  반대로 하면 `#fff1f3` 위 `#ffffff`(다크 `#2a1319` 위 `#1a181b`)가 되어 면 대비가 사라진다.

### `"use client"`가 문구 모듈을 통해 서버 모듈을 끌고 온다 🔴

`app/**/types.ts`(문구·상태 타입)는 **클라이언트 컴포넌트가 import한다.** 그 파일이
`lib/supabase/*`에서 상수 하나만 가져와도 `next/headers`까지 딸려 들어와 빌드가 깨진다:

```
invite-block.tsx (client) → settings/invite/types.ts → lib/supabase/invite.ts → ./server → next/headers  ✗
```

→ 상수는 문구 모듈에 다시 적되 **원본의 리터럴 타입에 묶는다.** 타입 위치의 `import(...)`는
런타임에 남지 않고, 한쪽만 바뀌면 컴파일이 실패한다.

```ts
const INVITE_TTL_HOURS: typeof import("@/lib/supabase/invite").INVITE_TTL_HOURS = 48;
```

### 카테고리 트리 표현 — ✅ `/settings/categories`가 선례다

3단 계층을 375px에서 들여쓰기로만 표현하면 소분류 이름이 잘린다.

- **대분류는 섹션 헤더**(색 점 + 이름 + `meta`로 "중 4 · 소 12"), 중분류는 그 안의 그룹 헤더
  (`bg-muted` · 48px · `text-body-sm font-bold`), 소분류만 `ListRow`.
  **중분류에 `ListRow`를 쓰지 않는다** — 그룹 헤더는 목록의 형제 항목이 아니라 중첩 목록의
  제목이라 `<li>` 안에 `<li>`가 생긴다.
- 들여쓰기는 소분류 한 단계(16px)만. 3단 들여쓰기는 쓰지 않는다.
- 보관된 항목은 `text-muted-foreground` + "보관됨" 배지. 기본은 숨기고 상단 토글로 표시한다.
  **`opacity`로 흐리지 않는다** — 알파는 자식의 대비를 계산 불가능하게 만든다
  (`--muted-foreground` 4.83:1이 `opacity-60`에서 2.3:1로 내려앉는다). (→ D-069)
- **보관 표시 토글은 화면 상단 별도 줄**이다. 대분류 헤더의 `action` 슬롯에 넣으면 전역
  상태가 4벌이 된다. 보관이 0개면 토글 자체를 그리지 않는다(켜도 변화가 없다 → D-061).
- **없는 것은 설명이 아니다** (→ D-074). 대분류는 4개 고정이라 "+ 대분류 추가"가 없는데
  (D-027 · D-073), 화면이 침묵하면 사용자는 "못 찾는 것"과 "없는 것"을 구분할 수 없어 계속
  찾는다. 마지막 대분류 **아래**(끝까지 스크롤한 사람이 질문을 갖는 자리)와 대분류 편집 시트
  안(보관 버튼이 없는 자리)에 이유를 쓰고, **대안까지 같이 말한다**.

🔴 **그룹 헤더 이름에 `text-muted-foreground`를 쓰지 않는다.** `bg-muted`(#f4f4f5) 위에서
4.40:1로 AA 미달이다 — 토큰 주석의 4.83:1은 **흰 배경(`--card`) 기준**이고, 앱 배경
(#f6f5f6) 위에서도 4.44:1이다. 15px 이하 본문을 `bg-muted`/`bg-background`에 얹을 때는
`text-foreground`(#18181b on #f4f4f5 = 16.12:1). 다크는 5.52:1로 통과한다 — **라이트에서만
깨지므로 다크만 보고 넘기면 안 잡힌다.**

#### 🔴 행에는 조작부를 두지 않는다 (→ D-075) — D-066·D-067을 갱신한다

실사용 피드백에서 두 가지가 무너졌다.

1. **이름 변경 진입이 보이지 않았다.** 화살표가 오른쪽 끝을 써서 `›`를 껐더니 "행이 눌린다"는
   신호가 스크린리더 전용 `actionLabel`에만 남았다. 상단 안내문으로 덮으려 했지만
   **글로 설명해야 하는 어포던스는 실패한 어포던스다.**
2. **순서변경은 y를 바꾸는 동작이라 한 번 누르면 손가락 아래 항목이 바뀐다.** D-067이 x좌표를
   고정했지만 y는 원리상 고정할 수 없다. 게다가 96px 고정 열이 소분류 이름을 179px(한글 11자)로
   눌러 `MAX_CATEGORY_NAME_LENGTH = 20`의 절반이 상시 잘렸다.

| 자리 | 표식 | 여는 것 |
|---|---|---|
| 소분류 행 | `›` (`ListRow` 기본값) | 편집 시트 |
| 그룹 헤더(대·중분류) | `⋯` (`Ellipsis` · `size="icon"`) | **같은** 편집 시트 |

표식이 갈리는 이유는 관례다 — 그룹 헤더에 `›`를 달면 "안으로 들어간다"로 읽혀 거짓이 된다.
그룹 헤더의 **이름은 라벨이지 버튼이 아니다**: 그룹 제목이 눌리는 관례가 없어서 버튼으로 두면
소분류 행보다 오히려 더 안 눌려 보인다.

**편집 시트는 계층별로 줄을 켜고 끈다** (→ D-076). 보관이 소분류에선 버튼, 중분류에선 메뉴
항목이면 같은 동작을 계층마다 다시 배워야 한다.

| | 이름 입력 | 자식 순서 변경 | 보관 | 4개 고정 안내 |
|---|---|---|---|---|
| 대분류 | ○ | 중분류 2개 이상일 때 | — | ○ |
| 중분류 | ○ | 소분류 2개 이상일 때 | ○ | — |
| 소분류 | ○ | — | ○ | — |

시트 제목은 **카테고리 이름 자체**이고 부제가 `path`다 — 40행짜리 트리에서 헷갈리는 것은
동작이 아니라 대상이다. 동작은 `BottomSheet`의 `description`(sr-only)이 낭독한다.

**"보관됨" 배지는 `ListRow.titleBadge`(제목 옆)다.** `meta`(제목 아래)에 두면 배지가 붙은
행만 56 → 66px로 자라 목록의 세로 리듬이 두 종류로 쪼개진다.

#### 순서변경 — 형제 목록 전체를 담은 시트

D-020(드래그 금지)은 유지하되 **근거를 좁힌다**: 막는 이유는 "세로 스크롤과 충돌"이고,
순서 시트는 **스크롤이 없는 최대 6행**이라 그 근거가 성립하지 않는다. 지금은 ↑↓로 낸다 —
접근성 경로를 지우지 않은 채 나중에 드래그를 얹을 수 있는 표면을 먼저 확보하는 것이 순서다.

D-066이 시트를 물린 이유("오버레이가 목록을 덮어 이동을 볼 수 없다")는 **행 하나의 액션 시트**를
가정한 말이었다. 형제 전체가 들어오면 이동이 시트 안에서 그대로 보인다.

- 재배열은 **로컬**이고 저장이 **왕복 1회**다. 순번(1·2·3)이 결과를 숫자로도 말한다(D-006).
- **없는 화살표는 버튼만 지우고 자리는 남긴다** — D-067의 원칙은 폐기가 아니라 이 시트로
  이사했다. 첫 행의 ↑, 마지막 행의 ↓ 자리에 `size-11` 빈 칸을 둔다.
- 이동 뒤 **같은 항목의 같은 방향 버튼에 포커스를 되돌린다**(`flushSync` → `getElementById`).
  경계에 닿아 그 버튼이 사라졌으면 반대쪽. 안 그러면 포커스가 `body`로 떨어져 AT 사용자가
  목록을 통째로 잃는다. 포커스 이동이 곧 낭독이라(D-037) `aria-describedby`가 가리키는
  "4개 중 2번째"가 그때 다시 읽힌다.
- 무변경이면 저장을 비활성으로 두고 이유를 쓴다. 그 문구는 **자리를 늘 차지한다** —
  첫 이동에서 사라지면 바닥에 붙은 시트가 통째로 튄다.

**순서 저장의 실패는 시트를 닫고 그룹 헤더 아래 `InlineError`다.** 실패 문구가
"지금 목록이 저장된 순서예요"라서 그 목록을 오버레이가 덮고 있으면 문장이 거짓이 된다.
액션 결과에 `parentId`를 실어 **자기 그룹만** 그린다. (`ConfirmSheet`의 "실패해도 닫히지
않는다"와 갈리는 지점 — 그건 질문을 잃으면 안 되는 확인 시트다.)

### 새로 만들 컴포넌트

```
components/form/
  field.tsx            ✅ 라벨 + 입력 + 도움말/에러 (위 규격)
  text-field.tsx       ✅ 한 줄 텍스트 = Field + Input
  date-field.tsx       ✅ 날짜 (예식일) — 요일 리드아웃 + D-day
  code-input.tsx       ✅ 6자리 초대 코드 — 한 칸 · 58px · 자간 0.28em
components/layout/
  auth-shell.tsx       ✅ (auth)·onboarding 공용 셸 — 웨시 + 24px 패딩 + 하단 슬롯
  back-header.tsx      ✅ 별도로 만들지 않았다 — AppHeader의 `back` prop으로 갈음
  confirm-sheet.tsx    ✅ 되돌리기 어려운 동작 확인 — BottomSheet + 폼 + (선택) 게이트 체크박스
components/data/
  copy-field.tsx       ✅ 초대 코드 표시 + 복사/공유 버튼 + 폴백
```

`form/*`가 갖는 것은 **의미론**(라벨 규격 · 도움말 · 에러 · `aria-describedby` 연결)이고,
`ui/*`가 갖는 것은 **밀도**뿐이다(D-032). 화면이 `Field` + `Input`을 손으로 조립하지 않게
`TextField`를 둔 이유가 그것이다 — 반복되면 어느 화면에선가 `aria-describedby`를 빠뜨린다.

### shadcn 프리미티브 — ✅ 수령·규격화 완료 (2026-07-31)

O-003에서 미룬 것들을 P1에서 받았다. 실제 폼이 생기는 시점이기 때문이다.

`input` · `label` · `select` · `checkbox` · `switch` · `separator` · `skeleton`

nova 프리셋의 데스크톱 밀도를 48px/16px로 손봤고, 각 파일 상단에 **무엇을 왜 바꿨는지**를
표로 남겼다. `npx shadcn add`를 다시 돌리면 덮어써지므로 그 표대로 되돌린다.

| 프리미티브 | nova 기본값 | 이 저장소 |
|---|---|---|
| `input` | `h-8` 32px, `md:text-sm` | `h-12` 48px, 16px 고정 |
| `select` 트리거 | `h-8` / `h-7` | `h-12` 48px / `h-11` 44px |
| `select` 항목 | `py-1` ≈26px | `min-h-11` 44px |
| `checkbox` | 16px, 히트 40×32 | 20px, 히트 **44×44** |
| `switch` | 32×18.4, 히트 56×36 | 40×24, 히트 **64×44** |
| `label` | `text-sm` 14px | `text-body` 15px + `min-h-11` |
| `separator` `skeleton` | — | 변경 없음(밀도 문제 없음) |

**`md:text-sm`은 지웠다.** 16px 미만이면 iOS가 포커스 시 자동 확대하는데, 확대 봉인은
접근성 위반이라 폰트로 푸는 게 이 프로젝트의 규칙이다(3절). 데스크톱 폭에서만 14px로
줄이는 이 선언은 그 규칙과 충돌한다.

**에러 상태는 손대지 않았다.** `--destructive`(`#e11d48`)가 `--primary`와 같은 값이라
shadcn 기본 `aria-invalid:border-destructive`가 위 폼 필드 규격의 "테두리 `border-primary`"와
이미 같은 결과를 낸다.

실물은 [`/design` 07 / FORM](http://localhost:3000/design) 절에 있다 —
조립 컴포넌트(`TextField` · `DateField` · `CodeInput` · 미선택 `SegmentedControl`)가 위,
프리미티브 7종이 아래다.

---

## 7. 구현 위치

| 파일 | 담긴 것 |
|---|---|
| `src/app/globals.css` | Pretendard import, 전 토큰(라이트/다크), 9단 타입 스케일, `word-break: keep-all`, `.num`, 사선 패턴 유틸 |
| `src/lib/domain.ts` | 대분류·결제자·수단·단계 어휘 + 라벨 + `PAYER_TOKEN` |
| `src/lib/format.ts` | 통화·비율·날짜 포맷. **금액 렌더는 반드시 여기 또는 `MoneyText`를 경유** |
| `src/components/ui/button.tsx` | 44/48/36px size variant (⚠️ shadcn 업스트림 파일 — 아래 경고 참조) |
| `src/components/ui/{input,label,select,checkbox,switch,separator,skeleton}.tsx` | 48px/16px로 규격화한 프리미티브 7종 (⚠️ 전부 shadcn 업스트림 파일) |
| `src/components/{layout,money,data,charts}/*` | 컴포넌트 16종 |
| `src/lib/mock/fixtures.ts` | `rich`/`sheet`/`empty` 3세트 + 집계 선택자 |
| `src/app/design/page.tsx` | 스타일가이드 (살아 있는 참조) |

### 지뢰 두 개 — 재발 주의

**① `ui/button.tsx`는 shadcn 업스트림 파일이다.**
`npx shadcn add button`을 다시 돌리면 44px size variant가 덮어써진다. 파일 상단에 같은 경고 주석이 있다.
앞으로 다른 shadcn 프리미티브(`input`, `select`, `checkbox`…)를 받을 때도 **nova 프리셋은 데스크톱 밀도이므로
받은 직후 44px 규칙에 맞게 손보고, 그 파일 상단에도 같은 경고 주석을 남긴다.**

**② 그라디언트 색상 정지점에 `color-mix()`를 쓰지 않는다.**
Tailwind v4는 `color-mix()`를 쓴 선언마다 `var(--원색)` 폴백을 자동으로 깐다. 테두리·배경에서는 무해하지만
그라디언트에서는 4% 틴트가 100% 불투명으로 뒤집힌다. 사선 패턴 색은 `--estimate-tint` / `--estimate-stripe`에
미리 섞어 둔 값을 쓴다. (→ decisions.md D-012)

---

## 검증

DoD 수치 대조는 [roadmap.md](./roadmap.md#definition-of-done--시트-실측치-대조)에 있다. 디자인 쪽 체크는 이것들:

1. `npm run lint` · `npm run build` 무경고 통과 — ✅
2. **375×812**에서 5탭 + `/design` 순회, 가로 스크롤이 한 군데도 없을 것
3. **Pretendard 실적용** — `getComputedStyle(document.body).fontFamily`가 `Pretendard Variable`로 시작하고
   네트워크 탭에 `PretendardVariable.subset.*.woff2`가 내려오는지 (import만 하고 폰트가 안 걸리는 사고가 흔하다).
   빌드 CSS에 `@font-face` 92개 + `unicode-range` 서브셋이 들어간 것은 확인됨 — ✅
4. **터치 타깃** — 하단 탭·FAB·바텀시트 버튼·리스트 행의 렌더된 높이가 전부 ≥44px인지 DOM에서 측정
5. **대비 검증** — 계산 완료, 결과는 decisions.md D-007과 `/design` 01절의 표 — ✅
6. `?fixture=empty`에서 5탭 전부 빈 상태가 깨지지 않는지 — ✅
7. **그레이스케일 렌더** — 확정/예상, 예랑/예신이 색 없이도 구분되는지

## 이 단계에서 하지 않은 것

Supabase 연결·인증·실제 CRUD(P1~P5) / 다크모드 **토글**(P6, 토큰은 정의 완료) /
바텀시트 드래그 제스처·스와이프 수정·삭제(P3) / PWA 아이콘 PNG 192·512(P6) /
shadcn 프리미티브 7종(→ P1에서 수령 완료, 6-b절) / 체크리스트·웨딩홀 비교(2차 백로그)
