<script setup lang="ts">
import { phaseStatuses } from '~~/shared/schemas/phase.schema'
import { projectTreeKey } from '~/composables/useProjectTree'
import InlineTextField from './InlineTextField.vue'
import StatusSelect from './StatusSelect.vue'
import TaskNode from './TaskNode.vue'
import type { PhaseNode as PhaseNodeType } from '~~/shared/types/entities'

const { phase, canMoveUp, canMoveDown } = defineProps<{
  phase: PhaseNodeType
  canMoveUp: boolean
  canMoveDown: boolean
}>()
defineEmits<{ 'move-up': []; 'move-down': [] }>()

const treeApi = inject(projectTreeKey)!

const newTaskTitle = ref('')
const newTaskReference = ref('')

function save(field: 'name' | 'description', value: string) {
  treeApi.updatePhase(phase.id, { [field]: value })
}

function saveStatus(value: string) {
  treeApi.updatePhase(phase.id, { status: value as PhaseNodeType['status'] })
}

function remove() {
  if (phase.tasks.length > 0 && !confirm(`Delete phase "${phase.name}" and its ${phase.tasks.length} task(s)?`)) return
  treeApi.deletePhase(phase.id)
}

async function addTask() {
  const title = newTaskTitle.value.trim()
  const reference = newTaskReference.value.trim()
  if (!title || !reference) return
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  newTaskTitle.value = ''
  newTaskReference.value = ''
  await treeApi.createTask({ phaseId: phase.id, title, reference, slug })
}

function moveTask(index: number, direction: -1 | 1) {
  const target = phase.tasks[index + direction]
  const current = phase.tasks[index]
  if (!target || !current) return
  treeApi.swapPositions('task', current, target)
}
</script>

<template>
  <section class="phase">
    <div class="phase-header">
      <div class="reorder">
        <button type="button" :disabled="!canMoveUp" title="Move up" @click="$emit('move-up')">^</button>
        <button type="button" :disabled="!canMoveDown" title="Move down" @click="$emit('move-down')">v</button>
      </div>
      <InlineTextField class="name" :model-value="phase.name" @save="value => save('name', value)" />
      <StatusSelect :model-value="phase.status" :options="phaseStatuses" @update:model-value="saveStatus" />
      <span class="task-count">{{ phase.tasks.length }} task{{ phase.tasks.length === 1 ? '' : 's' }}</span>
      <button type="button" class="danger" @click="remove">Delete</button>
    </div>
    <InlineTextField
      class="description"
      multiline
      placeholder="Add a description..."
      :model-value="phase.description"
      @save="value => save('description', value)"
    />

    <div class="tasks">
      <TaskNode
        v-for="(task, index) in phase.tasks"
        :key="task.id"
        :task="task"
        :can-move-up="index > 0"
        :can-move-down="index < phase.tasks.length - 1"
        @move-up="moveTask(index, -1)"
        @move-down="moveTask(index, 1)"
      />

      <form class="add-task" @submit.prevent="addTask">
        <input v-model="newTaskReference" placeholder="Reference (NAS-001)" class="reference" />
        <input v-model="newTaskTitle" placeholder="New task title" class="title" />
        <button type="submit">Add task</button>
      </form>
    </div>
  </section>
</template>

<style scoped>
.phase {
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.75rem;
  background: var(--surface);
}

.phase-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.reorder {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.reorder button {
  line-height: 1;
  padding: 0 0.25rem;
  border: 1px solid var(--border);
  background: var(--bg);
  cursor: pointer;
  font-size: 0.7rem;
}

.reorder button:disabled {
  opacity: 0.3;
  cursor: default;
}

.name {
  font-weight: 600;
}

.task-count {
  color: var(--text-muted);
  font-size: 0.75rem;
}

.description {
  display: block;
  margin-top: 0.35rem;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.danger {
  margin-left: auto;
  border: 1px solid var(--danger);
  color: var(--danger);
  background: none;
  border-radius: 4px;
  padding: 0.2rem 0.5rem;
  cursor: pointer;
  font-size: 0.75rem;
}

.tasks {
  margin-top: 0.6rem;
  padding-left: 1rem;
  border-left: 2px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.add-task {
  display: flex;
  gap: 0.4rem;
}

.add-task .reference {
  width: 8rem;
  font-family: ui-monospace, monospace;
}

.add-task .title {
  flex: 1;
}

.add-task input {
  padding: 0.3rem 0.45rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--bg);
}

.add-task button {
  padding: 0.3rem 0.6rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--surface);
  cursor: pointer;
}
</style>
