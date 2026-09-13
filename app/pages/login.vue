<script setup lang="ts">
definePageMeta({ layout: 'blank' })

useHead({ title: 'Log in' })

const { fetch: refreshSession } = useUserSession()
const { authenticate: authenticateWithPasskey, isSupported: passkeysSupported } = useWebAuthn()

const step = ref<'password' | 'twofactor'>('password')

const username = ref('')
const password = ref('')
const code = ref('')
const error = ref('')
const submitting = ref(false)

async function finishLogin() {
  await refreshSession()
  await navigateTo('/')
}

async function submitPassword() {
  error.value = ''
  submitting.value = true
  try {
    const result = await $fetch('/api/auth/login', {
      method: 'POST',
      body: { username: username.value, password: password.value },
    })
    if (result.twoFactorRequired) {
      step.value = 'twofactor'
      return
    }
    await finishLogin()
  } catch {
    error.value = 'Invalid username or password'
  } finally {
    submitting.value = false
  }
}

async function submitCode() {
  error.value = ''
  submitting.value = true
  try {
    await $fetch('/api/auth/totp/verify', { method: 'POST', body: { code: code.value.trim() } })
    await finishLogin()
  } catch (err: any) {
    error.value = err?.data?.statusMessage ?? err?.data?.message ?? 'Incorrect code'
  } finally {
    submitting.value = false
  }
}

// Shown on both steps -- a passkey is a complete login on its own, not
// an additional factor on top of a password, so it doesn't need the
// account to have gotten past the password step first.
async function loginWithPasskey() {
  error.value = ''
  submitting.value = true
  try {
    const verified = await authenticateWithPasskey()
    if (!verified) {
      error.value = 'Could not verify the passkey'
      return
    }
    await finishLogin()
  } catch (err: any) {
    error.value = err?.data?.statusMessage ?? err?.message ?? 'Could not sign in with that passkey'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form v-if="step === 'password'" class="login-card" @submit.prevent="submitPassword">
    <h1>TaskForge</h1>
    <UFormField label="Username">
      <UInput v-model="username" type="text" autocomplete="username" required autofocus class="w-full" />
    </UFormField>
    <UFormField label="Password">
      <UInput v-model="password" type="password" autocomplete="current-password" required class="w-full" />
    </UFormField>
    <p v-if="error" class="error">{{ error }}</p>
    <UButton type="submit" block :loading="submitting" :label="submitting ? 'Signing in...' : 'Sign in'" />
    <UButton
      v-if="passkeysSupported"
      color="neutral"
      variant="outline"
      block
      label="Use a passkey instead"
      @click="loginWithPasskey"
    />
  </form>

  <div v-else class="login-card">
    <h1>Two-factor authentication</h1>
    <p class="text-sm text-muted">Enter the code from your authenticator app, or a recovery code.</p>
    <UFormField label="Code">
      <UInput v-model="code" autofocus class="w-full" @keyup.enter="submitCode" />
    </UFormField>
    <p v-if="error" class="error">{{ error }}</p>
    <UButton block :loading="submitting" :disabled="!code.trim()" :label="submitting ? 'Verifying...' : 'Verify'" @click="submitCode" />
    <UButton
      v-if="passkeysSupported"
      color="neutral"
      variant="outline"
      block
      label="Use a passkey instead"
      @click="loginWithPasskey"
    />
  </div>
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
