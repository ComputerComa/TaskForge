<script setup lang="ts">
import { MIN_PASSWORD_LENGTH } from '~~/shared/schemas/setup.schema'

definePageMeta({ layout: 'blank' })
useHead({ title: 'Set up TaskForge' })

const { fetch: refreshSession } = useUserSession()
const { register: registerPasskey } = useWebAuthn()

// The high-level pill row only tracks the coarse stage -- the 2FA choice
// branches into one of two sub-flows (totp/webauthn), which both fold
// back into the same "twofactor" pill rather than each getting their own.
const stageOrder = ['account', 'twofactor', 'done'] as const
type Stage = (typeof stageOrder)[number]
const stageLabels: Record<Stage, string> = { account: 'Account', twofactor: 'Two-factor', done: 'Done' }

const subStepOrder = ['choice', 'totp', 'webauthn', 'recovery-codes'] as const
type SubStep = (typeof subStepOrder)[number]

const step = ref<'account' | SubStep | 'done'>('account')
const stage = computed<Stage>(() => {
  if (step.value === 'account') return 'account'
  if (step.value === 'done') return 'done'
  return 'twofactor'
})

// -- Step: account --------------------------------------------------

const username = ref('')
const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const submitting = ref(false)
const error = ref('')

const canSubmitAccount = computed(
  () =>
    username.value.trim().length > 0 &&
    name.value.trim().length > 0 &&
    email.value.trim().length > 0 &&
    password.value.length >= MIN_PASSWORD_LENGTH &&
    password.value === confirmPassword.value,
)

async function submitAccount() {
  if (!canSubmitAccount.value) return
  error.value = ''
  submitting.value = true
  try {
    await $fetch('/api/auth/setup', {
      method: 'POST',
      body: {
        username: username.value.trim(),
        name: name.value.trim(),
        email: email.value.trim(),
        password: password.value,
        confirmPassword: confirmPassword.value,
      },
    })
    step.value = 'choice'
  } catch (err: any) {
    error.value = err?.data?.statusMessage ?? err?.data?.message ?? 'Could not create the account'
  } finally {
    submitting.value = false
  }
}

// -- Step: twofactor choice ------------------------------------------

function skipTwoFactor() {
  step.value = 'done'
}

// -- Step: totp --------------------------------------------------------

const totpQrDataUrl = ref('')
const totpSecret = ref('')
const totpCode = ref('')

async function startTotpEnrollment() {
  error.value = ''
  step.value = 'totp'
  submitting.value = true
  try {
    const result = await $fetch<{ secret: string; qrDataUrl: string }>('/api/auth/totp/enroll', { method: 'POST' })
    totpQrDataUrl.value = result.qrDataUrl
    totpSecret.value = result.secret
  } catch (err: any) {
    error.value = err?.data?.statusMessage ?? err?.data?.message ?? 'Could not start authenticator setup'
  } finally {
    submitting.value = false
  }
}

async function confirmTotp() {
  if (!/^\d{6}$/.test(totpCode.value.trim())) return
  error.value = ''
  submitting.value = true
  try {
    await $fetch('/api/auth/totp/confirm', { method: 'POST', body: { code: totpCode.value.trim() } })
    await issueRecoveryCodes()
  } catch (err: any) {
    error.value = err?.data?.statusMessage ?? err?.data?.message ?? 'Incorrect code'
  } finally {
    submitting.value = false
  }
}

// -- Step: webauthn ----------------------------------------------------

async function enrollPasskey() {
  error.value = ''
  submitting.value = true
  try {
    const verified = await registerPasskey({ userName: username.value.trim(), displayName: name.value.trim(), credentialName: 'Passkey' })
    if (!verified) {
      error.value = 'Could not verify the passkey -- try again.'
      return
    }
    await issueRecoveryCodes()
  } catch (err: any) {
    error.value = err?.data?.statusMessage ?? err?.message ?? 'Could not set up the passkey'
  } finally {
    submitting.value = false
  }
}

// -- Step: recovery codes ----------------------------------------------

const recoveryCodes = ref<string[]>([])

async function issueRecoveryCodes() {
  const result = await $fetch<{ recoveryCodes: string[] }>('/api/auth/recovery-codes/regenerate', { method: 'POST' })
  recoveryCodes.value = result.recoveryCodes
  step.value = 'recovery-codes'
}

async function copyRecoveryCodes() {
  await navigator.clipboard.writeText(recoveryCodes.value.join('\n'))
}

// -- Step: done ----------------------------------------------------------

async function finish() {
  await refreshSession()
  await navigateTo('/')
}
</script>

<template>
  <div class="setup-card">
    <h1>Welcome to TaskForge</h1>

    <div class="flex flex-wrap gap-1.5">
      <UBadge
        v-for="key in stageOrder"
        :key="key"
        :label="stageLabels[key]"
        size="sm"
        :variant="stage === key ? 'solid' : 'subtle'"
        :color="stage === key ? 'primary' : 'neutral'"
      />
    </div>

    <div v-if="step === 'account'" class="flex flex-col gap-3">
      <p class="text-sm text-muted">Set up the one account this app supports.</p>
      <UFormField label="Username">
        <UInput v-model="username" autocomplete="username" autofocus class="w-full" />
      </UFormField>
      <UFormField label="Name">
        <UInput v-model="name" autocomplete="name" class="w-full" />
      </UFormField>
      <UFormField label="Email">
        <UInput v-model="email" type="email" autocomplete="email" class="w-full" />
      </UFormField>
      <UFormField label="Password" :description="`At least ${MIN_PASSWORD_LENGTH} characters.`">
        <UInput v-model="password" type="password" autocomplete="new-password" class="w-full" />
      </UFormField>
      <UFormField label="Confirm password">
        <UInput
          v-model="confirmPassword"
          type="password"
          autocomplete="new-password"
          class="w-full"
          @keyup.enter="submitAccount"
        />
      </UFormField>
      <p v-if="error" class="text-sm text-error">{{ error }}</p>
      <UButton
        :label="submitting ? 'Creating account...' : 'Continue'"
        :loading="submitting"
        :disabled="!canSubmitAccount"
        block
        @click="submitAccount"
      />
    </div>

    <div v-else-if="step === 'choice'" class="flex flex-col gap-3">
      <p class="text-sm text-muted">
        Optionally add two-factor authentication -- you can also set this up later from Settings.
      </p>
      <UButton label="Set up an authenticator app" icon="i-lucide-shield-check" block @click="startTotpEnrollment" />
      <UButton
        label="Set up a passkey"
        icon="i-lucide-fingerprint"
        color="neutral"
        variant="outline"
        block
        @click="enrollPasskey"
      />
      <UButton label="Skip for now" color="neutral" variant="ghost" block @click="skipTwoFactor" />
      <p v-if="error" class="text-sm text-error">{{ error }}</p>
    </div>

    <div v-else-if="step === 'totp'" class="flex flex-col gap-3">
      <p class="text-sm text-muted">Scan this with an authenticator app (1Password, Google Authenticator, etc.):</p>
      <img v-if="totpQrDataUrl" :src="totpQrDataUrl" alt="TOTP QR code" class="mx-auto" width="200" height="200" />
      <p class="text-xs text-muted">Can't scan it? Enter this code manually:</p>
      <code class="secret-value">{{ totpSecret }}</code>
      <UFormField label="6-digit code">
        <UInput v-model="totpCode" inputmode="numeric" autofocus class="w-full" @keyup.enter="confirmTotp" />
      </UFormField>
      <p v-if="error" class="text-sm text-error">{{ error }}</p>
      <div class="flex justify-between gap-2">
        <UButton label="Back" color="neutral" variant="ghost" @click="step = 'choice'" />
        <UButton
          :label="submitting ? 'Confirming...' : 'Confirm'"
          :loading="submitting"
          :disabled="!/^\d{6}$/.test(totpCode.trim())"
          @click="confirmTotp"
        />
      </div>
    </div>

    <div v-else-if="step === 'webauthn'" class="flex flex-col gap-3">
      <p class="text-sm text-muted">Your browser will prompt you to create a passkey.</p>
      <p v-if="error" class="text-sm text-error">{{ error }}</p>
      <div class="flex justify-between gap-2">
        <UButton label="Back" color="neutral" variant="ghost" @click="step = 'choice'" />
        <UButton :label="submitting ? 'Waiting...' : 'Try again'" :loading="submitting" @click="enrollPasskey" />
      </div>
    </div>

    <div v-else-if="step === 'recovery-codes'" class="flex flex-col gap-3">
      <p class="text-sm text-muted">
        Save these recovery codes somewhere safe -- each one can be used once to sign in if you lose access to your
        authenticator or passkey. They won't be shown again.
      </p>
      <div class="flex items-start gap-2">
        <pre class="recovery-codes">{{ recoveryCodes.join('\n') }}</pre>
        <UButton icon="i-lucide-copy" size="xs" square variant="outline" title="Copy" @click="copyRecoveryCodes" />
      </div>
      <UButton label="I've saved these" block @click="step = 'done'" />
    </div>

    <div v-else-if="step === 'done'" class="flex flex-col gap-3">
      <p class="text-sm text-muted">You're all set.</p>
      <UButton label="Go to dashboard" block @click="finish" />
    </div>
  </div>
</template>

<style scoped>
.setup-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 24rem;
  max-width: calc(100vw - 2rem);
  padding: 1.5rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface);
}

h1 {
  margin: 0;
  font-size: 1.1rem;
}

.secret-value,
.recovery-codes {
  padding: 0.5rem 0.6rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--bg);
  font-size: 0.8rem;
  word-break: break-all;
}

.recovery-codes {
  flex: 1;
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.6;
}
</style>
