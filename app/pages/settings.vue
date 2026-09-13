<script setup lang="ts">
import CreateApiTokenModal from '~/components/settings/CreateApiTokenModal.vue'
import type { ApiTokenSummary } from '~~/shared/types/entities'

useHead({ title: 'Settings' })

// useRequestFetch forwards the incoming request's cookies during SSR --
// see the comment in useProjectTree.ts for why this matters.
const requestFetch = useRequestFetch()
const { data: tokens, refresh } = useAsyncData<ApiTokenSummary[]>('api-tokens', () => requestFetch('/api/tokens'))

async function revoke(token: ApiTokenSummary) {
  if (!confirm(`Revoke "${token.name}"? Any MCP client using it will stop working immediately.`)) return
  await $fetch(`/api/tokens/${token.id}`, { method: 'DELETE' })
  await refresh()
}

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <h1 class="text-xl font-semibold text-default">Settings</h1>

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
        <CreateApiTokenModal @created="refresh" />
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
.token-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface);
}
</style>
