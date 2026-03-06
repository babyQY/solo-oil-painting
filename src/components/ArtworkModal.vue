<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Artwork } from '../types'

const props = defineProps<{
  artwork: Artwork
  canNavigate: boolean
}>()

const emit = defineEmits<{
  close: []
  previous: []
  next: []
}>()

const activeImageIndex = ref(0)

const galleryImages = computed(() => [props.artwork.fullImage, ...props.artwork.details])
const activeImage = computed(() => galleryImages.value[activeImageIndex.value] ?? props.artwork.fullImage)

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close')
  }

  if (event.key === 'ArrowLeft' && props.canNavigate) {
    emit('previous')
  }

  if (event.key === 'ArrowRight' && props.canNavigate) {
    emit('next')
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  document.body.style.overflow = 'hidden'
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})

watch(
  () => props.artwork.slug,
  () => {
    activeImageIndex.value = 0
  },
  { immediate: true },
)
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="modal-panel" role="dialog" aria-modal="true" :aria-label="props.artwork.title">
      <div class="modal-topbar">
        <div class="modal-switcher">
          <button
            class="modal-nav"
            type="button"
            aria-label="上一幅作品"
            :disabled="!props.canNavigate"
            @click="emit('previous')"
          >
            上一幅
          </button>
          <button
            class="modal-nav"
            type="button"
            aria-label="下一幅作品"
            :disabled="!props.canNavigate"
            @click="emit('next')"
          >
            下一幅
          </button>
        </div>

        <button class="modal-close" type="button" aria-label="关闭详情" @click="emit('close')">
          关闭
        </button>
      </div>

      <div class="modal-layout">
        <figure class="modal-hero-image painting-frame">
          <img class="painting-frame-image" :src="activeImage.src" :alt="activeImage.alt" decoding="async" sizes="100vw" />
          <figcaption>{{ activeImage.alt }}</figcaption>
        </figure>

        <div class="modal-copy">
          <p class="section-kicker">作品详情 / {{ props.artwork.series }}</p>
          <h2>{{ props.artwork.title }}</h2>
          <p class="modal-meta">
            {{ props.artwork.year }} / {{ props.artwork.medium }} / {{ props.artwork.size }}
          </p>
          <p class="modal-description">{{ props.artwork.description }}</p>

          <ul class="tag-list">
            <li v-for="tag in props.artwork.tags" :key="tag">{{ tag }}</li>
          </ul>

          <div class="modal-thumbnails">
            <button
              v-for="(image, index) in galleryImages"
              :key="image.alt"
              class="thumb-card"
              :class="{ 'thumb-card-active': activeImageIndex === index }"
              type="button"
              @click="activeImageIndex = index"
            >
              <img :src="image.src" :alt="image.alt" loading="lazy" decoding="async" />
              <span>{{ index === 0 ? '完整图' : `细节 ${index}` }}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>
