import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { extname, join, parse, relative, resolve } from 'node:path'
import sharp from 'sharp'

const projectRoot = resolve('.')
const sourceRoot = join(projectRoot, 'source-images')
const outputRoot = join(projectRoot, 'public', 'paintings')

const supportedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff'])
const pipelines = {
  works: {
    maxWidth: 1800,
    quality: 82,
  },
  details: {
    maxWidth: 1400,
    quality: 78,
  },
}

const artworksDataPath = join(projectRoot, 'public', 'data', 'artworks.json')
const smartCropPlans = {
  人物: [
    { mode: 'anchor', x: 0.5, y: 0.22, size: 0.34 },
    { mode: 'anchor', x: 0.38, y: 0.3, size: 0.32 },
    { mode: 'anchor', x: 0.62, y: 0.3, size: 0.32 },
    { mode: 'attention', size: 0.42 },
  ],
  动物: [
    { mode: 'anchor', x: 0.5, y: 0.26, size: 0.34 },
    { mode: 'anchor', x: 0.36, y: 0.34, size: 0.32 },
    { mode: 'anchor', x: 0.64, y: 0.34, size: 0.32 },
    { mode: 'attention', size: 0.44 },
  ],
  风景: [
    { mode: 'attention', size: 0.42 },
    { mode: 'anchor', x: 0.26, y: 0.34, size: 0.36 },
    { mode: 'anchor', x: 0.74, y: 0.34, size: 0.36 },
    { mode: 'anchor', x: 0.52, y: 0.68, size: 0.4 },
  ],
  静物: [
    { mode: 'anchor', x: 0.5, y: 0.34, size: 0.34 },
    { mode: 'anchor', x: 0.34, y: 0.5, size: 0.3 },
    { mode: 'anchor', x: 0.66, y: 0.5, size: 0.3 },
    { mode: 'attention', size: 0.4 },
  ],
  花卉: [
    { mode: 'anchor', x: 0.5, y: 0.28, size: 0.34 },
    { mode: 'anchor', x: 0.38, y: 0.46, size: 0.3 },
    { mode: 'anchor', x: 0.62, y: 0.46, size: 0.3 },
    { mode: 'attention', size: 0.38 },
  ],
  主题: [
    { mode: 'attention', size: 0.4 },
    { mode: 'anchor', x: 0.5, y: 0.28, size: 0.34 },
    { mode: 'anchor', x: 0.34, y: 0.56, size: 0.34 },
    { mode: 'anchor', x: 0.68, y: 0.56, size: 0.34 },
  ],
  default: [
    { mode: 'attention', size: 0.4 },
    { mode: 'anchor', x: 0.28, y: 0.28, size: 0.34 },
    { mode: 'anchor', x: 0.72, y: 0.3, size: 0.34 },
    { mode: 'anchor', x: 0.5, y: 0.68, size: 0.4 },
  ],
}

async function pathExists(path) {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = join(directory, entry.name)
      if (entry.isDirectory()) {
        return collectFiles(entryPath)
      }

      return entryPath
    }),
  )

  return files.flat()
}

async function shouldRegenerate(sourcePath, outputPath) {
  if (!(await pathExists(outputPath))) {
    return true
  }

  const [sourceStat, outputStat] = await Promise.all([stat(sourcePath), stat(outputPath)])
  return sourceStat.mtimeMs > outputStat.mtimeMs
}

async function loadArtworkMetaMap() {
  if (!(await pathExists(artworksDataPath))) {
    return new Map()
  }

  const raw = await readFile(artworksDataPath, 'utf8')
  const items = JSON.parse(raw)
  return new Map(items.map((item) => [item.slug, item]))
}

async function collectSourceWorkMtimeMap() {
  const sourceDirectory = join(sourceRoot, 'works')
  if (!(await pathExists(sourceDirectory))) {
    return new Map()
  }

  const allFiles = await collectFiles(sourceDirectory)
  const imageFiles = allFiles.filter((file) => supportedExtensions.has(extname(file).toLowerCase()))
  const mtimeMap = new Map()

  for (const file of imageFiles) {
    const parsed = parse(file)
    const fileStat = await stat(file)
    mtimeMap.set(parsed.name, fileStat.mtimeMs)
  }

  return mtimeMap
}

function toIso(ms) {
  return new Date(ms).toISOString()
}

async function syncArtworkCreatedAtOrder() {
  if (!(await pathExists(artworksDataPath))) {
    return
  }

  const raw = await readFile(artworksDataPath, 'utf8')
  const items = JSON.parse(raw)
  if (!Array.isArray(items) || items.length === 0) {
    return
  }

  const sourceMtimeMap = await collectSourceWorkMtimeMap()
  const existingCreatedAtCount = items.filter((item) => typeof item?.createdAt === 'string').length
  const now = Date.now()
  let touched = false

  const withOrderMeta = items.map((item, index) => {
    const normalized = { ...item }
    if (typeof normalized.sold !== 'boolean') {
      normalized.sold = false
      touched = true
    }
    if (typeof normalized.createdAt !== 'string' || Number.isNaN(Date.parse(normalized.createdAt))) {
      let createdAtMs
      if (existingCreatedAtCount === 0) {
        // First migration: preserve current manual list order.
        createdAtMs = now - index
      } else {
        createdAtMs = sourceMtimeMap.get(normalized.slug) ?? now
      }
      normalized.createdAt = toIso(createdAtMs)
      touched = true
    }
    return { item: normalized, index }
  })

  withOrderMeta.sort((a, b) => {
    const diff = Date.parse(b.item.createdAt) - Date.parse(a.item.createdAt)
    if (diff !== 0) {
      return diff
    }
    return a.index - b.index
  })

  const nextItems = withOrderMeta.map((entry) => entry.item)
  const nextRaw = `${JSON.stringify(nextItems, null, 2)}\n`

  if (touched || nextRaw !== raw) {
    await writeFile(artworksDataPath, nextRaw, 'utf8')
  }
}

async function optimizeFile(sourcePath, sourceType) {
  const relativePath = relative(join(sourceRoot, sourceType), sourcePath)
  const parsed = parse(relativePath)
  const outputPath = join(outputRoot, sourceType, parsed.dir, `${parsed.name}.webp`)
  const outputDirectory = join(outputRoot, sourceType, parsed.dir)

  await mkdir(outputDirectory, { recursive: true })

  if (!(await shouldRegenerate(sourcePath, outputPath))) {
    return { status: 'skipped', outputPath }
  }

  const { maxWidth, quality } = pipelines[sourceType]

  await sharp(sourcePath)
    .rotate()
    .resize({
      width: maxWidth,
      withoutEnlargement: true,
      fit: 'inside',
    })
    .webp({
      quality,
      effort: 6,
    })
    .toFile(outputPath)

  return { status: 'generated', outputPath }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

async function generateAutoDetails(sourcePath, artworkMetaMap) {
  const relativePath = relative(join(sourceRoot, 'works'), sourcePath)
  const parsed = parse(relativePath)
  const artworkMeta = artworkMetaMap.get(parsed.name)
  const cropPlan = smartCropPlans[artworkMeta?.category] ?? smartCropPlans.default
  const metadata = await sharp(sourcePath).rotate().metadata()
  const width = metadata.width ?? 0
  const height = metadata.height ?? 0

  if (width === 0 || height === 0) {
    return []
  }

  const cropSize = Math.max(720, Math.floor(Math.min(width, height) * 0.44))
  const outputDirectory = join(outputRoot, 'details', parsed.dir)

  await mkdir(outputDirectory, { recursive: true })

  return Promise.all(
    cropPlan.map(async (crop, index) => {
      const outputPath = join(outputDirectory, `${parsed.name}-detail-${index + 1}.webp`)

      if (!(await shouldRegenerate(sourcePath, outputPath))) {
        return { status: 'skipped', outputPath }
      }

      if (crop.mode === 'attention') {
        const attentionSize = Math.max(720, Math.floor(Math.min(width, height) * crop.size))

        await sharp(sourcePath)
          .rotate()
          .resize({
            width: attentionSize,
            height: attentionSize,
            fit: 'cover',
            position: sharp.strategy.attention,
          })
          .resize({
            width: pipelines.details.maxWidth,
            height: pipelines.details.maxWidth,
            fit: 'cover',
            position: 'centre',
          })
          .webp({
            quality: pipelines.details.quality,
            effort: 6,
          })
          .toFile(outputPath)
      } else {
        const anchorCropSize = Math.max(720, Math.floor(Math.min(width, height) * crop.size))
        const left = clamp(Math.round(width * crop.x - anchorCropSize / 2), 0, width - anchorCropSize)
        const top = clamp(Math.round(height * crop.y - anchorCropSize / 2), 0, height - anchorCropSize)

        await sharp(sourcePath)
          .rotate()
          .extract({
            left,
            top,
            width: anchorCropSize,
            height: anchorCropSize,
          })
          .resize({
            width: pipelines.details.maxWidth,
            height: pipelines.details.maxWidth,
            fit: 'cover',
            position: 'centre',
          })
          .webp({
            quality: pipelines.details.quality,
            effort: 6,
          })
          .toFile(outputPath)
      }

      return { status: 'generated', outputPath }
    }),
  )
}

async function run() {
  await syncArtworkCreatedAtOrder()
  const artworkMetaMap = await loadArtworkMetaMap()
  const summary = {
    generated: 0,
    skipped: 0,
    scanned: 0,
  }

  for (const sourceType of Object.keys(pipelines)) {
    const sourceDirectory = join(sourceRoot, sourceType)
    if (!(await pathExists(sourceDirectory))) {
      continue
    }

    const allFiles = await collectFiles(sourceDirectory)
    const imageFiles = allFiles.filter((file) => supportedExtensions.has(extname(file).toLowerCase()))

    for (const file of imageFiles) {
      summary.scanned += 1
      const result = await optimizeFile(file, sourceType)

      if (result.status === 'generated') {
        summary.generated += 1
      } else {
        summary.skipped += 1
      }

      if (sourceType === 'works') {
        const detailResults = await generateAutoDetails(file, artworkMetaMap)

        for (const detailResult of detailResults) {
          if (detailResult.status === 'generated') {
            summary.generated += 1
          } else {
            summary.skipped += 1
          }
        }
      }
    }
  }

  if (summary.scanned === 0) {
    console.log('No source images found in source-images/works or source-images/details. Skipping optimization.')
    return
  }

  console.log(
    `Image optimization complete. Scanned ${summary.scanned}, generated ${summary.generated}, skipped ${summary.skipped}.`,
  )
}

run().catch((error) => {
  console.error('Image optimization failed.')
  console.error(error)
  process.exitCode = 1
})
