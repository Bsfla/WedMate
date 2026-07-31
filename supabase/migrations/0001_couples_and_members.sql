-- 0001 · 커플 스페이스 · 멤버 · 초대 코드 · RLS 헬퍼
--
-- 설계 근거는 docs/erd.md 2-1절 / 3절.
-- 금액은 전부 bigint(원 단위 정수), enum은 text + CHECK다 (→ D-024, D-025).

-- ─────────────────────────────  couples  ─────────────────────────────
-- 스페이스 하나 = 결혼 준비 하나. 예식 정보가 여기 다 들어간다.
create table public.couples (
  id                  uuid primary key default gen_random_uuid(),
  name                text        not null,
  -- NOT NULL이다. 그래서 온보딩은 예식일을 받은 뒤에야 이 행을 만든다 (→ D-028).
  wedding_date        date        not null,
  total_budget        bigint      not null default 0  check (total_budget >= 0),
  guest_min_guarantee int         not null default 200 check (guest_min_guarantee >= 0),
  avg_gift_amount     bigint      not null default 80000 check (avg_gift_amount >= 0),
  meal_cost_per_head  bigint      not null default 70000 check (meal_cost_per_head >= 0),
  created_at          timestamptz not null default now()
);

comment on table public.couples is '커플 스페이스. 이 프로젝트의 모든 데이터가 이 id를 테넌트 키로 쓴다.';

-- ──────────────────────────  couple_members  ──────────────────────────
-- auth 스키마는 PostgREST에 노출되지 않아 상대방 이름을 조인해 올 수 없다.
-- 그래서 참여 시점에 display_name을 여기 복사해 둔다 (→ docs/erd.md 2-0).
create table public.couple_members (
  couple_id    uuid        not null references public.couples(id) on delete cascade,
  user_id      uuid        not null references auth.users(id)     on delete cascade,
  side         text        not null check (side in ('groom', 'bride')),
  display_name text        not null check (length(btrim(display_name)) > 0),
  created_at   timestamptz not null default now(),
  primary key (couple_id, user_id),
  -- side당 1명 → 3인 진입을 DB가 막는다.
  unique (couple_id, side)
);

-- 사용자 1명은 커플 1개에만 속한다. 이 제약이 current_couple_id()의 limit 1을 정당화한다.
create unique index couple_members_user_unique on public.couple_members (user_id);

-- ──────────────────────────  couple_invites  ──────────────────────────
create table public.couple_invites (
  id         uuid        primary key default gen_random_uuid(),
  couple_id  uuid        not null references public.couples(id) on delete cascade,
  -- 혼동 문자 0 O 1 I 를 뺀 32자 알파벳에서 6자리. 생성은 create_invite()가 한다.
  code       text        not null unique check (code ~ '^[2-9A-HJ-NP-Z]{6}$'),
  side       text        not null check (side in ('groom', 'bride')),
  expires_at timestamptz not null,
  used_by    uuid        references auth.users(id) on delete set null,
  used_at    timestamptz,
  -- 재발급할 때 이전 코드를 여기 찍어 무효화한다. 만료(expires_at)와는 별개다 —
  -- 부분 인덱스 술어에는 IMMUTABLE 식만 올 수 있어 now() 비교를 넣을 수 없기 때문이다.
  revoked_at timestamptz,
  created_by uuid        not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  check ((used_by is null) = (used_at is null))
);

-- 미사용·미폐기 코드는 커플당 1개. 재발급 시 이전 코드가 즉시 무효라는 규칙을 DB가 보장한다.
create unique index couple_invites_one_outstanding
  on public.couple_invites (couple_id)
  where used_by is null and revoked_at is null;

-- ───────────────────────  current_couple_id() 헬퍼  ───────────────────────
-- SECURITY DEFINER라 RLS를 우회한다. 그래서 couple_members 정책이 자기 테이블을
-- 다시 조회해도 무한 재귀가 나지 않는다 (→ D-018).
-- search_path를 비웠으므로 본문의 모든 이름은 스키마까지 적어야 한다.
create or replace function public.current_couple_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select cm.couple_id
  from public.couple_members cm
  where cm.user_id = (select auth.uid())
  limit 1
$$;

revoke execute on function public.current_couple_id() from public;
grant execute on function public.current_couple_id() to authenticated;

-- ─────────────────────────────  RLS  ─────────────────────────────
alter table public.couples        enable row level security;
alter table public.couple_members enable row level security;
alter table public.couple_invites enable row level security;

-- couples — 내 스페이스만. 생성은 create_couple() RPC로만 (INSERT 정책 없음).
create policy "couples: 내 스페이스 조회"
  on public.couples for select to authenticated
  using (id = (select public.current_couple_id()));

create policy "couples: 내 스페이스 수정"
  on public.couples for update to authenticated
  using (id = (select public.current_couple_id()))
  with check (id = (select public.current_couple_id()));

-- couple_members — 같은 스페이스의 멤버는 서로 보인다(멤버 목록에 상대 이름이 떠야 한다).
-- 재귀는 위 SECURITY DEFINER 헬퍼가 끊는다 (→ D-026).
create policy "members: 같은 스페이스 멤버 조회"
  on public.couple_members for select to authenticated
  using (couple_id = (select public.current_couple_id()));

-- 이름은 본인만 고친다. 가입/탈퇴는 RPC 경로로만.
create policy "members: 내 행만 수정"
  on public.couple_members for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- couple_invites — 정책을 하나도 만들지 않는다.
-- RLS가 켜진 채 정책이 없으면 전면 거부다. 초대 코드는 오직 SECURITY DEFINER RPC
-- (create_invite / active_invite / redeem_invite)로만 오간다 (→ D-017).

grant select, update on public.couples        to authenticated;
grant select, update on public.couple_members to authenticated;
