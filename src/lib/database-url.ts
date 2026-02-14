const WEAK_SSL_MODES = new Set(["prefer", "require", "verify-ca"]);

export function normalizeDatabaseUrl(rawUrl: string | undefined): string | undefined {
  if (!rawUrl) return rawUrl;

  try {
    const url = new URL(rawUrl);

    if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
      return rawUrl;
    }

    const sslMode = url.searchParams.get("sslmode");
    if (sslMode && WEAK_SSL_MODES.has(sslMode.toLowerCase())) {
      url.searchParams.set("sslmode", "verify-full");
    }

    return url.toString();
  } catch {
    return rawUrl;
  }
}
