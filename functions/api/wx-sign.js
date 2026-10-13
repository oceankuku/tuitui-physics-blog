// 可选 Cloudflare Pages Function。仅服务端设置自己的 WX_APPID / WX_APPSECRET。
const accounts = new Map();
function response(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
}
async function ticketFor(env) {
  const now = Date.now();
  const cached = accounts.get(env.WX_APPID);
  if (cached && now < cached.expiresAt) return cached.ticket;
  const tokenURL = new URL('https://api.weixin.qq.com/cgi-bin/token');
  tokenURL.search = new URLSearchParams({ grant_type: 'client_credential', appid: env.WX_APPID, secret: env.WX_APPSECRET }).toString();
  const token = await (await fetch(tokenURL)).json();
  if (!token.access_token) throw new Error(`微信 token 请求失败 (${token.errcode || 'unknown'})`);
  const ticketURL = new URL('https://api.weixin.qq.com/cgi-bin/ticket/getticket');
  ticketURL.search = new URLSearchParams({ access_token: token.access_token, type: 'jsapi' }).toString();
  const result = await (await fetch(ticketURL)).json();
  if (!result.ticket) throw new Error(`微信 ticket 请求失败 (${result.errcode || 'unknown'})`);
  accounts.set(env.WX_APPID, { ticket: result.ticket, expiresAt: now + Math.max(0, result.expires_in - 300) * 1000 });
  return result.ticket;
}
export async function onRequestGet({ request, env }) {
  const requestURL = new URL(request.url);
  const target = requestURL.searchParams.get('url');
  if (!target) return response({ error: 'missing url param' }, 400);
  let targetURL;
  try { targetURL = new URL(target); } catch { return response({ error: 'invalid url' }, 400); }
  const allowedOrigin = env.WX_SITE_ORIGIN || requestURL.origin;
  if (!['http:', 'https:'].includes(targetURL.protocol) || targetURL.origin !== allowedOrigin || targetURL.username || targetURL.password) return response({ error: 'origin not allowed' }, 403);
  if (!env.WX_APPID || !env.WX_APPSECRET) return response({ error: 'WX_APPID / WX_APPSECRET not configured' }, 503);
  try {
    const nonceStr = crypto.randomUUID().replaceAll('-', '');
    const timestamp = Math.floor(Date.now() / 1000);
    const ticket = await ticketFor(env);
    const raw = `jsapi_ticket=${ticket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${target.split('#')[0]}`;
    const hash = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(raw));
    const signature = Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
    return response({ appId: env.WX_APPID, timestamp, nonceStr, signature });
  } catch (error) { return response({ error: error.message || 'signature failed' }, 502); }
}
