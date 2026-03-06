<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import ArtworkCard from './components/ArtworkCard.vue'
import ArtworkModal from './components/ArtworkModal.vue'
import { loadArtworks, loadSiteMeta } from './data/content'
import type { Artwork, SiteMeta } from './types'

const siteMeta = ref<SiteMeta | null>(null)
const artworks = ref<Artwork[]>([])
const selectedArtworkSlug = ref<string | null>(null)
const selectedCategory = ref('全部')
const searchQuery = ref('')
const isLoading = ref(true)
const loadError = ref('')

const categories = computed(() => {
  const values = new Set(artworks.value.map((artwork) => artwork.category))
  return ['全部', ...values]
})

const filteredArtworks = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return artworks.value.filter((artwork) => {
    const matchesCategory =
      selectedCategory.value === '全部' || artwork.category === selectedCategory.value
    const haystack = [artwork.title, artwork.series, artwork.description, ...artwork.tags]
      .join(' ')
      .toLowerCase()
    const matchesQuery = query.length === 0 || haystack.includes(query)

    return matchesCategory && matchesQuery
  })
})

const featuredArtworks = computed(() => artworks.value.filter((artwork) => artwork.featured).slice(0, 4))

const activeArtworkIndex = computed(() =>
  filteredArtworks.value.findIndex((artwork) => artwork.slug === selectedArtworkSlug.value),
)

const activeArtwork = computed(() =>
  filteredArtworks.value.find((artwork) => artwork.slug === selectedArtworkSlug.value) ?? null,
)

const artworkCountLabel = computed(() => String(artworks.value.length).padStart(2, '0'))

function openArtwork(artwork: Artwork) {
  selectedArtworkSlug.value = artwork.slug
}

function closeArtwork() {
  selectedArtworkSlug.value = null
}

function showPreviousArtwork() {
  if (activeArtworkIndex.value <= 0) {
    return
  }

  const previousArtwork = filteredArtworks.value[activeArtworkIndex.value - 1]
  if (previousArtwork) {
    selectedArtworkSlug.value = previousArtwork.slug
  }
}

function showNextArtwork() {
  if (activeArtworkIndex.value === -1 || activeArtworkIndex.value >= filteredArtworks.value.length - 1) {
    return
  }

  const nextArtwork = filteredArtworks.value[activeArtworkIndex.value + 1]
  if (nextArtwork) {
    selectedArtworkSlug.value = nextArtwork.slug
  }
}

watch(filteredArtworks, (nextArtworks) => {
  if (!selectedArtworkSlug.value) {
    return
  }

  const stillExists = nextArtworks.some((artwork) => artwork.slug === selectedArtworkSlug.value)
  if (!stillExists) {
    selectedArtworkSlug.value = null
  }
})

onMounted(async () => {
  try {
    const [site, items] = await Promise.all([loadSiteMeta(), loadArtworks()])
    siteMeta.value = site
    artworks.value = items
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : '内容加载失败'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="site-shell">
    <div class="background-glow background-glow-left" />
    <div class="background-glow background-glow-right" />

    <template v-if="siteMeta">
      <header class="topbar">
        <a class="brand" href="#top">
          <span class="brand-mark" />
          <span>{{ siteMeta.artistName }}</span>
        </a>

        <nav class="nav">
          <a href="#featured">精选</a>
          <a href="#gallery">作品</a>
          <a href="#process">维护</a>
          <a href="#contact">联系</a>
        </nav>
      </header>

      <header id="top" class="hero">
        <div class="hero-copy">
          <p class="eyebrow">{{ siteMeta.label }}</p>
          <h1>{{ siteMeta.title }}</h1>
          <p class="hero-note">{{ siteMeta.heroNote }}</p>
          <p class="hero-text">{{ siteMeta.description }}</p>

          <div class="hero-actions">
            <a class="button button-primary" href="#gallery">进入作品画廊</a>
            <a class="button button-secondary" href="#process">查看维护方式</a>
          </div>

          <ul class="hero-stats" aria-label="站点亮点">
            <li>
              <strong>{{ artworkCountLabel }}</strong>
              <span>当前示例作品</span>
            </li>
            <li>
              <strong>0 元</strong>
              <span>免费静态托管</span>
            </li>
            <li>
              <strong>CDN</strong>
              <span>可公开访问分发</span>
            </li>
          </ul>
        </div>

        <div class="hero-panel">
          <p class="panel-label">展厅速览</p>
          <div class="featured-stack">
            <button
              v-for="artwork in featuredArtworks"
              :key="artwork.slug"
              class="featured-card"
              type="button"
              @click="openArtwork(artwork)"
            >
              <img :src="artwork.cover.src" :alt="artwork.cover.alt" loading="lazy" decoding="async" />
              <div class="featured-card-copy">
                <span>{{ artwork.year }} · {{ artwork.category }}</span>
                <strong>{{ artwork.title }}</strong>
                <small>{{ artwork.series }}</small>
              </div>
            </button>
          </div>
        </div>
      </header>

      <main>
        <section class="section intro-section">
          <div class="section-heading">
            <p class="section-kicker">关于这个站</p>
            <h2>偏美术馆感的个人线上作品集</h2>
            <p>
              这个项目专门针对你这种“本地维护图片和 JSON，再重新部署”的工作流来设计，
              不需要服务器、不需要数据库，也不需要任何付费服务。
            </p>
          </div>

          <div class="intro-grid">
            <article v-for="card in siteMeta.introCards" :key="card.title" class="info-card">
              <p class="section-kicker">特色</p>
              <h3>{{ card.title }}</h3>
              <p>{{ card.body }}</p>
            </article>
          </div>
        </section>

        <section id="featured" class="section">
          <div class="section-heading section-heading-inline">
            <div>
              <p class="section-kicker">Curated Selection</p>
              <h2>精选作品</h2>
            </div>
            <p class="section-note">这里自动展示 `featured: true` 的作品。</p>
          </div>

          <div class="featured-gallery">
            <button
              v-for="artwork in featuredArtworks"
              :key="artwork.slug"
              class="featured-gallery-card"
              type="button"
              @click="openArtwork(artwork)"
            >
              <img :src="artwork.fullImage.src" :alt="artwork.fullImage.alt" loading="lazy" decoding="async" />
              <div class="featured-gallery-overlay">
                <p>{{ artwork.category }} / {{ artwork.year }}</p>
                <h3>{{ artwork.title }}</h3>
                <span>{{ artwork.medium }}</span>
              </div>
            </button>
          </div>
        </section>

        <section id="gallery" class="section">
          <div class="section-heading section-heading-inline">
            <div>
              <p class="section-kicker">作品档案</p>
              <h2>画廊浏览</h2>
            </div>
            <p class="section-note">支持按分类筛选，并可按标题、系列或标签搜索。</p>
          </div>

          <div class="gallery-toolbar">
            <div class="filter-group" aria-label="作品分类">
              <button
                v-for="category in categories"
                :key="category"
                class="filter-pill"
                :class="{ 'filter-pill-active': selectedCategory === category }"
                type="button"
                @click="selectedCategory = category"
              >
                {{ category }}
              </button>
            </div>

            <label class="search-box">
              <span class="sr-only">搜索作品</span>
              <input v-model="searchQuery" type="search" placeholder="搜索标题、系列或标签" />
            </label>
          </div>

          <div class="gallery-summary">
            <p>共展示 {{ filteredArtworks.length }} 幅作品</p>
            <p>图片与信息来自 `public/data/artworks.json` 和 `public/paintings/`。</p>
          </div>

          <div class="artwork-grid">
            <ArtworkCard
              v-for="artwork in filteredArtworks"
              :key="artwork.slug"
              :artwork="artwork"
              @select="openArtwork"
            />
          </div>

          <div v-if="filteredArtworks.length === 0" class="empty-state">
            <h3>没有匹配到作品</h3>
            <p>试试切换分类或清空搜索关键字。</p>
          </div>
        </section>

        <section id="process" class="section">
          <div class="section-heading section-heading-inline">
            <div>
              <p class="section-kicker">维护方式</p>
              <h2>以后只做这三件事</h2>
            </div>
            <p class="section-note">很适合你逐步把 40 幅作品整理进来。</p>
          </div>

          <div class="process-grid">
            <article v-for="step in siteMeta.processSteps" :key="step.title" class="process-card">
              <span class="process-index">{{ siteMeta.processSteps.indexOf(step) + 1 }}</span>
              <h3>{{ step.title }}</h3>
              <p>{{ step.body }}</p>
            </article>
          </div>

          <div class="about-grid">
            <article class="info-card">
              <p class="section-kicker">图片位置</p>
              <h3>把你的 40 幅作品照片放在这里</h3>
              <p>
                `source-images/works/` 放原始作品图，`source-images/details/`
                放原始细节图。执行构建时会自动压缩并生成网页可用图片到 `public/paintings/`。
              </p>
            </article>

            <article class="info-card">
              <p class="section-kicker">JSON 配置位置</p>
              <h3>主要改这两个文件</h3>
              <p>
                `public/data/site.json` 维护站点标题、简介和联系信息；`public/data/artworks.json`
                维护作品列表、分类、尺寸、说明和所有图片路径。
              </p>
            </article>
          </div>
        </section>
      </main>

      <footer id="contact" class="footer-card">
        <div>
          <p class="section-kicker">联系与分享</p>
          <h2>{{ siteMeta.artistName }}</h2>
          <p class="footer-text">
            {{ siteMeta.location }} · {{ siteMeta.email }}
          </p>
        </div>

        <div class="footer-links">
          <a v-for="link in siteMeta.socialLinks" :key="link.label" :href="link.href" target="_blank" rel="noreferrer">
            {{ link.label }}
          </a>
        </div>

        <p class="footer-caption">{{ siteMeta.footer }}</p>
      </footer>
    </template>

    <section v-else-if="isLoading" class="loading-state">
      <p class="section-kicker">Loading</p>
      <h2>正在加载展厅内容...</h2>
    </section>

    <section v-else class="loading-state">
      <p class="section-kicker">Load Error</p>
      <h2>内容加载失败</h2>
      <p>{{ loadError }}</p>
    </section>

    <ArtworkModal
      v-if="activeArtwork"
      :artwork="activeArtwork"
      :can-navigate="filteredArtworks.length > 1"
      @close="closeArtwork"
      @previous="showPreviousArtwork"
      @next="showNextArtwork"
    />
  </div>
</template>
