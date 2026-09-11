<script setup lang="ts">
import { projectTreeKey } from '~/composables/useProjectTree'
import { isPhaseDone } from '~/composables/useProjectDetailUi'
import type { PhaseNode } from '~~/shared/types/entities'

const open = defineModel<boolean>('open', { required: true })
const { phases } = defineProps<{ phases: PhaseNode[] }>()

const treeApi = inject(projectTreeKey)!

const title = ref('')
const phaseId = ref<number | undefined>(undefined)
const submitting = ref(false)

const phaseOptions = computed(() => phases.map(phase => ({ value: phase.id, label: phase.name })))

// Same "current phase" rule as PhaseTree.vue -- the first, in order, that
// isn't done -- since adding a task almost always means adding to the phase
// currently being worked on.
const currentPhaseId = computed(() => phases.find(phase => !isPhaseDone(phase))?.id ?? phases[0]?.id ?? undefined)

watch(open, isOpen => {
  if (isOpen) phaseId.value = currentPhaseId.value
})

function close() {
  open.value = false
}

async function submit() {
  const trimmed = title.value.trim()
  if (!trimmed || phaseId.value === undefined) return
  submitting.value = true
  try {
    await treeApi.createTask({ phaseId: phaseId.value, title: trimmed })
    title.value = ''
    open.value = false
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Add task">
    <template #body>
      <div class="flex flex-col gap-4">
        <UFormField label="Phase">
          <USelect v-model="phaseId" :items="phaseOptions" class="w-full" />
        </UFormField>
        <UFormField label="Title">
          <UInput v-model="title" class="w-full" placeholder="New task" autofocus @keyup.enter="submit" />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-between">
        <UButton label="Cancel" color="neutral" variant="ghost" @click="close" />
        <UButton label="Add task" :loading="submitting" :disabled="!title.trim() || phaseId == null" @click="submit" />
      </div>
    </template>
  </UModal>
</template>
