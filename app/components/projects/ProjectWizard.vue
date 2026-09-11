<script setup lang="ts">
const emit = defineEmits<{ created: [] }>()

interface DraftTask { title: string }
interface DraftPhase { name: string; tasks: DraftTask[] }
interface DraftEvent { title: string; expectedAt: string }

const stepOrder = ['basics', 'phases', 'tasks', 'events', 'review'] as const
type Step = (typeof stepOrder)[number]
const stepLabels: Record<Step, string> = {
  basics: 'Goal',
  phases: 'Phases',
  tasks: 'Tasks',
  events: 'Events',
  review: 'Review',
}

const open = ref(false)
const step = ref<Step>('basics')
const currentPhaseIndex = ref(0)

const identifier = ref('')
const identifierTouched = ref(false)
const name = ref('')
const description = ref('')
const phases = ref<DraftPhase[]>([])
const events = ref<DraftEvent[]>([])

const newPhaseName = ref('')
const newTaskTitle = ref('')
const newEventTitle = ref('')
const newEventDate = ref('')

const submitting = ref(false)
const error = ref('')

const currentPhase = computed(() => phases.value[currentPhaseIndex.value])

watch(name, value => {
  if (identifierTouched.value) return
  identifier.value = value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '')
})

function resetDraft() {
  step.value = 'basics'
  currentPhaseIndex.value = 0
  identifier.value = ''
  identifierTouched.value = false
  name.value = ''
  description.value = ''
  phases.value = []
  events.value = []
  newPhaseName.value = ''
  newTaskTitle.value = ''
  newEventTitle.value = ''
  newEventDate.value = ''
  error.value = ''
}

function launch() {
  resetDraft()
  open.value = true
}

function close() {
  open.value = false
}

function addPhase() {
  const phaseName = newPhaseName.value.trim()
  if (!phaseName) return
  phases.value.push({ name: phaseName, tasks: [] })
  newPhaseName.value = ''
}

function removePhase(index: number) {
  phases.value.splice(index, 1)
}

function addTask() {
  const title = newTaskTitle.value.trim()
  if (!title || !currentPhase.value) return
  currentPhase.value.tasks.push({ title })
  newTaskTitle.value = ''
}

function removeTask(index: number) {
  currentPhase.value?.tasks.splice(index, 1)
}

function addEvent() {
  const title = newEventTitle.value.trim()
  if (!title) return
  events.value.push({ title, expectedAt: newEventDate.value })
  newEventTitle.value = ''
  newEventDate.value = ''
}

function removeEvent(index: number) {
  events.value.splice(index, 1)
}

const canProceed = computed(() => {
  if (step.value === 'basics') return name.value.trim().length > 0 && identifier.value.trim().length > 0
  return true
})

function goNext() {
  if (!canProceed.value) return
  if (step.value === 'basics') {
    step.value = 'phases'
  } else if (step.value === 'phases') {
    if (phases.value.length > 0) {
      currentPhaseIndex.value = 0
      step.value = 'tasks'
    } else {
      step.value = 'events'
    }
  } else if (step.value === 'tasks') {
    if (currentPhaseIndex.value < phases.value.length - 1) {
      currentPhaseIndex.value += 1
    } else {
      step.value = 'events'
    }
  } else if (step.value === 'events') {
    step.value = 'review'
  }
}

function goBack() {
  if (step.value === 'phases') {
    step.value = 'basics'
  } else if (step.value === 'tasks') {
    if (currentPhaseIndex.value > 0) {
      currentPhaseIndex.value -= 1
    } else {
      step.value = 'phases'
    }
  } else if (step.value === 'events') {
    if (phases.value.length > 0) {
      currentPhaseIndex.value = phases.value.length - 1
      step.value = 'tasks'
    } else {
      step.value = 'phases'
    }
  } else if (step.value === 'review') {
    step.value = 'events'
  }
}

async function create() {
  error.value = ''
  submitting.value = true
  try {
    const project = await $fetch<{ id: number }>('/api/projects', {
      method: 'POST',
      body: { identifier: identifier.value, name: name.value, description: description.value },
    })

    for (const phase of phases.value) {
      const createdPhase = await $fetch<{ id: number }>('/api/phases', {
        method: 'POST',
        body: { projectId: project.id, name: phase.name },
      })
      for (const task of phase.tasks) {
        await $fetch('/api/tasks', {
          method: 'POST',
          body: { projectId: project.id, phaseId: createdPhase.id, title: task.title },
        })
      }
    }

    for (const event of events.value) {
      await $fetch('/api/events', {
        method: 'POST',
        body: {
          projectId: project.id,
          // Wizard-created events are always project-scoped -- attaching
          // one to a specific phase/task is done later from the Events
          // section, which has a proper scope picker.
          scopeType: 'project',
          scopeId: project.id,
          title: event.title,
          expectedAt: event.expectedAt || undefined,
        },
      })
    }

    emit('created')
    open.value = false
    await navigateTo(`/projects/${project.id}`)
  } catch (err: any) {
    error.value = err?.data?.statusMessage ?? err?.data?.message ?? 'Could not create the project'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <UButton label="New project" icon="i-lucide-plus" @click="launch" />

  <UModal v-model:open="open" title="New project">
    <template #body>
      <div class="flex flex-col gap-4">
        <div class="flex flex-wrap gap-1.5">
          <UBadge
            v-for="key in stepOrder"
            :key="key"
            :label="stepLabels[key]"
            size="sm"
            :variant="step === key ? 'solid' : 'subtle'"
            :color="step === key ? 'primary' : 'neutral'"
          />
        </div>

        <div v-if="step === 'basics'" class="flex min-h-40 flex-col gap-3">
          <p class="text-sm text-muted">What's the project, and what's it for?</p>
          <UFormField label="Project name">
            <UInput v-model="name" placeholder="Homelab Server Migration" autofocus class="w-full" />
          </UFormField>
          <UFormField label="Identifier">
            <UInput v-model="identifier" placeholder="HOMELABREFRESH" class="w-full" @input="identifierTouched = true" />
          </UFormField>
          <UFormField label="Overall goal">
            <UTextarea v-model="description" :rows="3" placeholder="What is this project trying to accomplish?" class="w-full" />
          </UFormField>
        </div>

        <div v-else-if="step === 'phases'" class="flex min-h-40 flex-col gap-3">
          <p class="text-sm text-muted">What are the major phases, in order? (e.g. "New NAS setup" -&gt; "Migrate data" -&gt; "Retire old NAS")</p>
          <ol v-if="phases.length > 0" class="flex flex-col gap-1.5">
            <li v-for="(phase, index) in phases" :key="index" class="flex items-center gap-2">
              <span class="w-5 text-sm text-muted">{{ index + 1 }}.</span>
              <UInput v-model="phase.name" class="flex-1" />
              <UButton icon="i-lucide-x" size="xs" color="neutral" variant="ghost" square @click="removePhase(index)" />
            </li>
          </ol>
          <form class="flex gap-2" @submit.prevent="addPhase">
            <UInput v-model="newPhaseName" placeholder="New phase name" class="flex-1" />
            <UButton label="Add" type="submit" color="neutral" variant="outline" />
          </form>
        </div>

        <div v-else-if="step === 'tasks' && currentPhase" class="flex min-h-40 flex-col gap-3">
          <p class="text-sm text-muted">
            Phase {{ currentPhaseIndex + 1 }} of {{ phases.length }}: <strong class="text-default">{{ currentPhase.name }}</strong>
          </p>
          <p class="text-sm text-muted">Add the ordered checklist for this phase (optional -- you can add tasks later too).</p>
          <ol v-if="currentPhase.tasks.length > 0" class="flex flex-col gap-1.5">
            <li v-for="(task, index) in currentPhase.tasks" :key="index" class="flex items-center gap-2">
              <span class="w-5 text-sm text-muted">{{ index + 1 }}.</span>
              <UInput v-model="task.title" class="flex-1" />
              <UButton icon="i-lucide-x" size="xs" color="neutral" variant="ghost" square @click="removeTask(index)" />
            </li>
          </ol>
          <form class="flex gap-2" @submit.prevent="addTask">
            <UInput v-model="newTaskTitle" placeholder="New task" class="flex-1" />
            <UButton label="Add" type="submit" color="neutral" variant="outline" />
          </form>
        </div>

        <div v-else-if="step === 'events'" class="flex min-h-40 flex-col gap-3">
          <p class="text-sm text-muted">Is this project waiting on anything external? (optional -- e.g. a hardware delivery)</p>
          <ol v-if="events.length > 0" class="flex flex-col gap-1.5">
            <li v-for="(event, index) in events" :key="index" class="flex items-center gap-2">
              <UInput v-model="event.expectedAt" type="date" />
              <UInput v-model="event.title" placeholder="Event title" class="flex-1" />
              <UButton icon="i-lucide-x" size="xs" color="neutral" variant="ghost" square @click="removeEvent(index)" />
            </li>
          </ol>
          <form class="flex gap-2" @submit.prevent="addEvent">
            <UInput v-model="newEventDate" type="date" />
            <UInput v-model="newEventTitle" placeholder="New event" class="flex-1" />
            <UButton label="Add" type="submit" color="neutral" variant="outline" />
          </form>
        </div>

        <div v-else-if="step === 'review'" class="flex min-h-40 flex-col gap-3">
          <p class="text-sm text-muted">Ready to create <strong class="text-default">{{ name }}</strong>:</p>
          <ul class="list-inside list-disc text-sm">
            <li v-for="(phase, index) in phases" :key="index">
              {{ phase.name }} <span class="text-muted">({{ phase.tasks.length }} task{{ phase.tasks.length === 1 ? '' : 's' }})</span>
            </li>
            <li v-if="phases.length === 0" class="text-muted">No phases yet -- add them later.</li>
          </ul>
          <p v-if="events.length > 0" class="text-sm text-muted">Events: {{ events.map(e => e.title).join(', ') }}</p>
          <p v-if="error" class="text-sm text-error">{{ error }}</p>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-between">
        <UButton label="Cancel" color="neutral" variant="ghost" @click="close" />
        <div class="flex gap-2">
          <UButton label="Back" color="neutral" variant="outline" :disabled="step === 'basics'" @click="goBack" />
          <UButton v-if="step !== 'review'" label="Next" :disabled="!canProceed" @click="goNext" />
          <UButton v-else :label="submitting ? 'Creating...' : 'Create project'" :loading="submitting" @click="create" />
        </div>
      </div>
    </template>
  </UModal>
</template>
