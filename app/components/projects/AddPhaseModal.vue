<script setup lang="ts">
import { projectTreeKey } from '~/composables/useProjectTree'

const open = defineModel<boolean>('open', { required: true })

const treeApi = inject(projectTreeKey)!

const name = ref('')
const submitting = ref(false)

function close() {
  open.value = false
}

async function submit() {
  const trimmed = name.value.trim()
  if (!trimmed) return
  submitting.value = true
  try {
    await treeApi.createPhase({ name: trimmed })
    name.value = ''
    open.value = false
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Add phase">
    <template #body>
      <UFormField label="Name">
        <UInput v-model="name" class="w-full" placeholder="New phase name" autofocus @keyup.enter="submit" />
      </UFormField>
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-between">
        <UButton label="Cancel" color="neutral" variant="ghost" @click="close" />
        <UButton label="Add phase" :loading="submitting" :disabled="!name.trim()" @click="submit" />
      </div>
    </template>
  </UModal>
</template>
