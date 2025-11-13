<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()
const isOpen = ref(false)

const menuItems = [
  { path: '/standup', label: 'Dashboard', icon: '📊' },
  { path: '/history', label: 'History', icon: '📈' },
  { path: '/settings', label: 'Settings', icon: '⚙️' }
]

function toggleMenu() {
  isOpen.value = !isOpen.value
}

function closeMenu() {
  isOpen.value = false
}

function isActive(path: string) {
  return route.path === path || (path === '/standup' && route.path === '/')
}
</script>

<template>
  <!-- Mobile Menu Button -->
  <div class="sm:hidden fixed top-4 right-4 z-50">
    <button 
      @click="toggleMenu"
      class="flex items-center justify-center w-12 h-12 rounded-full bg-black/80 backdrop-blur-sm border border-white/10 text-primary transition-all duration-200 hover:bg-black/90 hover:scale-110 active:scale-95"
      :class="{ 'rotate-45': isOpen }"
    >
      <div class="relative">
        <div 
          class="w-5 h-0.5 bg-current transition-all duration-200"
          :class="isOpen ? 'rotate-45 translate-y-0' : '-translate-y-1.5'"
        />
        <div 
          class="w-5 h-0.5 bg-current transition-all duration-200 mt-1"
          :class="isOpen ? 'opacity-0' : 'opacity-100'"
        />
        <div 
          class="w-5 h-0.5 bg-current transition-all duration-200 mt-1"
          :class="isOpen ? '-rotate-45 -translate-y-2' : 'translate-y-0'"
        />
      </div>
    </button>
  </div>

  <!-- Mobile Menu Overlay -->
  <Transition
    enter-active-class="duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div 
      v-if="isOpen"
      class="sm:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
      @click="closeMenu"
    />
  </Transition>

  <!-- Mobile Menu Panel -->
  <Transition
    enter-active-class="duration-300 ease-out"
    enter-from-class="translate-x-full opacity-0"
    enter-to-class="translate-x-0 opacity-100"
    leave-active-class="duration-200 ease-in"
    leave-from-class="translate-x-0 opacity-100"
    leave-to-class="translate-x-full opacity-0"
  >
    <div 
      v-if="isOpen"
      class="sm:hidden fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-black/90 backdrop-blur-xl border-l border-white/10 z-50 flex flex-col"
    >
      <!-- Menu Header -->
      <div class="p-6 border-b border-white/10">
        <h2 class="text-2xl font-semibold hologram-text text-primary">
          Mission Control
        </h2>
        <p class="text-sm text-white/60 mt-1">Navigation</p>
      </div>

      <!-- Menu Items -->
      <nav class="flex-1 p-6 space-y-2">
        <RouterLink
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          @click="closeMenu"
          class="flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 group"
          :class="isActive(item.path) 
            ? 'bg-primary/10 border border-primary/30 text-primary' 
            : 'text-white/70 hover:bg-white/5 hover:text-white active:scale-95'"
        >
          <span class="text-2xl">{{ item.icon }}</span>
          <div class="flex-1">
            <span class="font-medium">{{ item.label }}</span>
            <div 
              v-if="isActive(item.path)"
              class="w-2 h-2 bg-primary rounded-full mt-1 animate-pulse"
            />
          </div>
          <div 
            v-if="isActive(item.path)"
            class="w-1 h-6 bg-primary rounded-full"
          />
        </RouterLink>
      </nav>

      <!-- Menu Footer -->
      <div class="p-6 border-t border-white/10">
        <div class="flex items-center gap-2 text-xs text-white/40">
          <div class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span class="uppercase tracking-wider">System Online</span>
        </div>
        <div class="mt-2 text-xs text-white/30">
          AI-Powered Dashboard v1.0
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.hologram-text {
  text-shadow: 0 0 10px rgba(75, 188, 255, 0.5);
}
</style>