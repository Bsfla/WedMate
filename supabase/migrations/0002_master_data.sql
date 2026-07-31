-- 0002 · 마스터 데이터 — 카테고리 3단 트리 · 결제수단
--
-- 가입 시 스페이스별로 시드를 '복사'한다. 전역 마스터를 참조하지 않는다 (→ D-015).
-- 그래야 커플마다 이름을 바꾸고 항목을 늘릴 수 있다.

-- ──────────────────────────  categories  ──────────────────────────
create table public.categories (
  id         uuid not null primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples(id) on delete cascade,
  level      text not null check (level in ('major', 'mid', 'minor')),
  -- 트리 부모. major는 뿌리라 NULL이다.
  parent_id  uuid references public.categories(id) on delete cascade,
  name       text not null check (length(btrim(name)) > 0),
  -- 대분류 고정 키. 차트 색·결산 구조·최종 손익이 이 키에 묶여 있어서
  -- 사용자가 이름을 바꿔도 흔들리지 않는 식별자가 따로 필요하다 (→ D-027).
  major_key  text check (major_key in ('wedding', 'honeymoon', 'household', 'home')),
  sort_order int  not null default 0,
  -- 삭제 대신 보관. 기존 지출·결산에는 남고 새 입력 선택지에서만 빠진다 (→ D-016).
  is_archived bool not null default false,

  -- 대분류만 뿌리다.
  constraint categories_root_is_major check ((level = 'major') = (parent_id is null)),
  -- major_key는 대분류에만 있다. 값이 4종으로 못박혀 있고 아래 UNIQUE가 걸려 있어
  -- '대분류는 4개, 추가 불가'가 DB 제약이 된다 (삭제 금지는 여전히 앱 규칙).
  constraint categories_major_key_only_major check ((level = 'major') = (major_key is not null)),
  unique (couple_id, major_key)
);

-- 트리 화면이 읽는 순서 그대로.
create index categories_tree_idx on public.categories (couple_id, parent_id, sort_order);

comment on column public.categories.major_key is
  '대분류 고정 키. 이름 변경과 무관하게 차트 색·결산 집계가 이 값을 본다.';

-- ────────────────────────  payment_methods  ────────────────────────
-- 결제자(4) × 수단(4) = 16 조합. payer는 지출에서 이 테이블을 조인해 얻는다.
create table public.payment_methods (
  id        uuid not null primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  -- other = 부모님 등 제3자. 분담 정산에서 빠진다 (→ D-023).
  payer     text not null check (payer  in ('groom', 'bride', 'joint', 'other')),
  method    text not null check (method in ('cash', 'card', 'voucher', 'account')),
  label     text,
  -- 삭제 아닌 비활성. 이미 이 수단으로 기록된 지출이 있기 때문이다.
  is_active bool not null default true,
  unique (couple_id, payer, method)
);

create index payment_methods_active_idx
  on public.payment_methods (couple_id, is_active);

-- ─────────────────────────────  RLS  ─────────────────────────────
alter table public.categories      enable row level security;
alter table public.payment_methods enable row level security;

create policy "categories: 내 스페이스"
  on public.categories for all to authenticated
  using (couple_id = (select public.current_couple_id()))
  with check (couple_id = (select public.current_couple_id()));

create policy "payment_methods: 내 스페이스"
  on public.payment_methods for all to authenticated
  using (couple_id = (select public.current_couple_id()))
  with check (couple_id = (select public.current_couple_id()));

grant select, insert, update, delete on public.categories      to authenticated;
grant select, insert, update, delete on public.payment_methods to authenticated;
