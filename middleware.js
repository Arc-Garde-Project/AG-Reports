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
  const html = "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><meta name=\"robots\" content=\"noindex, nofollow, noarchive\"><title>Arc Garde</title><style>@font-face{font-family:'AG Cinzel';font-style:normal;font-weight:700;font-display:block;\nsrc:url(data:font/woff2;base64,d09GMgABAAAAAAMkAA8AAAAABfAAAALNAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGhYbdBwqBmA/U1RBVCoAPBEICoIYggwBNgIkAwwLCAAEIAWDIgcgG9UEAB6FTZlflMlk8ihxmRz9jFDJiaqR67m75JeRPJ9wFBYVh7AUwoD/hYoRKI3/PcaiWf9Lp72/UjLyOoBMVwFzi+h0B921CLVLPnVTv00ytngacGLpmDgJ1wBNMNDH8PXBugQSfLJAIL0WL9+h1nQV6icLWAMIwhBCYMmGF7aNS8mB2l1lTxvUiED9RyC3tV1tkEBAiBgJkTAmRHDGBSNAvQOoTwgzhhqGzXXacRAMcABgtBx2C0rQdqwAcFWfyQ284gKwh5cjP459iBTfn/1bgf5DPYAA+WO3AEcYQiQENgjsYff1DT3EAO0EMwAo6GBDQLVa5ACmcISJFF8FDLveCgIQVP+pAzpgmn+5a/ACYACYoKHORTXX5kZeVrBt+2G5HDyTy7T80Lw5t4Q3b917di8VQiWV8tPX5ZPLBJXIl89249irV3xJoaDJzU358uvXtrlcoVDwpVevMPH6de7y5lPj/EnOSRV8V/k07v6lp9L22907x1RkXMEho7/+aDInDH7PSmSJtu8WCnnneyc7J59DZ+mPPiT8kst0nvmkf3i0LHjaLrPreEHpwY6Okv2nCvr869Xy9Z/mhEwrOj6jzMo3syMtYEtdhc9abUoCbLd6wWexzdVbgxtydR8AAhosLwo/lKuHfJUE4QPAe9keA4Bffy/x/5v/lUmq8AxEGQME/jQd5wxgdwAChHu+wKs9/r/HwBWBro2GDqoIGw0DC10ENGSAV0BvAVGxR2IkJySBiwuSSM8bSYmRL6IyvahZiEElNr6ohRqtXYdBXRrVa9DDghePfJ+FHA1qWYjWqM2QWi0sZOjSrkmtaj0sROrVo0G7Lt0sOPhVjw7dgrhzV6+RRb5XFTfV2rVylyZGomzR0uWJlcV92t5xBR6lXYsaXtx44NtgadKliRXMjlyjvyNYFHlqb9tq1K6NBdUpSk2+2hfKBeBWu3gB) format('woff2')}\n:root{color-scheme:dark;--ground:#040302;--ink:#f4efe6;--muted:#9a9086;\n--gold:#c9a36a;--gold-bright:#e6c894;--hot:#fff1d6}\n*{box-sizing:border-box}\n/* overflow MUST be set on html as well. Setting it on body alone propagates the\n   value to the viewport and leaves the body box itself unclipped, so the light\n   shells hanging off the mark expanded the document past the viewport: measured\n   1632x1272 of canvas for a 1440x900 window. */\nhtml{overflow:hidden}\nbody{margin:0;min-height:100svh;display:grid;place-items:center;position:relative;overflow:hidden;\npadding:2rem 1.5rem clamp(5rem,20vh,14rem);background:var(--ground);color:var(--ink);\nfont:400 16px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;text-align:center}\n\n.ground{position:fixed;inset:0;z-index:0;pointer-events:none;background:var(--ground)}\n/* Dither. Sits ABOVE the light so it perturbs the falloff itself, which is what\n   breaks a Mach band: the eye needs a clean edge to amplify, and noise denies it\n   one. overlay against a near-black ground is self-masking, so it does nothing in\n   the unlit corners and only textures where there is actually light. */\n.dither{position:fixed;inset:0;pointer-events:none;opacity:.5;mix-blend-mode:overlay;\nbackground-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")}\n.flies{position:fixed;inset:0;pointer-events:none;overflow:hidden}\n\n/* ---- FIREFLIES: the only light in the room besides the mark ---- */\n.ff{position:absolute;animation-name:fx;animation-timing-function:ease-in-out;\nanimation-iteration-count:infinite;animation-direction:alternate}\n.ff i{display:block;border-radius:50%;opacity:var(--o);\nbackground:radial-gradient(circle,#fff 0%,#fff7e6 20%,#ffd089 44%,rgba(201,163,106,.34) 66%,\nrgba(201,163,106,0) 80%);\nbox-shadow:0 0 4px 0 rgba(255,243,216,.75),0 0 10px 2px rgba(255,206,138,.40),\n0 0 22px 6px rgba(201,163,106,.18),0 0 48px 14px rgba(176,126,66,.09);\nanimation-name:fy,pulse;animation-timing-function:ease-in-out;\nanimation-iteration-count:infinite;animation-direction:alternate,normal}\n.f1{left:8.49%;top:60.76%;--dx:92px;--dy:41px;--o:0.3;animation-duration:7s;animation-delay:-0.17s}\n.f1 i{width:2.22px;height:2.22px;filter:blur(0.97px);animation-duration:12.6s,7s;animation-delay:-2.83s,-2.91s}\n.f2{left:69.32%;top:47.54%;--dx:49px;--dy:48px;--o:0.32;animation-duration:7s;animation-delay:-2.72s}\n.f2 i{width:2.34px;height:2.34px;filter:blur(0.94px);animation-duration:12.6s,3s;animation-delay:-4.25s,-2.5s}\n.f3{left:43.69%;top:47.61%;--dx:34px;--dy:57px;--o:0.48;animation-duration:9s;animation-delay:-1.3s}\n.f3 i{width:3.21px;height:3.21px;filter:blur(0.68px);animation-duration:14s,4.2s;animation-delay:-12.28s,-2.91s}\n.f4{left:86.15%;top:49.98%;--dx:47px;--dy:49px;--o:0.32;animation-duration:14s;animation-delay:-5.47s}\n.f4 i{width:2.32px;height:2.32px;filter:blur(0.95px);animation-duration:9s,7s;animation-delay:-6.28s,-0.84s}\n.f5{left:66.18%;top:7.49%;--dx:90px;--dy:57px;--o:0.42;animation-duration:7s;animation-delay:-4.48s}\n.f5 i{width:2.86px;height:2.86px;filter:blur(0.79px);animation-duration:14s,3s;animation-delay:-6.43s,-0.79s}\n.f6{left:62.12%;top:4%;--dx:91px;--dy:41px;--o:0.53;animation-duration:14s;animation-delay:-5.37s}\n.f6 i{width:3.44px;height:3.44px;filter:blur(0.61px);animation-duration:21s,6.3s;animation-delay:-20.73s,-1.39s}\n.f7{left:67.16%;top:75.42%;--dx:82px;--dy:48px;--o:0.79;animation-duration:12.6s;animation-delay:-6.43s}\n.f7 i{width:4.83px;height:4.83px;filter:blur(0.2px);animation-duration:21s,3s;animation-delay:-2.9s,-2.9s}\n.f8{left:42.9%;top:19.11%;--dx:30px;--dy:65px;--o:0.63;animation-duration:7s;animation-delay:-3.31s}\n.f8 i{width:3.97px;height:3.97px;filter:blur(0.46px);animation-duration:21s,9s;animation-delay:-7.54s,-1.97s}\n.f9{left:93.08%;top:43.73%;--dx:70px;--dy:63px;--o:0.44;animation-duration:7s;animation-delay:-1.95s}\n.f9 i{width:2.96px;height:2.96px;filter:blur(0.76px);animation-duration:6.3s,4.2s;animation-delay:-3.29s,-1.69s}\n.f10{left:97%;top:40.67%;--dx:44px;--dy:41px;--o:0.34;animation-duration:7s;animation-delay:-3.28s}\n.f10 i{width:2.46px;height:2.46px;filter:blur(0.9px);animation-duration:12.6s,6.3s;animation-delay:-8.19s,-2.78s}\n.f11{left:62.39%;top:35.11%;--dx:81px;--dy:50px;--o:0.47;animation-duration:12.6s;animation-delay:-6.53s}\n.f11 i{width:3.13px;height:3.13px;filter:blur(0.7px);animation-duration:21s,6.3s;animation-delay:-1.7s,-5.22s}\n.f12{left:44.84%;top:35.37%;--dx:50px;--dy:17px;--o:0.7;animation-duration:7s;animation-delay:-5.95s}\n.f12 i{width:4.35px;height:4.35px;filter:blur(0.34px);animation-duration:9s,3s;animation-delay:-8.62s,-1.44s}\n.f13{left:3%;top:17.32%;--dx:20px;--dy:54px;--o:0.59;animation-duration:9s;animation-delay:-0.92s}\n.f13 i{width:3.77px;height:3.77px;filter:blur(0.51px);animation-duration:6.3s,3s;animation-delay:-5.18s,-1.15s}\n.f14{left:39.55%;top:4.14%;--dx:80px;--dy:15px;--o:0.82;animation-duration:12.6s;animation-delay:-1.08s}\n.f14 i{width:4.98px;height:4.98px;filter:blur(0.16px);animation-duration:14s,7s;animation-delay:-7.81s,-4.48s}\n.f15{left:37.57%;top:54.8%;--dx:50px;--dy:55px;--o:0.79;animation-duration:6.3s;animation-delay:-4.45s}\n.f15 i{width:4.83px;height:4.83px;filter:blur(0.2px);animation-duration:9s,6s;animation-delay:-8.47s,-5.14s}\n.f16{left:11.27%;top:24.59%;--dx:88px;--dy:57px;--o:0.41;animation-duration:12.6s;animation-delay:-4.61s}\n.f16 i{width:2.79px;height:2.79px;filter:blur(0.81px);animation-duration:7s,9s;animation-delay:-4.84s,-5.28s}\n.f17{left:58.63%;top:64.34%;--dx:66px;--dy:13px;--o:0.67;animation-duration:9s;animation-delay:-4.08s}\n.f17 i{width:4.21px;height:4.21px;filter:blur(0.39px);animation-duration:21s,6.3s;animation-delay:-9.44s,-4.95s}\n.f18{left:73.17%;top:8.71%;--dx:59px;--dy:48px;--o:0.55;animation-duration:7s;animation-delay:-6.5s}\n.f18 i{width:3.54px;height:3.54px;filter:blur(0.58px);animation-duration:12.6s,9s;animation-delay:-7.1s,-7.83s}\n.f19{left:31.4%;top:26.43%;--dx:58px;--dy:15px;--o:0.39;animation-duration:14s;animation-delay:-3.41s}\n.f19 i{width:2.7px;height:2.7px;filter:blur(0.83px);animation-duration:7s,6s;animation-delay:-2.87s,-0.58s}\n.f20{left:64.57%;top:52.46%;--dx:75px;--dy:55px;--o:0.52;animation-duration:14s;animation-delay:-3.42s}\n.f20 i{width:3.41px;height:3.41px;filter:blur(0.62px);animation-duration:6.3s,6s;animation-delay:-3.5s,-0.78s}\n.f21{left:74.8%;top:8.65%;--dx:83px;--dy:57px;--o:0.6;animation-duration:12.6s;animation-delay:-2.45s}\n.f21 i{width:3.84px;height:3.84px;filter:blur(0.49px);animation-duration:14s,4.2s;animation-delay:-11.8s,-2.09s}\n.f22{left:80.89%;top:7.61%;--dx:44px;--dy:25px;--o:0.33;animation-duration:12.6s;animation-delay:-5.22s}\n.f22 i{width:2.4px;height:2.4px;filter:blur(0.92px);animation-duration:21s,4.2s;animation-delay:-4.83s,-0.1s}\n.f23{left:48.28%;top:50.74%;--dx:73px;--dy:45px;--o:0.76;animation-duration:7s;animation-delay:-3.02s}\n.f23 i{width:4.7px;height:4.7px;filter:blur(0.24px);animation-duration:12.6s,4.2s;animation-delay:-2.09s,-1.4s}\n.f24{left:65.26%;top:69.68%;--dx:71px;--dy:14px;--o:0.23;animation-duration:6.3s;animation-delay:-1.92s}\n.f24 i{width:1.87px;height:1.87px;filter:blur(1.08px);animation-duration:14s,7s;animation-delay:-11.7s,-3.87s}\n.f25{left:17.74%;top:29.02%;--dx:74px;--dy:35px;--o:0.54;animation-duration:21s;animation-delay:-4.04s}\n.f25 i{width:3.49px;height:3.49px;filter:blur(0.6px);animation-duration:14s,3s;animation-delay:-12.51s,-0.74s}\n.f26{left:22.7%;top:41.68%;--dx:37px;--dy:60px;--o:0.54;animation-duration:6.3s;animation-delay:-2.08s}\n.f26 i{width:3.48px;height:3.48px;filter:blur(0.6px);animation-duration:21s,6.3s;animation-delay:-12.8s,-1.93s}\n\n/* ---- THE MARK IS THE LAMP -------------------------------------------------\n   The emitter is a CHILD of the mark, so the light originates at the AG and\n   travels outward. No blend mode: with exactly ONE source there is nothing for\n   additive compositing to sum against, and on a near-black ground plus-lighter\n   and normal are visually identical. Additive earned its cost when three lamps\n   overlapped; it does not for one. */\n.w{position:relative;max-width:34rem;animation:rise .9s cubic-bezier(.16,1,.3,1) backwards}\n.mark{position:relative;width:96px;height:96px;margin:0 auto 1.7rem;\nanimation:rise .7s cubic-bezier(.16,1,.3,1) backwards}\n/* ONE emitter. Three stacked shells was the bug: each ended its taper early and\n   went transparent, which puts a KINK in the falloff, and lateral inhibition in\n   the eye turns a kink into a visible ring. Mach banding, not colour banding:\n   measured steps in the old render were ~2px and never wider than 8px, so it was\n   never 8-bit quantization. This curve is a single exponential whose first\n   differences decrease monotonically all the way to exactly 0 at 100%, so there\n   is no kink anywhere. The hue drifts warm-white to deep brown across it as well,\n   so the R, G and B iso-luminance contours land at different radii instead of\n   stacking into one crisp circle. */\n.mark__field{position:absolute;left:50%;top:50%;width:74vmax;height:74vmax;\ntransform:translate(-50%,-50%);pointer-events:none;\nbackground:radial-gradient(circle closest-side,rgba(255,243,221,0.1860) 0.0%,rgba(236,220,195,0.1236) 6.3%,rgba(220,202,177,0.0816) 12.5%,rgba(206,187,162,0.0536) 18.8%,rgba(193,172,147,0.0349) 25.0%,rgba(179,159,134,0.0225) 31.3%,rgba(167,145,121,0.0144) 37.5%,rgba(154,133,109,0.0091) 43.8%,rgba(142,120,97,0.0056) 50.0%,rgba(131,108,86,0.0034) 56.3%,rgba(119,96,75,0.0020) 62.5%,rgba(107,84,64,0.0011) 68.8%,rgba(96,73,53,0.0006) 75.0%,rgba(85,62,43,0.0003) 81.3%,rgba(74,51,33,0.0001) 87.5%,rgba(63,40,23,0.0000) 93.8%,rgba(52,29,13,0.0000) 100.0%)}\n.mark__pool{position:absolute;inset:1px;border-radius:50%;\nbackground:radial-gradient(circle at 50% 46%,rgba(255,231,190,0.06),rgba(255,226,178,0.015) 44%,\nrgba(255,226,178,0) 72%)}\n/* ONE ring. The hot section is a stop inside this single conic sweep rather\n   than a second arc on its own layer, which is what read as two lines.\n   Clockwise only: no reverse, no counter-rotating element. */\n.mark__ring{position:absolute;inset:0;border-radius:50%;\nbackground:conic-gradient(from 0deg,rgba(201,163,106,.12) 0deg,rgba(201,163,106,.30) 96deg,\nvar(--gold) 214deg,var(--gold-bright) 300deg,var(--hot) 344deg,rgba(201,163,106,.12) 360deg);\n-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 2px),#000 calc(100% - 2px));\nmask:radial-gradient(farthest-side,transparent calc(100% - 2px),#000 calc(100% - 2px));\nfilter:drop-shadow(0 0 7px rgba(255,224,170,0.165)) drop-shadow(0 0 18px rgba(216,170,104,0.105))\ndrop-shadow(0 0 40px rgba(201,163,106,0.066));animation:spin 7s linear infinite}\n.mark__ag{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);\nfont-family:'AG Cinzel',serif;font-weight:700;font-size:34px;line-height:1;letter-spacing:.02em;\nbackground:linear-gradient(176deg,#fffdf9 0%,#fff 14%,#f4ecdd 52%,#dccdb2 100%);\n-webkit-background-clip:text;background-clip:text;color:transparent;\nfilter:drop-shadow(0 0 8px rgba(255,236,200,.55)) drop-shadow(0 0 22px rgba(255,214,150,.32))\ndrop-shadow(0 0 52px rgba(201,163,106,.22))}\nh1{font-size:clamp(1.4rem,1.15rem + 1vw,1.9rem);font-weight:600;margin:0 0 .6rem;\nletter-spacing:.01em;text-wrap:balance;text-shadow:0 0 28px rgba(255,214,150,.13)}\np{margin:0 auto;max-width:31rem;color:var(--muted);text-wrap:pretty}\n/* Authored break. Desktop-first per the AG responsive rule, so the break is on\n   by default and removed below the 900px step, where natural wrapping is better. */\n.brk{display:inline}\n@media (max-width:900px){.brk{display:none}}\n\n/* ---- EASTER EGG: hover the mark ---- */\n.mark__link{position:absolute;inset:0;border-radius:50%;display:block;\ntext-decoration:none;-webkit-tap-highlight-color:transparent}\n.mark__link:focus-visible{outline:2px solid var(--gold-bright);outline-offset:6px}\n.pill{position:absolute;bottom:calc(100% + 14px);left:50%;\ntransform:translate(-50%,5px);white-space:nowrap;\nfont-size:10px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;\ncolor:#0b0908;background:linear-gradient(176deg,#ffeecf 0%,#e8c795 55%,#cfa871 100%);\npadding:.46em .9em .42em;border-radius:999px;opacity:0;pointer-events:none;\nbox-shadow:0 0 16px rgba(255,214,150,.34),0 2px 12px rgba(0,0,0,.55);\ntransition:opacity .3s ease,transform .3s ease}\n/* hover is gated: on touch there is no real hover and the state can stick */\n@media (hover:hover){.mark__link:hover .pill{opacity:1;transform:translate(-50%,0)}}\n.mark__link:focus-visible .pill{opacity:1;transform:translate(-50%,0)}\n\n@keyframes spin{to{transform:rotate(360deg)}}\n@keyframes breathe{0%,100%{opacity:.72}50%{opacity:1}}\n@keyframes halo{0%,100%{opacity:.62}50%{opacity:1}}\n@keyframes rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}\n@keyframes fx{from{transform:translateX(calc(var(--dx) * -1))}to{transform:translateX(var(--dx))}}\n@keyframes fy{from{transform:translateY(calc(var(--dy) * -1))}to{transform:translateY(var(--dy))}}\n@keyframes pulse{0%,100%{opacity:.06}50%{opacity:var(--o)}}\n@media (prefers-reduced-motion:reduce){\n*{animation:none!important;transition:none!important}\n.w,.mark{opacity:1;transform:none}\n.pill{transform:translate(-50%,0)}}</style></head><body><div class=\"ground\"></div><div class=\"w\"><div class=\"mark\"><div class=\"mark__field\"></div><div class=\"mark__pool\"></div><div class=\"mark__ring\"></div><a class=\"mark__link\" href=\"https://www.instagram.com/arcgarde/\" target=\"_blank\" rel=\"noopener noreferrer\" aria-label=\"Click here for Arc Garde on Instagram\"><span class=\"mark__ag\">AG</span><span class=\"pill\" aria-hidden=\"true\">click here</span></a></div><h1>This page is not available</h1><p>If you were given a link, open the complete <br class=\"brk\">link exactly as you received it.</p></div><div class=\"dither\"></div><div class=\"flies\"><span class=\"ff f1\"><i></i></span><span class=\"ff f2\"><i></i></span><span class=\"ff f3\"><i></i></span><span class=\"ff f4\"><i></i></span><span class=\"ff f5\"><i></i></span><span class=\"ff f6\"><i></i></span><span class=\"ff f7\"><i></i></span><span class=\"ff f8\"><i></i></span><span class=\"ff f9\"><i></i></span><span class=\"ff f10\"><i></i></span><span class=\"ff f11\"><i></i></span><span class=\"ff f12\"><i></i></span><span class=\"ff f13\"><i></i></span><span class=\"ff f14\"><i></i></span><span class=\"ff f15\"><i></i></span><span class=\"ff f16\"><i></i></span><span class=\"ff f17\"><i></i></span><span class=\"ff f18\"><i></i></span><span class=\"ff f19\"><i></i></span><span class=\"ff f20\"><i></i></span><span class=\"ff f21\"><i></i></span><span class=\"ff f22\"><i></i></span><span class=\"ff f23\"><i></i></span><span class=\"ff f24\"><i></i></span><span class=\"ff f25\"><i></i></span><span class=\"ff f26\"><i></i></span></div><script>(function(){var m=/[#&]access=([A-Za-z0-9_-]{20,})/.exec(location.hash);if(!m)return;var s=m[1];fetch(\"/access/exchange\",{method:\"POST\",credentials:\"same-origin\",headers:{\"content-type\":\"application/json\"},body:JSON.stringify({route:location.pathname,secret:s})}).then(function(r){if(!r.ok)return;try{history.replaceState(null,\"\",location.pathname+location.search);}catch(e){}location.reload();});})();</script></body></html>";
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
