/** Keep post-login navigation on this application, including browser URL normalization. */
export function localRedirectPath(value: string, defaultPath = "/me") {
  if (!value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u0020\u007f]/.test(value)) return defaultPath;
  const base = "https://local.invalid";
  const url = new URL(value, base);
  return url.origin === base ? `${url.pathname}${url.search}${url.hash}` : defaultPath;
}
