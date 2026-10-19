import { z } from "zod";

const httpsRoot = z
  .string()
  .url()
  .refine((value) => {
    try {
      const url = new URL(value);
      return (
        url.protocol === "https:" &&
        !url.username &&
        !url.password &&
        url.pathname === "/" &&
        !url.search &&
        !url.hash
      );
    } catch {
      return false;
    }
  });
const configSchema = z.object({
  APP_ORIGIN: httpsRoot,
  SUPABASE_URL: httpsRoot,
  SUPABASE_SECRET_KEY: z.string().trim().min(1),
  AUTH_CODE_SECRET: z
    .string()
    .min(32)
    .refine((value) => value.trim() === value),
  RESEND_API_KEY: z.string().trim().min(1),
  EMAIL_FROM: z.string().refine((value) => {
    if (/[\r\n]/.test(value)) return false;
    const address = value.match(/^[^<>]*<([^<>]+)>$/)?.[1] ?? value;
    return z.email().safeParse(address.trim()).success;
  }),
});

function validate<T>(schema: z.ZodType<T>, env: NodeJS.ProcessEnv): T {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    // Never print invalid values, provider errors, or credentials in setup diagnostics.
    const fields = [
      ...new Set(parsed.error.issues.map((issue) => String(issue.path[0]))),
    ];
    throw Error(`Service setup required. Check: ${fields.join(", ")}.`);
  }
  return parsed.data;
}
export function configuration(env: NodeJS.ProcessEnv) {
  const config = validate(configSchema, env);
  return { ...config, APP_ORIGIN: new URL(config.APP_ORIGIN).origin };
}
export function databaseConfiguration(env: NodeJS.ProcessEnv) {
  return validate(
    configSchema.pick({ SUPABASE_URL: true, SUPABASE_SECRET_KEY: true }),
    env,
  );
}
