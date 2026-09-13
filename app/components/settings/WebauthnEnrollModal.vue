<script setup lang="ts">
const { username, hasRecoveryCodes } = defineProps<{ username: string; hasRecoveryCodes: boolean }>()
const emit = defineEmits<{ enrolled: [] }>()

const { register: registerPasskey } = useWebAuthn()

const open = ref(false)
const step = ref<'name' | 'recovery-codes'>('name')
const name = ref('')
const recoveryCodes = ref<string[]>([])
const submitting = ref(false)
const error = ref('')

function launch() {
  step.value = 'name'
  name.value = ''
  error.value = ''
  open.value = true
}

function close() {
  open.value = false
}

async function submit() {
  const label = name.value.trim()
  if (!label) return
  error.value = ''
  submitting.value = true
  try {
    const verified = await registerPasskey({ userName: username, credentialName: label })
    if (!verified) {
      error.value = 'Could not verify the passkey -- try again.'
      return
    }
    emit('enrolled')
    if (!hasRecoveryCodes) {
      const result = await $fetch<{ recoveryCodes: string[] }>('/api/auth/recovery-codes/regenerate', { method: 'POST' })
      recoveryCodes.value = result.recoveryCodes
      step.value = 'recovery-codes'
    } else {
      close()
    }
  } catch (err: any) {
    error.value = err?.data?.statusMessage ?? err?.message ?? 'Could not set up the passkey'
  } finally {
    submitting.value = false
  }
}

async function copyRecoveryCodes() {
  await navigator.clipboard.writeText(recoveryCodes.value.join('\n'))
}
</script>

<template>
  <UButton label="Add a passkey" icon="i-lucide-fingerprint" color="neutral" variant="outline" @click="launch" />

  <UModal v-model:open="open" :title="step === 'name' ? 'Add a passkey' : 'Recovery codes'">
    <template #body>
      <div v-if="step === 'name'" class="flex flex-col gap-3">
        <UFormField label="Name" description="A label to tell this passkey apart later, e.g. &quot;MacBook Touch ID&quot;.">
          <UInput v-model="name" placeholder="MacBook Touch ID" autofocus class="w-full" @keyup.enter="submit" />
        </UFormField>
        <p class="text-sm text-muted">Your browser will prompt you to create the passkey after confirming.</p>
        <p v-if="error" class="text-sm text-error">{{ error }}</p>
      </div>
      <div v-else class="flex flex-col gap-3">
        <p class="text-sm text-muted">
          Save these somewhere safe -- each can be used once to sign in if you lose access to your passkey. They
          won't be shown again.
        </p>
        <div class="flex items-start gap-2">
          <pre class="recovery-codes">{{ recoveryCodes.join('\n') }}</pre>
          <UButton icon="i-lucide-copy" size="xs" square variant="outline" title="Copy" @click="copyRecoveryCodes" />
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-end gap-2">
        <template v-if="step === 'name'">
          <UButton label="Cancel" color="neutral" variant="ghost" @click="close" />
          <UButton label="Continue" :loading="submitting" :disabled="!name.trim()" @click="submit" />
        </template>
        <UButton v-else label="Done" @click="close" />
      </div>
    </template>
  </UModal>
</template>

<style scoped>
.recovery-codes {
  flex: 1;
  margin: 0;
  padding: 0.5rem 0.6rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--bg);
  font-size: 0.8rem;
  white-space: pre-wrap;
  line-height: 1.6;
}
</style>
