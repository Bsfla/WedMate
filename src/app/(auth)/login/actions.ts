"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

import type { AuthField, AuthState } from "./types";

/** Supabase 기본값. 대시보드 Authentication → Providers에서 바꿀 수 있다. */
const MIN_PASSWORD_LENGTH = 6;

type AuthErrorView = { message: string; field?: AuthField };

/**
 * Supabase 에러를 화면 문구 + **귀속 필드**로 옮긴다.
 *
 * 원문은 영어인 데다("Invalid login credentials") 무엇을 어떻게 고쳐야 하는지 알려주지 않는다.
 * design-system.md 6-b의 에러 문구 규칙 — **무엇이 잘못됐고 어떻게 고치는지 쓴다**.
 *
 * `field`를 비워 두면 폼 상단 알림으로 뜬다. 어느 입력을 고쳐야 할지 **확실할 때만** 채운다.
 */
function toAuthError(error: AuthError): AuthErrorView {
  switch (error.code) {
    case "invalid_credentials":
      // field를 채우지 않는다 — 어느 쪽이 틀렸는지 알 수 없고,
      // 추측해서 이메일 쪽에 붙이면 계정 존재 여부가 새어 나간다.
      return { message: "이메일 또는 비밀번호가 맞지 않아요. 다시 확인해 주세요." };
    case "user_already_exists":
    case "email_exists":
      // 고칠 곳이 입력이 아니라 세그먼티드 컨트롤이라 필드에 붙이지 않는다.
      return { message: "이미 가입된 이메일이에요. 위에서 '로그인'을 선택해 주세요." };
    case "weak_password":
      return {
        message: `비밀번호가 너무 짧아요. ${MIN_PASSWORD_LENGTH}자 이상으로 정해 주세요.`,
        field: "password",
      };
    case "validation_failed":
      return { message: "이메일 형식을 확인해 주세요.", field: "email" };
    case "email_not_confirmed":
      return { message: "메일함에서 확인 링크를 먼저 눌러주세요." };
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return { message: "요청이 너무 잦아요. 잠시 뒤에 다시 시도해 주세요." };
    default:
      // 매핑하지 않은 코드는 원문을 그대로 보여준다. 삼키면 원인을 알 수 없다.
      return { message: `로그인에 실패했어요. (${error.code ?? error.message})` };
  }
}

function readForm(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  };
}

export async function signInAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password } = readForm(formData);

  if (!email) return { status: "error", message: "이메일을 입력해 주세요.", field: "email" };
  if (!password) return { status: "error", message: "비밀번호를 입력해 주세요.", field: "password" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { status: "error", ...toAuthError(error) };

  // 레이아웃까지 다시 그려야 로그인 상태가 반영된다.
  revalidatePath("/", "layout");
  redirect("/");
}

export async function signUpAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password } = readForm(formData);

  if (!email) return { status: "error", message: "이메일을 입력해 주세요.", field: "email" };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      status: "error",
      message: `비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상으로 정해 주세요.`,
      field: "password",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) return { status: "error", ...toAuthError(error) };

  // 대시보드의 `Confirm email`이 켜져 있으면 세션 없이 사용자만 만들어진다.
  // 이 앱은 메일 인프라 없이 P1을 끝내는 전제라 꺼 두는 것을 권하지만,
  // 켜져 있어도 화면이 막다른 길로 끝나지 않게 이 분기를 남긴다. (→ D-033)
  if (!data.session) {
    return {
      status: "check-email",
      message: "확인 메일을 보냈어요. 메일함의 링크를 누르면 가입이 끝납니다.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/login");
}
