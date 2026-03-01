import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';
import auth from 'auth-astro';

// https://astro.build/config
export default defineConfig({
  site: 'https://timigs.bansafan.com',
  output: 'static',
  adapter: vercel(),
  integrations: [react(), tailwind(), auth()],
  i18n: {
    defaultLocale: "en",
    locales: ["en", "uk", "de", "fr", "zh-CN", "zh-TW", "es", "ar", "nl", "be"],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false
    }
  }
});
