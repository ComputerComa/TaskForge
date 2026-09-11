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

const typeOptions = eventTypes.map(type => ({ value: type, label: `${eventTypeMeta[type].icon} ${eventTypeMeta[type].label}` }))

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

function saveType(value: string) {
  treeApi.updateEvent(event.id, { type: value as EventSummary['type'] })
}

function saveScope(value: string) {
  const [scopeType, scopeIdRaw] = value.split(':')
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
      <USelect :model-value="event.type" :items="typeOptions" class="min-w-36" @update:model-value="saveType" />
      <UInput :model-value="dateValue" type="date" @update:model-value="value => saveDate(String(value))" />
      <InlineTextField class="title" :model-value="event.title" @save="saveTitle" />
      <StatusSelect :model-value="event.status" :options="eventStatuses" @update:model-value="saveStatus" />
      <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="xs" square title="Delete" @click="remove" />
    </div>
    <div class="row secondary">
      <span class="scope-label">Scope:</span>
      <USelect :model-value="scopeValue" :items="scopeOptions" size="xs" class="min-w-40" @update:model-value="saveScope" />
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

.title {
  flex: 1;
  font-weight: 500;
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
