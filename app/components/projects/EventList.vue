<script setup lang="ts">
import EventItem from './EventItem.vue'
import type { ProjectTree } from '~~/shared/types/entities'

const { tree } = defineProps<{ tree: ProjectTree }>()
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
</style>
