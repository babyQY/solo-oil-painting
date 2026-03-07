<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

const props = defineProps<{
  src: string
  alt: string
}>()

const container = ref<HTMLElement | null>(null)
const hoverActive = ref(false)
const touchZoomEnabled = ref(false)
const supportsHoverZoom = ref(false)
const focusX = ref(50)
const focusY = ref(50)
const zoomScale = 2.6

const zoomVisible = computed(() => (supportsHoverZoom.value ? hoverActive.value : touchZoomEnabled.value))
const backgroundPosition = computed(() => `${focusX.value}% ${focusY.value}%`)

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function updateFocus(clientX: number, clientY: number) {
  if (!container.value) {
    return
  }

  const rect = container.value.getBoundingClientRect()
  const x = ((clientX - rect.left) / rect.width) * 100
  const y = ((clientY - rect.top) / rect.height) * 100

  focusX.value = clamp(x, 0, 100)
  focusY.value = clamp(y, 0, 100)
}

function handlePointerEnter(event: PointerEvent) {
  if (!supportsHoverZoom.value) {
    return
  }

  hoverActive.value = true
  updateFocus(event.clientX, event.clientY)
}

function handlePointerMove(event: PointerEvent) {
  if (!supportsHoverZoom.value && !touchZoomEnabled.value) {
    return
  }

  updateFocus(event.clientX, event.clientY)
}

function handlePointerLeave() {
  if (supportsHoverZoom.value) {
    hoverActive.value = false
  }
}

function toggleTouchZoom() {
  touchZoomEnabled.value = !touchZoomEnabled.value
}

onMounted(() => {
  supportsHoverZoom.value = window.matchMedia('(hover: hover) and (pointer: fine)').matches
})
</script>

<template>
  <div class="magnifier">
    <div
      ref="container"
      class="magnifier-stage painting-frame"
      @pointerenter="handlePointerEnter"
      @pointermove="handlePointerMove"
      @pointerleave="handlePointerLeave"
    >
      <img class="painting-frame-image magnifier-image" :src="props.src" :alt="props.alt" decoding="async" />
      <div
        v-if="zoomVisible"
        class="magnifier-lens"
        :style="{
          left: `${focusX}%`,
          top: `${focusY}%`,
        }"
      />
    </div>

    <div class="magnifier-toolbar">
      <span>拖动或悬停可查看笔触局部</span>
      <button v-if="!supportsHoverZoom" class="button button-secondary magnifier-toggle" type="button" @click="toggleTouchZoom">
        {{ touchZoomEnabled ? '关闭放大镜' : '开启放大镜' }}
      </button>
    </div>

    <div
      v-if="zoomVisible"
      class="magnifier-result"
      :style="{
        backgroundImage: `url(${props.src})`,
        backgroundPosition,
        backgroundSize: `${zoomScale * 100}%`,
      }"
    />
  </div>
</template>
