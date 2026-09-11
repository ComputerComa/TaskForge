<script setup lang="ts">
import AddPhaseModal from './AddPhaseModal.vue'
import AddTaskModal from './AddTaskModal.vue'
import AddEventModal from './AddEventModal.vue'
import type { ProjectTree } from '~~/shared/types/entities'

const { tree } = defineProps<{ tree: ProjectTree }>()

const phaseModalOpen = ref(false)
const taskModalOpen = ref(false)
const eventModalOpen = ref(false)

const items = [
  [
    { label: 'Phase', icon: 'i-lucide-flag', onSelect: () => (phaseModalOpen.value = true) },
    { label: 'Task', icon: 'i-lucide-square-check', onSelect: () => (taskModalOpen.value = true) },
    { label: 'Event', icon: 'i-lucide-calendar-plus', onSelect: () => (eventModalOpen.value = true) },
  ],
]
</script>

<template>
  <UDropdownMenu :items="items">
    <UButton label="Add" icon="i-lucide-plus" trailing-icon="i-lucide-chevron-down" color="neutral" variant="outline" size="sm" />
  </UDropdownMenu>

  <AddPhaseModal v-model:open="phaseModalOpen" />
  <AddTaskModal v-model:open="taskModalOpen" :phases="tree.phases" />
  <AddEventModal v-model:open="eventModalOpen" :tree="tree" />
</template>
