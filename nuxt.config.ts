// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // Vite's dev server (which `nuxt dev` wraps) binds to localhost only by
  // default, unreachable from outside the host it runs on -- fine when
  // only the browser on that machine talked to it, but not now that
  // remote MCP clients (and/or a reverse proxy in front of them) need a
  // path in. `npm run preview` and a production build aren't affected by
  // this setting -- Nitro's own server already binds all interfaces
  // there unless HOST is explicitly set to something narrower.
  devServer: { host: '0.0.0.0' },

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
