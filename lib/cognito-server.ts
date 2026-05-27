import "server-only";
import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import { awsCredentials } from "@/lib/aws-credentials";

/** Server-side Cognito admin config (never exposed to the client). */
export const serverPoolId =
  process.env.COGNITO_USER_POOL_ID ??
  process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ??
  "";
export const serverRegion =
  process.env.AWS_REGION ?? process.env.NEXT_PUBLIC_AWS_REGION ?? "us-east-1";

/** Admin routes are usable once a pool id is present (creds resolve from the
    standard AWS chain: env vars, shared config, or an instance role). */
export const serverConfigured = Boolean(serverPoolId);

export function cognitoServerClient() {
  return new CognitoIdentityProviderClient({
    region: serverRegion,
    credentials: awsCredentials(),
  });
}
