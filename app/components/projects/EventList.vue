<script setup lang="ts">
import { eventTypes } from '~~/shared/schemas/event.schema'
import { projectTreeKey } from '~/composables/useProjectTree'
import { eventTypeMeta } from '~/utils/eventScope'
import EventItem from './EventItem.vue'
import type { ProjectTree } from '~~/shared/types/entities'

const { tree } = defineProps<{ tree: ProjectTree }>()
const treeApi = inject(projectTreeKey)!

const newTitle = ref('')
const newDate = ref('')
const newType = ref<(typeof eventTypes)[number]>('milestone')
// Encodes both scope type and id as "type:id" -- see onSubmit.
const newScope = ref(`project:${tree.id}`)

const scopeOptions = computed(() => [
  { value: `project:${tree.id}`, label: 'Whole project' },
  ...tree.phases.map(phase => ({ value: `phase:${phase.id}`, label: `Phase: ${phase.name}` })),
  ...tree.phases.flatMap(phase =>
    phase.tasks.map(task => ({ value: `task:${task.id}`, label: `Task: ${task.title}` })),
  ),
])

async function addEvent() {
  const title = newTitle.value.trim()
  if (!title) return
  const [scopeType, scopeIdRaw] = newScope.value.split(':')
  newTitle.value = ''
  newDate.value = ''
  await treeApi.createEvent({
    scopeType: scopeType as 'project' | 'phase' | 'task',
    scopeId: Number(scopeIdRaw),
    type: newType.value,
    title,
    expectedAt: newDate.value || undefined,
  })
}
</script>

<template>
  <section class="events">
    <h2>Events</h2>
    <p v-if="tree.events.length === 0" class="muted">
      No events yet -- milestones, blockers, deliveries, decisions, maintenance windows, or notes.
    </p>
    <div v-else class="list">
      <EventItem v-for="event in tree.events" :key="event.id" :event="event" :tree="tree" />
    </div>

    <form class="add-event" @submit.prevent="addEvent">
      <select v-model="newScope">
        <option v-for="option in scopeOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
      </select>
      <select v-model="newType">
        <option v-for="type in eventTypes" :key="type" :value="type">{{ eventTypeMeta[type].label }}</option>
      </select>
      <input type="date" v-model="newDate" />
      <input v-model="newTitle" placeholder="New event (e.g. SSDs expected to arrive)" class="title" />
      <button type="submit">Add event</button>
    </form>
  </section>
</template>

<style scoped>
.events {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}

h2 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
}

.muted {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.6rem;
}

.add-event {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.add-event .title {
  flex: 1;
  min-width: 10rem;
}

.add-event input,
.add-event select {
  padding: 0.3rem 0.45rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--surface);
}

.add-event button {
  padding: 0.3rem 0.6rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--surface);
  cursor: pointer;
}
</style>
