-- 0007 · 스페이스 RPC — 생성 · 초대 발급 · 초대 조회 · 초대 사용
--
-- couples / couple_members INSERT와 couple_invites 접근 전체를 이 네 함수로만 연다.
-- 테이블에 INSERT 정책을 주지 않는 이유: 남의 couple_id를 적어 넣는 경로를 아예 없애기 위함이다.
-- couple_invites는 정책이 하나도 없어 직접 SELECT가 전면 거부된다 (→ D-017).

-- ────────────────────  create_couple — 스페이스 만들기  ────────────────────
-- 예식일이 NOT NULL이라 온보딩은 예식일·총예산을 받은 뒤에 이 함수를 부른다 (→ D-028).
create or replace function public.create_couple(
  p_name         text,
  p_wedding_date date,
  p_total_budget bigint,
  p_display_name text,
  p_side         text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid       uuid := (select auth.uid());
  v_couple_id uuid;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;
  if exists (select 1 from public.couple_members cm where cm.user_id = v_uid) then
    raise exception 'ALREADY_IN_COUPLE' using errcode = '23505';
  end if;
  if p_side is null or p_side not in ('groom', 'bride') then
    raise exception 'INVALID_SIDE' using errcode = '22023';
  end if;
  if length(btrim(coalesce(p_display_name, ''))) = 0 then
    raise exception 'DISPLAY_NAME_REQUIRED' using errcode = '22023';
  end if;
  if p_wedding_date is null then
    raise exception 'WEDDING_DATE_REQUIRED' using errcode = '22023';
  end if;

  insert into public.couples (name, wedding_date, total_budget)
  values (
    coalesce(nullif(btrim(p_name), ''), '우리 결혼 준비'),
    p_wedding_date,
    greatest(coalesce(p_total_budget, 0), 0)
  )
  returning id into v_couple_id;

  insert into public.couple_members (couple_id, user_id, side, display_name)
  values (v_couple_id, v_uid, p_side, btrim(p_display_name));

  -- 대4/중11/소25 + 결제수단 16
  perform public.seed_couple_defaults(v_couple_id);

  -- 대분류 배분 4행을 0원으로 깔아 둔다. 예산 화면이 UPSERT 없이 UPDATE만 하면 된다.
  insert into public.budget_allocations (couple_id, category_id, amount)
  select v_couple_id, c.id, 0
  from public.categories c
  where c.couple_id = v_couple_id and c.level = 'major';

  return v_couple_id;
end;
$$;

-- ────────────────────  create_invite — 1회용 코드 발급  ────────────────────
-- 남은 역할(예랑↔예신)로 side를 고정해 발급한다. 그래서 참여하는 쪽은 역할을 고를 수 없고,
-- 자동으로 반대편이 된다.
create or replace function public.create_invite()
returns public.couple_invites
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid        uuid := (select auth.uid());
  v_couple_id  uuid;
  v_taken      text[];
  v_side       text;
  v_code       text;
  v_row        public.couple_invites;
  v_try        int := 0;
  -- 32자. 혼동 문자 0 O 1 I 를 뺐다.
  v_alphabet   constant text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  select cm.couple_id into v_couple_id
  from public.couple_members cm where cm.user_id = v_uid;

  if v_couple_id is null then
    raise exception 'NO_COUPLE' using errcode = '42501';
  end if;

  select array_agg(cm.side) into v_taken
  from public.couple_members cm where cm.couple_id = v_couple_id;

  if coalesce(array_length(v_taken, 1), 0) >= 2 then
    raise exception 'COUPLE_FULL' using errcode = '23505';
  end if;

  v_side := case when 'groom' = any(v_taken) then 'bride' else 'groom' end;

  -- 재발급하면 이전 코드는 즉시 무효다. 부분 UNIQUE 인덱스가 '미사용·미폐기 코드 1개'를
  -- 강제하므로 이 UPDATE를 빠뜨리면 아래 INSERT가 실패한다.
  -- 이미 만료된 코드도 함께 폐기해야 인덱스가 풀린다.
  update public.couple_invites ci
     set revoked_at = now()
   where ci.couple_id = v_couple_id
     and ci.used_by is null
     and ci.revoked_at is null;

  loop
    v_try := v_try + 1;
    v_code := '';
    for i in 1..6 loop
      v_code := v_code || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
    end loop;

    begin
      insert into public.couple_invites (couple_id, code, side, expires_at, created_by)
      values (v_couple_id, v_code, v_side, now() + interval '7 days', v_uid)
      returning * into v_row;
      exit;
    exception when unique_violation then
      if v_try >= 10 then raise; end if;
    end;
  end loop;

  return v_row;
end;
$$;

-- ──────────────  active_invite — 내 커플의 살아 있는 코드 조회  ──────────────
-- 새로고침 후에도 설정 화면이 현재 코드를 다시 보여줄 수 있게 한다.
-- 자기 커플 것만 나온다 — 코드로 남의 것을 찾는 경로는 redeem 말고 없다.
create or replace function public.active_invite()
returns public.couple_invites
language sql
stable
security definer
set search_path = ''
as $$
  select ci.*
  from public.couple_invites ci
  where ci.couple_id = (select public.current_couple_id())
    and ci.used_by is null
    and ci.revoked_at is null
    and ci.expires_at > now()
  limit 1
$$;

-- ────────────────────  redeem_invite — 코드로 참여  ────────────────────
create or replace function public.redeem_invite(p_code text, p_display_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := (select auth.uid());
  v_invite public.couple_invites;
  v_count  int;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;
  if exists (select 1 from public.couple_members cm where cm.user_id = v_uid) then
    raise exception 'ALREADY_IN_COUPLE' using errcode = '23505';
  end if;
  if length(btrim(coalesce(p_display_name, ''))) = 0 then
    raise exception 'DISPLAY_NAME_REQUIRED' using errcode = '22023';
  end if;

  -- 만료·사용 여부를 한 번에 건다. 실패 사유를 나누지 않는 건 의도적이다 —
  -- '만료됨'과 '없는 코드'를 구분해 주면 코드를 긁는 쪽에 힌트가 된다.
  select * into v_invite
  from public.couple_invites ci
  where ci.code = upper(btrim(p_code))
    and ci.used_by is null
    and ci.revoked_at is null
    and ci.expires_at > now()
  for update;

  if v_invite.id is null then
    raise exception 'INVALID_CODE' using errcode = '22023';
  end if;

  select count(*) into v_count
  from public.couple_members cm where cm.couple_id = v_invite.couple_id;

  if v_count >= 2 then
    raise exception 'COUPLE_FULL' using errcode = '23505';
  end if;

  insert into public.couple_members (couple_id, user_id, side, display_name)
  values (v_invite.couple_id, v_uid, v_invite.side, btrim(p_display_name));

  update public.couple_invites ci
     set used_by = v_uid, used_at = now()
   where ci.id = v_invite.id;

  return v_invite.couple_id;
end;
$$;

revoke execute on function public.create_couple(text, date, bigint, text, text) from public;
revoke execute on function public.create_invite()                               from public;
revoke execute on function public.active_invite()                               from public;
revoke execute on function public.redeem_invite(text, text)                     from public;

grant execute on function public.create_couple(text, date, bigint, text, text) to authenticated;
grant execute on function public.create_invite()                               to authenticated;
grant execute on function public.active_invite()                               to authenticated;
grant execute on function public.redeem_invite(text, text)                     to authenticated;
