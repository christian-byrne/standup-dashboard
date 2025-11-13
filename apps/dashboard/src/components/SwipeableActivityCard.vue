<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  activity: Array<{
    title: string
    repository: string
    url: string
    state: 'open' | 'closed' | 'merged'
    mergedAt?: string | null
    updatedAt: string
  }>
  dateFormatter: Intl.DateTimeFormat
}>()

const activeIndex = ref(0)
const startX = ref(0)
const currentX = ref(0)
const isDragging = ref(false)

const totalCards = computed(() => props.activity.length)
const currentCard = computed(() => props.activity[activeIndex.value])

const transformStyle = computed(() => {
  if (!isDragging.value) return `translateX(-${activeIndex.value * 100}%)`
  
  const dragOffset = currentX.value - startX.value
  const baseTransform = -activeIndex.value * 100
  const dragTransform = (dragOffset / window.innerWidth) * 100
  
  return `translateX(${baseTransform + dragTransform}%)`
})

function handleTouchStart(event: TouchEvent) {
  startX.value = event.touches[0].clientX
  currentX.value = startX.value
  isDragging.value = true
}

function handleTouchMove(event: TouchEvent) {
  if (!isDragging.value) return
  
  currentX.value = event.touches[0].clientX
}

function handleTouchEnd() {
  if (!isDragging.value) return
  
  const diff = currentX.value - startX.value
  const threshold = window.innerWidth * 0.2 // 20% of screen width
  
  if (Math.abs(diff) > threshold) {
    if (diff > 0 && activeIndex.value > 0) {
      // Swipe right - previous card
      activeIndex.value--
    } else if (diff < 0 && activeIndex.value < totalCards.value - 1) {
      // Swipe left - next card
      activeIndex.value++
    }
  }
  
  isDragging.value = false
  startX.value = 0
  currentX.value = 0
}

function goToCard(index: number) {
  activeIndex.value = index
}

function getStateColor(state: string): string {
  switch (state) {
    case 'merged': return 'text-primary border-primary/30 bg-primary/10'
    case 'open': return 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10'
    case 'closed': return 'text-rose-400 border-rose-400/30 bg-rose-400/10'
    default: return 'text-gray-400 border-gray-400/30 bg-gray-400/10'
  }
}
</script>

<template>
  <div class="block sm:hidden">
    <!-- Mobile: Swipeable Cards -->
    <div class="relative overflow-hidden rounded-2xl">
      <div 
        class="flex transition-transform duration-300 ease-out"
        :style="{ transform: transformStyle }"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      >
        <div 
          v-for="(entry, index) in activity" 
          :key="entry.url"
          class="w-full flex-shrink-0 p-4 border border-white/5 bg-black/30 rounded-2xl mx-1"
          :class="{ 'opacity-50': index !== activeIndex }"
        >
          <p class="text-xs uppercase tracking-[0.3em] text-white/40 mb-2">
            {{ dateFormatter.format(new Date(entry.updatedAt)) }}
          </p>
          <p class="text-base font-semibold text-primary mb-2 leading-tight">
            {{ entry.title }}
          </p>
          <div class="flex items-center justify-between">
            <p class="text-sm text-white/60">{{ entry.repository }}</p>
            <span 
              class="px-2 py-1 rounded-full border text-xs font-medium"
              :class="getStateColor(entry.state)"
            >
              {{ entry.state }}
            </span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Pagination Dots -->
    <div v-if="totalCards > 1" class="flex justify-center gap-2 mt-4">
      <button
        v-for="(_, index) in activity"
        :key="index"
        class="w-2 h-2 rounded-full transition-all duration-200"
        :class="index === activeIndex ? 'bg-primary' : 'bg-white/20'"
        @click="goToCard(index)"
      />
    </div>
    
    <!-- Card Counter -->
    <div class="text-center mt-2 text-xs text-white/40">
      {{ activeIndex + 1 }} / {{ totalCards }}
    </div>
  </div>

  <!-- Desktop: Original Grid Layout -->
  <div class="hidden sm:grid gap-3 text-sm font-mono text-white/70">
    <div
      v-for="entry in activity"
      :key="entry.url"
      class="rounded-2xl border border-white/5 bg-black/30 px-4 py-3"
    >
      <p class="text-xs uppercase tracking-[0.3em] text-white/40">
        {{ dateFormatter.format(new Date(entry.updatedAt)) }}
      </p>
      <p class="text-base font-semibold text-primary">{{ entry.title }}</p>
      <p class="text-sm text-white/60">{{ entry.repository }} · {{ entry.state }}</p>
    </div>
  </div>
</template>

<style scoped>
.touch-pan-y {
  touch-action: pan-y;
}
</style>