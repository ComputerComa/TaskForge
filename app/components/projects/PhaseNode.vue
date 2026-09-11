<script setup lang="ts">
import { projectTreeKey } from '~/composables/useProjectTree'
import { isPhaseVisible, projectUiKey } from '~/composables/useProjectDetailUi'
import BlockedBadge from './BlockedBadge.vue'
import InlineTextField from './InlineTextField.vue'
import TaskNode from './TaskNode.vue'
import type { PhaseDisplayStatus } from '~~/shared/schemas/phase.schema'
import type { PhaseNode as PhaseNodeType } from '~~/shared/types/entities'

const { phase, isCurrentPhase } = defineProps<{
  phase: PhaseNodeType
  // Whether this is the project's current phase (the first, in order,
  // that isn't done) -- only it can have an "up next" task; every later
  // phase is waiting on it regardless of its own tasks' statuses.
  isCurrentPhase: boolean
}>()

const treeApi = inject(projectTreeKey)!
const uiApi = inject(projectUiKey)!

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

// Only the current phase defaults to showing just its "up next" task --
// a manually-expanded past/future phase has no single current task, so
// it always shows everything (see the v-show on TaskNode below).
const taskListExpanded = computed(() => uiApi.isTaskListExpanded(phase))
const showTaskListToggle = computed(() => isCurrentPhase && phase.tasks.length > 1)

// Read-only badge colors for the derived status -- mirrors
// StatusSelect.vue's colorByStatus palette for these same words, kept
// local since this is a badge, not a select.
const displayStatusColor: Record<PhaseDisplayStatus, 'neutral' | 'success'> = {
  pending: 'neutral',
  active: 'neutral',
  done: 'success',
  archived: 'neutral',
}

function save(field: 'name' | 'description', value: string) {
  treeApi.updatePhase(phase.id, { [field]: value })
}

// Only meaningful for a phase with no tasks -- there's nothing to derive
// completion from, so this is the one case that's still a manual toggle.
function toggleDone() {
  treeApi.updatePhase(phase.id, { status: phase.status === 'done' ? 'active' : 'done' })
}

// Archiving always counts as complete for sequencing (see
// isPhaseComplete), even with unfinished tasks -- it's an explicit "skip
// this phase" action, available regardless of task count.
function toggleArchived() {
  treeApi.updatePhase(phase.id, { status: phase.status === 'archived' ? 'active' : 'archived' })
}

function remove() {
  if (phase.tasks.length > 0 && !confirm(`Delete phase "${phase.name}" and its ${phase.tasks.length} task(s)?`)) return
  treeApi.deletePhase(phase.id)
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
      <UBadge
        :label="phase.displayStatus"
        :color="displayStatusColor[phase.displayStatus]"
        variant="subtle"
        size="sm"
        class="capitalize"
      />
      <UCheckbox
        v-if="phase.tasks.length === 0 && phase.status !== 'archived'"
        :model-value="phase.status === 'done'"
        title="Mark phase done"
        @update:model-value="toggleDone"
      />
      <UButton
        :icon="phase.status === 'archived' ? 'i-lucide-archive-restore' : 'i-lucide-archive'"
        :title="phase.status === 'archived' ? 'Unarchive phase' : 'Archive phase'"
        color="neutral"
        variant="ghost"
        size="xs"
        square
        @click="toggleArchived"
      />
      <span class="task-count">{{ doneCount }}/{{ phase.tasks.length }} done</span>
      <BlockedBadge :blockers="phase.blockers" />
      <div class="spacer" />
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
          v-show="!isCurrentPhase || taskListExpanded || index === firstPendingIndex"
          :key="task.id"
          :task="task"
          :is-current="index === firstPendingIndex"
        />

        <UButton
          v-if="showTaskListToggle"
          :icon="taskListExpanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
          :label="taskListExpanded ? 'Show only current task' : `Show all ${phase.tasks.length} tasks`"
          color="neutral"
          variant="link"
          size="xs"
          class="show-all"
          @click="uiApi.toggleTaskListExpanded(phase)"
        />
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

.show-all {
  align-self: flex-start;
  padding: 0;
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
