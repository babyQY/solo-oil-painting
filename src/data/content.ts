import type { Artwork, SiteMeta } from '../types'

async function loadJson<T>(path: string): Promise<T> {
  const normalizedPath = `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`
  const response = await fetch(normalizedPath)

  if (!response.ok) {
    throw new Error(`Failed to load ${path}`)
  }

  return (await response.json()) as T
}

export function loadSiteMeta() {
  return loadJson<SiteMeta>('/data/site.json')
}

export function loadArtworks() {
  return loadJson<Artwork[]>('/data/artworks.json')
}
