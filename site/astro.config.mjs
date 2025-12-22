import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  integrations: [react(), tailwind()],
  i18n: {
    defaultLocale: "en",
    locales: ["en", "uk", "de", "fr", "zh-CN", "zh-TW", "es", "ar", "nl", "be"],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false
    }
  }
});
