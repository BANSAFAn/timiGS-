import { Language, type Translation } from './types.ts';

// Import all translation JSON files using import assertions
import enJson from './translations/en.json' with { type: 'json' };
import ukJson from './translations/uk.json' with { type: 'json' };
import deJson from './translations/de.json' with { type: 'json' };
import frJson from './translations/fr.json' with { type: 'json' };
import esJson from './translations/es.json' with { type: 'json' };
import zhCNJson from './translations/zh-CN.json' with { type: 'json' };
import zhTWJson from './translations/zh-TW.json' with { type: 'json' };
import arJson from './translations/ar.json' with { type: 'json' };
import nlJson from './translations/nl.json' with { type: 'json' };
import beJson from './translations/be.json' with { type: 'json' };

// Cast to Translation type
const en = enJson as unknown as Translation;
const uk = ukJson as unknown as Translation;
const de = deJson as unknown as Translation;
const fr = frJson as unknown as Translation;
const es = esJson as unknown as Translation;
const zhCN = zhCNJson as unknown as Translation;
const zhTW = zhTWJson as unknown as Translation;
const ar = arJson as unknown as Translation;
const nl = nlJson as unknown as Translation;
const be = beJson as unknown as Translation;

export const TRANSLATIONS: Record<Language, Translation> = {
  [Language.EN]: en,
  [Language.UK]: uk,
  [Language.DE]: de,
  [Language.FR]: fr,
  [Language.ES]: es,
  [Language.ZH_CN]: zhCN,
  [Language.ZH_TW]: zhTW,
  [Language.AR]: ar,
  [Language.NL]: nl,
  [Language.BE]: be,
};

export function getLangFromUrl(url: URL): Language {
  const [, lang] = url.pathname.split('/');
  if (lang && Object.values(Language).includes(lang as Language)) {
    return lang as Language;
  }
  return Language.EN;
}

export function useTranslations(lang: Language): Translation {
  return TRANSLATIONS[lang] || TRANSLATIONS[Language.EN];
}

export function getRouteFromUrl(url: URL): string {
    const [, lang, ...rest] = url.pathname.split('/');
    if (lang && Object.values(Language).includes(lang as Language)) {
        return '/' + rest.join('/');
    }
    return url.pathname;
}
