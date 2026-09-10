<script setup lang="ts">
import Modal from './Modal.vue'

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
  <button type="button" class="primary" @click="launch">New project</button>

  <Modal v-if="open" @close="close">
    <div class="wizard">
      <div class="steps">
        <span
          v-for="key in stepOrder"
          :key="key"
          class="pill"
          :class="{ active: step === key, done: stepOrder.indexOf(step) > stepOrder.indexOf(key) }"
        >
          {{ stepLabels[key] }}
        </span>
      </div>

      <div v-if="step === 'basics'" class="body">
        <p class="hint">What's the project, and what's it for?</p>
        <label>
          Project name
          <input v-model="name" placeholder="Homelab Server Migration" autofocus />
        </label>
        <label>
          Identifier
          <input v-model="identifier" placeholder="HOMELABREFRESH" @input="identifierTouched = true" />
        </label>
        <label>
          Overall goal
          <textarea v-model="description" rows="3" placeholder="What is this project trying to accomplish?" />
        </label>
      </div>

      <div v-else-if="step === 'phases'" class="body">
        <p class="hint">What are the major phases, in order? (e.g. "New NAS setup" -&gt; "Migrate data" -&gt; "Retire old NAS")</p>
        <ol v-if="phases.length > 0" class="draft-list">
          <li v-for="(phase, index) in phases" :key="index">
            <span class="index">{{ index + 1 }}.</span>
            <input v-model="phase.name" />
            <button type="button" class="remove" @click="removePhase(index)">x</button>
          </li>
        </ol>
        <form class="add-row" @submit.prevent="addPhase">
          <input v-model="newPhaseName" placeholder="New phase name" />
          <button type="submit">Add</button>
        </form>
      </div>

      <div v-else-if="step === 'tasks' && currentPhase" class="body">
        <p class="hint">
          Phase {{ currentPhaseIndex + 1 }} of {{ phases.length }}: <strong>{{ currentPhase.name }}</strong>
        </p>
        <p class="hint">Add the ordered checklist for this phase (optional -- you can add tasks later too).</p>
        <ol v-if="currentPhase.tasks.length > 0" class="draft-list">
          <li v-for="(task, index) in currentPhase.tasks" :key="index">
            <span class="index">{{ index + 1 }}.</span>
            <input v-model="task.title" />
            <button type="button" class="remove" @click="removeTask(index)">x</button>
          </li>
        </ol>
        <form class="add-row" @submit.prevent="addTask">
          <input v-model="newTaskTitle" placeholder="New task" />
          <button type="submit">Add</button>
        </form>
      </div>

      <div v-else-if="step === 'events'" class="body">
        <p class="hint">Is this project waiting on anything external? (optional -- e.g. a hardware delivery)</p>
        <ol v-if="events.length > 0" class="draft-list">
          <li v-for="(event, index) in events" :key="index">
            <input type="date" v-model="event.expectedAt" />
            <input v-model="event.title" placeholder="Event title" />
            <button type="button" class="remove" @click="removeEvent(index)">x</button>
          </li>
        </ol>
        <form class="add-row" @submit.prevent="addEvent">
          <input type="date" v-model="newEventDate" />
          <input v-model="newEventTitle" placeholder="New event" />
          <button type="submit">Add</button>
        </form>
      </div>

      <div v-else-if="step === 'review'" class="body">
        <p class="hint">Ready to create <strong>{{ name }}</strong>:</p>
        <ul class="review-list">
          <li v-for="(phase, index) in phases" :key="index">
            {{ phase.name }} <span class="muted">({{ phase.tasks.length }} task{{ phase.tasks.length === 1 ? '' : 's' }})</span>
          </li>
          <li v-if="phases.length === 0" class="muted">No phases yet -- add them later.</li>
        </ul>
        <p v-if="events.length > 0" class="hint">Events: {{ events.map(e => e.title).join(', ') }}</p>
        <p v-if="error" class="error">{{ error }}</p>
      </div>

      <div class="footer">
        <button type="button" class="text" @click="close">Cancel</button>
        <div class="nav">
          <button type="button" :disabled="step === 'basics'" @click="goBack">Back</button>
          <button v-if="step !== 'review'" type="button" class="primary" :disabled="!canProceed" @click="goNext">
            Next
          </button>
          <button v-else type="button" class="primary" :disabled="submitting" @click="create">
            {{ submitting ? 'Creating...' : 'Create project' }}
          </button>
        </div>
      </div>
    </div>
  </Modal>
</template>

<style scoped>
.primary {
  padding: 0.35rem 0.7rem;
  border: 1px solid var(--accent);
  border-radius: 4px;
  background: var(--accent);
  color: white;
  cursor: pointer;
}

.primary:disabled {
  opacity: 0.5;
  cursor: default;
}

.wizard {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.steps {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.pill {
  font-size: 0.7rem;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  border: 1px solid var(--border);
  color: var(--text-muted);
}

.pill.active {
  border-color: var(--accent);
  color: var(--accent);
  font-weight: 600;
}

.pill.done {
  color: var(--text);
}

.body {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  min-height: 10rem;
}

.hint {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-muted);
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.8rem;
  color: var(--text-muted);
}

input,
textarea {
  padding: 0.35rem 0.5rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--bg);
  color: var(--text);
}

.draft-list {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.draft-list li {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.draft-list .index {
  font-size: 0.8rem;
  color: var(--text-muted);
  width: 1.2rem;
}

.draft-list input {
  flex: 1;
}

.remove {
  border: none;
  background: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.1rem 0.3rem;
}

.remove:hover {
  color: var(--danger);
}

.add-row {
  display: flex;
  gap: 0.4rem;
}

.add-row input {
  flex: 1;
}

.add-row button {
  padding: 0.35rem 0.6rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--surface);
  cursor: pointer;
}

.review-list {
  margin: 0;
  padding-left: 1.1rem;
  font-size: 0.85rem;
}

.muted {
  color: var(--text-muted);
}

.error {
  color: var(--danger);
  font-size: 0.85rem;
}

.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid var(--border);
  padding-top: 0.75rem;
}

.footer .text {
  border: none;
  background: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.85rem;
}

.nav {
  display: flex;
  gap: 0.5rem;
}

.nav button:not(.primary) {
  padding: 0.35rem 0.7rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--surface);
  cursor: pointer;
}

.nav button:disabled {
  opacity: 0.4;
  cursor: default;
}
</style>
