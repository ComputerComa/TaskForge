<script setup lang="ts">
import type { ProjectSummary } from '~~/shared/types/entities'

defineProps<{ project: ProjectSummary }>()

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}
</script>

<template>
  <NuxtLink :to="`/projects/${project.id}`" class="row">
    <span class="identifier">{{ project.identifier }}</span>
    <span class="name">{{ project.name }}</span>
    <span class="status" :class="`status-${project.status}`">{{ project.status.replace('_', ' ') }}</span>
    <span class="count">{{ project.taskCount }} task{{ project.taskCount === 1 ? '' : 's' }}</span>
    <span class="updated">{{ formatDate(project.updatedAt) }}</span>
  </NuxtLink>
</template>

<style scoped>
.row {
  display: grid;
  grid-template-columns: 10rem 1fr 6rem 6rem 10rem;
  gap: 0.75rem;
  align-items: center;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  text-decoration: none;
  color: var(--text);
  background: var(--surface);
}

.row:hover {
  border-color: var(--accent);
}

.identifier {
  font-family: ui-monospace, monospace;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.status {
  font-size: 0.75rem;
  text-transform: capitalize;
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

.count,
.updated {
  font-size: 0.75rem;
  color: var(--text-muted);
}

@media (max-width: 640px) {
  .row {
    grid-template-columns: 1fr;
    gap: 0.15rem;
  }
}
</style>
