<script setup lang="ts">
import { projectStatuses } from '~~/shared/schemas/project.schema'
import { projectTreeKey } from '~/composables/useProjectTree'
import InlineTextField from './InlineTextField.vue'
import StatusSelect from './StatusSelect.vue'
import type { ProjectTree } from '~~/shared/types/entities'

const { project } = defineProps<{ project: ProjectTree }>()
const treeApi = inject(projectTreeKey)!

function save(field: 'identifier' | 'name' | 'description', value: string) {
  treeApi.updateProject({ [field]: value })
}

function saveStatus(value: string) {
  treeApi.updateProject({ status: value as ProjectTree['status'] })
}
</script>

<template>
  <header class="header">
    <div class="title-row">
      <InlineTextField
        class="identifier"
        :model-value="project.identifier"
        @save="value => save('identifier', value)"
      />
      <InlineTextField
        class="name"
        :model-value="project.name"
        @save="value => save('name', value)"
      />
      <StatusSelect
        :model-value="project.status"
        :options="projectStatuses"
        @update:model-value="saveStatus"
      />
    </div>
    <InlineTextField
      multiline
      placeholder="Add a description..."
      :model-value="project.description"
      @save="value => save('description', value)"
    />
  </header>
</template>

<style scoped>
.header {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border);
  margin-bottom: 1rem;
}

.title-row {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.identifier {
  font-family: ui-monospace, monospace;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.name {
  font-size: 1.2rem;
  font-weight: 600;
}
</style>
