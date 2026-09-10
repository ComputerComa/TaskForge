<script setup lang="ts">
definePageMeta({ layout: 'blank' })

const { fetch: refreshSession } = useUserSession()

const username = ref('')
const password = ref('')
const error = ref('')
const submitting = ref(false)

async function submit() {
  error.value = ''
  submitting.value = true
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { username: username.value, password: password.value },
    })
    await refreshSession()
    await navigateTo('/')
  } catch {
    error.value = 'Invalid username or password'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form class="login-card" @submit.prevent="submit">
    <h1>TaskForge</h1>
    <UFormField label="Username">
      <UInput v-model="username" type="text" autocomplete="username" required autofocus class="w-full" />
    </UFormField>
    <UFormField label="Password">
      <UInput v-model="password" type="password" autocomplete="current-password" required class="w-full" />
    </UFormField>
    <p v-if="error" class="error">{{ error }}</p>
    <UButton type="submit" block :loading="submitting" :label="submitting ? 'Signing in...' : 'Sign in'" />
  </form>
</template>

<style scoped>
.login-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 20rem;
  padding: 1.5rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface);
}

h1 {
  margin: 0 0 0.25rem;
  font-size: 1.1rem;
}

.error {
  margin: 0;
  color: var(--danger);
  font-size: 0.85rem;
}
</style>
