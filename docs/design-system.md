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

---

## 2. 컬러 토큰

`src/app/globals.css`의 `:root` / `.dark` 블록을 확장한다. 앱 고유 토큰은 **hex로 적고** 원본 의도를 주석에 남긴다 (기존 shadcn 뉴트럴은 oklch 유지 — Tailwind v4는 두 표기를 모두 처리한다).

```
액센트    --primary            #E11D48   로즈. CTA · 활성 탭 · 진행 바
경고      --warning            #D97706   배분 초과 · 보증인원 갭 · 잔금 미납
성공      --success            #059669   잔액 여유 · 최종 손익 +
결제자    --payer-groom        #0EA5E9   예랑
          --payer-bride        #E11D48   예신
          --payer-joint        #71717A   공동
대분류    --chart-1  #E11D48  결혼식
          --chart-2  #F59E0B  신혼여행
          --chart-3  #0EA5E9  혼수
          --chart-4  #10B981  신혼집
          --chart-5  #8B5CF6  기타
```

**색만으로 정보를 전달하지 않는다** — 이 앱은 구분해야 할 축이 세 개(확정/예상, 결제자 3종, 대분류 4종)라 색에만 기대면 색각 이상 사용자에게 무너진다.

- 확정 지출 = 실선 테두리 + 채운 막대 / 예상 지출 = **점선 테두리 + 사선 패턴 + "예상" 배지**
- 결제자 = 색 + **텍스트 라벨(예랑/예신/공동)** 병기
- 대분류 = 색 + 카테고리명 항상 노출

**다크 모드**는 `.dark` 블록에 대응값을 지금 정의해 둔다. 토글(next-themes) 자체는 기획안대로 P6에 붙인다. 시안 확인은 라이트 기준.

**대비 검증**은 구현 후 필수 단계로 넣는다(아래 "검증" 5번). `#E11D48` on `#FFFFFF`는 AA 경계선이라 **본문 텍스트색으로는 쓰지 않고** 면·테두리·큰 숫자에만 쓴다.

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

---

## 4. 만들 컴포넌트

shadcn에서 추가로 받을 것: `input`, `label`, `badge`, `separator`, `select`, `checkbox`, `switch`, `skeleton`.

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

**Recharts는 월별 타임라인 하나에만 쓴다.** 소진율 바·게이지·진행률은 전부 div + `role="progressbar"`로 만든다 — 더 가볍고, 스크린리더가 값을 읽고, 다크모드 대응이 자동이다. `recharts@3.10.1`은 React 19 peer를 공식 지원한다(확인 완료).

기존 `src/lib/format.ts`를 그대로 재사용한다 — `formatWon` / `formatCompactWon`(차트 축·좁은 칩 전용) / `formatPercent` / `formatDday` / `clampedPercent`. 새 포맷 함수를 만들지 않는다.

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

## 7. 구현 위치

| 파일 | 담긴 것 |
|---|---|
| `src/app/globals.css` | Pretendard import, 전 토큰(라이트/다크), 9단 타입 스케일, `word-break: keep-all`, `.num`, 사선 패턴 유틸 |
| `src/lib/domain.ts` | 대분류·결제자·수단·단계 어휘 + 라벨 + `PAYER_TOKEN` |
| `src/lib/format.ts` | 통화·비율·날짜 포맷. **금액 렌더는 반드시 여기 또는 `MoneyText`를 경유** |
| `src/components/ui/button.tsx` | 44/48/36px size variant (⚠️ shadcn 업스트림 파일 — 아래 경고 참조) |
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
shadcn 프리미티브 8종(→ decisions.md O-003) / 체크리스트·웨딩홀 비교(2차 백로그)
