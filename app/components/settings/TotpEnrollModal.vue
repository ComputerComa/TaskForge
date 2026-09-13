<script setup lang="ts">
const emit = defineEmits<{ enabled: [] }>()

const open = ref(false)
const step = ref<'scan' | 'recovery-codes'>('scan')
const qrDataUrl = ref('')
const secret = ref('')
const code = ref('')
const recoveryCodes = ref<string[]>([])
const submitting = ref(false)
const error = ref('')

async function launch() {
  step.value = 'scan'
  code.value = ''
  error.value = ''
  open.value = true
  submitting.value = true
  try {
    const result = await $fetch<{ secret: string; qrDataUrl: string }>('/api/auth/totp/enroll', { method: 'POST' })
    qrDataUrl.value = result.qrDataUrl
    secret.value = result.secret
  } catch (err: any) {
    error.value = err?.data?.statusMessage ?? err?.data?.message ?? 'Could not start authenticator setup'
  } finally {
    submitting.value = false
  }
}

function close() {
  open.value = false
}

async function confirm() {
  if (!/^\d{6}$/.test(code.value.trim())) return
  error.value = ''
  submitting.value = true
  try {
    await $fetch('/api/auth/totp/confirm', { method: 'POST', body: { code: code.value.trim() } })
    const result = await $fetch<{ recoveryCodes: string[] }>('/api/auth/recovery-codes/regenerate', { method: 'POST' })
    recoveryCodes.value = result.recoveryCodes
    step.value = 'recovery-codes'
    emit('enabled')
  } catch (err: any) {
    error.value = err?.data?.statusMessage ?? err?.data?.message ?? 'Incorrect code'
  } finally {
    submitting.value = false
  }
}

async function copyRecoveryCodes() {
  await navigator.clipboard.writeText(recoveryCodes.value.join('\n'))
}
</script>

<template>
  <UButton label="Set up authenticator app" icon="i-lucide-shield-check" color="neutral" variant="outline" @click="launch" />

  <UModal v-model:open="open" :title="step === 'scan' ? 'Set up authenticator app' : 'Recovery codes'">
    <template #body>
      <div v-if="step === 'scan'" class="flex flex-col gap-3">
        <p class="text-sm text-muted">Scan this with an authenticator app (1Password, Google Authenticator, etc.):</p>
        <img v-if="qrDataUrl" :src="qrDataUrl" alt="TOTP QR code" class="mx-auto" width="200" height="200" />
        <p class="text-xs text-muted">Can't scan it? Enter this code manually:</p>
        <code class="secret-value">{{ secret }}</code>
        <UFormField label="6-digit code">
          <UInput v-model="code" inputmode="numeric" autofocus class="w-full" @keyup.enter="confirm" />
        </UFormField>
        <p v-if="error" class="text-sm text-error">{{ error }}</p>
      </div>
      <div v-else class="flex flex-col gap-3">
        <p class="text-sm text-muted">
          Save these somewhere safe -- each can be used once to sign in if you lose access to your authenticator.
          They won't be shown again.
        </p>
        <div class="flex items-start gap-2">
          <pre class="recovery-codes">{{ recoveryCodes.join('\n') }}</pre>
          <UButton icon="i-lucide-copy" size="xs" square variant="outline" title="Copy" @click="copyRecoveryCodes" />
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-end gap-2">
        <template v-if="step === 'scan'">
          <UButton label="Cancel" color="neutral" variant="ghost" @click="close" />
          <UButton
            label="Confirm"
            :loading="submitting"
            :disabled="!/^\d{6}$/.test(code.trim())"
            @click="confirm"
          />
        </template>
        <UButton v-else label="Done" @click="close" />
      </div>
    </template>
  </UModal>
</template>

<style scoped>
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
