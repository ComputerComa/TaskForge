<script setup lang="ts">
import { eventStatuses, eventTypes } from '~~/shared/schemas/event.schema'
import { projectTreeKey } from '~/composables/useProjectTree'
import { eventScopeLabel, eventTypeMeta, isActiveBlockerEvent } from '~/utils/eventScope'
import InlineTextField from './InlineTextField.vue'
import StatusSelect from './StatusSelect.vue'
import type { EventSummary, ProjectTree } from '~~/shared/types/entities'

const { event, tree } = defineProps<{ event: EventSummary; tree: ProjectTree }>()
const treeApi = inject(projectTreeKey)!

// Native date inputs want/return "YYYY-MM-DD"; the API stores a full
// timestamp, so trim to the date part for display.
const dateValue = computed(() => event.expectedAt?.slice(0, 10) ?? '')

const scopeOptions = computed(() => [
  { value: `project:${tree.id}`, label: 'Whole project' },
  ...tree.phases.map(phase => ({ value: `phase:${phase.id}`, label: `Phase: ${phase.name}` })),
  ...tree.phases.flatMap(phase =>
    phase.tasks.map(task => ({ value: `task:${task.id}`, label: `Task: ${task.title}` })),
  ),
])
const scopeValue = computed(() => `${event.scopeType}:${event.scopeId}`)

function saveTitle(value: string) {
  if (!value) return
  treeApi.updateEvent(event.id, { title: value })
}

function saveDescription(value: string) {
  treeApi.updateEvent(event.id, { description: value })
}

function saveDate(raw: string) {
  treeApi.updateEvent(event.id, { expectedAt: raw || null })
}

function saveStatus(value: string) {
  treeApi.updateEvent(event.id, { status: value as EventSummary['status'] })
}

function saveType(raw: Event) {
  const value = (raw.target as HTMLSelectElement).value as EventSummary['type']
  treeApi.updateEvent(event.id, { type: value })
}

function saveScope(raw: Event) {
  const [scopeType, scopeIdRaw] = (raw.target as HTMLSelectElement).value.split(':')
  treeApi.updateEvent(event.id, { scopeType: scopeType as EventSummary['scopeType'], scopeId: Number(scopeIdRaw) })
}

function remove() {
  treeApi.deleteEvent(event.id)
}
</script>

<template>
  <div
    class="event"
    :class="{ occurred: event.status === 'occurred', cancelled: event.status === 'cancelled', blocker: isActiveBlockerEvent(event) }"
  >
    <div class="row">
      <select class="type" :value="event.type" @change="saveType">
        <option v-for="type in eventTypes" :key="type" :value="type">{{ eventTypeMeta[type].icon }} {{ eventTypeMeta[type].label }}</option>
      </select>
      <input type="date" :value="dateValue" @change="saveDate(($event.target as HTMLInputElement).value)" />
      <InlineTextField class="title" :model-value="event.title" @save="saveTitle" />
      <StatusSelect :model-value="event.status" :options="eventStatuses" @update:model-value="saveStatus" />
      <button type="button" class="danger" @click="remove">Delete</button>
    </div>
    <div class="row secondary">
      <span class="scope-label">Scope:</span>
      <select class="scope" :value="scopeValue" @change="saveScope">
        <option v-for="option in scopeOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
      </select>
      <span v-if="isActiveBlockerEvent(event)" class="blocking-tag">blocking {{ eventScopeLabel(event, tree) }}</span>
    </div>
    <InlineTextField
      class="description"
      multiline
      placeholder="Add a description..."
      :model-value="event.description ?? ''"
      @save="saveDescription"
    />
  </div>
</template>

<style scoped>
.event {
  padding: 0.4rem 0.5rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--bg);
}

.event.blocker {
  border-color: var(--danger);
}

.event.occurred,
.event.cancelled {
  opacity: 0.6;
}

.row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.row.secondary {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.row input[type='date'],
select {
  padding: 0.15rem 0.3rem;
  border: 1px solid var(--border);
  border-radius: 3px;
  background: var(--surface);
  font-size: 0.8rem;
  color: var(--text);
}

.title {
  flex: 1;
  font-weight: 500;
}

.danger {
  border: none;
  background: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.75rem;
}

.danger:hover {
  color: var(--danger);
}

.scope-label {
  color: var(--text-muted);
}

.blocking-tag {
  color: var(--danger);
  font-weight: 500;
}

.description {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.8rem;
  color: var(--text-muted);
}
</style>
