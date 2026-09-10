<script setup lang="ts">
import { projectTreeKey } from '~/composables/useProjectTree'
import PhaseNode from './PhaseNode.vue'
import type { PhaseNode as PhaseNodeType } from '~~/shared/types/entities'

const { phases } = defineProps<{ phases: PhaseNodeType[] }>()
const treeApi = inject(projectTreeKey)!

const newPhaseName = ref('')

async function addPhase() {
  const name = newPhaseName.value.trim()
  if (!name) return
  newPhaseName.value = ''
  await treeApi.createPhase({ name })
}

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
      :can-move-up="index > 0"
      :can-move-down="index < phases.length - 1"
      @move-up="move(index, -1)"
      @move-down="move(index, 1)"
    />

    <form class="add-phase" @submit.prevent="addPhase">
      <input v-model="newPhaseName" placeholder="New phase name" />
      <button type="submit">Add phase</button>
    </form>
  </div>
</template>

<style scoped>
.phases {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.add-phase {
  display: flex;
  gap: 0.5rem;
}

.add-phase input {
  flex: 1;
  padding: 0.35rem 0.5rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--surface);
}

.add-phase button {
  padding: 0.35rem 0.7rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--surface);
  cursor: pointer;
}
</style>
