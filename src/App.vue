<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { RouterView } from 'vue-router'

const protectedMediaSelector = 'img'

function isProtectedMediaTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest(protectedMediaSelector))
}

function handleProtectedContextMenu(event: MouseEvent) {
  if (isProtectedMediaTarget(event.target)) {
    event.preventDefault()
  }
}

function handleProtectedDragStart(event: DragEvent) {
  if (isProtectedMediaTarget(event.target)) {
    event.preventDefault()
  }
}

onMounted(() => {
  window.addEventListener('contextmenu', handleProtectedContextMenu)
  window.addEventListener('dragstart', handleProtectedDragStart)
})

onBeforeUnmount(() => {
  window.removeEventListener('contextmenu', handleProtectedContextMenu)
  window.removeEventListener('dragstart', handleProtectedDragStart)
})
</script>

<template>
  <RouterView />
</template>
