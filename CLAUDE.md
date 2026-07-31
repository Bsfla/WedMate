# WedMate (buget)

예비부부 둘이 함께 쓰는, **결혼 준비 예산 전용 모바일 가계부**.
원본 구글 시트(weddingreceipt 템플릿)의 「예산 수립 → 지출 기록 → 자동 결산」 계산 모델을 그대로
재현하면서, 모바일에서 한 손으로 입력·확인 가능하게 만드는 것이 목표다.

**스택**: Next.js 16 (App Router) · TypeScript · Tailwind v4 · shadcn-ui(radix-nova) · Supabase · Recharts

---

## 문서 — 작업 전에 읽고, 작업 후에 갱신한다

| 문서 | 담긴 것 | 언제 갱신하나 |
|---|---|---|
| [docs/product.md](docs/product.md) | 기획안 — 제품 정의 · 정보구조 · 화면 · 데이터 모델 | 기능/화면/스키마가 늘거나 바뀔 때 |
| [docs/design-system.md](docs/design-system.md) | 토큰 · 타입 스케일 · 44px 밀도 · 컴포넌트 규칙 | 새 규칙이 생길 때 (+ `/design`에도 반영) |
| [docs/erd.md](docs/erd.md) | 데이터 모델 물리 설계 — 타입·제약·인덱스·RLS·집계 View | 스키마가 바뀔 때 |
| [docs/erd-diagram.html](docs/erd-diagram.html) | 확대·이동되는 ERD 뷰어 (브라우저로 열기) | erd.md의 다이어그램을 고칠 때 **같이** |
| [docs/erd.dbml](docs/erd.dbml) | 같은 ERD의 DBML 사본 — dbdiagram.io에 붙여넣는 용도 | erd.md의 스키마를 고칠 때 **같이** |
| [docs/roadmap.md](docs/roadmap.md) | **P0~P6 진행 상태 + DoD 수치** — 진행률의 단일 진실 소스 | 단계를 끝낼 때마다 |
| [docs/decisions.md](docs/decisions.md) | 왜 그렇게 정했는가 (append-only) | 판단이 필요한 갈림길을 지날 때마다 |
| [docs/design-review.html](docs/design-review.html) | 디자인 시안 보드 (브라우저로 열기) | 시안을 다시 그릴 때 |

**살아 있는 참조는 `/design` 라우트다** — 앱과 같은 컴포넌트를 그대로 렌더하므로 문서보다 정확하다.

## 새 기능을 추가할 때

1. **docs/product.md**의 해당 절을 먼저 갱신한다 (무엇을 왜 만드는지).
2. **화면이 하나라도 늘면 `design` 서브에이전트를 먼저 부른다** (↓ 아래 절).
3. 갈림길에서 판단했다면 **docs/decisions.md**에 한 항목 덧붙인다 (코드를 봐도 모르는 "왜"만).
4. 끝나면 **docs/roadmap.md**의 상태를 갱신한다.
5. `npm run lint && npm run build`가 무경고로 통과해야 한다.

---

## 새 페이지는 디자인이 먼저다 🔴

**새 화면·새 페이지를 만들 때는 코드를 짜기 전에 `design` 서브에이전트를 먼저 부른다.**
(`.claude/agents/design.md` — Task 도구의 `design` 타입)

```
설계(design 에이전트)  →  검토  →  구현  →  /design 등록  →  lint/build
```

순서를 뒤집지 않는다. 화면을 먼저 짜고 나중에 디자인을 입히면 화면마다 크기·색·간격이
제각각으로 굳어져 되돌리는 비용이 커진다 — P0→PD에서 이미 한 번 겪은 일이다.

**design 에이전트에게 넘길 것**: 화면의 목적, 보여줄 데이터, 진입 경로, 제약.
**받을 것**: 정보 위계 · 375px 와이어 · 상태 목록(빈/로딩/에러/제출중) · 토큰 매핑 · 재사용할 기존 컴포넌트.

이 에이전트는 **파일을 직접 고칠 수 있다.** 같은 파일을 동시에 만지지 않도록 범위를 나눠 던진다.

**부르지 않아도 되는 경우** — 문구 한 줄 수정, 이미 설계된 화면의 버그 픽스, 서버 로직·쿼리 작업.
새 컴포넌트가 생기거나 레이아웃이 바뀌면 부른다.

---

## 코드 규약

**금액** — 렌더는 반드시 `components/money/money-text.tsx`의 `MoneyText` 또는 `lib/format.ts`를 경유한다.
새 포맷 함수를 만들지 않는다. 숫자가 세로로 정렬되는 자리에는 `.num`(tabular-nums).

**진행률** — 소진율 바·게이지·진행률은 `div` + `role="progressbar"`로 만든다.
**Recharts는 월별 타임라인 하나에만** 쓴다. (→ D-008)

**색만으로 정보를 전달하지 않는다** — 구분 축이 세 개(확정/예상 · 결제자 4종 · 대분류 4종)라
색에만 기대면 무너진다. 확정은 채운 막대 / 예상은 점선 + 사선 패턴 + "예상" 배지,
결제자·대분류는 **텍스트 라벨을 항상 병기**. 그레이스케일에서도 구분이 살아야 한다. (→ D-006)

**대비 미달 토큰을 텍스트로 쓰지 않는다** — `--warning` `--success` `--payer-groom`은 흰 배경에서
AA 미달이다. 면·테두리·아이콘 전용이고, 텍스트에는 `-strong` 변형을 쓴다. (→ D-007)

**터치 타깃 44px** — 버튼 `default` h-11, `lg` h-12, 리스트 행 min-h-14, FAB size-14.
입력 필드 폰트는 16px 이상 (iOS 자동 확대 방지 — 확대를 봉인하지 않기 위함).

**데이터 경계** — 화면은 `lib/mock/fixtures.ts`의 선택자 함수(`getMockHome()` 등) **하나만** 부른다.
P2~P5는 그 함수 본문만 Supabase 쿼리로 갈아끼우고 화면 코드는 건드리지 않는다.
도메인 어휘(대분류·결제자·수단·단계)는 `lib/domain.ts`에 있고 목업이 사라져도 남는다. (→ D-010)

**목업 집계** — 합계를 손으로 적지 않는다. 원시 배열에서 파생시킨다. (→ D-011)

---

## 이 저장소의 지뢰

**`src/proxy.ts`가 middleware다.** Next 16 규약이라 `middleware.ts`가 아니다
(기본 export 또는 `proxy` named export + `config.matcher`).

**lucide-react v1이라 아이콘 이름이 다르다.** `Home`→`House`, `PieChart`→`ChartPie`,
`AlertTriangle`→`TriangleAlert`. 구 이름 별칭이 없어 import가 조용히 깨진다.

**`ui/button.tsx`는 shadcn 업스트림 파일이다.** `npx shadcn add button`을 다시 돌리면 44px
스케일이 덮어써진다. 다른 프리미티브를 받을 때도 nova 프리셋은 데스크톱 밀도이므로
받은 직후 44px에 맞게 손보고 경고 주석을 남긴다.

**그라디언트 색상 정지점에 `color-mix()`를 쓰지 않는다.** Tailwind v4가 `var(--원색)` 폴백을
자동으로 깔아서 4% 틴트가 100% 불투명으로 뒤집힌다. 사선 패턴은 `--estimate-tint` /
`--estimate-stripe`를 쓴다. (→ D-012)

**Recharts 3의 `TooltipContentProps`는 제네릭 인자를 명시하면 안 된다.** 기본값이 곧
`Tooltip content`가 요구하는 시그니처라, `<number, string>`으로 좁히면 반공변 위치에서 대입이 깨진다.

**shadcn CLI v4는 비대화식으로 돌리려면** `-p nova -b radix`가 필요하다.

**`CREATE VIEW`에 `WITH (security_invoker = on)`을 빠뜨리지 않는다.** 기본값이 아니라서,
빠뜨리면 View가 소유자 권한으로 돌아 호출자의 RLS를 통과한다 — 남의 커플 결산이 그대로 보인다. (→ D-025)

**부분 UNIQUE 인덱스 술어에 `now()`를 쓸 수 없다.** IMMUTABLE 식만 허용된다.
"살아 있는 코드 1개"는 `expires_at > now()`가 아니라 `revoked_at IS NULL`로 건다. (→ D-029)

**`src/lib/supabase/types.ts`는 손으로 고치지 않는다.** `npm run db:types`의 출력물이다.
스키마를 바꿨으면 반드시 다시 돌린다 — 안 그러면 없는 컬럼을 타입 오류 없이 참조하게 된다.

---

## 확인용 명령

```bash
npm run dev          # 375×812 뷰포트로 볼 것
npm run lint         # 무경고여야 함
npm run build        # 무경고여야 함

npm run db:reset     # 로컬 Postgres 초기화 + 마이그레이션 재적용 (Docker 필요)
npm run db:types     # 스키마 → src/lib/supabase/types.ts 재생성
```

**스키마는 `supabase/migrations/`가 진실이다.** 대시보드에서 직접 고치지 않는다.
설계 근거는 [docs/erd.md](docs/erd.md), 파일별 역할은 그 문서 5절에 있다.

**fixture 전환** — 모든 탭이 `?fixture=` 쿼리를 받는다.

| | 용도 |
|---|---|
| `?fixture=rich` | 기본. 여러 달 지출, 예상 혼재, 결제자 섞임 |
| `?fixture=sheet` | **DoD 회귀 세트** — 시트 실측치 재현 (roadmap.md의 표와 대조) |
| `?fixture=empty` | 데이터 0건. 5탭 빈 상태 확인 |
