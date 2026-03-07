import type { Artwork, ArtworkImage, SiteMeta } from '../types'

const AUTO_DETAIL_COUNT = 4

function withBase(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`
}

function createAutoDetails(artwork: Artwork): ArtworkImage[] {
  return Array.from({ length: AUTO_DETAIL_COUNT }, (_, index) => ({
    src: withBase(`/paintings/details/${artwork.slug}-detail-${index + 1}.webp`),
    alt: `${artwork.title}自动细节图${index + 1}`,
  }))
}

function normalizeImage(image: ArtworkImage): ArtworkImage {
  return {
    ...image,
    src: withBase(image.src),
  }
}

function normalizeArtwork(artwork: Artwork): Artwork {
  const details = artwork.details.length > 0 ? artwork.details : createAutoDetails(artwork)

  return {
    ...artwork,
    cover: normalizeImage(artwork.cover),
    fullImage: normalizeImage(artwork.fullImage),
    details: details.map(normalizeImage),
  }
}

async function loadJson<T>(path: string): Promise<T> {
  const normalizedPath = withBase(path)
  const response = await fetch(normalizedPath)

  if (!response.ok) {
    throw new Error(`Failed to load ${path}`)
  }

  return (await response.json()) as T
}

export function loadSiteMeta() {
  return loadJson<SiteMeta>('/data/site.json')
}

export async function loadArtworks() {
  const items = await loadJson<Artwork[]>('/data/artworks.json')
  return items.map(normalizeArtwork)
}
