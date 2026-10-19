import { createClient, isAuthRetryableFetchError } from "@supabase/supabase-js";
import { z } from "zod";
import type { Identity, IdentityProvider, Rpc } from "./api";
import { configuration } from "./config";
const claimsSchema = z.object({ sub: z.uuid(), session_id: z.uuid() });
// Only decode tokens returned by successful provider verification, never an unverified request token.
function identity(
  token: string,
  refresh: string,
  email: string,
  userId: string,
): Identity {
  const claims = claimsSchema.parse(
    JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString()),
  );
  if (claims.sub !== userId) throw Error("unauthorized");
  return {
    user_id: claims.sub,
    session_id: claims.session_id,
    email: email.toLowerCase(),
    access: token,
    refresh,
  };
}
export function providers(
  environment: NodeJS.ProcessEnv,
  transport: typeof fetch = fetch,
) {
  const env = configuration(environment);
  const url = env.SUPABASE_URL,
    key = env.SUPABASE_SECRET_KEY;
  const client = () =>
    createClient(url, key, {
      global: { fetch: transport },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  const rpc: Rpc = async (operation, payload) => {
    const { data, error } = await client().rpc("app_rpc", {
      operation,
      payload,
    });
    if (error) throw Error("database_unavailable");
    return data;
  };
  const provider: IdentityProvider = {
    async issue(email) {
      // Native provider tokens never go into the email. Only the application challenge is sent.
      const c = client();
      const { data, error } = await c.auth.admin.generateLink({
        type: "magiclink",
        email,
      });
      if (error || !data.properties?.hashed_token)
        throw Error("identity_unavailable");
      const verified = await c.auth.verifyOtp({
        token_hash: data.properties.hashed_token,
        type: "email",
      });
      const s = verified.data.session;
      if (
        verified.error ||
        !s ||
        verified.data.user?.email?.toLowerCase() !== email.toLowerCase()
      )
        throw Error("identity_unavailable");
      try {
        return identity(
          s.access_token,
          s.refresh_token,
          email,
          verified.data.user.id,
        );
      } catch {
        throw Error("identity_unavailable");
      }
    },
    async verify(access, refresh) {
      const c = client();
      const check = access ? await c.auth.getUser(access) : null;
      if (
        check?.error &&
        (isAuthRetryableFetchError(check.error) ||
          (check.error.status ?? 0) >= 500)
      )
        throw Error("identity_unavailable");
      if (check && !check.error && check.data.user?.email)
        return identity(
          access,
          refresh,
          check.data.user.email,
          check.data.user.id,
        );
      if (!refresh) throw Error("unauthorized");
      const renewed = await c.auth.refreshSession({ refresh_token: refresh });
      const s = renewed.data.session;
      if (
        renewed.error &&
        (isAuthRetryableFetchError(renewed.error) ||
          (renewed.error.status ?? 0) >= 500)
      )
        throw Error("identity_unavailable");
      if (renewed.error || !s || !renewed.data.user?.email)
        throw Error("unauthorized");
      return identity(
        s.access_token,
        s.refresh_token,
        renewed.data.user.email,
        renewed.data.user.id,
      );
    },
  };
  return {
    rpc,
    identity: provider,
    secret: env.AUTH_CODE_SECRET,
    origin: env.APP_ORIGIN,
    async sendCode(email: string, code: string) {
      let r: Response;
      try {
        r = await transport("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: env.EMAIL_FROM,
            to: [email],
            subject: "Your AIPoweredID sign-in code",
            text: `Your sign-in code is ${code}. It expires in 10 minutes and can be used once. If you did not request it, you can ignore this email.`,
          }),
        });
      } catch {
        throw Error("email_unavailable");
      }
      if (!r.ok) throw Error("email_unavailable");
    },
  };
}
