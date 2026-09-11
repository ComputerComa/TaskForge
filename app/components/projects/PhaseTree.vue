<script setup lang="ts">
import { projectTreeKey } from '~/composables/useProjectTree'
import { isPhaseDone } from '~/composables/useProjectDetailUi'
import PhaseNode from './PhaseNode.vue'
import type { PhaseNode as PhaseNodeType } from '~~/shared/types/entities'

const { phases } = defineProps<{ phases: PhaseNodeType[] }>()
const treeApi = inject(projectTreeKey)!

// Phases block sequentially by position: the "current" one is the first
// that isn't done yet. Only that phase's first pending task should ever
// be marked "up next" -- everything after it is waiting on it, not
// independently "next" within its own task list.
const currentPhaseIndex = computed(() => phases.findIndex(phase => !isPhaseDone(phase)))

function move(index: number, direction: -1 | 1) {
  const target = phases[index + direction]
  const current = phases[index]
  if (!target || !current) return
  treeApi.swapPositions('phase', current, target)
}
</script>

<template>
  <div class="phases">
    <PhaseNode
      v-for="(phase, index) in phases"
      :key="phase.id"
      :phase="phase"
      :is-current-phase="index === currentPhaseIndex"
      :can-move-up="index > 0"
      :can-move-down="index < phases.length - 1"
      @move-up="move(index, -1)"
      @move-down="move(index, 1)"
    />
  </div>
</template>

<style scoped>
.phases {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
</style>
