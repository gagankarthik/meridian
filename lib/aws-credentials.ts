import "server-only";

/**
 * Resolve AWS credentials for the SDK clients.
 *
 * Amplify Hosting reserves the `AWS_` env-var prefix, so static keys there must
 * be named `MERIDIAN_AWS_ACCESS_KEY_ID` / `MERIDIAN_AWS_SECRET_ACCESS_KEY`
 * (optionally `MERIDIAN_AWS_SESSION_TOKEN`) and passed explicitly.
 *
 * Returns `undefined` when those aren't set — then the SDK falls back to its
 * default credential chain, which covers:
 *   - local dev: the standard `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`
 *   - production: the Amplify compute IAM role (the recommended approach)
 */
export function awsCredentials():
  | { accessKeyId: string; secretAccessKey: string; sessionToken?: string }
  | undefined {
  const accessKeyId = process.env.MERIDIAN_AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.MERIDIAN_AWS_SECRET_ACCESS_KEY;
  if (accessKeyId && secretAccessKey) {
    const sessionToken = process.env.MERIDIAN_AWS_SESSION_TOKEN;
    return { accessKeyId, secretAccessKey, ...(sessionToken ? { sessionToken } : {}) };
  }
  return undefined;
}
