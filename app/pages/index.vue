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
  <div class="flex flex-col gap-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-xl font-semibold text-default">Dashboard</h1>
      <ProjectWizard @created="onCreated" />
    </div>

    <p v-if="pending" class="text-sm text-muted">Loading...</p>
    <p v-else-if="!projects?.length" class="text-sm text-muted">No projects yet. Create one to get started.</p>
    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      <ProjectCard v-for="project in projects" :key="project.id" :project="project" />
    </div>
  </div>
</template>
