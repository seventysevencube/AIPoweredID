import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const outfile = ".netlify/verification/api.mjs";
const result = await build({
  entryPoints: ["netlify/functions/api.mts"],
  outfile,
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  metafile: true,
  banner: {
    js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
  },
});
if (
  Object.keys(result.metafile.inputs).some(
    (file) =>
      /^scripts\/local-/.test(file) || file.includes("@electric-sql/pglite"),
  )
)
  throw Error(
    "The hosted backend must not contain the fictional local service.",
  );

// Exercise the actual bundled entry with no live configuration or network calls.
const environment = { ...process.env };
for (const name of [
  "APP_ORIGIN",
  "SUPABASE_URL",
  "SUPABASE_SECRET_KEY",
  "AUTH_CODE_SECRET",
  "RESEND_API_KEY",
  "EMAIL_FROM",
])
  delete environment[name];
const smoke = spawnSync(
  process.execPath,
  [
    "--input-type=module",
    "-e",
    `
  import handler from ${JSON.stringify(pathToFileURL(resolve(outfile)).href)};
  const response = await handler(new Request("https://workspace.test/api/setup"));
  if (response.status !== 503 || (await response.json()).error !== "setup_required") process.exit(1);
  Object.assign(process.env, {
    APP_ORIGIN: "https://workspace.test", SUPABASE_URL: "https://project.supabase.co",
    SUPABASE_SECRET_KEY: "sb_secret_fictional_build_key", AUTH_CODE_SECRET: "fictional-build-secret-more-than-thirty-two-characters",
    RESEND_API_KEY: "re_fictional_build_key", EMAIL_FROM: "signin@workspace.test"
  });
  const configured = await handler(new Request("https://workspace.test/api/setup"));
  if (configured.status !== 200 || (await configured.json()).mode !== "connected") process.exit(1);
  const privateRoute = await handler(new Request("https://workspace.test/api/local-inbox"));
  if (privateRoute.status !== 401) process.exit(1);
`,
  ],
  { env: environment, encoding: "utf8" },
);
if (smoke.status !== 0)
  throw Error("The bundled backend failed its unconfigured-startup check.");
console.log(
  "Hosted backend bundled for Node 22; configured/unconfigured startup verified without network; fictional local service excluded.",
);
