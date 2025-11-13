import { createI18n } from 'vue-i18n';
import en from '../locales/en.json';
import es from '../locales/es.json';
import ja from '../locales/ja.json';

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en,
    es,
    ja,
  },
});

export default i18n;
