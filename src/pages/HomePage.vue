<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ArtworkCard from '../components/ArtworkCard.vue'
import { loadArtworks, loadSiteMeta } from '../data/content'
import type { Artwork, SiteMeta } from '../types'

const router = useRouter()
const siteMeta = ref<SiteMeta | null>(null)
const artworks = ref<Artwork[]>([])
const selectedCategory = ref('全部')
const searchQuery = ref('')
const isLoading = ref(true)
const loadError = ref('')
const featuredCarouselIndex = ref(0)

let featuredAutoplayTimer: number | undefined
let emailCopiedTimer: number | undefined
const emailCopied = ref(false)

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

    return matchesCategory && (query.length === 0 || haystack.includes(query))
  })
})

const featuredArtworks = computed(() => artworks.value.filter((artwork) => artwork.featured))
const featuredCarouselItems = computed(() =>
  featuredArtworks.value.length > 0 ? featuredArtworks.value : artworks.value.slice(0, 1),
)
const activeFeaturedArtwork = computed(
  () => featuredCarouselItems.value[featuredCarouselIndex.value] ?? null,
)
const artworkCountLabel = computed(() => String(artworks.value.length).padStart(2, '0'))

function stopFeaturedAutoplay() {
  if (featuredAutoplayTimer !== undefined) {
    window.clearInterval(featuredAutoplayTimer)
    featuredAutoplayTimer = undefined
  }
}

function startFeaturedAutoplay() {
  stopFeaturedAutoplay()

  if (featuredCarouselItems.value.length <= 1) {
    return
  }

  featuredAutoplayTimer = window.setInterval(() => {
    featuredCarouselIndex.value = (featuredCarouselIndex.value + 1) % featuredCarouselItems.value.length
  }, 4200)
}

function goToFeatured(index: number) {
  featuredCarouselIndex.value = index
}

function goToPrevFeatured() {
  if (featuredCarouselItems.value.length <= 1) {
    return
  }
  featuredCarouselIndex.value =
    (featuredCarouselIndex.value - 1 + featuredCarouselItems.value.length) %
    featuredCarouselItems.value.length
}

function goToNextFeatured() {
  if (featuredCarouselItems.value.length <= 1) {
    return
  }
  featuredCarouselIndex.value =
    (featuredCarouselIndex.value + 1) % featuredCarouselItems.value.length
}

function openArtwork(artwork: Artwork) {
  router.push({ name: 'artwork', params: { slug: artwork.slug } })
}

function getEmailAddressFromHref(href: string) {
  return href.replace(/^mailto:/i, '').trim()
}

function getSocialLinkLabel(label: string, href: string) {
  if (href.startsWith('mailto:') && emailCopied.value) {
    return '已复制邮箱'
  }
  return label
}

async function handleSocialLinkClick(href: string, event: MouseEvent) {
  if (!href.startsWith('mailto:')) {
    return
  }

  event.preventDefault()
  const email = getEmailAddressFromHref(href) || siteMeta.value?.email || ''
  if (!email) {
    return
  }

  try {
    await navigator.clipboard.writeText(email)
    emailCopied.value = true
    if (emailCopiedTimer !== undefined) {
      window.clearTimeout(emailCopiedTimer)
    }
    emailCopiedTimer = window.setTimeout(() => {
      emailCopied.value = false
      emailCopiedTimer = undefined
    }, 1500)
  } catch {
    window.prompt('请复制邮箱地址：', email)
  }
}

watch(
  featuredCarouselItems,
  (items) => {
    if (featuredCarouselIndex.value >= items.length) {
      featuredCarouselIndex.value = 0
    }
    startFeaturedAutoplay()
  },
  { immediate: true },
)

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

onBeforeUnmount(() => {
  stopFeaturedAutoplay()
  if (emailCopiedTimer !== undefined) {
    window.clearTimeout(emailCopiedTimer)
  }
})
</script>

<template>
  <div class="site-shell">
    <div class="background-glow background-glow-left" />
    <div class="background-glow background-glow-right" />

    <template v-if="siteMeta">
      <header class="topbar">
        <RouterLink class="brand" to="/">
          <span class="brand-mark" />
          <span>{{ siteMeta.artistName }}</span>
        </RouterLink>

        <nav class="nav">
          <RouterLink to="/gallery">作品</RouterLink>
          <RouterLink to="/contact">联系</RouterLink>
        </nav>
      </header>

      <main class="page-stack">
        <section id="top" class="hero hero-home">
          <div class="hero-copy hero-copy-large">
            <p class="eyebrow">{{ siteMeta.label }}</p>
            <h1>{{ siteMeta.title }}</h1>
            <p class="hero-note">{{ siteMeta.heroNote }}</p>
            <p class="hero-text">{{ siteMeta.description }}</p>

            <div class="hero-actions">
              <RouterLink class="button button-primary" to="/gallery">进入作品画廊</RouterLink>
              <RouterLink class="button button-secondary" to="/contact">联系阿彬</RouterLink>
            </div>

            <ul class="hero-stats" aria-label="站点亮点">
              <li>
                <strong>{{ artworkCountLabel }}</strong>
                <span>在线作品</span>
              </li>
              <li>
                <strong>高清细览</strong>
                <span>自动生成细节图</span>
              </li>
            </ul>

            <div v-if="siteMeta.introCards.length > 0" class="hero-quotes" aria-label="艺术哲思">
              <article
                v-for="card in siteMeta.introCards"
                :key="card.title"
                class="hero-quote-card"
              >
                <p class="hero-quote-title">{{ card.title }}</p>
                <p class="hero-quote-body">{{ card.body }}</p>
              </article>
            </div>
          </div>

          <div class="hero-panel hero-panel-wide" @mouseenter="stopFeaturedAutoplay" @mouseleave="startFeaturedAutoplay">
            <p class="panel-label">Featured Work</p>
            <template v-if="activeFeaturedArtwork">
              <div class="hero-carousel-shell">
                <div class="hero-carousel-stage">
                  <button class="hero-carousel-card painting-frame" type="button" @click="openArtwork(activeFeaturedArtwork)">
                    <img
                      class="painting-frame-image"
                      :src="activeFeaturedArtwork.fullImage.src"
                      :alt="activeFeaturedArtwork.fullImage.alt"
                      loading="eager"
                      decoding="async"
                    />
                    <div class="hero-carousel-overlay">
                      <span>{{ activeFeaturedArtwork.year }} · {{ activeFeaturedArtwork.category }}</span>
                      <strong>{{ activeFeaturedArtwork.title }}</strong>
                      <small>{{ activeFeaturedArtwork.series }}</small>
                    </div>
                  </button>

                  <template v-if="featuredCarouselItems.length > 1">
                    <button
                      class="hero-carousel-arrow hero-carousel-arrow-prev"
                      type="button"
                      aria-label="上一张精选作品"
                      @click="goToPrevFeatured"
                    >
                      <span class="hero-carousel-arrow-icon" aria-hidden="true" />
                    </button>
                    <button
                      class="hero-carousel-arrow hero-carousel-arrow-next"
                      type="button"
                      aria-label="下一张精选作品"
                      @click="goToNextFeatured"
                    >
                      <span class="hero-carousel-arrow-icon" aria-hidden="true" />
                    </button>
                  </template>
                </div>

                <div v-if="featuredCarouselItems.length > 1" class="hero-carousel-dots" aria-label="轮播切换">
                  <button
                    v-for="(artwork, index) in featuredCarouselItems"
                    :key="artwork.slug"
                    class="hero-carousel-dot"
                    :class="{ 'hero-carousel-dot-active': index === featuredCarouselIndex }"
                    type="button"
                    :aria-label="`切换到第 ${index + 1} 张`"
                    @click="goToFeatured(index)"
                  />
                </div>
              </div>
            </template>
          </div>
        </section>

        <section id="gallery" class="section section-gallery">
          <div class="section-heading section-heading-inline">
            <div>
              <p class="section-kicker">Gallery</p>
              <h2>作品画廊</h2>
            </div>
            <p class="section-note">“艺术并不复制可见之物，而是使其可见。”</p>
          </div>

          <div class="gallery-toolbar gallery-toolbar-compact">
            <div v-if="categories.length > 2" class="filter-group" aria-label="作品分类">
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

          <div class="gallery-summary gallery-summary-tight">
            <p>共展示 {{ filteredArtworks.length }} 幅作品</p>
            <p>“绘画是无声的诗，诗是有声的画。”</p>
          </div>

          <div class="artwork-grid artwork-grid-dense">
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
      </main>

      <footer id="contact" class="footer-card">
        <div>
          <p class="section-kicker">联系与分享</p>
          <h2>{{ siteMeta.artistName }}</h2>
          <p class="footer-text">{{ siteMeta.location }} · {{ siteMeta.email }}</p>
        </div>

        <div class="footer-links">
          <a
            v-for="link in siteMeta.socialLinks"
            :key="link.label"
            :href="link.href"
            :target="link.href.startsWith('mailto:') ? undefined : '_blank'"
            rel="noreferrer"
            @click="handleSocialLinkClick(link.href, $event)"
          >
            {{ getSocialLinkLabel(link.label, link.href) }}
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
  </div>
</template>
