// Proxies cdn.dl.uy audio files to avoid CORS / cross-origin redirect issues.
// Only allows requests targeting cdn.dl.uy to prevent open-proxy abuse.
export async function onRequest(context) {
  const url = new URL(context.request.url)

  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  // Strip /dlproxy prefix, forward the rest to the CDN
  const cdnPath = url.pathname.replace(/^\/dlproxy/, '')
  const target = 'https://cdn.dl.uy' + cdnPath + url.search

  const reqHeaders = { 'User-Agent': context.request.headers.get('User-Agent') ?? 'Mozilla/5.0' }
  const range = context.request.headers.get('Range')
  if (range) reqHeaders['Range'] = range

  const response = await fetch(target, { headers: reqHeaders })

  const newResponse = new Response(response.body, response)
  newResponse.headers.set('Access-Control-Allow-Origin', '*')
  newResponse.headers.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges')
  return newResponse
}
