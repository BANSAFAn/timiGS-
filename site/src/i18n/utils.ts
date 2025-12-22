import { TRANSLATIONS } from './translations';
import { Language } from './types.ts';

export function getLangFromUrl(url: URL): Language {
  const [, lang] = url.pathname.split('/');
  if (lang && Object.values(Language).includes(lang as Language)) {
    return lang as Language;
  }
  return Language.EN;
}

export function useTranslations(lang: Language) {
  return TRANSLATIONS[lang] || TRANSLATIONS[Language.EN];
}

export function getRouteFromUrl(url: URL): string {
    const [, lang, ...rest] = url.pathname.split('/');
    if (lang && Object.values(Language).includes(lang as Language)) {
        return '/' + rest.join('/');
    }
    return url.pathname;
}
