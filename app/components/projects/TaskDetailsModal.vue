<script setup lang="ts">
import { projectTreeKey } from '~/composables/useProjectTree'
import InlineTextField from './InlineTextField.vue'
import type { TaskNode } from '~~/shared/types/entities'

const open = defineModel<boolean>('open', { required: true })
const { task } = defineProps<{ task: TaskNode }>()

const treeApi = inject(projectTreeKey)!

function save(field: 'description' | 'command' | 'notes' | 'link', value: string) {
  treeApi.updateTask(task.id, { [field]: value })
}

function close() {
  open.value = false
}
</script>

<template>
  <UModal v-model:open="open" :title="task.title">
    <template #body>
      <div class="flex flex-col gap-3">
        <InlineTextField
          class="description"
          multiline
          placeholder="Add a description..."
          :model-value="task.description"
          @save="value => save('description', value)"
        />
        <div class="fields">
          <label>Command<InlineTextField placeholder="(none)" :model-value="task.command ?? ''" @save="value => save('command', value)" /></label>
          <label>Notes<InlineTextField multiline placeholder="(none)" :model-value="task.notes ?? ''" @save="value => save('notes', value)" /></label>
          <label>Link<InlineTextField placeholder="(none)" :model-value="task.link ?? ''" @save="value => save('link', value)" /></label>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end">
        <UButton label="Close" color="neutral" variant="ghost" @click="close" />
      </div>
    </template>
  </UModal>
</template>

<style scoped>
.description {
  display: block;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.fields {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.fields label {
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
}
</style>
