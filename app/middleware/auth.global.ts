export default defineNuxtRouteMiddleware(async to => {
  const { loggedIn, fetch, ready } = useUserSession()

  if (!ready.value) {
    await fetch()
  }

  if (!loggedIn.value && to.path !== '/login') {
    return navigateTo('/login')
  }

  if (loggedIn.value && to.path === '/login') {
    return navigateTo('/')
  }
})
