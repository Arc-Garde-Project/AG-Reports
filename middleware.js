// Arc Garde Hub - access control (Vercel Edge Middleware)
//
// - Hub root + Showcase  -> YOU only (HUB_PASSWORD).
// - Client decks (/presentations/*, /reports/*) -> open UNLESS a per-client key
//   exists in CLIENT_KEYS (JSON slug->21-char password). Then that deck needs the
//   key, accepted as a one-click ?k= link, a cookie, or a typed password.
// - Everything else (shared /assets, /ag-*.js, deck sub-assets) stays open so pages render.
//
// Env (Vercel Production):
//   HUB_PASSWORD = your password
//   CLIENT_KEYS  = {"cogentic":"<21char>", ...}   (optional; starts empty)

export const config = {
  matcher: ['/', '/index.html', '/index', '/showcase', '/showcase/:path*',
            '/presentations/:path*', '/reports/:path*'],
};

function unauth(realm) {
  return new Response('Arc Garde - authorization required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': `Basic realm="${realm}", charset="UTF-8"`,
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function basicPassword(request) {
  const h = request.headers.get('authorization') || '';
  if (!h.startsWith('Basic ')) return null;
  try { return atob(h.slice(6)).split(':').slice(1).join(':'); } catch { return null; }
}

export default function middleware(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // ---- HUB + SHOWCASE: your password only ----
  if (path === '/' || path === '/index.html' || path === '/index' ||
      path === '/showcase' || path.startsWith('/showcase/')) {
    const pw = process.env.HUB_PASSWORD || '';
    if (pw && basicPassword(request) === pw) return;
    return unauth('Arc Garde Hub');
  }

  // ---- CLIENT DECKS: per-client key if configured, else open ----
  if (path.startsWith('/presentations/') || path.startsWith('/reports/')) {
    let keys = {};
    try { keys = JSON.parse(process.env.CLIENT_KEYS || '{}'); } catch {}
    const seg = path.split('/').filter(Boolean); // [section, slug, ...]
    const section = seg[0], slug = seg[1] || '';
    const key = keys[slug];
    if (!key) return; // no key configured -> open (shareable link)

    const cookie = request.headers.get('cookie') || '';
    const cookieOk = cookie.split(/;\s*/).includes(`agk_${slug}=${key}`);
    const qOk = url.searchParams.get('k') === key;
    const bOk = basicPassword(request) === key;

    if (qOk && !cookieOk) {
      // one-click link: set a cookie, strip the key from the URL, then serve
      const clean = new URL(request.url);
      clean.searchParams.delete('k');
      return new Response(null, {
        status: 302,
        headers: {
          'Location': clean.pathname + clean.search,
          'Set-Cookie': `agk_${slug}=${key}; Path=/${section}/${slug}; Max-Age=604800; HttpOnly; Secure; SameSite=Lax`,
          'Cache-Control': 'no-store',
        },
      });
    }
    if (cookieOk || bOk) return; // authorized
    return unauth(`Arc Garde - ${slug}`);
  }

  return;
}
