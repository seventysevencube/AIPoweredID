export async function api(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch("/api" + path, {
      method,
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
      headers: body ? { "Content-Type": "application/json" } : {},
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    let value;
    try {
      value = await res.json();
    } catch {
      throw Error("The service returned an unreadable response. Please retry.");
    }
    if (!res.ok)
      throw Object.assign(
        new Error(value.message ?? "The service is unavailable."),
        value,
        { status: res.status },
      );
    return value;
  } finally {
    clearTimeout(timer);
  }
}
