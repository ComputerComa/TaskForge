<script setup lang="ts">
import { phaseStatuses } from '~~/shared/schemas/phase.schema'
import { projectTreeKey } from '~/composables/useProjectTree'
import { isPhaseVisible, projectUiKey } from '~/composables/useProjectDetailUi'
import BlockedBadge from './BlockedBadge.vue'
import InlineTextField from './InlineTextField.vue'
import StatusSelect from './StatusSelect.vue'
import TaskNode from './TaskNode.vue'
import type { PhaseNode as PhaseNodeType } from '~~/shared/types/entities'

const { phase, isCurrentPhase, canMoveUp, canMoveDown } = defineProps<{
  phase: PhaseNodeType
  // Whether this is the project's current phase (the first, in order,
  // that isn't done) -- only it can have an "up next" task; every later
  // phase is waiting on it regardless of its own tasks' statuses.
  isCurrentPhase: boolean
  canMoveUp: boolean
  canMoveDown: boolean
}>()
defineEmits<{ 'move-up': []; 'move-down': [] }>()

const treeApi = inject(projectTreeKey)!
const uiApi = inject(projectUiKey)!

const newTaskTitle = ref('')

// Tasks block sequentially by position: the "current" one is the first
// that isn't done yet -- everything after it is implicitly waiting. But
// that only applies within the project's current phase; a later phase's
// first task isn't "next" until every phase before it is done.
const firstPendingIndex = computed(() =>
  isCurrentPhase ? phase.tasks.findIndex(task => task.status !== 'done') : -1,
)
const doneCount = computed(() => phase.tasks.filter(task => task.status === 'done').length)

const visible = computed(() => isPhaseVisible(phase, uiApi.filters))
const collapsed = computed(() => uiApi.isPhaseCollapsed(phase))

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
  if (!title) return
  newTaskTitle.value = ''
  await treeApi.createTask({ phaseId: phase.id, title })
}

function moveTask(index: number, direction: -1 | 1) {
  const target = phase.tasks[index + direction]
  const current = phase.tasks[index]
  if (!target || !current) return
  treeApi.swapPositions('task', current, target)
}
</script>

<template>
  <section v-show="visible" :id="`phase-${phase.id}`" class="phase">
    <div class="phase-header">
      <UButton
        :icon="collapsed ? 'i-lucide-chevron-right' : 'i-lucide-chevron-down'"
        :title="collapsed ? 'Expand' : 'Collapse'"
        color="neutral"
        variant="ghost"
        size="xs"
        square
        @click="uiApi.togglePhaseCollapsed(phase)"
      />
      <InlineTextField class="name" :model-value="phase.name" @save="value => save('name', value)" />
      <StatusSelect :model-value="phase.status" :options="phaseStatuses" @update:model-value="saveStatus" />
      <span class="task-count">{{ doneCount }}/{{ phase.tasks.length }} done</span>
      <BlockedBadge :blockers="phase.blockers" />
      <div class="spacer" />
      <div class="reorder">
        <UButton icon="i-lucide-chevron-up" title="Move up" color="neutral" variant="ghost" size="xs" square :disabled="!canMoveUp" @click="$emit('move-up')" />
        <UButton icon="i-lucide-chevron-down" title="Move down" color="neutral" variant="ghost" size="xs" square :disabled="!canMoveDown" @click="$emit('move-down')" />
      </div>
      <UButton icon="i-lucide-trash-2" label="Delete" color="error" variant="ghost" size="xs" @click="remove" />
    </div>

    <template v-if="!collapsed">
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
          :is-current="index === firstPendingIndex"
          :can-move-up="index > 0"
          :can-move-down="index < phase.tasks.length - 1"
          @move-up="moveTask(index, -1)"
          @move-down="moveTask(index, 1)"
        />

        <form class="add-task" @submit.prevent="addTask">
          <UInput v-model="newTaskTitle" placeholder="New task" class="title" size="sm" />
          <UButton type="submit" label="Add task" color="neutral" variant="outline" size="sm" />
        </form>
      </div>
    </template>
  </section>
</template>

<style scoped>
.phase {
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.6rem 0.75rem;
  background: var(--surface);
}

.phase-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.spacer {
  flex: 1;
}

.reorder {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.name {
  font-weight: 600;
}

.task-count {
  color: var(--text-muted);
  font-size: 0.75rem;
  white-space: nowrap;
}

.description {
  display: block;
  margin-top: 0.35rem;
  margin-left: 1.4rem;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.tasks {
  margin-top: 0.6rem;
  margin-left: 1.4rem;
  padding-left: 1rem;
  border-left: 2px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.add-task {
  display: flex;
  gap: 0.4rem;
}

.add-task .title {
  flex: 1;
}

@media (max-width: 640px) {
  .phase-header {
    gap: 0.4rem;
  }

  .spacer {
    flex-basis: 100%;
    height: 0;
  }
}
</style>
