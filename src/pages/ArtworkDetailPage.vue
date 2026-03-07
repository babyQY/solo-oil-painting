<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import ImageMagnifier from '../components/ImageMagnifier.vue'
import { loadArtworks, loadSiteMeta } from '../data/content'
import type { Artwork, SiteMeta } from '../types'

const route = useRoute()
const siteMeta = ref<SiteMeta | null>(null)
const artworks = ref<Artwork[]>([])
const activeImageIndex = ref(0)
const isLoading = ref(true)
const loadError = ref('')
const parallaxOffset = ref(0)
const parallaxTiltX = ref(0)
const parallaxTiltY = ref(0)

const currentArtwork = computed(() =>
  artworks.value.find((artwork) => artwork.slug === String(route.params.slug)) ?? null,
)

const currentIndex = computed(() =>
  artworks.value.findIndex((artwork) => artwork.slug === String(route.params.slug)),
)

const galleryImages = computed(() => {
  if (!currentArtwork.value) {
    return []
  }

  return [currentArtwork.value.fullImage, ...currentArtwork.value.details]
})

const activeImage = computed(() => galleryImages.value[activeImageIndex.value] ?? null)
const previousArtwork = computed(() =>
  currentIndex.value > 0 ? artworks.value[currentIndex.value - 1] : null,
)
const nextArtwork = computed(() =>
  currentIndex.value >= 0 && currentIndex.value < artworks.value.length - 1
    ? artworks.value[currentIndex.value + 1]
    : null,
)

const heroBackdropStyle = computed(() => {
  if (!currentArtwork.value) {
    return {}
  }

  return {
    backgroundImage: `linear-gradient(180deg, rgba(8, 8, 8, 0.12), rgba(8, 8, 8, 0.82)), url(${currentArtwork.value.fullImage.src})`,
    transform: `translate3d(0, ${parallaxOffset.value}px, 0) scale(1.08) rotateX(${parallaxTiltX.value}deg) rotateY(${parallaxTiltY.value}deg)`,
  }
})

function handleScroll() {
  parallaxOffset.value = Math.min(window.scrollY * 0.12, 48)
}

function handleHeroPointerMove(event: PointerEvent) {
  const target = event.currentTarget as HTMLElement | null

  if (!target) {
    return
  }

  const rect = target.getBoundingClientRect()
  const x = (event.clientX - rect.left) / rect.width - 0.5
  const y = (event.clientY - rect.top) / rect.height - 0.5

  parallaxTiltY.value = x * 4
  parallaxTiltX.value = y * -4
}

function resetHeroParallax() {
  parallaxTiltX.value = 0
  parallaxTiltY.value = 0
}

watch(
  () => route.params.slug,
  () => {
    activeImageIndex.value = 0
    resetHeroParallax()
    handleScroll()
  },
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

  handleScroll()
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div class="site-shell site-shell-detail">
    <div class="background-glow background-glow-left" />
    <div class="background-glow background-glow-right" />

    <template v-if="siteMeta && currentArtwork && activeImage">
      <header class="topbar topbar-detail">
        <RouterLink class="brand" :to="{ name: 'home' }">
          <span class="brand-mark" />
          <span>{{ siteMeta.artistName }}</span>
        </RouterLink>

        <nav class="nav">
          <RouterLink :to="{ name: 'home' }">返回画廊</RouterLink>
          <a href="#detail-meta">作品信息</a>
        </nav>
      </header>

      <Transition name="detail-route" mode="out-in">
        <main :key="currentArtwork.slug" class="detail-page">
          <section
            class="detail-cinematic-hero"
            @pointermove="handleHeroPointerMove"
            @pointerleave="resetHeroParallax"
          >
            <div class="detail-cinematic-backdrop" :style="heroBackdropStyle" />
            <div class="detail-cinematic-overlay" />

            <div class="detail-cinematic-content">
              <p class="eyebrow">{{ currentArtwork.category }} / {{ currentArtwork.series }}</p>
              <h1>{{ currentArtwork.title }}</h1>
              <p class="hero-note">{{ currentArtwork.year }} · {{ currentArtwork.medium }} · {{ currentArtwork.size }}</p>
              <p class="hero-text">{{ currentArtwork.description }}</p>

              <div class="detail-stage-nav">
                <RouterLink
                  v-if="previousArtwork"
                  class="detail-nav-card"
                  :to="{ name: 'artwork', params: { slug: previousArtwork.slug } }"
                >
                  <span>上一幅</span>
                  <strong>{{ previousArtwork.title }}</strong>
                </RouterLink>
                <RouterLink
                  v-if="nextArtwork"
                  class="detail-nav-card detail-nav-card-primary"
                  :to="{ name: 'artwork', params: { slug: nextArtwork.slug } }"
                >
                  <span>下一幅</span>
                  <strong>{{ nextArtwork.title }}</strong>
                </RouterLink>
              </div>
            </div>
          </section>

          <section class="detail-layout">
            <div class="detail-visual">
              <ImageMagnifier :src="activeImage.src" :alt="activeImage.alt" />

              <div class="detail-thumb-strip">
                <button
                  v-for="(image, index) in galleryImages"
                  :key="image.src"
                  class="detail-thumb-card"
                  :class="{ 'detail-thumb-card-active': index === activeImageIndex }"
                  type="button"
                  @click="activeImageIndex = index"
                >
                  <img :src="image.src" :alt="image.alt" loading="lazy" decoding="async" />
                  <span>{{ index === 0 ? '完整图' : `自动细节 ${index}` }}</span>
                </button>
              </div>
            </div>

            <aside id="detail-meta" class="detail-sidebar">
              <div class="detail-panel">
                <p class="section-kicker">Immersive View</p>
                <h2>作品信息</h2>
                <p class="detail-panel-text">{{ currentArtwork.description }}</p>
              </div>

              <div class="detail-panel">
                <p class="section-kicker">Auto Crop</p>
                <h2>智能细节裁剪</h2>
                <p class="detail-panel-text">
                  人物与动物优先聚焦面部与主体，风景优先捕捉高对比与视觉焦点区域。
                </p>
              </div>

              <ul class="tag-list">
                <li v-for="tag in currentArtwork.tags" :key="tag">{{ tag }}</li>
              </ul>
            </aside>
          </section>
        </main>
      </Transition>
    </template>

    <section v-else-if="isLoading" class="loading-state">
      <p class="section-kicker">Loading</p>
      <h2>正在加载作品详情...</h2>
    </section>

    <section v-else class="loading-state">
      <p class="section-kicker">Not Found</p>
      <h2>没有找到这幅作品</h2>
      <p>{{ loadError || '可能是链接失效，或者作品数据尚未同步。' }}</p>
      <RouterLink class="button button-primary" :to="{ name: 'home' }">返回首页</RouterLink>
    </section>
  </div>
</template>
