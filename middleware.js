// Site-wide login page, run by Vercel before any page is served.
// Only a SHA-256 hash of "username:password" is stored here, never the password itself.
// To change the login: replace HASH with sha256("newuser:newpass") in hex.
export const config = { matcher: '/:path*' };

const HASH = '70c66d8d6502fa2c466d3443dee0480238828bc7509c354be50fb4191baa2713';
const COOKIE = 'edge_plan_auth';
const MAX_AGE = 60 * 60 * 24 * 30; // stay signed in for 30 days

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
const enc = (s) => btoa(unescape(encodeURIComponent(s)));
const dec = (s) => decodeURIComponent(escape(atob(s)));

function readCookie(req, name) {
  const m = (req.headers.get('cookie') || '').match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : '';
}

function loginPage(error) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<title>Sign in · Edge Free Course Plan</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Manrope:wght@400;600;700;800&family=JetBrains+Mono:wght@700&display=swap">
<style>
:root{color-scheme:light;--ink:#0B2B26;--mut:#4F6964;--line:#DCE8E3;--tint:#F2FAF6;--green:#08E186;--deep:#03624C;--err:#B4322A}
*{box-sizing:border-box}
html,body{height:100%;margin:0}
body{font-family:"Manrope",Arial,sans-serif;color:var(--ink);background:#fff;display:grid;grid-template-columns:1fr 1fr;-webkit-font-smoothing:antialiased}
.side{background:var(--tint);padding:48px;display:flex;flex-direction:column;justify-content:space-between;gap:40px}
.brand{display:flex;align-items:center;gap:10px;font-family:"Barred Black","Archivo Black","Arial Black",sans-serif;font-size:1.05rem;letter-spacing:.03em}
.side h1{font-family:"Barred Black","Archivo Black","Arial Black",sans-serif;font-weight:400;text-transform:uppercase;font-size:clamp(2rem,4vw,3.2rem);line-height:1.05;margin:0}
.side h1 em{font-style:normal;background:linear-gradient(transparent 60%,#C3F4DA 60%)}
.side p{color:var(--mut);max-width:40ch;margin:16px 0 0;font-size:1.05rem;line-height:1.6}
.dots{display:flex;gap:8px;align-items:center;font-family:"JetBrains Mono",monospace;font-size:.72rem;font-weight:700;letter-spacing:.12em;color:var(--deep)}
.dots i{width:10px;height:10px;border-radius:3px;background:var(--green)}
main{display:grid;place-items:center;padding:48px max(24px,env(safe-area-inset-left,0px))}
form{width:100%;max-width:360px;display:grid;gap:18px}
.k{font-family:"JetBrains Mono",monospace;font-size:.74rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--deep)}
h2{font-family:"Barred Black","Archivo Black","Arial Black",sans-serif;font-weight:400;text-transform:uppercase;font-size:1.8rem;margin:4px 0 0}
label{display:grid;gap:6px;font-weight:700;font-size:.92rem}
input{font:inherit;font-weight:500;padding:13px 14px;border:1.5px solid var(--line);border-radius:10px;background:#fff;color:var(--ink)}
input:focus{outline:none;border-color:var(--deep);box-shadow:0 0 0 3px rgba(8,225,134,.25)}
button{font:inherit;font-weight:800;padding:14px;border:0;border-radius:10px;background:var(--deep);color:#fff;cursor:pointer;margin-top:4px}
button:hover{background:var(--ink)}
.err{background:#FDEEEC;color:var(--err);border-radius:10px;padding:11px 14px;font-weight:700;font-size:.92rem}
.foot{color:var(--mut);font-size:.85rem}
@media (max-width:800px){body{grid-template-columns:1fr;grid-template-rows:auto 1fr}.side{padding:28px 24px;gap:18px}.side p,.dots{display:none}}
</style></head><body>
<aside class="side">
  <div class="brand"><svg width="26" height="26" viewBox="0 0 34 34" aria-hidden="true"><path d="M4 26 L16 10 L22 18 L30 6" fill="none" stroke="#08E186" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 6 H30 V13" fill="none" stroke="#08E186" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>EDGE TRADING ACADEMY</div>
  <div><h1>Free course plan <em>team only</em></h1><p>The 6-step journey from free class to long-term client. Sign in with the team login to view it.</p></div>
  <div class="dots"><i></i>INTERNAL · NOT FOR SHARING</div>
</aside>
<main>
  <form method="post" action="/__login">
    <div><span class="k">Team access</span><h2>Sign in</h2></div>
    ${error ? '<div class="err" role="alert">Wrong username or password. Try again.</div>' : ''}
    <label for="u">Username<input id="u" name="username" autocomplete="username" required autofocus></label>
    <label for="p">Password<input id="p" name="password" type="password" autocomplete="current-password" required></label>
    <button type="submit">Sign in</button>
    <p class="foot">Ask the marketing head if you need the login.</p>
  </form>
</main>
</body></html>`;
}

const html = (body, status) => new Response(body, {
  status,
  headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' },
});

export default async function middleware(request) {
  const url = new URL(request.url);

  if (url.pathname === '/__logout') {
    return new Response(null, { status: 303, headers: { location: '/', 'set-cookie': `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax` } });
  }

  if (url.pathname === '/__login') {
    if (request.method !== 'POST') return Response.redirect(new URL('/', url), 303);
    let user = '', pass = '';
    try { const f = await request.formData(); user = String(f.get('username') || '').trim(); pass = String(f.get('password') || ''); } catch (e) {}
    const creds = user + ':' + pass;
    if ((await sha256Hex(creds)) === HASH) {
      return new Response(null, { status: 303, headers: {
        location: '/',
        'set-cookie': `${COOKIE}=${encodeURIComponent(enc(creds))}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
      } });
    }
    return html(loginPage(true), 401);
  }

  const c = readCookie(request, COOKIE);
  if (c) {
    try { if ((await sha256Hex(dec(c))) === HASH) return new Response(null, { headers: { 'x-middleware-next': '1' } }); } catch (e) {}
  }
  return html(loginPage(false), 401);
}
