<script setup lang="ts">
import ProjectWizard from '~/components/projects/ProjectWizard.vue'
import ProjectCard from '~/components/projects/ProjectCard.vue'
import type { ProjectSummary } from '~~/shared/types/entities'

// useRequestFetch forwards the incoming request's cookies during SSR --
// see the comment in useProjectTree.ts for why this matters.
const requestFetch = useRequestFetch()
const { data: projects, pending, refresh } = useAsyncData<ProjectSummary[]>('projects', () =>
  requestFetch('/api/projects'),
)

async function onCreated() {
  await refresh()
}
</script>

<template>
  <div class="page">
    <div class="header">
      <h1>Dashboard</h1>
      <ProjectWizard @created="onCreated" />
    </div>

    <p v-if="pending" class="muted">Loading...</p>
    <p v-else-if="!projects?.length" class="muted">No projects yet. Create one to get started.</p>
    <div v-else class="grid">
      <ProjectCard v-for="project in projects" :key="project.id" :project="project" />
    </div>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.header {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

h1 {
  margin: 0;
  font-size: 1.2rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  gap: 0.75rem;
}

.muted {
  color: var(--text-muted);
}
</style>
