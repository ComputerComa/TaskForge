<script setup lang="ts">
import { projectTreeKey } from '~/composables/useProjectTree'
import { projectUiKey, useProjectDetailUi } from '~/composables/useProjectDetailUi'
import ProjectEditableHeader from '~/components/projects/ProjectEditableHeader.vue'
import PhaseTree from '~/components/projects/PhaseTree.vue'
import StatusSummary from '~/components/projects/StatusSummary.vue'
import EventRail from '~/components/projects/EventRail.vue'
import FilterBar from '~/components/projects/FilterBar.vue'
import BlockedBadge from '~/components/projects/BlockedBadge.vue'
import EventList from '~/components/projects/EventList.vue'

const route = useRoute()
const projectId = Number(route.params.id)

const treeApi = useProjectTree(projectId)
provide(projectTreeKey, treeApi)

const uiApi = useProjectDetailUi()
provide(projectUiKey, uiApi)

const { tree, pending, error } = treeApi
</script>

<template>
  <div class="page">
    <NuxtLink to="/" class="back">&lt;- Projects</NuxtLink>

    <p v-if="pending" class="muted">Loading...</p>
    <p v-else-if="error" class="muted">Could not load this project.</p>
    <template v-else-if="tree">
      <div id="project-header">
        <ProjectEditableHeader :project="tree" />
        <BlockedBadge :blockers="tree.blockers" />
        <StatusSummary :summary="tree.statusSummary" />
      </div>

      <EventRail :events="tree.events" :tree="tree" />
      <FilterBar />
      <PhaseTree :phases="tree.phases" />
      <EventList :tree="tree" />
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

#project-header {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
</style>
