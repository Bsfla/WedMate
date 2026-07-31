-- 0006 · 집계 View 5종
--
-- 화면은 합계를 계산하지 않는다. 지금 fixtures.ts의 선택자 함수가 하는 일을 그대로 DB로 옮긴 것이다
-- (→ D-010, D-011).
--
-- ⚠️ security_invoker는 기본값이 아니다. 빠뜨리면 View가 소유자 권한으로 돌아 RLS를 통과해
--    남의 커플 결산이 보인다. 다섯 개 전부에 명시한다 (→ D-026).
--
-- 검증 기준은 roadmap.md의 DoD 표다. ?fixture=sheet와 같은 숫자가 나와야 한다.

-- ────────────────────  ① v_budget_lines — 소분류별  ────────────────────
-- 예산 화면과 결산 ②가 읽는다. 예산 행이 없는 소분류도 지출은 잡히도록 categories가 기준이다.
create view public.v_budget_lines with (security_invoker = on) as
select
  c.couple_id,
  c.id                                       as category_id,
  c.name                                     as minor_name,
  c.sort_order                               as minor_sort,
  c.is_archived,
  mid.id                                     as mid_id,
  mid.name                                   as mid_name,
  mid.sort_order                             as mid_sort,
  maj.id                                     as major_id,
  maj.major_key,
  maj.name                                   as major_name,
  maj.sort_order                             as major_sort,
  coalesce(b.amount, 0)::bigint              as budget_amount,
  coalesce(e.confirmed_amount, 0)::bigint    as confirmed_amount,
  coalesce(e.estimated_amount, 0)::bigint    as estimated_amount,
  (coalesce(b.amount, 0) - coalesce(e.confirmed_amount, 0))::bigint as remaining,
  case
    when coalesce(b.amount, 0) = 0 then null
    else round(coalesce(e.confirmed_amount, 0)::numeric * 100 / b.amount)
  end                                        as progress_pct,
  b.vendor_candidate,
  b.reference_url,
  b.note
from public.categories c
join public.categories mid on mid.id = c.parent_id
join public.categories maj on maj.id = mid.parent_id
left join public.budgets b
  on b.couple_id = c.couple_id and b.category_id = c.id
left join lateral (
  select
    sum(x.amount) filter (where not x.is_estimated) as confirmed_amount,
    sum(x.amount) filter (where     x.is_estimated) as estimated_amount
  from public.expenses x
  where x.category_id = c.id
) e on true
where c.level = 'minor';

-- ────────────────────  ② v_major_rollup — 대분류별  ────────────────────
-- 배분 vs 세부 합을 나란히 놓는다. over_allocation이 시트에 없던 '배분 초과 경고'다.
create view public.v_major_rollup with (security_invoker = on) as
select
  maj.couple_id,
  maj.id                                  as major_id,
  maj.major_key,
  maj.name                                as major_name,
  maj.sort_order                          as major_sort,
  coalesce(a.amount, 0)::bigint           as allocated,
  coalesce(l.detail_total, 0)::bigint     as detail_total,
  coalesce(l.confirmed_amount, 0)::bigint as confirmed_amount,
  coalesce(l.estimated_amount, 0)::bigint as estimated_amount,
  (coalesce(a.amount, 0) - coalesce(l.confirmed_amount, 0))::bigint as remaining,
  greatest(coalesce(l.detail_total, 0) - coalesce(a.amount, 0), 0)::bigint as over_allocation,
  case
    when coalesce(a.amount, 0) = 0 then null
    else round(coalesce(l.confirmed_amount, 0)::numeric * 100 / a.amount)
  end                                     as progress_pct
from public.categories maj
left join public.budget_allocations a
  on a.couple_id = maj.couple_id and a.category_id = maj.id
left join lateral (
  select
    sum(v.budget_amount)    as detail_total,
    sum(v.confirmed_amount) as confirmed_amount,
    sum(v.estimated_amount) as estimated_amount
  from public.v_budget_lines v
  where v.major_id = maj.id
) l on true
where maj.level = 'major';

-- ──────────────────  ③ v_settlement — 분담 정산 (커플당 1행)  ──────────────────
-- joint(공동계좌)는 양쪽에 절반씩 귀속되고, other(제3자)는 커플 돈이 아니므로
-- 부담·정산액 어디에도 들어가지 않는다. 별도 줄로만 뜬다 (→ D-023).
create view public.v_settlement with (security_invoker = on) as
with paid as (
  select
    c.id as couple_id,
    coalesce(sum(e.amount) filter (where pm.payer = 'groom'), 0)::bigint as groom_paid,
    coalesce(sum(e.amount) filter (where pm.payer = 'bride'), 0)::bigint as bride_paid,
    coalesce(sum(e.amount) filter (where pm.payer = 'joint'), 0)::bigint as joint_paid,
    coalesce(sum(e.amount) filter (where pm.payer = 'other'), 0)::bigint as other_paid
  from public.couples c
  left join public.expenses e
    on e.couple_id = c.id and not e.is_estimated
  left join public.payment_methods pm on pm.id = e.payment_method_id
  group by c.id
), burden as (
  -- 홀수 원이 남아도 합이 어긋나지 않도록, 예신 쪽이 나머지를 가져간다.
  select
    p.*,
    (p.groom_paid + round(p.joint_paid / 2.0))::bigint                        as groom_burden,
    (p.bride_paid + (p.joint_paid - round(p.joint_paid / 2.0)))::bigint       as bride_burden
  from paid p
)
select
  b.couple_id,
  b.groom_paid,
  b.bride_paid,
  b.joint_paid,
  b.other_paid,
  (b.groom_paid + b.bride_paid + b.joint_paid)::bigint as couple_total,
  b.groom_burden,
  b.bride_burden,
  (abs(b.groom_burden - b.bride_burden) / 2)::bigint   as settle_amount,
  case
    when b.groom_burden > b.bride_burden then 'bride_to_groom'
    when b.bride_burden > b.groom_burden then 'groom_to_bride'
    else 'even'
  end as settle_direction
from burden b;

-- ─────────────  ④ v_monthly_timeline — 월별 확정/예상 2계열  ─────────────
create view public.v_monthly_timeline with (security_invoker = on) as
select
  e.couple_id,
  e.spent_year,
  e.spent_month,
  coalesce(sum(e.amount) filter (where not e.is_estimated), 0)::bigint as confirmed_amount,
  coalesce(sum(e.amount) filter (where     e.is_estimated), 0)::bigint as estimated_amount
from public.expenses e
group by e.couple_id, e.spent_year, e.spent_month;

-- ────────────  ⑤ v_guest_summary — 하객 · 보증인원 · 최종 손익  ────────────
-- 최종 손익의 비교 대상은 아직 미결(O-002)이라 구성 요소를 전부 노출해 두고,
-- 현재 구현과 같은 식(예상 축의금 − 결혼식 세부 합 − 미달 식대)을 net_expected로 둔다.
create view public.v_guest_summary with (security_invoker = on) as
with g as (
  select
    c.id as couple_id,
    coalesce(sum(1 + gu.companion_count) filter (where gu.expected_attend), 0)::bigint as expected_headcount,
    coalesce(sum(gu.actual_attend_count), 0)::bigint                                   as actual_headcount,
    coalesce(sum(gu.gift_amount), 0)::bigint                                           as actual_gift_total
  from public.couples c
  left join public.guests gu on gu.couple_id = c.id
  group by c.id
)
select
  c.id as couple_id,
  g.expected_headcount,
  g.actual_headcount,
  g.actual_gift_total,
  c.guest_min_guarantee,
  (c.guest_min_guarantee - g.expected_headcount)::bigint            as guarantee_gap,
  (g.expected_headcount * c.avg_gift_amount)::bigint                as expected_gift_total,
  (greatest(c.guest_min_guarantee - g.expected_headcount, 0)
     * c.meal_cost_per_head)::bigint                                as shortfall_meal_cost,
  coalesce(w.detail_total, 0)::bigint                               as wedding_budget_total,
  coalesce(w.confirmed_amount, 0)::bigint                           as wedding_confirmed_total,
  (g.expected_headcount * c.avg_gift_amount
     - coalesce(w.detail_total, 0)
     - greatest(c.guest_min_guarantee - g.expected_headcount, 0)
       * c.meal_cost_per_head)::bigint                              as net_expected,
  (g.actual_gift_total - coalesce(w.confirmed_amount, 0))::bigint   as net_actual
from public.couples c
join g on g.couple_id = c.id
left join public.v_major_rollup w
  on w.couple_id = c.id and w.major_key = 'wedding';

grant select on public.v_budget_lines     to authenticated;
grant select on public.v_major_rollup     to authenticated;
grant select on public.v_settlement       to authenticated;
grant select on public.v_monthly_timeline to authenticated;
grant select on public.v_guest_summary    to authenticated;
