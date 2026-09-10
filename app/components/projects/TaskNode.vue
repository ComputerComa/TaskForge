<script setup lang="ts">
import { projectTreeKey } from '~/composables/useProjectTree'
import { isTaskVisible, projectUiKey } from '~/composables/useProjectDetailUi'
import BlockedBadge from './BlockedBadge.vue'
import InlineTextField from './InlineTextField.vue'
import type { TaskNode } from '~~/shared/types/entities'

const { task, isCurrent, canMoveUp, canMoveDown } = defineProps<{
  task: TaskNode
  // The first not-done task in its phase -- the one you'd actually work
  // on next, per the "on task X of Y" sequential-checklist model.
  isCurrent: boolean
  canMoveUp: boolean
  canMoveDown: boolean
}>()
defineEmits<{ 'move-up': []; 'move-down': [] }>()

const treeApi = inject(projectTreeKey)!
const uiApi = inject(projectUiKey)!

const visible = computed(() => isTaskVisible(task, uiApi.filters))

// "Implementation details" (description/command/notes/link) stay
// collapsed by default to keep the checklist scannable -- unless the
// task already has some, in which case hiding them would bury existing
// notes. Once toggled, the user's choice sticks even if the fields are
// later cleared back to empty.
const hasDetails = Boolean(task.description || task.command || task.notes || task.link)
const detailsOpen = ref(hasDetails)

function save(field: 'title' | 'description' | 'command' | 'notes' | 'link', value: string) {
  treeApi.updateTask(task.id, { [field]: value })
}

function toggleDone() {
  treeApi.updateTask(task.id, { status: task.status === 'done' ? 'pending' : 'done' })
}

function remove() {
  treeApi.deleteTask(task.id)
}
</script>

<template>
  <div v-show="visible" :id="`task-${task.id}`" class="task" :class="{ done: task.status === 'done', current: isCurrent }">
    <div class="row">
      <input type="checkbox" :checked="task.status === 'done'" @change="toggleDone" />
      <InlineTextField class="title" :model-value="task.title" @save="value => save('title', value)" />
      <span v-if="isCurrent" class="badge current">up next</span>
      <BlockedBadge :blockers="task.blockers" />
      <div class="spacer" />
      <button type="button" class="text-button" :title="detailsOpen ? 'Hide details' : 'Show details'" @click="detailsOpen = !detailsOpen">
        {{ detailsOpen ? 'details -' : 'details +' }}
      </button>
      <div class="reorder">
        <button type="button" :disabled="!canMoveUp" title="Move up" @click="$emit('move-up')">^</button>
        <button type="button" :disabled="!canMoveDown" title="Move down" @click="$emit('move-down')">v</button>
      </div>
      <button type="button" class="danger" @click="remove">Delete</button>
    </div>

    <div v-if="detailsOpen" class="details">
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
  </div>
</template>

<style scoped>
.task {
  padding: 0.35rem 0.5rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--bg);
}

.task.current {
  border-color: var(--accent);
}

.task.done {
  opacity: 0.6;
}

.task.done .title {
  text-decoration: line-through;
}

.row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.spacer {
  flex: 1;
}

.title {
  flex: 1;
  min-width: 6rem;
}

.badge {
  font-size: 0.7rem;
  padding: 0.05rem 0.4rem;
  border-radius: 999px;
  white-space: nowrap;
}

.badge.current {
  background: color-mix(in srgb, var(--accent) 15%, transparent);
  color: var(--accent);
}

.text-button {
  border: none;
  background: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.7rem;
  padding: 0.1rem 0.2rem;
  white-space: nowrap;
}

.text-button:hover {
  color: var(--text);
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
  color: var(--text-muted);
}

.reorder button:hover:not(:disabled) {
  color: var(--text);
}

.reorder button:disabled {
  opacity: 0.3;
  cursor: default;
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

.details {
  margin-top: 0.3rem;
  margin-left: 1.6rem;
  padding-left: 0.6rem;
  border-left: 2px solid var(--border);
}

.description {
  display: block;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.fields {
  margin-top: 0.3rem;
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
