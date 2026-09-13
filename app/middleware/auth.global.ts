export default defineNuxtRouteMiddleware(async to => {
  const { loggedIn, fetch, ready } = useUserSession()

  if (!ready.value) {
    await fetch()
  }

  if (loggedIn.value) {
    // Already signed in -- neither the setup wizard nor the login page
    // has anything left to offer.
    if (to.path === '/login' || to.path === '/setup') {
      return navigateTo('/')
    }
    return
  }

  // Logged out: figure out whether an account exists yet at all. Cached
  // in a useState so repeated client-side navigations in the same page
  // load don't re-check on every route -- a logged-in session, once
  // reached, never needs this again (see the early return above).
  const setupRequired = useState<boolean | null>('setup-required', () => null)
  if (setupRequired.value === null) {
    const status = await $fetch('/api/auth/status')
    setupRequired.value = status.setupRequired
  }

  if (setupRequired.value && to.path !== '/setup') {
    return navigateTo('/setup')
  }
  if (!setupRequired.value && to.path === '/setup') {
    // Setup already completed -- don't let anyone linger on that page.
    return navigateTo('/login')
  }
  if (!setupRequired.value && to.path !== '/login') {
    return navigateTo('/login')
  }
})
