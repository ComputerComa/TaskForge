<script setup lang="ts">
const emit = defineEmits<{ created: [] }>()

const open = ref(false)
const name = ref('')
const submitting = ref(false)
// The raw token, held only in memory for the life of this modal -- it's
// never retrievable again once the modal closes (see server/api/tokens/index.post.ts).
const createdToken = ref('')

function launch() {
  name.value = ''
  createdToken.value = ''
  open.value = true
}

function close() {
  open.value = false
}

async function submit() {
  const trimmed = name.value.trim()
  if (!trimmed) return
  submitting.value = true
  try {
    const result = await $fetch<{ token: string }>('/api/tokens', {
      method: 'POST',
      body: { name: trimmed },
    })
    createdToken.value = result.token
    emit('created')
  } finally {
    submitting.value = false
  }
}

async function copyToken() {
  await navigator.clipboard.writeText(createdToken.value)
}
</script>

<template>
  <UButton label="New token" icon="i-lucide-plus" @click="launch" />

  <UModal v-model:open="open" :title="createdToken ? 'Token created' : 'New MCP access token'">
    <template #body>
      <div v-if="!createdToken" class="flex flex-col gap-3">
        <UFormField label="Name" description="A label to tell this token apart later, e.g. &quot;Claude&quot; or &quot;ChatGPT&quot;.">
          <UInput v-model="name" class="w-full" placeholder="Claude" autofocus @keyup.enter="submit" />
        </UFormField>
      </div>
      <div v-else class="flex flex-col gap-3">
        <p class="text-sm text-muted">
          Copy this token now -- it won't be shown again. Paste it as a bearer token
          (<code>Authorization: Bearer &lt;token&gt;</code>) when adding TaskForge as a connector.
        </p>
        <div class="flex items-center gap-2">
          <code class="token-value">{{ createdToken }}</code>
          <UButton icon="i-lucide-copy" size="xs" square variant="outline" title="Copy" @click="copyToken" />
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-end gap-2">
        <template v-if="!createdToken">
          <UButton label="Cancel" color="neutral" variant="ghost" @click="close" />
          <UButton label="Create" :loading="submitting" :disabled="!name.trim()" @click="submit" />
        </template>
        <UButton v-else label="Done" @click="close" />
      </div>
    </template>
  </UModal>
</template>

<style scoped>
.token-value {
  flex: 1;
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--bg);
  font-size: 0.8rem;
  word-break: break-all;
}
</style>
