import { mkdir, readdir, stat } from 'node:fs/promises'
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

async function run() {
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
