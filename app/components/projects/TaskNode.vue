<script setup lang="ts">
import { projectTreeKey } from '~/composables/useProjectTree'
import { isTaskVisible, projectUiKey } from '~/composables/useProjectDetailUi'
import BlockedBadge from './BlockedBadge.vue'
import InlineTextField from './InlineTextField.vue'
import TaskDetailsModal from './TaskDetailsModal.vue'
import type { TaskNode } from '~~/shared/types/entities'

const { task, isCurrent } = defineProps<{
  task: TaskNode
  // The first not-done task in its phase -- the one you'd actually work
  // on next, per the "on task X of Y" sequential-checklist model.
  isCurrent: boolean
}>()

const treeApi = inject(projectTreeKey)!
const uiApi = inject(projectUiKey)!

const visible = computed(() => isTaskVisible(task, uiApi.filters))

const detailsModalOpen = ref(false)

// Two-click safety: the first "Delete" selection just arms this (and keeps
// the menu open via preventDefault, see below) instead of deleting
// immediately; a second selection while armed actually deletes. Closing the
// menu without confirming resets it, so reopening later always starts
// unarmed.
const confirmingDelete = ref(false)

function onMenuOpenChange(isOpen: boolean) {
  if (!isOpen) confirmingDelete.value = false
}

function saveTitle(value: string) {
  treeApi.updateTask(task.id, { title: value })
}

function toggleDone() {
  treeApi.updateTask(task.id, { status: task.status === 'done' ? 'pending' : 'done' })
}

function remove() {
  treeApi.deleteTask(task.id)
}

const menuItems = computed(() => [
  [
    { label: 'Add more details', icon: 'i-lucide-file-text', onSelect: () => (detailsModalOpen.value = true) },
    confirmingDelete.value
      ? {
          label: 'Confirm delete',
          icon: 'i-lucide-trash-2',
          color: 'error' as const,
          onSelect: () => remove(),
        }
      : {
          label: 'Delete',
          icon: 'i-lucide-trash-2',
          color: 'error' as const,
          // preventDefault keeps the dropdown open instead of closing it on
          // select, so the second (confirming) click can land on the same menu.
          onSelect: (event: Event) => {
            event.preventDefault()
            confirmingDelete.value = true
          },
        },
  ],
])
</script>

<template>
  <div v-show="visible" :id="`task-${task.id}`" class="task" :class="{ done: task.status === 'done', current: isCurrent }">
    <div class="row">
      <UCheckbox :model-value="task.status === 'done'" @update:model-value="toggleDone" />
      <InlineTextField class="title" :model-value="task.title" @save="saveTitle" />
      <BlockedBadge :blockers="task.blockers" />
      <div class="spacer" />
      <UDropdownMenu :items="menuItems" @update:open="onMenuOpenChange">
        <UButton icon="i-lucide-ellipsis-vertical" title="More actions" color="neutral" variant="ghost" size="xs" square />
      </UDropdownMenu>
    </div>

    <TaskDetailsModal v-model:open="detailsModalOpen" :task="task" />
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
</style>
