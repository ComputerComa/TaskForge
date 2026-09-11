// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  app: {
    head: {
      title: 'TaskForge',
      // Pages set a short title via useHead({ title: ... }); this suffixes
      // it so the tab always reads "<page> · TaskForge" instead of every
      // page showing the bare app name (or the browser falling back to the
      // URL when no title is set at all).
      titleTemplate: '%s · TaskForge',
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        // Fallback for browsers that don't support SVG favicons.
        { rel: 'shortcut icon', href: '/favicon.ico' },
      ],
    },
  },

  modules: ['nuxt-auth-utils', '@vueuse/nuxt', '@nuxt/ui'],

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    // DATABASE_URL is consumed server-side by Prisma via process.env.
  },
})
