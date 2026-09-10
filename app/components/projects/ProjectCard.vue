<script setup lang="ts">
import StatusSummary from './StatusSummary.vue'
import type { ProjectSummary } from '~~/shared/types/entities'

defineProps<{ project: ProjectSummary }>()

function formatEventDate(value: string | null) {
  if (!value) return null
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
</script>

<template>
  <NuxtLink :to="`/projects/${project.id}`" class="card">
    <div class="top">
      <span class="name">{{ project.name }}</span>
      <span class="status" :class="`status-${project.status}`">{{ project.status.replace('_', ' ') }}</span>
    </div>
    <p v-if="project.description" class="description">{{ project.description }}</p>

    <StatusSummary :summary="project.statusSummary" />

    <div v-if="project.upcomingEvents.length > 0" class="events">
      <span
        v-for="event in project.upcomingEvents"
        :key="event.id"
        class="event"
      >
        <span v-if="formatEventDate(event.expectedAt)" class="event-date">{{ formatEventDate(event.expectedAt) }}</span>
        {{ event.title }}
      </span>
    </div>
  </NuxtLink>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.85rem 1rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  text-decoration: none;
  color: var(--text);
  background: var(--surface);
}

.card:hover {
  border-color: var(--accent);
}

.top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
}

.name {
  font-weight: 600;
}

.status {
  font-size: 0.75rem;
  text-transform: capitalize;
  color: var(--text-muted);
  white-space: nowrap;
}

.status-done {
  color: #2f9e44;
}

.status-on_hold {
  color: #e08e0b;
}

.status-archived {
  color: var(--text-muted);
}

.description {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.events {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  margin-top: 0.15rem;
}

.event {
  font-size: 0.75rem;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-date {
  font-variant-numeric: tabular-nums;
  color: var(--accent);
  margin-right: 0.4rem;
}
</style>
