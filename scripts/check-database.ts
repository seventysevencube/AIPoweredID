import { loadEnvFile } from "node:process";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { databaseConfiguration } from "../server/config";

try {
  if (process.argv[2]) {
    try {
      loadEnvFile(process.argv[2]);
    } catch {
      throw Error("Could not load the local configuration file.");
    }
  }
  const settings = databaseConfiguration(process.env);
  const client = createClient(
    settings.SUPABASE_URL,
    settings.SUPABASE_SECRET_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
  // Read-only: no session is admitted, and no code, project, or email is created.
  const { data, error } = await client
    .rpc("app_rpc", {
      operation: "session",
      payload: { user_id: randomUUID(), session_id: randomUUID() },
    })
    .abortSignal(AbortSignal.timeout(10000));
  if (error || data?.error !== "unauthorized")
    throw Error(
      "Database check failed. Check the project URL, server key, service availability, and applied migrations. No provider details or credentials were printed.",
    );
  console.log(
    "Supabase application RPC is reachable and denies an unadmitted session.",
  );
  console.log(
    "No data or email was created. This does not verify all migrations, real sign-in, owner isolation, or hosted saving.",
  );
} catch (error) {
  // Configuration messages contain field names only. Network diagnostics are generic.
  console.error(
    error instanceof Error && error.message.startsWith("Service setup required")
      ? error.message
      : "Database check could not complete. Check local settings, applied migrations, and service availability.",
  );
  process.exitCode = 1;
}
