<script setup lang="ts">
import { ref, onMounted } from 'vue'

const dots = ref(['', '', ''])
const currentStep = ref(0)

const loadingSteps = [
  'Loading dashboard...',
  'Scanning development activity...',
  'Processing AI insights...',
  'Preparing dashboard...'
]

function animateDots() {
  const interval = setInterval(() => {
    dots.value = dots.value.map((_, index) => 
      index <= (Date.now() / 300) % 3 ? '●' : '○'
    )
  }, 300)
  
  return () => clearInterval(interval)
}

function animateSteps() {
  const interval = setInterval(() => {
    currentStep.value = (currentStep.value + 1) % loadingSteps.length
  }, 1500)
  
  return () => clearInterval(interval)
}

onMounted(() => {
  const cleanupDots = animateDots()
  const cleanupSteps = animateSteps()
  
  return () => {
    cleanupDots()
    cleanupSteps()
  }
})
</script>

<template>
  <div class="glass-panel rounded-3xl p-6 sm:p-8 text-center space-y-6">
    <!-- Mobile: Compact Loading -->
    <div class="sm:hidden space-y-4">
      <div class="relative">
        <!-- Pulsing center circle -->
        <div class="w-16 h-16 mx-auto rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center relative">
          <div class="w-8 h-8 rounded-full bg-primary animate-pulse" />
          
          <!-- Orbiting dots -->
          <div class="absolute inset-0 animate-spin">
            <div class="absolute top-0 left-1/2 w-2 h-2 bg-primary rounded-full transform -translate-x-1/2 -translate-y-1" />
          </div>
          <div class="absolute inset-0 animate-spin" style="animation-delay: -0.5s">
            <div class="absolute bottom-0 left-1/2 w-2 h-2 bg-emerald-400 rounded-full transform -translate-x-1/2 translate-y-1" />
          </div>
        </div>
      </div>
      
      <div>
        <div class="text-lg font-semibold text-primary mb-2">
          {{ loadingSteps[currentStep] }}
        </div>
        <div class="flex justify-center gap-1 text-white/40">
          <span v-for="dot in dots" :key="Math.random()" class="text-lg">{{ dot }}</span>
        </div>
      </div>
    </div>

    <!-- Desktop: Original Loading -->
    <div class="hidden sm:block">
      <div class="relative w-20 h-20 mx-auto mb-6">
        <!-- Main spinner -->
        <div class="absolute inset-0 border-4 border-primary/20 rounded-full" />
        <div class="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        
        <!-- Inner pulse -->
        <div class="absolute inset-4 bg-primary/30 rounded-full animate-pulse" />
      </div>
      
      <div class="space-y-2">
        <div class="text-xl font-semibold text-primary">
          {{ loadingSteps[currentStep] }}
        </div>
        <div class="flex justify-center gap-1 text-white/40">
          <span v-for="dot in dots" :key="Math.random()" class="text-xl">{{ dot }}</span>
        </div>
      </div>
    </div>
    
    <!-- Progress indicator -->
    <div class="w-full bg-white/10 rounded-full h-1 overflow-hidden">
      <div 
        class="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all duration-500"
        :style="{ width: `${((currentStep + 1) / loadingSteps.length) * 100}%` }"
      />
    </div>
  </div>
</template>