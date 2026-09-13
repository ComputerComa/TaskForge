<script setup lang="ts">
import CreateApiTokenModal from '~/components/settings/CreateApiTokenModal.vue'
import TotpEnrollModal from '~/components/settings/TotpEnrollModal.vue'
import WebauthnEnrollModal from '~/components/settings/WebauthnEnrollModal.vue'
import type { ApiTokenSummary } from '~~/shared/types/entities'

useHead({ title: 'Settings' })

const { user } = useUserSession()

// useRequestFetch forwards the incoming request's cookies during SSR --
// see the comment in useProjectTree.ts for why this matters.
const requestFetch = useRequestFetch()
const { data: tokens, refresh: refreshTokens } = useAsyncData<ApiTokenSummary[]>('api-tokens', () =>
  requestFetch('/api/tokens'),
)

async function revoke(token: ApiTokenSummary) {
  if (!confirm(`Revoke "${token.name}"? Any MCP client using it will stop working immediately.`)) return
  await $fetch(`/api/tokens/${token.id}`, { method: 'DELETE' })
  await refreshTokens()
}

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}

// -- Profile -----------------------------------------------------------

interface Profile { name: string; email: string }
const { data: profile, refresh: refreshProfile } = useAsyncData<Profile>('profile', () => requestFetch('/api/auth/profile'))
const profileName = ref('')
const profileEmail = ref('')
const profileSubmitting = ref(false)
const profileSaved = ref(false)

watch(
  profile,
  value => {
    if (!value) return
    profileName.value = value.name
    profileEmail.value = value.email
  },
  { immediate: true },
)

async function saveProfile() {
  profileSubmitting.value = true
  profileSaved.value = false
  try {
    await $fetch('/api/auth/profile', {
      method: 'PATCH',
      body: { name: profileName.value.trim(), email: profileEmail.value.trim() },
    })
    await refreshProfile()
    profileSaved.value = true
  } finally {
    profileSubmitting.value = false
  }
}

// -- Two-factor authentication ------------------------------------------

interface TwoFactorStatus { totpEnabled: boolean; webauthnCredentialCount: number; hasRecoveryCodes: boolean }
interface WebauthnCredentialSummary { id: number; name: string; backedUp: boolean; createdAt: string; lastUsedAt: string | null }

const { data: twoFactorStatus, refresh: refreshTwoFactorStatus } = useAsyncData<TwoFactorStatus>('2fa-status', () =>
  requestFetch('/api/auth/2fa-status'),
)
const { data: passkeys, refresh: refreshPasskeys } = useAsyncData<WebauthnCredentialSummary[]>('webauthn-credentials', () =>
  requestFetch('/api/webauthn'),
)

const disablingTotp = ref(false)
const disableTotpPassword = ref('')
const disableTotpSubmitting = ref(false)
const disableTotpError = ref('')

async function confirmDisableTotp() {
  disableTotpSubmitting.value = true
  disableTotpError.value = ''
  try {
    await $fetch('/api/auth/totp/disable', { method: 'POST', body: { password: disableTotpPassword.value } })
    disablingTotp.value = false
    disableTotpPassword.value = ''
    await refreshTwoFactorStatus()
  } catch (err: any) {
    disableTotpError.value = err?.data?.statusMessage ?? 'Incorrect password'
  } finally {
    disableTotpSubmitting.value = false
  }
}

async function removePasskey(credential: WebauthnCredentialSummary) {
  if (!confirm(`Remove passkey "${credential.name}"?`)) return
  await $fetch(`/api/webauthn/${credential.id}`, { method: 'DELETE' })
  await Promise.all([refreshPasskeys(), refreshTwoFactorStatus()])
}

const regeneratingCodes = ref(false)
async function regenerateRecoveryCodes() {
  regeneratingCodes.value = true
  try {
    const result = await $fetch<{ recoveryCodes: string[] }>('/api/auth/recovery-codes/regenerate', { method: 'POST' })
    alert(`New recovery codes (save these now, they won't be shown again):\n\n${result.recoveryCodes.join('\n')}`)
    await refreshTwoFactorStatus()
  } finally {
    regeneratingCodes.value = false
  }
}

function onEnabledOrEnrolled() {
  refreshTwoFactorStatus()
  refreshPasskeys()
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <h1 class="text-xl font-semibold text-default">Settings</h1>

    <section class="flex flex-col gap-3">
      <h2 class="text-base font-semibold text-default">Profile</h2>
      <div class="flex max-w-sm flex-col gap-3">
        <UFormField label="Name">
          <UInput v-model="profileName" class="w-full" @input="profileSaved = false" />
        </UFormField>
        <UFormField label="Email">
          <UInput v-model="profileEmail" type="email" class="w-full" @input="profileSaved = false" />
        </UFormField>
        <div class="flex items-center gap-2">
          <UButton
            label="Save"
            size="sm"
            :loading="profileSubmitting"
            :disabled="!profileName.trim() || !profileEmail.trim()"
            @click="saveProfile"
          />
          <span v-if="profileSaved" class="text-xs text-success">Saved</span>
        </div>
      </div>
    </section>

    <section class="flex flex-col gap-3">
      <h2 class="text-base font-semibold text-default">Two-factor authentication</h2>

      <div class="factor-row">
        <div>
          <p class="font-medium text-default">Authenticator app</p>
          <p class="text-xs text-muted">{{ twoFactorStatus?.totpEnabled ? 'Enabled' : 'Not set up' }}</p>
        </div>
        <TotpEnrollModal v-if="!twoFactorStatus?.totpEnabled" @enabled="onEnabledOrEnrolled" />
        <template v-else>
          <UButton
            v-if="!disablingTotp"
            label="Disable"
            color="error"
            variant="ghost"
            size="xs"
            @click="disablingTotp = true"
          />
          <div v-else class="flex flex-wrap items-center gap-2">
            <UInput v-model="disableTotpPassword" type="password" placeholder="Current password" size="xs" @keyup.enter="confirmDisableTotp" />
            <UButton label="Confirm" color="error" size="xs" :loading="disableTotpSubmitting" @click="confirmDisableTotp" />
            <UButton label="Cancel" variant="ghost" size="xs" @click="disablingTotp = false; disableTotpPassword = ''" />
            <span v-if="disableTotpError" class="text-xs text-error">{{ disableTotpError }}</span>
          </div>
        </template>
      </div>

      <div class="flex flex-col gap-2">
        <p class="font-medium text-default">Passkeys</p>
        <div v-for="credential in passkeys" :key="credential.id" class="factor-row">
          <div>
            <p class="text-default">{{ credential.name }}</p>
            <p class="text-xs text-muted">
              added {{ formatDate(credential.createdAt) }}{{ credential.lastUsedAt ? `, last used ${formatDate(credential.lastUsedAt)}` : '' }}
            </p>
          </div>
          <UButton label="Remove" color="error" variant="ghost" size="xs" @click="removePasskey(credential)" />
        </div>
        <WebauthnEnrollModal
          v-if="user"
          :username="user.username"
          :has-recovery-codes="twoFactorStatus?.hasRecoveryCodes ?? false"
          @enrolled="onEnabledOrEnrolled"
        />
      </div>

      <UButton
        v-if="twoFactorStatus?.totpEnabled || (passkeys?.length ?? 0) > 0"
        label="Regenerate recovery codes"
        color="neutral"
        variant="outline"
        size="xs"
        class="self-start"
        :loading="regeneratingCodes"
        @click="regenerateRecoveryCodes"
      />
    </section>

    <section class="flex flex-col gap-3">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 class="text-base font-semibold text-default">MCP access tokens</h2>
          <p class="max-w-prose text-sm text-muted">
            Bearer tokens for connecting Claude or ChatGPT to TaskForge's MCP endpoint
            (<code>/mcp</code>) over the internet. The web app itself keeps using your login
            session -- these are separate, revocable credentials for MCP clients only.
          </p>
        </div>
        <CreateApiTokenModal @created="refreshTokens" />
      </div>

      <p v-if="!tokens?.length" class="text-sm text-muted">No tokens yet.</p>
      <div v-else class="flex flex-col gap-2">
        <div v-for="token in tokens" :key="token.id" class="token-row">
          <div class="flex-1">
            <p class="font-medium text-default">{{ token.name }}</p>
            <p class="text-xs text-muted">
              {{ token.tokenPrefix }}&hellip; &middot; created {{ formatDate(token.createdAt) }} &middot;
              {{ token.lastUsedAt ? `last used ${formatDate(token.lastUsedAt)}` : 'never used' }}
            </p>
          </div>
          <UButton label="Revoke" color="error" variant="ghost" size="xs" @click="revoke(token)" />
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.token-row,
.factor-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface);
}
</style>
