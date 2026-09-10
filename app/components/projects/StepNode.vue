<script setup lang="ts">
import { projectTreeKey } from '~/composables/useProjectTree'
import InlineTextField from './InlineTextField.vue'
import type { StepNode } from '~~/shared/types/entities'

const { step } = defineProps<{
  step: StepNode
  canMoveUp: boolean
  canMoveDown: boolean
}>()
defineEmits<{ 'move-up': []; 'move-down': [] }>()

const treeApi = inject(projectTreeKey)!

function save(field: 'title' | 'description' | 'command' | 'notes' | 'link', value: string) {
  treeApi.updateStep(step.id, { [field]: value })
}

function toggleDone() {
  treeApi.updateStep(step.id, { status: step.status === 'done' ? 'pending' : 'done' })
}

function remove() {
  treeApi.deleteStep(step.id)
}
</script>

<template>
  <div class="step" :class="{ done: step.status === 'done' }">
    <div class="row">
      <div class="reorder">
        <button type="button" :disabled="!canMoveUp" title="Move up" @click="$emit('move-up')">^</button>
        <button type="button" :disabled="!canMoveDown" title="Move down" @click="$emit('move-down')">v</button>
      </div>
      <input type="checkbox" :checked="step.status === 'done'" @change="toggleDone" />
      <InlineTextField class="title" :model-value="step.title" @save="value => save('title', value)" />
      <button type="button" class="danger" @click="remove">Delete</button>
    </div>
    <div class="fields">
      <label>Command<InlineTextField placeholder="(none)" :model-value="step.command ?? ''" @save="value => save('command', value)" /></label>
      <label>Notes<InlineTextField multiline placeholder="(none)" :model-value="step.notes ?? ''" @save="value => save('notes', value)" /></label>
      <label>Link<InlineTextField placeholder="(none)" :model-value="step.link ?? ''" @save="value => save('link', value)" /></label>
    </div>
  </div>
</template>

<style scoped>
.step {
  padding: 0.4rem 0.5rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--bg);
}

.step.done {
  opacity: 0.65;
}

.step.done .title {
  text-decoration: line-through;
}

.row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.reorder {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
}

.reorder button {
  line-height: 1;
  padding: 0 0.2rem;
  border: 1px solid var(--border);
  background: var(--surface);
  cursor: pointer;
  font-size: 0.65rem;
}

.reorder button:disabled {
  opacity: 0.3;
  cursor: default;
}

.title {
  flex: 1;
}

.danger {
  border: none;
  background: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.75rem;
}

.danger:hover {
  color: var(--danger);
}

.fields {
  margin-top: 0.3rem;
  margin-left: 2.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.fields label {
  display: flex;
  gap: 0.4rem;
  align-items: baseline;
}
</style>
