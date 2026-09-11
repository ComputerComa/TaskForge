<script setup lang="ts">
import ProjectWizard from '~/components/projects/ProjectWizard.vue'
import ImportProjectModal from '~/components/projects/ImportProjectModal.vue'
import ProjectCard from '~/components/projects/ProjectCard.vue'
import type { ProjectSummary } from '~~/shared/types/entities'

useHead({ title: 'Dashboard' })

// useRequestFetch forwards the incoming request's cookies during SSR --
// see the comment in useProjectTree.ts for why this matters.
const requestFetch = useRequestFetch()
const { data: projects, pending, refresh } = useAsyncData<ProjectSummary[]>('projects', () =>
  requestFetch('/api/projects'),
)

async function refreshProjects() {
  await refresh()
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-xl font-semibold text-default">Dashboard</h1>
      <div class="flex gap-2">
        <ImportProjectModal @imported="refreshProjects" />
        <ProjectWizard @created="refreshProjects" />
      </div>
    </div>

    <p v-if="pending" class="text-sm text-muted">Loading...</p>
    <p v-else-if="!projects?.length" class="text-sm text-muted">No projects yet. Create one to get started.</p>
    <div v-else class="grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-4">
      <ProjectCard v-for="project in projects" :key="project.id" :project="project" />
    </div>
  </div>
</template>
