-- 0005 · 하객 명단 · 저축 목표

-- ─────────────────────────────  guests  ─────────────────────────────
-- "교회 청년부"처럼 팀 단위도 한 행이다. 그래서 인원은 1(본인) + companion_count로 센다.
create table public.guests (
  id                  uuid not null primary key default gen_random_uuid(),
  couple_id           uuid not null references public.couples(id) on delete cascade,
  side                text not null check (side in ('groom', 'bride')),
  name                text not null check (length(btrim(name)) > 0),
  companion_count     int  not null default 0 check (companion_count >= 0),

  -- 참석 예측 신호 3종. 하나라도 켜지면 참석 예상이다.
  sig_event_attended  bool not null default false,  -- 과거 경조사 참석
  sig_invite_meeting  bool not null default false,  -- 청첩장 모임
  sig_close           bool not null default false,  -- 친분
  expected_attend     bool generated always as
                        (sig_event_attended or sig_invite_meeting or sig_close) stored,

  -- 예식 후 입력분
  actual_attend_count int    check (actual_attend_count >= 0),
  gift_amount         bigint check (gift_amount >= 0),
  gift_method         text   check (gift_method in ('transfer', 'cash')),
  repay_done          bool not null default false,
  memo                text,
  created_at          timestamptz not null default now()
);

create index guests_couple_idx on public.guests (couple_id, side, name);

-- ──────────────────────────  savings_goals  ──────────────────────────
create table public.savings_goals (
  id             uuid   not null primary key default gen_random_uuid(),
  couple_id      uuid   not null references public.couples(id) on delete cascade,
  label          text   not null check (length(btrim(label)) > 0),
  target_amount  bigint not null check (target_amount > 0),
  monthly_amount bigint check (monthly_amount >= 0),
  months         int    check (months > 0),
  account_name   text,
  current_amount bigint not null default 0 check (current_amount >= 0),
  created_at     timestamptz not null default now()
);

create index savings_goals_couple_idx on public.savings_goals (couple_id);

-- ─────────────────────────────  RLS  ─────────────────────────────
-- 커플만 보는 테이블이라도 예외를 두지 않는다.
alter table public.guests        enable row level security;
alter table public.savings_goals enable row level security;

create policy "guests: 내 스페이스"
  on public.guests for all to authenticated
  using (couple_id = (select public.current_couple_id()))
  with check (couple_id = (select public.current_couple_id()));

create policy "savings_goals: 내 스페이스"
  on public.savings_goals for all to authenticated
  using (couple_id = (select public.current_couple_id()))
  with check (couple_id = (select public.current_couple_id()));

grant select, insert, update, delete on public.guests        to authenticated;
grant select, insert, update, delete on public.savings_goals to authenticated;
