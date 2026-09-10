<script setup lang="ts">
import { projectTreeKey } from '~/composables/useProjectTree'
import ProjectEditableHeader from '~/components/projects/ProjectEditableHeader.vue'
import PhaseTree from '~/components/projects/PhaseTree.vue'
import StatusSummary from '~/components/projects/StatusSummary.vue'
import EventList from '~/components/projects/EventList.vue'

const route = useRoute()
const projectId = Number(route.params.id)

const treeApi = useProjectTree(projectId)
provide(projectTreeKey, treeApi)

const { tree, pending, error } = treeApi
</script>

<template>
  <div class="page">
    <NuxtLink to="/" class="back">&lt;- Projects</NuxtLink>

    <p v-if="pending" class="muted">Loading...</p>
    <p v-else-if="error" class="muted">Could not load this project.</p>
    <template v-else-if="tree">
      <ProjectEditableHeader :project="tree" />
      <StatusSummary :summary="tree.statusSummary" />
      <PhaseTree :phases="tree.phases" />
      <EventList :events="tree.events" />
    </template>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.back {
  font-size: 0.8rem;
  text-decoration: none;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}

.muted {
  color: var(--text-muted);
}
</style>
