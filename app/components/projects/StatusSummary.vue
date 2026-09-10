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
  <div class="status">
    <span class="label">{{ label }}</span>
    <div class="bar">
      <div class="fill" :style="{ width: `${percent}%` }" />
    </div>
    <span class="percent">{{ percent }}%</span>
  </div>
</template>

<style scoped>
.status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
}

.label {
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bar {
  flex: 1;
  min-width: 4rem;
  height: 0.4rem;
  border-radius: 999px;
  background: var(--border);
  overflow: hidden;
}

.fill {
  height: 100%;
  background: var(--accent);
  transition: width 0.2s ease;
}

.percent {
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
  min-width: 2.5rem;
  text-align: right;
}
</style>
