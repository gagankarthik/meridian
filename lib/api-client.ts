import { fetchAuthSession } from "aws-amplify/auth";

/**
 * fetch() wrapper that attaches the Cognito ID token so route handlers can
 * authenticate the caller. Safe to call in demo mode (no token → no header).
 */
export async function authedFetch(
  input: string,
  init: RequestInit = {},
): Promise<Response> {
  let token = "";
  try {
    const session = await fetchAuthSession();
    token = session.tokens?.idToken?.toString() ?? "";
  } catch {
    /* not signed in — request goes out unauthenticated */
  }
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
