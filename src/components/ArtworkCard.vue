<script setup lang="ts">
import type { Artwork } from '../types'

defineProps<{
  artwork: Artwork
}>()

const emit = defineEmits<{
  select: [artwork: Artwork]
}>()
</script>

<template>
  <button class="artwork-card" type="button" @click="emit('select', artwork)">
    <div class="artwork-card-image">
      <img
        :src="artwork.cover.src"
        :alt="artwork.cover.alt"
        loading="lazy"
        decoding="async"
        sizes="(max-width: 720px) 100vw, (max-width: 980px) 50vw, 33vw"
      />
      <span v-if="artwork.featured" class="artwork-badge">精选</span>
    </div>

    <div class="artwork-card-body">
      <div class="artwork-card-head">
        <div>
          <p>{{ artwork.year }}</p>
          <h3>{{ artwork.title }}</h3>
        </div>
        <span>{{ artwork.size }}</span>
      </div>

      <p class="artwork-card-medium">{{ artwork.medium }} · {{ artwork.series }}</p>

      <ul class="tag-list">
        <li v-for="tag in artwork.tags" :key="tag">{{ tag }}</li>
      </ul>
    </div>
  </button>
</template>
