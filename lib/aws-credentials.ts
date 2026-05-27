import "server-only";

/**
 * Resolve AWS credentials for the SDK clients.
 *
 * Amplify Hosting reserves the `AWS_` env-var prefix, so static keys there are
 * named `NEXT_AWS_ACCESS_KEY_ID` / `NEXT_AWS_SECRET_ACCESS_KEY` (optionally
 * `NEXT_AWS_SESSION_TOKEN`). These are NOT `NEXT_PUBLIC_`, so Next keeps them
 * server-only — they never reach the browser bundle.
 *
 * Returns `undefined` when none are set — then the SDK falls back to its
 * default credential chain, which covers:
 *   - local dev: the standard `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`
 *   - production: the Amplify compute IAM role (the recommended approach)
 */
export function awsCredentials():
  | { accessKeyId: string; secretAccessKey: string; sessionToken?: string }
  | undefined {
  // Primary: NEXT_AWS_* (settable on Amplify). Fallback: legacy MERIDIAN_AWS_*.
  const accessKeyId =
    process.env.NEXT_AWS_ACCESS_KEY_ID ?? process.env.MERIDIAN_AWS_ACCESS_KEY_ID;
  const secretAccessKey =
    process.env.NEXT_AWS_SECRET_ACCESS_KEY ??
    process.env.MERIDIAN_AWS_SECRET_ACCESS_KEY;
  if (accessKeyId && secretAccessKey) {
    const sessionToken =
      process.env.NEXT_AWS_SESSION_TOKEN ?? process.env.MERIDIAN_AWS_SESSION_TOKEN;
    return { accessKeyId, secretAccessKey, ...(sessionToken ? { sessionToken } : {}) };
  }
  return undefined;
}
