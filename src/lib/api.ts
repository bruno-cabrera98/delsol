import type { Show, ShowDetail, PaginatedResponse, Episode } from '@/types'

// /apisol is proxied by Vite in dev and by Cloudflare Pages Functions in production
const BASE = '/apisol'

export async function fetchShows(): Promise<Show[]> {
  const res = await fetch(`${BASE}/programas`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  const arr: Show[] = Array.isArray(data) ? data : data.programas ?? []
  return arr.filter((s) => s.publicar)
}

export async function fetchShowDetail(slug: string): Promise<ShowDetail> {
  const res = await fetch(`${BASE}/programas/${slug}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  // API wraps show fields in "record" and sections in "secciones"
  if (data.record) {
    return { ...data.record, secciones: data.secciones ?? [] }
  }
  return data
}

export async function fetchEpisodes(
  slug: string,
  section: string | null,
  page: number,
  recordPage = 20
): Promise<PaginatedResponse> {
  const base = section
    ? `${BASE}/programas/${slug}/${section}/contenido`
    : `${BASE}/programas/${slug}/contenido`
  const res = await fetch(`${base}?page=${page}&recordPage=${recordPage}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchEpisode(id: string): Promise<Episode> {
  const res = await fetch(`${BASE}/contenido/${id}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
