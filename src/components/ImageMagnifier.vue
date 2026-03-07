<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  src: string
  alt: string
}>()

const container = ref<HTMLElement | null>(null)
const image = ref<HTMLImageElement | null>(null)
const sideResult = ref<HTMLElement | null>(null)
const inlineResult = ref<HTMLElement | null>(null)
const hoverActive = ref(false)
const touchZoomActive = ref(false)
const supportsHoverZoom = ref(false)
const isNarrowViewport = ref(false)
const focusX = ref(50)
const focusY = ref(50)
const focusCanvasX = ref(0)
const focusCanvasY = ref(0)
const displayWidth = ref(0)
const displayHeight = ref(0)
const displayOffsetX = ref(0)
const displayOffsetY = ref(0)
const sideResultWidth = ref(0)
const sideResultHeight = ref(0)
const inlineResultWidth = ref(0)
const inlineResultHeight = ref(0)
const zoomScale = 2.6

const useDesktopHoverMode = computed(() => supportsHoverZoom.value && !isNarrowViewport.value)
const zoomVisible = computed(() => (useDesktopHoverMode.value ? hoverActive.value : touchZoomActive.value))
const lensStyle = computed(() => ({
  left: `${displayOffsetX.value + focusCanvasX.value}px`,
  top: `${displayOffsetY.value + focusCanvasY.value}px`,
}))

function getBackgroundStyle(targetWidth: number, targetHeight: number) {
  if (displayWidth.value === 0 || displayHeight.value === 0 || targetWidth === 0 || targetHeight === 0) {
    return {}
  }

  return {
    backgroundImage: `url(${props.src})`,
    backgroundSize: `${displayWidth.value * zoomScale}px ${displayHeight.value * zoomScale}px`,
    backgroundPosition: `${targetWidth / 2 - focusCanvasX.value * zoomScale}px ${targetHeight / 2 - focusCanvasY.value * zoomScale}px`,
  }
}

const sideResultStyle = computed(() => getBackgroundStyle(sideResultWidth.value, sideResultHeight.value))
const inlineResultStyle = computed(() => getBackgroundStyle(inlineResultWidth.value, inlineResultHeight.value))

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function syncMetrics() {
  if (!container.value || !image.value) {
    return
  }

  const stageWidth = container.value.clientWidth
  const stageHeight = container.value.clientHeight
  const naturalWidth = image.value.naturalWidth
  const naturalHeight = image.value.naturalHeight

  if (stageWidth === 0 || stageHeight === 0 || naturalWidth === 0 || naturalHeight === 0) {
    return
  }

  const scale = Math.min(stageWidth / naturalWidth, stageHeight / naturalHeight)
  displayWidth.value = naturalWidth * scale
  displayHeight.value = naturalHeight * scale
  displayOffsetX.value = (stageWidth - displayWidth.value) / 2
  displayOffsetY.value = (stageHeight - displayHeight.value) / 2

  sideResultWidth.value = sideResult.value?.clientWidth ?? 0
  sideResultHeight.value = sideResult.value?.clientHeight ?? 0
  inlineResultWidth.value = inlineResult.value?.clientWidth ?? 0
  inlineResultHeight.value = inlineResult.value?.clientHeight ?? 0

  focusCanvasX.value = clamp(focusCanvasX.value || displayWidth.value / 2, 0, displayWidth.value)
  focusCanvasY.value = clamp(focusCanvasY.value || displayHeight.value / 2, 0, displayHeight.value)
  focusX.value = (focusCanvasX.value / displayWidth.value) * 100
  focusY.value = (focusCanvasY.value / displayHeight.value) * 100
}

function resetFocusToCenter() {
  if (displayWidth.value === 0 || displayHeight.value === 0) {
    return
  }

  focusCanvasX.value = displayWidth.value / 2
  focusCanvasY.value = displayHeight.value / 2
  focusX.value = 50
  focusY.value = 50
}

function updateFocus(clientX: number, clientY: number) {
  if (!container.value) {
    return
  }

  const rect = container.value.getBoundingClientRect()
  const localX = clientX - rect.left - displayOffsetX.value
  const localY = clientY - rect.top - displayOffsetY.value
  const clampedX = clamp(localX, 0, displayWidth.value)
  const clampedY = clamp(localY, 0, displayHeight.value)

  focusCanvasX.value = clampedX
  focusCanvasY.value = clampedY
  focusX.value = displayWidth.value === 0 ? 50 : (clampedX / displayWidth.value) * 100
  focusY.value = displayHeight.value === 0 ? 50 : (clampedY / displayHeight.value) * 100
}

function handlePointerEnter(event: PointerEvent) {
  if (!useDesktopHoverMode.value) {
    return
  }

  hoverActive.value = true
  updateFocus(event.clientX, event.clientY)
}

function handlePointerMove(event: PointerEvent) {
  if (!useDesktopHoverMode.value && !touchZoomActive.value) {
    return
  }

  updateFocus(event.clientX, event.clientY)
}

function handlePointerLeave() {
  if (useDesktopHoverMode.value) {
    hoverActive.value = false
    return
  }

  touchZoomActive.value = false
}

function handlePointerDown(event: PointerEvent) {
  if (useDesktopHoverMode.value) {
    return
  }
  touchZoomActive.value = true
  updateFocus(event.clientX, event.clientY)
}

function handlePointerUp() {
  if (!useDesktopHoverMode.value) {
    touchZoomActive.value = false
  }
}

function handleResize() {
  isNarrowViewport.value = window.matchMedia('(max-width: 720px)').matches
  syncMetrics()
}

onMounted(() => {
  supportsHoverZoom.value = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  isNarrowViewport.value = window.matchMedia('(max-width: 720px)').matches
  nextTick(() => {
    syncMetrics()
    resetFocusToCenter()
  })
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})

watch(
  () => props.src,
  async () => {
    await nextTick()
    syncMetrics()
    resetFocusToCenter()
  },
)

watch(
  () => zoomVisible.value,
  async () => {
    await nextTick()
    syncMetrics()
  },
)
</script>

<template>
  <div class="magnifier">
    <div class="magnifier-main">
      <div
        ref="container"
        class="magnifier-stage painting-frame"
        @pointerenter="handlePointerEnter"
        @pointermove="handlePointerMove"
        @pointerleave="handlePointerLeave"
        @pointerdown="handlePointerDown"
        @pointerup="handlePointerUp"
        @pointercancel="handlePointerUp"
      >
        <img
          ref="image"
          class="painting-frame-image magnifier-image"
          :src="props.src"
          :alt="props.alt"
          decoding="async"
          @load="syncMetrics"
        />

        <div
          v-if="useDesktopHoverMode && zoomVisible"
          class="magnifier-lens"
          :style="lensStyle"
        />

        <div
          v-if="!useDesktopHoverMode && zoomVisible"
          ref="inlineResult"
          class="magnifier-inline-result"
          :style="inlineResultStyle"
        />

      </div>

      <div
        v-if="useDesktopHoverMode && zoomVisible"
        ref="sideResult"
        class="magnifier-floating-result magnifier-result-active"
        :style="sideResultStyle"
      />

      <div class="magnifier-toolbar">
        <span>{{ useDesktopHoverMode ? '鼠标移动到画面上即可查看右侧悬浮预览' : '按住并拖动画面，即可查看叠层放大' }}</span>
      </div>
    </div>
  </div>
</template>
