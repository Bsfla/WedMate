-- 0008 · 오참여 복구 — 나가기 · 내보내기 · 스페이스 삭제 + 초대 코드 만료 단축
--
-- 0007까지는 couple_members에 DELETE 정책도 GRANT도 없어서 **한 번 들어오면 뺄 방법이 없었다**.
-- 초대 코드가 새면 남이 우리 가계부를 영구히 들여다보게 된다. 그 구멍을 닫는다.
--
-- 세 가지 실패를 구분해서 연다:
--   A. 내가 엉뚱한 스페이스에 들어갔다        → leave_couple()
--   B. 남이 내 코드로 들어왔다 (비협조)        → remove_member(), 24시간 창
--   C. 파혼·이별로 영구 축출                   → **열지 않는다.** 별도 판단이 필요하다.
--
-- 데이터는 깨지지 않는다. 예산·지출·하객은 전부 couple_id에 매달려 있고
-- expenses.created_by는 on delete set null이라 멤버 한 명이 빠져도 원장이 남는다.
-- 나간 사람은 current_couple_id()가 null이 되어 RLS가 즉시 전부 차단한다.

-- ────────────────────  leave_couple — 내가 나가기  ────────────────────
-- **혼자 남았을 때는 나갈 수 없다.** couples에 owner가 없어서, 마지막 멤버가 나가면
-- 아무도 접근할 수 없는 유령 행이 남는다. 그 경우는 delete_couple()로 이름을 갈랐다 —
-- 결과가 "빠지기"가 아니라 "전부 지우기"이므로 같은 버튼이면 안 된다.
create or replace function public.leave_couple()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid       uuid := (select auth.uid());
  v_couple_id uuid;
  v_count     int;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  select cm.couple_id into v_couple_id
  from public.couple_members cm where cm.user_id = v_uid;

  if v_couple_id is null then
    raise exception 'NO_COUPLE' using errcode = '42501';
  end if;

  select count(*) into v_count
  from public.couple_members cm where cm.couple_id = v_couple_id;

  if v_count <= 1 then
    raise exception 'LAST_MEMBER' using errcode = '23503';
  end if;

  delete from public.couple_members cm
   where cm.couple_id = v_couple_id and cm.user_id = v_uid;
end;
$$;

-- ────────────────  remove_member — 늦게 들어온 사람 내보내기  ────────────────
-- 두 겹으로 막는다:
--   1. **가입 후 24시간 이내**만. 코드 유출은 대개 즉시 알아채고, 그 시점엔 데이터도 거의 없다.
--      창을 닫아 두는 이유는 이별·파혼에 의한 영구 축출(C)을 이 경로로 흘리지 않기 위함이다.
--   2. 🔴 **나보다 늦게 들어온 사람만**. 이게 없으면 유출된 코드로 들어온 쪽이
--      24시간 안에 원래 주인을 쫓아낼 수 있다 — 복구 수단이 공격 수단으로 뒤집힌다.
create or replace function public.remove_member(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid          uuid := (select auth.uid());
  v_couple_id    uuid;
  v_my_joined_at timestamptz;
  v_target       public.couple_members;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;
  if p_user_id is null or p_user_id = v_uid then
    -- 자기 자신은 이 경로가 아니다. 문구도 결과도 다르다.
    raise exception 'USE_LEAVE_INSTEAD' using errcode = '22023';
  end if;

  select cm.couple_id, cm.created_at into v_couple_id, v_my_joined_at
  from public.couple_members cm where cm.user_id = v_uid;

  if v_couple_id is null then
    raise exception 'NO_COUPLE' using errcode = '42501';
  end if;

  select * into v_target
  from public.couple_members cm
  where cm.couple_id = v_couple_id and cm.user_id = p_user_id
  for update;

  if v_target.user_id is null then
    raise exception 'NOT_A_MEMBER' using errcode = '22023';
  end if;

  -- 늦게 들어온 쪽만 내보낼 수 있다. 동시 가입은 구조상 불가능하다(create → redeem 순서).
  if v_target.created_at <= v_my_joined_at then
    raise exception 'NOT_REMOVABLE' using errcode = '42501';
  end if;

  if v_target.created_at <= now() - interval '24 hours' then
    raise exception 'REMOVE_WINDOW_CLOSED' using errcode = '42501';
  end if;

  delete from public.couple_members cm
   where cm.couple_id = v_couple_id and cm.user_id = p_user_id;
end;
$$;

-- ──────────────  delete_couple — 혼자일 때 스페이스째 지우기  ──────────────
-- 예산·지출·하객·카테고리가 전부 cascade로 사라진다. 되돌릴 수 없다.
-- **혼자일 때만** 허용한다 — 둘이 쓰는 데이터를 한 사람이 지울 수 있으면 안 된다.
create or replace function public.delete_couple()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid       uuid := (select auth.uid());
  v_couple_id uuid;
  v_count     int;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  select cm.couple_id into v_couple_id
  from public.couple_members cm where cm.user_id = v_uid;

  if v_couple_id is null then
    raise exception 'NO_COUPLE' using errcode = '42501';
  end if;

  select count(*) into v_count
  from public.couple_members cm where cm.couple_id = v_couple_id;

  if v_count > 1 then
    raise exception 'NOT_ALONE' using errcode = '42501';
  end if;

  delete from public.couples c where c.id = v_couple_id;
end;
$$;

-- ────────────────  create_invite — 만료 7일 → 48시간  ────────────────
-- 코드 엔트로피(32^6 ≈ 10억)는 문제가 아니다. 문제는 **유출**이라 노출 창을 줄이는 게 직접적이다.
-- 본문의 나머지는 0007과 같다.
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
      values (v_couple_id, v_code, v_side, now() + interval '48 hours', v_uid)
      returning * into v_row;
      exit;
    exception when unique_violation then
      if v_try >= 10 then raise; end if;
    end;
  end loop;

  return v_row;
end;
$$;

revoke execute on function public.leave_couple()        from public;
revoke execute on function public.remove_member(uuid)   from public;
revoke execute on function public.delete_couple()       from public;

grant execute on function public.leave_couple()         to authenticated;
grant execute on function public.remove_member(uuid)    to authenticated;
grant execute on function public.delete_couple()        to authenticated;
