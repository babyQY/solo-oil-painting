<script setup lang="ts">
import { computed } from 'vue'
import type { Artwork } from '../types'

const props = defineProps<{
  artwork: Artwork
}>()

const emit = defineEmits<{
  select: [artwork: Artwork]
}>()

const displayTags = computed(() =>
  props.artwork.sold ? ['已售', ...props.artwork.tags] : props.artwork.tags,
)
</script>

<template>
  <button class="artwork-card" type="button" @click="emit('select', artwork)">
    <div class="artwork-card-image painting-frame">
      <img
        :src="artwork.cover.src"
        :alt="artwork.cover.alt"
        loading="lazy"
        decoding="async"
        sizes="(max-width: 480px) 50vw, (max-width: 720px) 34vw, (max-width: 1100px) 34vw, 20vw"
      />
      <span v-if="artwork.featured" class="artwork-badge">精选</span>
      <span v-if="artwork.sold" class="artwork-badge artwork-badge-sold">已售出</span>
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
        <li
          v-for="tag in displayTags"
          :key="tag"
          :class="{ 'tag-list-item-status': tag === '已售' }"
        >
          {{ tag }}
        </li>
      </ul>
    </div>
  </button>
</template>
