<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink, RouterView, useRoute } from 'vue-router';

const route = useRoute();
const { t } = useI18n();

const links = [
  { labelKey: 'app.nav.home', to: '/' },
  { labelKey: 'app.nav.standup', to: '/standup' },
  { labelKey: 'app.nav.history', to: '/history' },
  { labelKey: 'app.nav.settings', to: '/settings' },
  { labelKey: 'app.nav.docs', to: '/docs' },
];

const currentPath = computed(() => route.path);
</script>

<template>
  <div class="relative flex min-h-screen flex-col">
    <header class="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-xl">
      <div class="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-5">
        <div class="flex items-center gap-3">
          <span
            class="flex h-10 w-10 items-center justify-center rounded-full border border-primary/40 bg-primary/20 text-sm font-semibold text-primary shadow-glow"
          >
            SD
          </span>
          <div>
            <p class="text-xs uppercase tracking-[0.4em] text-white/50">{{ t('app.title') }}</p>
            <p class="text-sm text-white/60">{{ t('app.tagline') }}</p>
          </div>
        </div>
        <nav class="flex flex-wrap items-center gap-2 text-sm">
          <RouterLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            class="rounded-full border border-transparent px-4 py-2 uppercase tracking-[0.3em] text-white/60 transition hover:border-primary/40 hover:text-primary"
            :class="{
              'border-primary/40 bg-primary/10 text-primary shadow-glow': currentPath === link.to,
            }"
          >
            {{ t(link.labelKey) }}
          </RouterLink>
        </nav>
      </div>
    </header>

    <main class="flex-1 px-4 pb-16 sm:px-8">
      <RouterView />
    </main>

    <footer class="border-t border-white/10 bg-black/60 text-xs text-white/40 backdrop-blur-xl">
      <div class="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-6 py-4">
        <p>{{ t('app.footer.left') }}</p>
        <p>{{ t('app.footer.right') }}</p>
      </div>
    </footer>
  </div>
</template>
