<script setup lang="ts">
import ProjectCreateForm from '~/components/projects/ProjectCreateForm.vue'
import ProjectListItem from '~/components/projects/ProjectListItem.vue'
import type { ProjectSummary } from '~~/shared/types/entities'

// useRequestFetch forwards the incoming request's cookies during SSR --
// see the comment in useProjectTree.ts for why this matters.
const requestFetch = useRequestFetch()
const { data: projects, pending } = useAsyncData<ProjectSummary[]>('projects', () =>
  requestFetch('/api/projects'),
)

function onCreated(project: ProjectSummary) {
  projects.value = [project, ...(projects.value ?? [])]
}
</script>

<template>
  <div class="page">
    <div class="header">
      <h1>Projects</h1>
      <ProjectCreateForm @created="onCreated" />
    </div>

    <p v-if="pending" class="muted">Loading...</p>
    <p v-else-if="!projects?.length" class="muted">No projects yet. Create one to get started.</p>
    <div v-else class="list">
      <ProjectListItem v-for="project in projects" :key="project.id" :project="project" />
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

.list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.muted {
  color: var(--text-muted);
}
</style>
