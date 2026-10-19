import { loadEnvFile } from "node:process";
import { configuration } from "../server/config";

try {
  if (process.argv[2]) {
    try {
      loadEnvFile(process.argv[2]);
    } catch {
      throw Error(
        "Could not load the configuration file. Keep it in an ignored local environment file.",
      );
    }
  }
  configuration(process.env);
  console.log(
    "All six required server settings pass format checks. No values were printed.",
  );
  console.log(
    "No services were contacted. Account access, migrations, sender verification, and delivery still require live checks.",
  );
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Service setup required.",
  );
  process.exitCode = 1;
}
