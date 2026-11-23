/**
 * Cloudflare Worker: Free Unlimited-Bandwidth Telegram HLS Streaming Proxy
 *
 * Setup (2 minutes, 0$ Free Plan - 100,000 requests/day, Unlimited Egress):
 * 1. Create a Worker on https://dash.cloudflare.com
 * 2. Paste this file into the Worker editor & Deploy
 * 3. Add Environment Variable (Secret): TELEGRAM_BOT_TOKEN = your bot token
 * 4. Optional Variable: SITE_ORIGIN = https://ticket-vib.netlify.app
 *
 * Routes:
 * - GET /seg/<fileId>.ts        -> Streams chunk from Telegram Bot CDN (24h cached)
 * - GET /playlist/<codeId>.m3u8 -> Rewrites <SITE_ORIGIN>/tg_hls/<codeId>.json into HLS playlist pointing to /seg/
 */

const FILE_PATH_CACHE = new Map();

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const token = env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return new Response('Missing TELEGRAM_BOT_TOKEN secret', { status: 500, headers: corsHeaders });
    }

    // 1. Dynamic M3U8 Playlist Generator from static JSON manifest on Netlify
    const plMatch = url.pathname.match(/^\/playlist\/([a-zA-Z0-9_-]+)\.m3u8$/);
    if (plMatch) {
      const code = plMatch[1];
      const siteOrigin = (env.SITE_ORIGIN || 'https://ticket-vib.netlify.app').replace(/\/+$/, '');
      const manifestResp = await fetch(`${siteOrigin}/tg_hls/${code}.json`);
      if (!manifestResp.ok) {
        return new Response('Playlist manifest not found', { status: 404, headers: corsHeaders });
      }
      const manifest = await manifestResp.json();
      const lines = [
        '#EXTM3U',
        '#EXT-X-VERSION:3',
        `#EXT-X-TARGETDURATION:${manifest.targetDuration || 60}`,
        '#EXT-X-MEDIA-SEQUENCE:0',
        manifest.complete ? '#EXT-X-PLAYLIST-TYPE:VOD' : '#EXT-X-PLAYLIST-TYPE:EVENT',
      ];
      for (const seg of manifest.segments || []) {
        lines.push(`#EXTINF:${Number(seg.duration).toFixed(3)},`);
        lines.push(`${url.origin}/seg/${encodeURIComponent(seg.fileId)}.ts`);
      }
      if (manifest.complete) lines.push('#EXT-X-ENDLIST');
      return new Response(lines.join('\n'), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/vnd.apple.mpegurl; charset=utf-8',
          'Cache-Control': manifest.complete ? 'public, max-age=3600' : 'no-cache',
        },
      });
    }

    // 2. Stream MPEG-TS Segment from Telegram Bot CDN
    const segMatch = url.pathname.match(/^\/seg\/([^/]+?)(?:\.ts)?$/);
    if (segMatch) {
      const fileId = decodeURIComponent(segMatch[1]);
      let cached = FILE_PATH_CACHE.get(fileId);
      if (!cached || Date.now() > cached.expiresAt) {
        const gfResp = await fetch(
          `https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`
        );
        const gf = await gfResp.json();
        if (!gf.ok || !gf.result?.file_path) {
          return new Response('Telegram file not found', { status: 404, headers: corsHeaders });
        }
        cached = {
          filePath: gf.result.file_path,
          expiresAt: Date.now() + 45 * 60 * 1000,
        };
        FILE_PATH_CACHE.set(fileId, cached);
      }

      const tgUrl = `https://api.telegram.org/file/bot${token}/${cached.filePath}`;
      const upstreamHeaders = {};
      const range = request.headers.get('Range');
      if (range) upstreamHeaders['Range'] = range;

      const tgResp = await fetch(tgUrl, { headers: upstreamHeaders });
      const respHeaders = new Headers(corsHeaders);
      respHeaders.set('Content-Type', 'video/mp2t');
      respHeaders.set('Cache-Control', 'public, max-age=86400');
      const cl = tgResp.headers.get('Content-Length');
      const cr = tgResp.headers.get('Content-Range');
      const ar = tgResp.headers.get('Accept-Ranges');
      if (cl) respHeaders.set('Content-Length', cl);
      if (cr) respHeaders.set('Content-Range', cr);
      if (ar) respHeaders.set('Accept-Ranges', ar);

      return new Response(tgResp.body, {
        status: tgResp.status,
        headers: respHeaders,
      });
    }

    return new Response('Tadhkira Telegram Stream Proxy Ready', { status: 200, headers: corsHeaders });
  },
};
