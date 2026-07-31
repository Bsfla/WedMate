-- 0004 · 예산(대분류 배분 · 소분류 예산) · 지출
--
-- 카테고리 참조는 전부 ON DELETE RESTRICT다. 지출이 걸려 있는 카테고리는 DB가 삭제를
-- 막고, 화면에서는 is_archived로만 감춘다 (→ D-016, 0절 ⑤).

-- ───────────────────────  budget_allocations  ───────────────────────
-- 대분류당 배분 1행. 별도 id를 두지 않는다 — (couple_id, category_id)가 곧 키다.
create table public.budget_allocations (
  couple_id   uuid   not null references public.couples(id)    on delete cascade,
  category_id uuid   not null references public.categories(id) on delete restrict,
  amount      bigint not null default 0 check (amount >= 0),
  primary key (couple_id, category_id)
);

-- ─────────────────────────────  budgets  ─────────────────────────────
-- 소분류당 예산 1행 + 후보 업체·참고 링크·메모.
create table public.budgets (
  id               uuid   not null primary key default gen_random_uuid(),
  couple_id        uuid   not null references public.couples(id)    on delete cascade,
  category_id      uuid   not null references public.categories(id) on delete restrict,
  amount           bigint not null default 0 check (amount >= 0),
  vendor_candidate text,
  reference_url    text,
  note             text,
  unique (couple_id, category_id)
);

-- ────────────────────────────  expenses  ────────────────────────────
create table public.expenses (
  id                uuid   not null primary key default gen_random_uuid(),
  couple_id         uuid   not null references public.couples(id)         on delete cascade,
  category_id       uuid   not null references public.categories(id)      on delete restrict,
  amount            bigint not null check (amount > 0),

  -- 날짜를 date 한 컬럼이 아니라 년/월/일로 쪼갠 이유: '2026년 8월 어느 날'(일자 미정)을
  -- date로는 담을 수 없다. 시트의 입력 방식과도 같다.
  spent_year        int  not null check (spent_year between 2000 and 2100),
  spent_month       int  not null check (spent_month between 1 and 12),
  spent_day         int           check (spent_day between 1 and 31),
  -- 일자가 비면 예상 지출. 확정 여부를 따로 저장하지 않는다 —
  -- is_confirmed는 이 값의 부정일 뿐이라 어긋날 여지만 만든다 (→ D-024).
  is_estimated      bool generated always as (spent_day is null) stored,

  payment_method_id uuid not null references public.payment_methods(id) on delete restrict,
  stage             text not null check (stage in ('deposit', 'interim', 'balance', 'full')),
  vendor            text,
  memo              text,
  -- 누가 입력했는지. 탈퇴해도 지출은 커플의 기록이므로 남긴다 → NULL 허용 + SET NULL.
  created_by        uuid default auth.uid() references auth.users(id) on delete set null,
  created_at        timestamptz not null default now()
);

-- 원장·월별 타임라인이 읽는 순서.
create index expenses_month_idx on public.expenses (couple_id, spent_year desc, spent_month desc);
-- 소분류 진행률 집계용.
create index expenses_category_idx on public.expenses (couple_id, category_id);

-- ─────────────────────────────  RLS  ─────────────────────────────
alter table public.budget_allocations enable row level security;
alter table public.budgets            enable row level security;
alter table public.expenses           enable row level security;

create policy "budget_allocations: 내 스페이스"
  on public.budget_allocations for all to authenticated
  using (couple_id = (select public.current_couple_id()))
  with check (couple_id = (select public.current_couple_id()));

create policy "budgets: 내 스페이스"
  on public.budgets for all to authenticated
  using (couple_id = (select public.current_couple_id()))
  with check (couple_id = (select public.current_couple_id()));

create policy "expenses: 내 스페이스"
  on public.expenses for all to authenticated
  using (couple_id = (select public.current_couple_id()))
  with check (couple_id = (select public.current_couple_id()));

grant select, insert, update, delete on public.budget_allocations to authenticated;
grant select, insert, update, delete on public.budgets            to authenticated;
grant select, insert, update, delete on public.expenses           to authenticated;
