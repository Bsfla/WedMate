-- 0003 · 스페이스 시드 — 대4 / 중11 / 소25 + 결제수단 16
--
-- 원본은 src/lib/mock/fixtures.ts의 RICH_BUDGETS다. 목업과 시드가 어긋나면
-- ?fixture=sheet 회귀 세트가 실데이터와 다른 숫자를 내므로, 여기를 고치면 저기도 고친다.
--
-- create_couple()(0007)만 이 함수를 부른다. 직접 실행 권한은 아무에게도 주지 않는다.

create or replace function public.seed_couple_defaults(p_couple_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- ── 대분류 4 (추가·삭제 불가. 이름 변경만 허용)
  insert into public.categories (couple_id, level, parent_id, name, major_key, sort_order)
  values
    (p_couple_id, 'major', null, '결혼식',   'wedding',   1),
    (p_couple_id, 'major', null, '신혼여행', 'honeymoon', 2),
    (p_couple_id, 'major', null, '혼수',     'household', 3),
    (p_couple_id, 'major', null, '신혼집',   'home',      4);

  -- ── 중분류 11
  insert into public.categories (couple_id, level, parent_id, name, sort_order)
  select p_couple_id, 'mid', maj.id, s.mid_name, s.mid_sort
  from (values
    ('wedding',   '상견례',     1),
    ('wedding',   '스드메',     2),
    ('wedding',   '예식',       3),
    ('wedding',   '예단',       4),
    ('honeymoon', '항공',       1),
    ('honeymoon', '숙박',       2),
    ('honeymoon', '현지',       3),
    ('household', '가전',       1),
    ('household', '가구',       2),
    ('home',      '인테리어',   1),
    ('home',      '이사',       2)
  ) as s(major_key, mid_name, mid_sort)
  join public.categories maj
    on maj.couple_id = p_couple_id
   and maj.level = 'major'
   and maj.major_key = s.major_key;

  -- ── 소분류 25
  insert into public.categories (couple_id, level, parent_id, name, sort_order)
  select p_couple_id, 'minor', mid.id, s.minor_name, s.minor_sort
  from (values
    ('wedding',   '상견례',   '상견례 식사',   1),
    ('wedding',   '상견례',   '청첩장 모임',   2),
    ('wedding',   '스드메',   '드레스',        1),
    ('wedding',   '스드메',   '스튜디오 스냅', 2),
    ('wedding',   '스드메',   '신부 메이크업', 3),
    ('wedding',   '스드메',   '본식 스냅',     4),
    ('wedding',   '스드메',   '부케',          5),
    ('wedding',   '예식',     '웨딩홀 대관',   1),
    ('wedding',   '예식',     '주례',          2),
    ('wedding',   '예식',     '청첩장',        3),
    ('wedding',   '예식',     '폐백',          4),
    ('wedding',   '예식',     '사회·축가',     5),
    ('wedding',   '예식',     '주차·기타',     6),
    ('wedding',   '예단',     '예단·예물',     1),
    ('honeymoon', '항공',     '항공권',        1),
    ('honeymoon', '숙박',     '리조트 숙박',   1),
    ('honeymoon', '현지',     '현지 경비',     1),
    ('household', '가전',     '냉장고',        1),
    ('household', '가전',     '세탁기',        2),
    ('household', '가구',     '침대',          1),
    ('household', '가구',     '소파',          2),
    ('home',      '인테리어', '도배·장판',     1),
    ('home',      '인테리어', '조명',          2),
    ('home',      '이사',     '이사비',        1),
    ('home',      '이사',     '입주청소',      2)
  ) as s(major_key, mid_name, minor_name, minor_sort)
  join public.categories maj
    on maj.couple_id = p_couple_id
   and maj.level = 'major'
   and maj.major_key = s.major_key
  join public.categories mid
    on mid.couple_id = p_couple_id
   and mid.level = 'mid'
   and mid.parent_id = maj.id
   and mid.name = s.mid_name;

  -- ── 결제수단 16 = 결제자 4 × 수단 4 (→ D-023)
  insert into public.payment_methods (couple_id, payer, method)
  select p_couple_id, p, m
  from   unnest(array['groom', 'bride', 'joint', 'other'])   as p,
         unnest(array['cash', 'card', 'voucher', 'account']) as m;
end;
$$;

revoke execute on function public.seed_couple_defaults(uuid) from public;
