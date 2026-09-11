<script setup lang="ts">
import { eventTypes } from '~~/shared/schemas/event.schema'
import { projectTreeKey } from '~/composables/useProjectTree'
import { eventTypeMeta } from '~/utils/eventScope'
import type { ProjectTree } from '~~/shared/types/entities'

const open = defineModel<boolean>('open', { required: true })
const { tree } = defineProps<{ tree: ProjectTree }>()

const treeApi = inject(projectTreeKey)!

const scopeTypes = ['project', 'phase', 'task'] as const
const scopeTypeOptions = [
  { value: 'project', label: 'Whole project' },
  { value: 'phase', label: 'Phase' },
  { value: 'task', label: 'Task' },
]
const typeOptions = eventTypes.map(type => ({ value: type, label: eventTypeMeta[type].label }))

const type = ref<(typeof eventTypes)[number]>('milestone')
const scopeType = ref<(typeof scopeTypes)[number]>('project')
const targetId = ref<number | undefined>(undefined)
const date = ref('')
const title = ref('')
const submitting = ref(false)

// Filtered per the chosen scope -- a Phase scope only ever offers phases, a
// Task scope only ever offers tasks (labeled with their phase for context),
// instead of one flattened list mixing every kind of target together.
const targetOptions = computed(() => {
  if (scopeType.value === 'phase') {
    return tree.phases.map(phase => ({ value: phase.id, label: phase.name }))
  }
  if (scopeType.value === 'task') {
    return tree.phases.flatMap(phase =>
      phase.tasks.map(task => ({ value: task.id, label: `${task.title} (${phase.name})` })),
    )
  }
  return []
})

// Switching scope invalidates whatever target was picked for the old scope.
watch(scopeType, () => {
  targetId.value = undefined
})

watch(open, isOpen => {
  if (!isOpen) return
  type.value = 'milestone'
  scopeType.value = 'project'
  targetId.value = undefined
  date.value = ''
  title.value = ''
})

const canSubmit = computed(() => {
  if (!title.value.trim()) return false
  if (scopeType.value !== 'project' && targetId.value === undefined) return false
  return true
})

function close() {
  open.value = false
}

async function submit() {
  if (!canSubmit.value) return
  const trimmed = title.value.trim()
  const scopeId = scopeType.value === 'project' ? tree.id : targetId.value!
  submitting.value = true
  try {
    await treeApi.createEvent({
      scopeType: scopeType.value,
      scopeId,
      type: type.value,
      title: trimmed,
      expectedAt: date.value || undefined,
    })
    open.value = false
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Add event">
    <template #body>
      <div class="flex flex-col gap-4">
        <div class="flex gap-3">
          <UFormField label="Type" class="flex-1">
            <USelect v-model="type" :items="typeOptions" class="w-full" />
          </UFormField>
          <UFormField label="Scope" class="flex-1">
            <USelect v-model="scopeType" :items="scopeTypeOptions" class="w-full" />
          </UFormField>
        </div>

        <UFormField v-if="scopeType !== 'project'" :label="scopeType === 'phase' ? 'Phase' : 'Task'">
          <USelect
            v-model="targetId"
            :items="targetOptions"
            :placeholder="`Select a ${scopeType}...`"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Expected date">
          <UInput v-model="date" type="date" class="w-full" />
        </UFormField>

        <UFormField label="Title">
          <UInput
            v-model="title"
            class="w-full"
            placeholder="e.g. SSDs expected to arrive"
            autofocus
            @keyup.enter="submit"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-between">
        <UButton label="Cancel" color="neutral" variant="ghost" @click="close" />
        <UButton label="Add event" :loading="submitting" :disabled="!canSubmit" @click="submit" />
      </div>
    </template>
  </UModal>
</template>
