#!/usr/bin/env node
/**
 * P1 완료 판정 — 로컬 스택 자동 검증.
 *
 *   npm run verify:p1
 *
 * roadmap.md 「P1 완료 판정」의 9줄 중 **화면 확인 1줄을 뺀 나머지**를 실제 HTTP로 돌린다.
 * 계정 3개를 만들어 온보딩 → 초대 → 참여 → 카테고리 → RLS까지 한 번에 밟는다.
 *
 * 🔴 **왜 이 스크립트가 있는가** — `/settings/wedding`의 저장은 만들어진 날부터 한 번도
 * 동작하지 않았다. lint·build 무경고로 통과했고 커밋됐고 배포까지 됐는데, PostgREST가
 * 필터 없는 UPDATE를 거부(21000)한다는 걸 아무도 몰랐다. 잡힌 이유는 사람이 눌러봤기
 * 때문이다. 타입 검사와 빌드는 **요청이 실제로 나가서 무엇이 돌아오는지**를 모른다. (→ D-078)
 *
 * 그래서 이 스크립트는 UI를 흉내내지 않고 **서버 액션이 하는 것과 같은 HTTP 요청**을 던진다.
 * mock이 없다 — 진짜 Postgres, 진짜 RLS, 진짜 PostgREST다.
 *
 * 필요한 것: Docker + `npx supabase start` (로컬 스택). 원격에는 절대 쏘지 않는다.
 */

import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/* 이 문자열이 붙은 커플·계정만 정리한다. 로컬에 남아 있는 다른 데이터는 건드리지 않는다. */
const MARK = "__P1VERIFY__";
const PASSWORD = "verify-p1-pw";

let passed = 0;
let failed = 0;
const failures = [];

function ok(label, detail = "") {
  passed += 1;
  console.log(`  [32m✓[0m ${label}${detail ? `  [2m${detail}[0m` : ""}`);
}

function bad(label, detail) {
  failed += 1;
  failures.push({ label, detail });
  console.log(`  [31m✗[0m ${label}`);
  if (detail) console.log(`      [31m${detail}[0m`);
}

function check(label, condition, detail = "") {
  if (condition) ok(label, detail);
  else bad(label, detail || "조건 불만족");
}

function section(title) {
  console.log(`\n[1m${title}[0m`);
}

/* ─────────────────────────────────────────────── 로컬 스택 접속 정보 */

function readStatus() {
  let raw;
  try {
    raw = execFileSync("npx", ["supabase", "status", "-o", "json"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32",
    });
  } catch {
    console.error(
      "[31m로컬 Supabase 스택을 읽지 못했습니다.[0m\n" +
        "  Docker를 켜고 `npx supabase start`를 먼저 실행해 주세요.",
    );
    process.exit(2);
  }
  // status가 안내 문구를 함께 뱉을 수 있어 JSON 객체만 뽑는다.
  const json = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
  return JSON.parse(json);
}

const status = readStatus();
const API = status.API_URL;
const ANON = status.ANON_KEY;
const SERVICE = status.SERVICE_ROLE_KEY;

if (!API || !ANON || !SERVICE) {
  console.error("[31mAPI_URL / ANON_KEY / SERVICE_ROLE_KEY를 찾지 못했습니다.[0m");
  process.exit(2);
}
/* 🔴 원격 사고 방지. 로컬 스택이 아니면 즉시 멈춘다 — 이 스크립트는 계정과 커플을 지운다. */
if (!/^https?:\/\/(127\.0\.0\.1|localhost)/.test(API)) {
  console.error(`[31m로컬이 아닌 API_URL입니다: ${API}[0m`);
  process.exit(2);
}

/* ─────────────────────────────────────────────── HTTP 헬퍼 */

async function api(path, { token, method = "GET", body, headers = {} } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      apikey: ANON,
      Authorization: `Bearer ${token ?? ANON}`,
      "Content-Type": "application/json",
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  return { status: res.status, data };
}

/** PostgREST 테이블 요청. `select`가 있으면 그대로 붙인다. */
const rest = (path, opts) => api(`/rest/v1/${path}`, opts);
/** SECURITY DEFINER RPC. 에러 본문의 `message`가 곧 토큰이다 (→ rpc-error.ts). */
const rpc = (fn, token, args = {}) =>
  api(`/rest/v1/rpc/${fn}`, { token, method: "POST", body: args });

/** 로컬 Postgres 직접 실행 — 시간 이동처럼 API로 못 만드는 상태에만 쓴다. */
function sql(query) {
  return execFileSync(
    "docker",
    ["exec", "-i", "supabase_db_buget", "psql", "-U", "postgres", "-d", "postgres", "-tAc", query],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  ).trim();
}

/* ─────────────────────────────────────────────── 계정 */

async function createUser(tag) {
  const email = `${tag}.${MARK.toLowerCase()}@example.test`;
  await api("/auth/v1/admin/users", {
    token: SERVICE,
    method: "POST",
    headers: { apikey: SERVICE },
    body: { email, password: PASSWORD, email_confirm: true },
  });
  const { data } = await api("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: { email, password: PASSWORD },
  });
  if (!data?.access_token) {
    console.error(`[31m${email} 로그인 실패[0m`, data);
    process.exit(2);
  }
  return { email, token: data.access_token, id: data.user.id };
}

function cleanup() {
  /* 커플을 먼저 지운다 — cascade로 멤버·카테고리·초대가 함께 사라진다.
     계정을 먼저 지우면 멤버만 빠지고 커플이 고아로 남는다. */
  sql(`delete from public.couples where name like '%${MARK}%'`);
  sql(`delete from auth.users where email like '%${MARK.toLowerCase()}%'`);
}

/* ─────────────────────────────────────────────── 본문 */

console.log(`[1mP1 완료 판정 검증[0m  [2m${API}[0m`);
cleanup();

const A = await createUser("a");
const B = await createUser("b");
const C = await createUser("c");

section("1. 스페이스 생성 · 예식 정보 저장");

const created = await rpc("create_couple", A.token, {
  p_name: `우리 결혼 준비 ${MARK}`,
  p_wedding_date: "2026-11-14",
  p_total_budget: 26000000,
  p_display_name: "예랑",
  p_side: "groom",
});
check("A가 스페이스를 만든다", typeof created.data === "string", JSON.stringify(created.data));
const coupleId = typeof created.data === "string" ? created.data : null;

const seeded = sql(
  `select level || ':' || count(*) from public.categories where couple_id='${coupleId}' group by level order by level`,
)
  .split("\n")
  .join(" ");
check(
  "시드가 대4/중11/소25로 깔린다",
  seeded.includes("major:4") && seeded.includes("mid:11") && seeded.includes("minor:25"),
  seeded,
);

/* 🔴 D-078 회귀. 이 요청이 성공하면 안 된다 — 성공한다면 누군가 안전장치를 껐다는 뜻이고,
   반대로 여기서 21000이 나오는 것이 `.eq()`가 필요한 이유의 증거다. */
const unfiltered = await rest("couples?select=id", {
  token: A.token,
  method: "PATCH",
  body: { total_budget: 1 },
  headers: { Prefer: "return=representation" },
});
check(
  "필터 없는 UPDATE는 PostgREST가 거부한다 (D-078)",
  unfiltered.data?.code === "21000",
  `받은 값: ${JSON.stringify(unfiltered.data)}`,
);

/* 서버 액션 `updateWeddingInfoAction`이 실제로 던지는 요청과 같은 모양이다. */
const saved = await rest(
  `couples?id=eq.${coupleId}&select=wedding_date,total_budget,guest_min_guarantee,avg_gift_amount,meal_cost_per_head`,
  {
    token: A.token,
    method: "PATCH",
    body: {
      wedding_date: "2026-12-25",
      total_budget: 30000000,
      guest_min_guarantee: 220,
      avg_gift_amount: 80000,
      meal_cost_per_head: 70000,
    },
    headers: { Prefer: "return=representation" },
  },
);
const row = Array.isArray(saved.data) ? saved.data[0] : null;
check(
  "예식 정보 5필드가 저장된다",
  row?.wedding_date === "2026-12-25" &&
    row?.guest_min_guarantee === 220 &&
    row?.meal_cost_per_head === 70000,
  JSON.stringify(saved.data),
);

section("2. 초대 · 참여 · 역할 자동 배정");

const invite = await rpc("create_invite", A.token);
const code = invite.data?.code;
check("A가 초대 코드를 발급한다", typeof code === "string" && code.length === 6, String(code));
check(
  "코드의 side가 남은 역할(bride)로 고정된다",
  invite.data?.side === "bride",
  String(invite.data?.side),
);

const redeemed = await rpc("redeem_invite", B.token, { p_code: code, p_display_name: "예신" });
check("B가 코드로 참여한다", redeemed.data === coupleId, JSON.stringify(redeemed.data));

const bSide = sql(
  `select side from public.couple_members where user_id='${B.id}' and couple_id='${coupleId}'`,
);
check("B의 역할이 A의 반대(groom→bride)로 자동 배정된다", bSide === "bride", bSide);

const bView = await rest("couples?select=id,name", { token: B.token });
check(
  "양쪽이 같은 스페이스를 본다",
  Array.isArray(bView.data) && bView.data[0]?.id === coupleId,
  JSON.stringify(bView.data),
);

section("3. 코드 재사용 · 초과 · 만료 거부");

const reuse = await rpc("redeem_invite", C.token, { p_code: code, p_display_name: "제3자" });
check(
  "이미 쓴 코드는 거부된다",
  String(reuse.data?.message).includes("INVALID_CODE"),
  JSON.stringify(reuse.data),
);

const full = await rpc("create_invite", A.token);
check(
  "2명이 찬 커플은 발급이 거부된다",
  String(full.data?.message).includes("COUPLE_FULL"),
  JSON.stringify(full.data),
);

/* 만료는 48시간이라 기다릴 수 없다. 코드를 하나 살려 두고 `expires_at`을 과거로 민다.
   B를 빼서 자리를 비워야 발급이 되므로, 검증 순서상 여기서 한 번 내보낸다. */
sql(`delete from public.couple_members where user_id='${B.id}'`);
const revived = await rpc("create_invite", A.token);
const expiredCode = revived.data?.code;
sql(
  `update public.couple_invites set expires_at = now() - interval '1 hour' where code='${expiredCode}'`,
);
const expired = await rpc("redeem_invite", C.token, {
  p_code: expiredCode,
  p_display_name: "제3자",
});
check(
  "만료된 코드는 거부된다",
  String(expired.data?.message).includes("INVALID_CODE"),
  JSON.stringify(expired.data),
);

section("4. 카테고리 — 추가 · 보관 cascade");

const midId = sql(
  `select id from public.categories where couple_id='${coupleId}' and level='mid' and name='예식'`,
);
const addedMinor = await rest("categories?select=id", {
  token: A.token,
  method: "POST",
  body: {
    couple_id: coupleId,
    level: "minor",
    parent_id: midId,
    name: `본식 DVD ${MARK}`,
    sort_order: 99,
  },
  headers: { Prefer: "return=representation" },
});
const newMinorId = Array.isArray(addedMinor.data) ? addedMinor.data[0]?.id : null;
check("소분류를 추가한다", Boolean(newMinorId), JSON.stringify(addedMinor.data));

const inView = sql(
  `select count(*) from public.v_budget_lines where category_id='${newMinorId}'`,
);
check("추가한 소분류가 집계 View(v_budget_lines)에 뜬다", inView === "1", `${inView}행`);

/* 서버 액션 `setCategoryArchivedAction`과 같은 모양 — 부모와 자식을 한 문장으로 UPDATE한다. */
const childIds = sql(
  `select string_agg(id::text, ',') from public.categories where parent_id='${midId}'`,
).split(",");
await rest(`categories?id=in.(${[midId, ...childIds].join(",")})&select=id`, {
  token: A.token,
  method: "PATCH",
  body: { is_archived: true },
  headers: { Prefer: "return=representation" },
});
const cascade = sql(
  `select count(*) filter (where is_archived) || '/' || count(*) from public.categories where parent_id='${midId}'`,
);
const [archivedCount, totalCount] = cascade.split("/");
check(
  "중분류를 보관하면 자식 소분류까지 is_archived가 된다",
  archivedCount === totalCount && Number(totalCount) > 0,
  `${cascade} 보관됨`,
);

const viewArchived = sql(
  `select is_archived from public.v_budget_lines where category_id='${newMinorId}'`,
);
check("보관이 집계 View에 반영된다", viewArchived === "t", viewArchived);

const expenseKept = sql(
  `select count(*) from public.categories where couple_id='${coupleId}' and parent_id='${midId}'`,
);
check(
  "보관해도 행 자체는 남는다 (삭제가 아니다)",
  Number(expenseKept) === Number(totalCount),
  `${expenseKept}행`,
);

section("5. RLS");

/* C는 어느 커플에도 속하지 않는다. A의 couple_id를 직접 지목해도 아무것도 보이면 안 된다. */
const rlsCouples = await rest(`couples?id=eq.${coupleId}&select=id`, { token: C.token });
check(
  "다른 커플 계정으로 A의 couple_id 조회 시 0건 — couples",
  Array.isArray(rlsCouples.data) && rlsCouples.data.length === 0,
  JSON.stringify(rlsCouples.data),
);

const rlsCategories = await rest(`categories?couple_id=eq.${coupleId}&select=id`, {
  token: C.token,
});
check(
  "다른 커플 계정으로 조회 시 0건 — categories",
  Array.isArray(rlsCategories.data) && rlsCategories.data.length === 0,
  JSON.stringify(rlsCategories.data),
);

const rlsWrite = await rest("categories?select=id", {
  token: C.token,
  method: "POST",
  body: { couple_id: coupleId, level: "mid", parent_id: midId, name: "침입" },
  headers: { Prefer: "return=representation" },
});
check(
  "남의 couple_id로 INSERT는 정책 위반으로 거부된다",
  rlsWrite.status >= 400,
  JSON.stringify(rlsWrite.data),
);

const rlsInvites = await rest("couple_invites?select=code", { token: C.token });
check(
  "초대 코드 테이블 직접 SELECT는 거부된다",
  rlsInvites.status >= 400 ||
    (Array.isArray(rlsInvites.data) && rlsInvites.data.length === 0),
  JSON.stringify(rlsInvites.data),
);

section("6. 소스 정적 검사 — 필터 없는 쓰기");

/* 🔴 위의 HTTP 검증만으로는 **원래 버그를 못 잡는다.** 이 스크립트는 자기가 조립한
   필터 붙은 요청을 던지지, `actions.ts`가 실제로 무엇을 보내는지는 모른다.
   D-078을 잡아낸 것은 사람이 화면을 눌러본 일이었다.

   그 구멍을 메우는 것이 이 절이다 — 소스에서 `.update(` · `.delete(` 를 찾아
   같은 체인에 필터가 붙어 있는지 본다. 문법 파싱이 아니라 문자열 검사라 완벽하지 않지만,
   "RLS가 좁히니 `.eq()`는 불필요하다"는 **바로 그 실수**를 잡는다. */

const FILTERS = [".eq(", ".in(", ".match(", ".neq(", ".gt(", ".lt(", ".gte(", ".lte(", ".like(", ".is("];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

const offenders = [];
for (const file of walk("src")) {
  const source = readFileSync(file, "utf8");
  const lines = source.split("\n");
  lines.forEach((line, index) => {
    if (!/\.(update|delete)\(/.test(line)) return;
    // 체인은 여러 줄에 걸친다. 문장이 끝나는 `;`까지 이어 붙여 본다.
    let chain = "";
    for (let i = index; i < Math.min(index + 25, lines.length); i += 1) {
      chain += lines[i];
      if (lines[i].includes(";")) break;
    }
    if (!FILTERS.some((f) => chain.includes(f))) {
      offenders.push(`${file}:${index + 1}  ${line.trim()}`);
    }
  });
}

check(
  "모든 .update() · .delete()에 필터가 붙어 있다 (D-078)",
  offenders.length === 0,
  offenders.join("\n      "),
);

/* ─────────────────────────────────────────────── 마무리 */

cleanup();

console.log(
  `\n[1m결과[0m  [32m${passed} 통과[0m` +
    (failed ? `  [31m${failed} 실패[0m` : "") +
    "\n",
);

if (failed) {
  console.log("[31m실패 항목[0m");
  for (const f of failures) console.log(`  · ${f.label}\n    ${f.detail}`);
  console.log(
    "\n[2m브라우저로만 확인되는 판정 1줄은 이 스크립트에 없다 —\n" +
      "  홈에서 내가 넣은 예식일로 D-day가 뜨는지.[0m\n",
  );
  process.exit(1);
}

console.log(
  "[2m남은 판정 1줄은 사람이 봐야 한다 — 홈에서 내가 넣은 예식일로 D-day가 뜨는지.[0m\n",
);
