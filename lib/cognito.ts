/**
 * AWS Cognito configuration, read from public env vars at build time.
 *
 * When these are set the auth screens drive a real Cognito User Pool; when
 * they're absent the app falls back to its existing demo navigation so the
 * UI keeps working without any AWS setup. See `.env.example`.
 */
export const cognitoConfig = {
  region:
    process.env.NEXT_PUBLIC_AWS_REGION ??
    process.env.NEXT_PUBLIC_COGNITO_REGION ??
    "us-east-1",
  userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ?? "",
  userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID ?? "",
};

/** True only when a real User Pool + client id are configured. */
export const cognitoConfigured = Boolean(
  cognitoConfig.userPoolId && cognitoConfig.userPoolClientId,
);

/** Surface the human-readable reason behind an Amplify auth error. */
export function authErrorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string") return err;
  return fallback;
}
