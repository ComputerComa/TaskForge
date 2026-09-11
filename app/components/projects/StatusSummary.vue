<script setup lang="ts">
import type { ProjectStatusSummary } from '~~/shared/types/entities'

const { summary } = defineProps<{ summary: ProjectStatusSummary }>()

const label = computed(() => {
  if (summary.totalPhases === 0) return 'No phases yet'
  if (summary.isComplete) return 'All phases complete'
  if (summary.currentPhaseIndex == null) return 'No phases yet'
  const phaseLabel = `Phase ${summary.currentPhaseIndex}: ${summary.currentPhaseName}`
  if (!summary.totalTasksInPhase) return `${phaseLabel} (no tasks yet)`
  return `${phaseLabel} -- on task ${summary.currentTaskPosition} of ${summary.totalTasksInPhase}`
})

const percent = computed(() => Math.round(summary.progress * 100))
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <div class="flex items-center gap-1.5 text-sm">
      <UIcon name="i-lucide-flag" class="size-4 shrink-0 text-muted" />
      <span class="truncate text-default" :title="label">{{ label }}</span>
    </div>
    <div class="flex items-center gap-2">
      <UProgress
        :model-value="percent"
        size="sm"
        :color="summary.isComplete ? 'success' : 'primary'"
        class="flex-1"
      />
      <span class="w-9 shrink-0 text-right text-xs font-medium tabular-nums text-muted">{{ percent }}%</span>
    </div>
  </div>
</template>
