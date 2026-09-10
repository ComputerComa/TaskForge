<script setup lang="ts">
import { projectTreeKey } from '~/composables/useProjectTree'
import type { TaskNode } from '~~/shared/types/entities'

const { task } = defineProps<{ task: TaskNode }>()
const treeApi = inject(projectTreeKey)!

const error = ref('')
const selected = ref('')

const taskById = computed(() => new Map(treeApi.allTasks.value.map(t => [t.id, t])))

const candidates = computed(() =>
  treeApi.allTasks.value.filter(
    candidate =>
      candidate.id !== task.id &&
      !task.dependencies.some(dep => dep.dependsOnTaskId === candidate.id),
  ),
)

function label(candidate: TaskNode) {
  return `${candidate.reference} - ${candidate.title}`
}

async function add() {
  error.value = ''
  const dependsOnTaskId = Number(selected.value)
  if (!dependsOnTaskId) return
  try {
    await treeApi.addDependency(task.id, dependsOnTaskId)
    selected.value = ''
  } catch (err: any) {
    error.value = err?.data?.statusMessage ?? 'Could not add dependency'
  }
}

async function remove(edgeId: number) {
  error.value = ''
  try {
    await treeApi.removeDependency(edgeId)
  } catch (err: any) {
    error.value = err?.data?.statusMessage ?? 'Could not remove dependency'
  }
}
</script>

<template>
  <div class="dependencies">
    <span class="label">Depends on:</span>
    <span v-if="task.dependencies.length === 0" class="none">none</span>
    <span v-for="dep in task.dependencies" :key="dep.id" class="chip">
      {{ taskById.get(dep.dependsOnTaskId)?.reference ?? `#${dep.dependsOnTaskId}` }}
      <button type="button" title="Remove dependency" @click="remove(dep.id)">x</button>
    </span>

    <select v-if="candidates.length > 0" v-model="selected" @change="add">
      <option value="">+ add dependency</option>
      <option v-for="candidate in candidates" :key="candidate.id" :value="candidate.id">
        {{ label(candidate) }}
      </option>
    </select>

    <span v-if="error" class="error">{{ error }}</span>
  </div>
</template>

<style scoped>
.dependencies {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
  font-size: 0.8rem;
}

.label {
  color: var(--text-muted);
}

.none {
  color: var(--text-muted);
  font-style: italic;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.05rem 0.4rem;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--bg);
  font-family: ui-monospace, monospace;
}

.chip button {
  border: none;
  background: none;
  cursor: pointer;
  color: var(--text-muted);
  padding: 0;
  line-height: 1;
}

select {
  padding: 0.1rem 0.3rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--surface);
  font-size: 0.75rem;
}

.error {
  color: var(--danger);
}
</style>
