import { createI18n } from 'vue-i18n';
import en from './locales/en.json';
import uk from './locales/uk.json';

// Get saved language or default to English
const savedLang = localStorage.getItem('timigs-language') || 'en';

export const i18n = createI18n({
  legacy: false,
  locale: savedLang,
  fallbackLocale: 'en',
  messages: {
    en,
    uk
  }
});

export function setLanguage(lang: string) {
  i18n.global.locale.value = lang as 'en' | 'uk';
  localStorage.setItem('timigs-language', lang);
}

export function getCurrentLanguage() {
  return i18n.global.locale.value;
}
