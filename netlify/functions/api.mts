import { createHandler } from "../../server/api";
import { providers } from "../../server/providers";
export default async (req: Request) => {
  try {
    return await createHandler(providers(process.env))(req);
  } catch {
    return Response.json(
      {
        error: "setup_required",
        message: "Service setup is required before this workspace can be used.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
};
