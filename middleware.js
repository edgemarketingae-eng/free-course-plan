// Password gate for the whole site (HTTP Basic Auth), run by Vercel before any page is served.
// Only a SHA-256 hash of "username:password" is stored here, never the password itself.
// To change the login: replace HASH with sha256("newuser:newpass") in hex.
export const config = { matcher: '/:path*' };

const HASH = '70c66d8d6502fa2c466d3443dee0480238828bc7509c354be50fb4191baa2713';

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default async function middleware(request) {
  const auth = request.headers.get('authorization') || '';
  if (auth.startsWith('Basic ')) {
    try {
      if ((await sha256Hex(atob(auth.slice(6)))) === HASH) {
        return new Response(null, { headers: { 'x-middleware-next': '1' } });
      }
    } catch (e) { /* malformed header falls through to 401 */ }
  }
  return new Response('Login required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Edge Free Course Plan", charset="UTF-8"', 'Cache-Control': 'no-store' },
  });
}
