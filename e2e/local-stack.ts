/**
 * 로컬 Supabase 스택 접속 정보.
 *
 * 🔴 **e2e는 로컬 스택에만 붙는다.** 테스트가 계정을 만들고 지우기 때문이다.
 * `.env.local`은 호스팅 프로젝트를 가리키므로, `playwright.config.ts`가 여기서 읽은 값을
 * dev 서버에 **덮어씌워** 띄운다(Next는 이미 정의된 process.env를 .env 파일로 덮지 않는다).
 *
 * `scripts/verify-p1.mjs`와 같은 출처를 쓴다 — 둘이 다른 스택을 보면 한쪽이 통과하고
 * 한쪽이 실패하는 이유를 찾느라 시간을 버린다.
 */

import { execFileSync } from "node:child_process";

export type LocalStack = {
  apiUrl: string;
  anonKey: string;
  serviceKey: string;
};

let cached: LocalStack | null = null;

export function localStack(): LocalStack {
  if (cached) return cached;

  let raw: string;
  try {
    raw = execFileSync("npx", ["supabase", "status", "-o", "json"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32",
    });
  } catch {
    throw new Error(
      "로컬 Supabase 스택을 읽지 못했습니다. Docker를 켜고 `npx supabase start`를 먼저 실행해 주세요.",
    );
  }

  const status = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
  const stack: LocalStack = {
    apiUrl: status.API_URL,
    anonKey: status.ANON_KEY,
    serviceKey: status.SERVICE_ROLE_KEY,
  };

  if (!/^https?:\/\/(127\.0\.0\.1|localhost)/.test(stack.apiUrl ?? "")) {
    throw new Error(`로컬이 아닌 API_URL입니다: ${stack.apiUrl}`);
  }
  cached = stack;
  return stack;
}

/** 이 문자열이 붙은 계정·커플만 정리한다. 로컬에 남아 있는 다른 데이터는 건드리지 않는다. */
export const E2E_MARK = "__E2E__";

/** 로컬 Postgres 직접 실행 — API로 만들 수 없는 상태(정리·시간 이동)에만 쓴다. */
export function sql(query: string): string {
  return execFileSync(
    "docker",
    ["exec", "-i", "supabase_db_buget", "psql", "-U", "postgres", "-d", "postgres", "-tAc", query],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  ).trim();
}

export function cleanupE2E(): void {
  /* 🔴 커플을 **먼저** 지운다 — cascade로 멤버·카테고리·초대가 함께 사라진다.
     계정부터 지우면 멤버 행만 빠지고 **커플이 고아로 남는다.**

     커플 이름으로 못 고른다 — 온보딩 폼은 이름을 안 받고 `create_couple()`이
     '우리 결혼 준비'를 기본값으로 넣기 때문이다. 그래서 멤버의 이메일로 거슬러 올라간다. */
  sql(
    `delete from public.couples c where exists (
       select 1 from public.couple_members m
       join auth.users u on u.id = m.user_id
       where m.couple_id = c.id and u.email like '%${E2E_MARK.toLowerCase()}%')`,
  );
  sql(`delete from auth.users where email like '%${E2E_MARK.toLowerCase()}%'`);
}
