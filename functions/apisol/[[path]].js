export async function onRequest(context) {
  const url = new URL(context.request.url)
  const target = 'https://delsol.uy' + url.pathname + url.search

  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  const response = await fetch(target, {
    headers: { 'User-Agent': context.request.headers.get('User-Agent') ?? 'Mozilla/5.0' },
  })

  const newResponse = new Response(response.body, response)
  newResponse.headers.set('Access-Control-Allow-Origin', '*')
  return newResponse
}
