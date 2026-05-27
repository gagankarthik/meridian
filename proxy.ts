import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge proxy that gates the app behind Cognito auth (Next 16's `proxy`
 * convention — the renamed `middleware`). Amplify stores its tokens in
 * cookies (see configure-amplify.tsx), so we check for a present ID token
 * here and bounce unauthenticated visitors to /login before the page loads.
 *
 * The API route handlers still cryptographically verify the token — this is a
 * fast first line of defense, not the trust boundary. No-op in demo mode.
 */
const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID ?? "";

export function proxy(request: NextRequest) {
  if (!CLIENT_ID) return NextResponse.next();

  const prefix = `CognitoIdentityServiceProvider.${CLIENT_ID}`;
  const lastUser = request.cookies.get(`${prefix}.LastAuthUser`)?.value;
  const idToken = lastUser
    ? request.cookies.get(`${prefix}.${lastUser}.idToken`)?.value
    : undefined;

  if (!idToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Protected areas only. Public marketing + auth pages are untouched.
  matcher: ["/app/:path*", "/onboarding"],
};
