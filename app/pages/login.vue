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
    <label>
      Username
      <input v-model="username" type="text" autocomplete="username" required autofocus />
    </label>
    <label>
      Password
      <input v-model="password" type="password" autocomplete="current-password" required />
    </label>
    <p v-if="error" class="error">{{ error }}</p>
    <button type="submit" :disabled="submitting">{{ submitting ? 'Signing in…' : 'Sign in' }}</button>
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

label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.85rem;
  color: var(--text-muted);
}

input {
  padding: 0.4rem 0.5rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--bg);
}

button {
  margin-top: 0.25rem;
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  background: var(--accent);
  color: white;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: default;
}

.error {
  margin: 0;
  color: var(--danger);
  font-size: 0.85rem;
}
</style>
