export interface ArtworkImage {
  src: string
  alt: string
}

export interface Artwork {
  slug: string
  title: string
  category: string
  series: string
  year: string
  medium: string
  size: string
  description: string
  tags: string[]
  featured: boolean
  cover: ArtworkImage
  fullImage: ArtworkImage
  details: ArtworkImage[]
}

export interface SiteMeta {
  label: string
  artistName: string
  title: string
  heroNote: string
  description: string
  location: string
  email: string
  socialLinks: Array<{
    label: string
    href: string
  }>
  introCards: Array<{
    title: string
    body: string
  }>
  processSteps: Array<{
    title: string
    body: string
  }>
  footer: string
}
