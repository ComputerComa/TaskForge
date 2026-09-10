// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['nuxt-auth-utils', '@vueuse/nuxt'],

  runtimeConfig: {
    // NUXT_DATABASE_PATH
    databasePath: './server/db/data/taskforge.db',
  },
})
