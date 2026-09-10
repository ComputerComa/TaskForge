<script setup lang="ts">
import { eventStatuses } from '~~/shared/schemas/event.schema'
import { projectTreeKey } from '~/composables/useProjectTree'
import InlineTextField from './InlineTextField.vue'
import StatusSelect from './StatusSelect.vue'
import type { EventSummary } from '~~/shared/types/entities'

const { event } = defineProps<{ event: EventSummary }>()
const treeApi = inject(projectTreeKey)!

// Native date inputs want/return "YYYY-MM-DD"; the API stores a full
// timestamp, so trim to the date part for display.
const dateValue = computed(() => event.expectedAt?.slice(0, 10) ?? '')

function saveTitle(value: string) {
  if (!value) return
  treeApi.updateEvent(event.id, { title: value })
}

function saveNote(value: string) {
  treeApi.updateEvent(event.id, { note: value })
}

function saveDate(raw: string) {
  treeApi.updateEvent(event.id, { expectedAt: raw || null })
}

function saveStatus(value: string) {
  treeApi.updateEvent(event.id, { status: value as EventSummary['status'] })
}

function remove() {
  treeApi.deleteEvent(event.id)
}
</script>

<template>
  <div class="event" :class="{ occurred: event.status === 'occurred', cancelled: event.status === 'cancelled' }">
    <div class="row">
      <input type="date" :value="dateValue" @change="saveDate(($event.target as HTMLInputElement).value)" />
      <InlineTextField class="title" :model-value="event.title" @save="saveTitle" />
      <StatusSelect :model-value="event.status" :options="eventStatuses" @update:model-value="saveStatus" />
      <button type="button" class="danger" @click="remove">Delete</button>
    </div>
    <InlineTextField
      class="note"
      multiline
      placeholder="Add a note..."
      :model-value="event.note ?? ''"
      @save="saveNote"
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

.row input[type='date'] {
  padding: 0.15rem 0.3rem;
  border: 1px solid var(--border);
  border-radius: 3px;
  background: var(--surface);
  font-size: 0.8rem;
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

.note {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.8rem;
  color: var(--text-muted);
}
</style>
