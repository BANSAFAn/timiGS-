import { createI18n } from "vue-i18n";
import en from "./locales/en.json";
import uk from "./locales/uk.json";
import de from "./locales/de.json";
import ar from "./locales/ar.json";
import fr from "./locales/fr.json";
import zh from "./locales/zh.json";
import es from "./locales/es.json";
import pt from "./locales/pt.json";
import pl from "./locales/pl.json";

// Get saved language or default to English
const savedLang = localStorage.getItem("timigs-language") || "en";

export const i18n = createI18n({
  legacy: false,
  locale: savedLang,
  fallbackLocale: "en",
  messages: {
    en,
    uk,
    de,
    ar,
    fr,
    zh,
    es,
    pt,
    pl
  },
});

export function setLanguage(lang: string) {
  i18n.global.locale.value = lang as "en" | "uk" | "de" | "ar" | "fr" | "zh" | "es" | "pt" | "pl";
  localStorage.setItem("timigs-language", lang);
}

export function getCurrentLanguage() {
  return i18n.global.locale.value;
}
