const FALLBACK_PATH = "/dashboard";
const APP_ORIGIN = "https://autoai.invalid";

export function safeInternalPath(value, fallback = FALLBACK_PATH) {
  if (typeof value !== "string" || value.length === 0 || value.length > 2048) {
    return fallback;
  }
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\") || /[\u0000-\u001f\u007f]/.test(value)) {
    return fallback;
  }
  try {
    const target = new URL(value, APP_ORIGIN);
    if (target.origin !== APP_ORIGIN) return fallback;
    return \`${target.pathname}${target.search}${target.hash}\`;
  } catch {
    return fallback;
  }
}
