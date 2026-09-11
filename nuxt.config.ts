// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['nuxt-auth-utils', '@vueuse/nuxt', '@nuxt/ui'],

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    // DATABASE_URL is consumed server-side by Prisma via process.env.
  },
})
