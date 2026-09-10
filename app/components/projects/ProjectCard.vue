<script setup lang="ts">
import BlockedBadge from './BlockedBadge.vue'
import StatusSummary from './StatusSummary.vue'
import type { ProjectStatus } from '~~/shared/schemas/project.schema'
import type { ProjectSummary } from '~~/shared/types/entities'

defineProps<{ project: ProjectSummary }>()

const statusColor: Record<ProjectStatus, 'primary' | 'success' | 'warning' | 'neutral'> = {
  active: 'primary',
  on_hold: 'warning',
  done: 'success',
  archived: 'neutral',
}

function formatEventDate(value: string | null) {
  if (!value) return null
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
</script>

<template>
  <NuxtLink :to="`/projects/${project.id}`" class="block h-full">
    <UCard
      variant="outline"
      class="h-full transition hover:shadow-md hover:ring-primary"
      :ui="{ body: 'flex flex-col gap-3' }"
    >
      <div class="flex items-start justify-between gap-2">
        <h2 class="truncate font-semibold text-default">{{ project.name }}</h2>
        <UBadge
          :label="project.status.replace('_', ' ')"
          :color="statusColor[project.status]"
          variant="subtle"
          size="sm"
          class="shrink-0 capitalize"
        />
      </div>

      <BlockedBadge :blockers="project.blockers" />

      <p v-if="project.description" class="line-clamp-2 text-sm text-muted">
        {{ project.description }}
      </p>

      <StatusSummary :summary="project.statusSummary" />

      <div v-if="project.upcomingEvents.length > 0" class="flex flex-col gap-1 border-t border-default pt-2">
        <div
          v-for="event in project.upcomingEvents"
          :key="event.id"
          class="flex items-center gap-1.5 text-xs text-muted"
        >
          <UIcon name="i-lucide-calendar" class="size-3.5 shrink-0" />
          <span v-if="formatEventDate(event.expectedAt)" class="shrink-0 font-medium tabular-nums text-default">
            {{ formatEventDate(event.expectedAt) }}
          </span>
          <span class="truncate">{{ event.title }}</span>
        </div>
      </div>
    </UCard>
  </NuxtLink>
</template>
