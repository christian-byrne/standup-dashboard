<script setup lang="ts">
import { computed } from 'vue';
import type { TimelinePulse } from '../composables/useStandupData';

const props = defineProps<{
  pulses: TimelinePulse[];
  domain: { start: number; end: number } | null;
}>();

const hasDomain = computed(
  () => props.domain !== null && props.domain.end > (props.domain?.start ?? 0)
);

const span = computed(() => {
  if (!hasDomain.value || !props.domain) {
    return 1;
  }
  const diff = props.domain.end - props.domain.start;
  return diff === 0 ? 1 : diff;
});

const pulsesWithPosition = computed(() => {
  if (!hasDomain.value || !props.domain) {
    return [] as Array<TimelinePulse & { left: number; lane: number }>;
  }

  return props.pulses.map((pulse, index) => {
    const left = ((pulse.timestamp - props.domain!.start) / span.value) * 100;
    return {
      ...pulse,
      left: Number.isFinite(left) ? Math.min(100, Math.max(0, left)) : 0,
      lane: index % 4,
    };
  });
});

const startLabel = computed(() => {
  if (!hasDomain.value || !props.domain) return null;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(props.domain.start));
});

const endLabel = computed(() => {
  if (!hasDomain.value || !props.domain) return null;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(props.domain.end));
});

const stateColor = (state: TimelinePulse['state']) => {
  switch (state) {
    case 'merged':
      return 'bg-primary/80 border-primary/60 shadow-[0_0_12px_rgba(75,188,255,0.6)]';
    case 'open':
      return 'bg-emerald-400/80 border-emerald-300/60 shadow-[0_0_12px_rgba(16,185,129,0.5)]';
    case 'closed':
    default:
      return 'bg-rose-400/80 border-rose-300/60 shadow-[0_0_12px_rgba(244,114,182,0.4)]';
  }
};

const openUrl = (url: string) => {
  window.open(url, '_blank');
};
</script>

<template>
  <div class="relative h-24 sm:h-40 w-full overflow-hidden rounded-3xl border border-white/10 bg-black/30">
    <!-- Holographic background layers -->
    <div
      class="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(75,188,255,0.15),transparent_70%)]"
    />
    <div
      class="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.1),transparent_60%)]"
    />
    
    <!-- Animated grid pattern -->
    <div
      class="absolute inset-0 bg-[linear-gradient(90deg,rgba(75,188,255,0.03)_1px,transparent_1px),linear-gradient(0deg,rgba(75,188,255,0.03)_1px,transparent_1px)] bg-[size:20px_10px] sm:bg-[size:40px_20px] opacity-60 animate-pulse"
    />
    
    <!-- Scanning line animation -->
    <div
      class="absolute inset-y-0 w-0.5 bg-gradient-to-b from-transparent via-primary/50 to-transparent animate-[scan_4s_ease-in-out_infinite]"
      style="animation: scan 4s ease-in-out infinite;"
    />

    <div
      v-if="!hasDomain || !pulsesWithPosition.length"
      class="relative flex h-full items-center justify-center text-sm text-white/60"
    >
      <slot name="empty">
        <span class="animate-pulse">No pulses tracked yet...</span>
      </slot>
    </div>
    <div v-else class="relative h-full w-full">
      <!-- Timeline connecting lines -->
      <svg class="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <linearGradient id="timelineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:rgba(75,188,255,0.1);stop-opacity:1" />
            <stop offset="50%" style="stop-color:rgba(75,188,255,0.3);stop-opacity:1" />
            <stop offset="100%" style="stop-color:rgba(75,188,255,0.1);stop-opacity:1" />
          </linearGradient>
        </defs>
        <line 
          v-for="(pulse, index) in pulsesWithPosition.slice(0, -1)" 
          :key="`line-${pulse.id}`"
          :x1="`${pulse.left}%`" 
          :y1="`${22 + pulse.lane * 18}%`"
          :x2="`${pulsesWithPosition[index + 1]?.left}%`" 
          :y2="`${22 + (pulsesWithPosition[index + 1]?.lane ?? 0) * 18}%`"
          stroke="url(#timelineGradient)" 
          stroke-width="1" 
          class="animate-pulse"
        />
      </svg>
      
      <div
        class="absolute inset-x-0 bottom-1 sm:bottom-3 flex justify-between px-2 sm:px-4 text-[8px] sm:text-[10px] uppercase tracking-[0.3em] text-white/40"
      >
        <span class="flex items-center gap-1">
          <span class="w-1 h-1 bg-primary/60 rounded-full animate-pulse"></span>
          {{ startLabel }}
        </span>
        <span class="flex items-center gap-1">
          {{ endLabel }}
          <span class="w-1 h-1 bg-primary/60 rounded-full animate-pulse"></span>
        </span>
      </div>
      
      <!-- Enhanced pulse nodes -->
      <div class="absolute inset-0">
        <button
          v-for="(pulse, index) in pulsesWithPosition"
          :key="pulse.id"
          class="absolute flex items-center justify-center rounded-full border backdrop-blur cursor-pointer transition-all hover:scale-125 focus:outline-none focus:ring-2 focus:ring-primary/50 group"
          :class="[
            stateColor(pulse.state),
            'h-5 w-5 sm:h-7 sm:w-7 -translate-x-1/2 -translate-y-1/2'
          ]"
          :style="{ 
            left: `${pulse.left}%`, 
            top: `${22 + pulse.lane * 18}%`,
            animationDelay: `${index * 0.1}s`
          }"
          :title="`${pulse.repository} - ${pulse.state}`"
          @click="() => openUrl(pulse.url)"
        >
          <!-- Outer glow ring -->
          <span 
            class="absolute inset-0 rounded-full animate-ping opacity-30"
            :class="stateColor(pulse.state)"
          ></span>
          
          <!-- Inner core -->
          <span class="relative h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-white shadow-lg group-hover:bg-primary transition-colors" />
          
          <!-- Holographic overlay -->
          <span class="absolute inset-0 rounded-full bg-gradient-to-t from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes scan {
  0%, 100% { left: 0%; opacity: 0; }
  50% { left: 100%; opacity: 1; }
}
</style>
