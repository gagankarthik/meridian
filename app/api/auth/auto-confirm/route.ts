import {
  AdminConfirmSignUpCommand,
  AdminUpdateUserAttributesCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import {
  cognitoServerClient,
  serverConfigured,
  serverPoolId,
} from "@/lib/cognito-server";

/**
 * Confirms a freshly self-signed-up user and marks their email verified so
 * they can sign in immediately — keeps the sign-up UI free of a code step.
 */
export async function POST(request: Request) {
  if (!serverConfigured) {
    // Demo mode: nothing to confirm.
    return Response.json({ ok: true, skipped: true });
  }

  let email = "";
  try {
    ({ email } = await request.json());
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!email) {
    return Response.json({ error: "email is required" }, { status: 400 });
  }

  const client = cognitoServerClient();
  try {
    await client.send(
      new AdminConfirmSignUpCommand({
        UserPoolId: serverPoolId,
        Username: email,
      }),
    );
    await client.send(
      new AdminUpdateUserAttributesCommand({
        UserPoolId: serverPoolId,
        Username: email,
        UserAttributes: [{ Name: "email_verified", Value: "true" }],
      }),
    );
    return Response.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not confirm account";
    // Already-confirmed users are fine — let the client proceed to sign in.
    if (/already.*confirmed/i.test(message)) {
      return Response.json({ ok: true, alreadyConfirmed: true });
    }
    return Response.json({ error: message }, { status: 500 });
  }
}
