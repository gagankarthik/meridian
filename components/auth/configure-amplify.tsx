"use client";

import { Amplify } from "aws-amplify";
import { cognitoUserPoolsTokenProvider } from "aws-amplify/auth/cognito";
import { CookieStorage } from "aws-amplify/utils";
import { cognitoConfig, cognitoConfigured } from "@/lib/cognito";

/* Configure Amplify once on the client. No-op when Cognito env isn't set,
   so the app still runs in demo mode. */
if (cognitoConfigured) {
  Amplify.configure(
    {
      Auth: {
        Cognito: {
          userPoolId: cognitoConfig.userPoolId,
          userPoolClientId: cognitoConfig.userPoolClientId,
        },
      },
    },
    { ssr: true },
  );

  // Store tokens in cookies (not localStorage) so the Next.js middleware can
  // gate protected routes. Secure on https, relaxed on http://localhost.
  cognitoUserPoolsTokenProvider.setKeyValueStorage(
    new CookieStorage({
      sameSite: "lax",
      secure:
        typeof window !== "undefined" &&
        window.location.protocol === "https:",
      expires: 30,
    }),
  );
}

export function ConfigureAmplify() {
  return null;
}
