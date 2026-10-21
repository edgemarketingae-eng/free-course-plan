// Password-only login for the whole site, run by Vercel before any page is served.
// Only a SHA-256 hash of the password is stored here, never the password itself.
// To change the password: replace HASH with sha256("newpassword") in hex.
// A wrong password sends the visitor straight to the Edge join page.
export const config = { matcher: '/:path*' };

const HASH = 'b786125ea23531c0aa7ddd92c6e0742033c31e19c5f058e8fe49db529a8a6f39';
const WRONG_PASSWORD_URL = 'https://join.edgeacademy.ae/';
const COOKIE = 'edge_roadmap_auth';
const MAX_AGE = 60 * 60 * 24 * 30; // stay signed in for 30 days

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
const sessionToken = () => sha256Hex(HASH + ':edge-session');

function readCookie(req, name) {
  const m = (req.headers.get('cookie') || '').match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : '';
}

const next = () => new Response(null, { headers: { 'x-middleware-next': '1' } });

function loginPage() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<title>Sign in · Edge Free Course Roadmap</title>
<link rel="icon" type="image/svg+xml" href="/assets/edge-mark-green.svg">
<style>
:root{color-scheme:dark;--green:#08E186;--emerald:#03624C;--ink:#021A1A;--off:#F1F7F7;--mint:#BEEBEA;--pine:#0C3B40}
*{box-sizing:border-box}
html,body{height:100%;margin:0}
body{font-family:Arial,"Helvetica Neue",Helvetica,"Liberation Sans",sans-serif;background:var(--ink);color:var(--off);display:grid;place-items:center;padding:24px 16px;position:relative;overflow:hidden;-webkit-font-smoothing:antialiased}
.glow{position:fixed;inset:0;pointer-events:none;background:radial-gradient(60% 70% at 0% 0%,rgba(3,98,76,.95),rgba(3,98,76,0) 70%),radial-gradient(50% 60% at 100% 110%,rgba(8,225,134,.25),rgba(8,225,134,0) 70%)}
.lines{position:fixed;inset:0;width:100%;height:100%;pointer-events:none}
.lines line{stroke:var(--green);stroke-width:2;opacity:.14}
.card{position:relative;width:100%;max-width:420px;background:rgba(12,59,64,.55);border:1px solid rgba(190,235,234,.18);border-radius:28px;padding:36px 30px;display:grid;gap:22px;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);box-shadow:0 30px 60px -30px rgba(0,0,0,.7)}
.logo{height:42px;width:auto;display:block}
.k{font-size:.74rem;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--green);margin:0 0 8px}
h1{font-weight:900;text-transform:uppercase;letter-spacing:-.01em;line-height:.98;font-size:2rem;margin:0}
h1 span{color:var(--green)}
p.sub{margin:10px 0 0;color:var(--mint);line-height:1.55;font-size:.98rem}
form{display:grid;gap:14px}
label{font-weight:700;font-size:.9rem;display:grid;gap:8px}
input{font:inherit;font-size:1rem;padding:14px 16px;border-radius:14px;border:1.5px solid rgba(190,235,234,.3);background:rgba(2,26,26,.6);color:var(--off)}
input::placeholder{color:rgba(190,235,234,.5)}
input:focus{outline:none;border-color:var(--green);box-shadow:0 0 0 3px rgba(8,225,134,.25)}
button{font:inherit;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:15px;border:0;border-radius:14px;background:var(--green);color:var(--ink);cursor:pointer}
button:hover{background:#1ADE88}
.foot{font-size:.78rem;color:var(--off);opacity:.5;margin:0;line-height:1.5}
</style></head><body>
<div class="glow"></div>
<svg class="lines" viewBox="0 0 1440 900" preserveAspectRatio="none" aria-hidden="true"><line x1="760" y1="-20" x2="1300" y2="920"/><line x1="1460" y1="60" x2="620" y2="920"/><line x1="-20" y1="640" x2="700" y2="-20"/></svg>
<main class="card">
  <img class="logo" src="/assets/edge-logo-green-on-dark.svg" alt="Edge Trading Academy">
  <div>
    <p class="k">Team access</p>
    <h1>Free course <span>roadmap</span></h1>
    <p class="sub">Enter the team password to open the roadmap.</p>
  </div>
  <form method="post" action="/__login">
    <label for="p">Password<input id="p" name="password" type="password" placeholder="Enter password" autocomplete="current-password" required autofocus></label>
    <button type="submit">Open roadmap</button>
  </form>
  <p class="foot">Educational content only. Trading forex involves significant risk of loss.</p>
</main>
</body></html>`;
}

export default async function middleware(request) {
  const url = new URL(request.url);

  // Logo and icon files are needed by the login page itself.
  if (url.pathname.startsWith('/assets/')) return next();

  if (url.pathname === '/__logout') {
    return new Response(null, { status: 303, headers: { location: '/', 'set-cookie': `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax` } });
  }

  if (url.pathname === '/__login') {
    if (request.method !== 'POST') return Response.redirect(new URL('/', url), 303);
    let pass = '';
    try { const f = await request.formData(); pass = String(f.get('password') || ''); } catch (e) {}
    if (pass && (await sha256Hex(pass)) === HASH) {
      return new Response(null, { status: 303, headers: {
        location: '/',
        'set-cookie': `${COOKIE}=${await sessionToken()}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
      } });
    }
    // Wrong password: send them to the Edge join page right away.
    return new Response(null, { status: 303, headers: { location: WRONG_PASSWORD_URL, 'cache-control': 'no-store' } });
  }

  if (readCookie(request, COOKIE) === (await sessionToken())) return next();

  return new Response(loginPage(), {
    status: 401,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' },
  });
}
