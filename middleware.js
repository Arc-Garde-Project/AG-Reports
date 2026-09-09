// Arc Garde Hub - access control (Vercel Edge Middleware)
//
// Model (fail-closed):
//   - Hub root + /showcase        -> HUB_PASSWORD, unchanged from the previous version.
//   - Open render assets          -> always served, so protected pages can paint.
//   - Everything under a route in access-policy.json with access PRIVATE_MAGIC_LINK
//     -> requires a signed, version-bound cookie. Without it, the branded 404 is
//        returned. The same 404 is returned for DENY routes and for unknown routes,
//        so existence is never revealed.
//   - Magic link format: /<section>/<slug>#access=<secret>
//     The fragment never reaches the server. The branded 404 carries a tiny inline
//     script that reads the fragment, POSTs it to /access/exchange, and on success
//     strips the fragment and reloads the clean URL.
//
// Env (Vercel Production):
//   HUB_PASSWORD  = hub + showcase password (unchanged)
//   COOKIE_SECRET = random signing key for access cookies
//   DECK_TOKENS   = {"/presentations/slug":{"h":"<sha256 hex of secret>","v":1}, ...}
//                   Only hashes and versions. Never plaintext secrets.
//
// Rotation: bump "v" for a route. The old cookie carries the old version and fails,
// and a new secret hash makes the old link fail. Revocation: delete the route entry.

import policy from './access-policy.json';

export const config = {
  matcher: [
    '/',
    '/index.html',
    '/index',
    '/showcase',
    '/showcase/:path*',
    '/access/:path*',
    '/presentations/:path*',
    '/reports/:path*',
    '/preview/:path*',
    '/arborwealth/:path*',
    '/hitch-academy/:path*',
    '/_brand-source/:path*',
  ],
};

const PRIVATE_HEADERS = {
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'Referrer-Policy': 'no-referrer',
  'Cache-Control': 'private, no-store',
};

const enc = new TextEncoder();

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function toHex(buf) {
  const b = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < b.length; i++) s += b[i].toString(16).padStart(2, '0');
  return s;
}

async function sha256Hex(text) {
  return toHex(await crypto.subtle.digest('SHA-256', enc.encode(text)));
}

async function hmacHex(secret, text) {
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  return toHex(await crypto.subtle.sign('HMAC', key, enc.encode(text)));
}

// Longest-prefix match against the policy. Returns [routeKey, entry] or [null, null].
function resolveRoute(pathname) {
  const routes = policy.routes || {};
  let best = null;
  for (const key of Object.keys(routes)) {
    if (pathname === key || pathname.startsWith(key + '/')) {
      if (!best || key.length > best.length) best = key;
    }
  }
  return best ? [best, routes[best]] : [null, null];
}

function isOpenAsset(pathname) {
  return (policy.openAssets || []).some(
    (p) => (p.endsWith('/') ? pathname.startsWith(p) : pathname === p)
  );
}

function cookieNameFor(routeKey) {
  return 'agp_' + routeKey.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function readCookie(request, name) {
  const raw = request.headers.get('cookie') || '';
  for (const part of raw.split(/;\s*/)) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i) === name) return part.slice(i + 1);
  }
  return null;
}

function branded404(pathname) {
  // Served for unauthorized, denied AND unknown routes. Identical in every case.
  // No third-party scripts, no protected metadata, no existence disclosure.
  const html = '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="robots" content="noindex, nofollow, noarchive">' +
    '<title>Arc Garde</title><style>' +
    ':root{color-scheme:dark}body{margin:0;min-height:100vh;display:grid;place-items:center;' +
    'background:#0d0b09;color:#f2ece3;font:400 16px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;' +
    'text-align:center;padding:2rem}.w{max-width:34rem}h1{font-size:1.5rem;margin:0 0 .75rem;' +
    'letter-spacing:.01em}p{margin:0;color:#9a9086}.b{width:2.25rem;height:2.25rem;margin:0 auto 1.5rem;' +
    'border:1px solid #c9a36a;border-radius:50%}</style></head><body><div class="w">' +
    '<div class="b"></div><h1>This page is not available</h1>' +
    '<p>If you were given a link, open the complete link exactly as you received it.</p>' +
    '</div><script>(function(){var m=/[#&]access=([A-Za-z0-9_-]{20,})/.exec(location.hash);' +
    'if(!m)return;var s=m[1];' +
    'fetch("/access/exchange",{method:"POST",credentials:"same-origin",' +
    'headers:{"content-type":"application/json"},' +
    'body:JSON.stringify({route:location.pathname,secret:s})}).then(function(r){' +
    'if(!r.ok)return;try{history.replaceState(null,"",location.pathname+location.search);}catch(e){}' +
    'location.reload();});})();</script></body></html>';
  return new Response(html, {
    status: 404,
    headers: { 'Content-Type': 'text/html; charset=utf-8', ...PRIVATE_HEADERS },
  });
}

function unauthHub(realm) {
  return new Response('Arc Garde - authorization required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="' + realm + '", charset="UTF-8"',
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

function tokens() {
  try { return JSON.parse(process.env.DECK_TOKENS || '{}'); } catch { return {}; }
}

// Best-effort per-isolate rate limit on failed exchanges. Edge isolates are not
// shared, so this throttles a single attacker path rather than being a global quota.
const failures = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const rec = failures.get(ip);
  if (!rec || now - rec.t > 60000) { failures.set(ip, { n: 0, t: now }); return false; }
  return rec.n >= 10;
}
function noteFailure(ip) {
  const now = Date.now();
  const rec = failures.get(ip);
  if (!rec || now - rec.t > 60000) failures.set(ip, { n: 1, t: now });
  else rec.n += 1;
  if (failures.size > 5000) failures.clear();
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const pathname = decodeURIComponent(url.pathname).replace(/\/{2,}/g, '/');

  // Traversal and encoding defence: anything that normalises outside itself is denied.
  if (pathname.includes('..')) return branded404(pathname);

  // ---- exchange endpoint ----
  if (pathname === '/access/exchange') {
    if (request.method !== 'POST') return branded404(pathname);

    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    if (origin) {
      try { if (new URL(origin).host !== host) return branded404(pathname); }
      catch { return branded404(pathname); }
    }

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (rateLimited(ip)) {
      return new Response(null, { status: 429, headers: PRIVATE_HEADERS });
    }

    let body;
    try { body = await request.json(); } catch { noteFailure(ip); return branded404(pathname); }
    const route = typeof body?.route === 'string' ? body.route : '';
    const secret = typeof body?.secret === 'string' ? body.secret : '';
    if (!route || !secret) { noteFailure(ip); return branded404(pathname); }

    const norm = decodeURIComponent(route).replace(/\/{2,}/g, '/');
    const [routeKey, entry] = resolveRoute(norm);
    if (!routeKey || !entry || entry.access !== 'PRIVATE_MAGIC_LINK') {
      noteFailure(ip); return branded404(pathname);
    }

    const tok = tokens()[routeKey];
    const cookieSecret = process.env.COOKIE_SECRET || '';
    if (!tok || !tok.h || !cookieSecret) { noteFailure(ip); return branded404(pathname); }

    const presented = await sha256Hex(secret);
    if (!timingSafeEqual(presented, String(tok.h))) { noteFailure(ip); return branded404(pathname); }

    const version = Number(tok.v || 1);
    const sig = await hmacHex(cookieSecret, routeKey + '|' + version);
    const value = 'v' + version + '.' + sig;

    return new Response(null, {
      status: 204,
      headers: {
        'Set-Cookie': cookieNameFor(routeKey) + '=' + value +
          '; Path=' + routeKey + '; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax',
        ...PRIVATE_HEADERS,
      },
    });
  }

  // ---- hub + showcase: unchanged password behaviour ----
  if (pathname === '/' || pathname === '/index.html' || pathname === '/index' ||
      pathname === '/showcase' || pathname.startsWith('/showcase/')) {
    const pw = process.env.HUB_PASSWORD || '';
    if (pw && basicPassword(request) === pw) return;
    return unauthHub('Arc Garde Hub');
  }

  // ---- open render assets ----
  if (isOpenAsset(pathname)) return;

  // ---- policy lookup, fail closed ----
  const [routeKey, entry] = resolveRoute(pathname);
  if (!routeKey || !entry) return branded404(pathname);
  if (entry.access !== 'PRIVATE_MAGIC_LINK') return branded404(pathname);

  const tok = tokens()[routeKey];
  const cookieSecret = process.env.COOKIE_SECRET || '';
  if (!tok || !cookieSecret) return branded404(pathname);

  const version = Number(tok.v || 1);
  const presented = readCookie(request, cookieNameFor(routeKey));
  if (!presented) return branded404(pathname);

  const expected = 'v' + version + '.' + (await hmacHex(cookieSecret, routeKey + '|' + version));
  if (!timingSafeEqual(presented, expected)) return branded404(pathname);

  // authorized: serve, with private headers applied to the protected response
  const res = NextResponseNext();
  for (const [k, v] of Object.entries(PRIVATE_HEADERS)) res.headers.set(k, v);
  return res;
}

// Minimal stand-in for next/server's NextResponse.next() so this module stays
// dependency-free on the Edge runtime.
function NextResponseNext() {
  return new Response(null, {
    status: 200,
    headers: { 'x-middleware-next': '1' },
  });
}
