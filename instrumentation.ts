// Runs once when the Next.js server starts (Node runtime only — see the
// NEXT_RUNTIME guard below). Corporate network here doesn't resolve public
// hosts (e.g. *.supabase.co) via direct DNS; only the HTTP(S) proxy can
// reach them. curl and browsers already use HTTPS_PROXY/HTTP_PROXY
// automatically, but Node's built-in fetch (undici), which
// @supabase/supabase-js and our route handlers rely on, does not — it was
// failing with `getaddrinfo ENOTFOUND *.supabase.co`. Registering a global
// ProxyAgent makes server-side fetch go through the same proxy curl uses.
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  const proxyUrl =
    process.env.HTTPS_PROXY ?? process.env.https_proxy ?? process.env.HTTP_PROXY ?? process.env.http_proxy
  if (!proxyUrl) return

  const { setGlobalDispatcher, ProxyAgent } = await import('undici')
  setGlobalDispatcher(new ProxyAgent(proxyUrl))
}
