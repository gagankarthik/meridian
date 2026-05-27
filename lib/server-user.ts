import "server-only";
import { CognitoJwtVerifier } from "aws-jwt-verify";

const userPoolId =
  process.env.COGNITO_USER_POOL_ID ??
  process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ??
  "";
const clientId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID ?? "";

type Verifier = ReturnType<typeof CognitoJwtVerifier.create>;
let _verifier: Verifier | null = null;
function verifier(): Verifier | null {
  if (!_verifier && userPoolId && clientId) {
    _verifier = CognitoJwtVerifier.create({
      userPoolId,
      tokenUse: "id",
      clientId,
    });
  }
  return _verifier;
}

export type ServerUser = {
  sub: string;
  email: string;
  name?: string;
  groups: string[];
};

/**
 * Read the Cognito ID token from the request cookies (Amplify CookieStorage),
 * matching the proxy's lookup. This is the reliable path in production: CDNs
 * in front of the app (e.g. Amplify/CloudFront) often strip the Authorization
 * header before it reaches the server, but cookies are always forwarded.
 */
function tokenFromCookie(request: Request): string {
  const cookieHeader = request.headers.get("cookie") ?? "";
  if (!cookieHeader || !clientId) return "";
  const cookies: Record<string, string> = {};
  for (const part of cookieHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    cookies[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
  }
  const prefix = `CognitoIdentityServiceProvider.${clientId}`;
  const lastUser = cookies[`${prefix}.LastAuthUser`];
  const direct = lastUser ? cookies[`${prefix}.${lastUser}.idToken`] : undefined;
  if (direct) return decodeURIComponent(direct);
  // Fallback: any id token cookie under the client-id prefix.
  const key = Object.keys(cookies).find(
    (k) => k.startsWith(prefix) && k.endsWith(".idToken"),
  );
  return key ? decodeURIComponent(cookies[key]) : "";
}

/**
 * Verifies the Cognito ID token and returns the caller. Reads the token from
 * the Authorization header first (local dev), then falls back to the Amplify
 * ID-token cookie (production, where the header may be stripped by a CDN).
 * Returns null when unauthenticated or when Cognito isn't configured.
 */
export async function getServerUser(request: Request): Promise<ServerUser | null> {
  const header = request.headers.get("authorization") ?? "";
  let token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) token = tokenFromCookie(request);
  const v = verifier();
  if (!token || !v) return null;
  try {
    const payload = await v.verify(token);
    return {
      sub: String(payload.sub),
      email: typeof payload.email === "string" ? payload.email : "",
      name: typeof payload.name === "string" ? payload.name : undefined,
      groups: Array.isArray(payload["cognito:groups"])
        ? (payload["cognito:groups"] as string[])
        : [],
    };
  } catch {
    return null;
  }
}
