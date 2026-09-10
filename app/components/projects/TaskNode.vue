<script setup lang="ts">
import { taskStatuses } from '~~/shared/schemas/task.schema'
import { projectTreeKey } from '~/composables/useProjectTree'
import InlineTextField from './InlineTextField.vue'
import StatusSelect from './StatusSelect.vue'
import StepNode from './StepNode.vue'
import TaskDependencyPicker from './TaskDependencyPicker.vue'
import type { TaskNode as TaskNodeType } from '~~/shared/types/entities'

const { task, canMoveUp, canMoveDown } = defineProps<{
  task: TaskNodeType
  canMoveUp: boolean
  canMoveDown: boolean
}>()
defineEmits<{ 'move-up': []; 'move-down': [] }>()

const treeApi = inject(projectTreeKey)!

const newStepTitle = ref('')

const isBlocked = computed(() => {
  const byId = new Map(treeApi.allTasks.value.map(t => [t.id, t]))
  return task.dependencies.some(dep => byId.get(dep.dependsOnTaskId)?.status !== 'done')
})

function save(field: 'title' | 'description' | 'reference' | 'slug', value: string) {
  // Empty input silently no-ops rather than sending a value the schema
  // will reject -- these fields are all required (non-empty) once set.
  if (!value) return
  treeApi.updateTask(task.id, { [field]: value })
}

function saveAssignee(value: string) {
  // Unlike the fields above, assignee is genuinely optional: an empty
  // input here means "unassign", sent as an explicit null (undefined
  // would just omit the key and leave the previous assignee in place).
  treeApi.updateTask(task.id, { assignee: value.trim() ? value.trim().toLowerCase() : null })
}

function saveStatus(value: string) {
  treeApi.updateTask(task.id, { status: value as TaskNodeType['status'] })
}

function remove() {
  if (task.steps.length > 0 && !confirm(`Delete task "${task.title}" and its ${task.steps.length} step(s)?`)) return
  treeApi.deleteTask(task.id)
}

async function addStep() {
  const title = newStepTitle.value.trim()
  if (!title) return
  newStepTitle.value = ''
  await treeApi.createStep({ taskId: task.id, title })
}

function moveStep(index: number, direction: -1 | 1) {
  const target = task.steps[index + direction]
  const current = task.steps[index]
  if (!target || !current) return
  treeApi.swapPositions('step', current, target)
}
</script>

<template>
  <div class="task">
    <div class="task-header">
      <div class="reorder">
        <button type="button" :disabled="!canMoveUp" title="Move up" @click="$emit('move-up')">^</button>
        <button type="button" :disabled="!canMoveDown" title="Move down" @click="$emit('move-down')">v</button>
      </div>
      <InlineTextField class="reference" :model-value="task.reference" @save="value => save('reference', value)" />
      <InlineTextField class="title" :model-value="task.title" @save="value => save('title', value)" />
      <span v-if="isBlocked" class="badge blocked">blocked</span>
      <StatusSelect :model-value="task.status" :options="taskStatuses" @update:model-value="saveStatus" />
      <span class="assignee">
        <InlineTextField placeholder="unassigned" :model-value="task.assignee ?? ''" @save="saveAssignee" />
      </span>
      <button type="button" class="danger" @click="remove">Delete</button>
    </div>
    <InlineTextField
      class="description"
      multiline
      placeholder="Add a description..."
      :model-value="task.description"
      @save="value => save('description', value)"
    />

    <TaskDependencyPicker :task="task" />

    <div class="steps">
      <StepNode
        v-for="(step, index) in task.steps"
        :key="step.id"
        :step="step"
        :can-move-up="index > 0"
        :can-move-down="index < task.steps.length - 1"
        @move-up="moveStep(index, -1)"
        @move-down="moveStep(index, 1)"
      />

      <form class="add-step" @submit.prevent="addStep">
        <input v-model="newStepTitle" placeholder="New step" />
        <button type="submit">Add step</button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.task {
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 0.6rem;
  background: var(--surface);
}

.task-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
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
  background: var(--bg);
  cursor: pointer;
  font-size: 0.65rem;
}

.reorder button:disabled {
  opacity: 0.3;
  cursor: default;
}

.reference {
  font-family: ui-monospace, monospace;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.title {
  font-weight: 500;
}

.badge {
  font-size: 0.7rem;
  padding: 0.05rem 0.4rem;
  border-radius: 999px;
}

.badge.blocked {
  background: color-mix(in srgb, var(--danger) 15%, transparent);
  color: var(--danger);
}

.assignee {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-left: auto;
}

.description {
  display: block;
  margin-top: 0.3rem;
  font-size: 0.8rem;
  color: var(--text-muted);
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

.steps {
  margin-top: 0.5rem;
  padding-left: 0.9rem;
  border-left: 2px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.add-step {
  display: flex;
  gap: 0.4rem;
}

.add-step input {
  flex: 1;
  padding: 0.25rem 0.4rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--bg);
  font-size: 0.85rem;
}

.add-step button {
  padding: 0.25rem 0.55rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--surface);
  cursor: pointer;
  font-size: 0.85rem;
}
</style>
