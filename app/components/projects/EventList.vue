<script setup lang="ts">
import { projectTreeKey } from '~/composables/useProjectTree'
import EventItem from './EventItem.vue'
import type { EventSummary } from '~~/shared/types/entities'

const { events } = defineProps<{ events: EventSummary[] }>()
const treeApi = inject(projectTreeKey)!

const newTitle = ref('')
const newDate = ref('')

async function addEvent() {
  const title = newTitle.value.trim()
  if (!title) return
  const expectedAt = newDate.value || undefined
  newTitle.value = ''
  newDate.value = ''
  await treeApi.createEvent({ title, expectedAt })
}
</script>

<template>
  <section class="events">
    <h2>Events</h2>
    <p v-if="events.length === 0" class="muted">
      No events yet -- expected deliveries, waiting windows, or other dated milestones.
    </p>
    <div v-else class="list">
      <EventItem v-for="event in events" :key="event.id" :event="event" />
    </div>

    <form class="add-event" @submit.prevent="addEvent">
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
  gap: 0.4rem;
}

.add-event .title {
  flex: 1;
}

.add-event input {
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
