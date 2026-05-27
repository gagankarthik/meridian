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
 * Verifies the Cognito ID token from the Authorization header and returns the
 * caller. Returns null when unauthenticated or when Cognito isn't configured.
 */
export async function getServerUser(request: Request): Promise<ServerUser | null> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
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
