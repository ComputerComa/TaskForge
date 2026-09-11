<script setup lang="ts">
import { projectUiKey } from '~/composables/useProjectDetailUi'
import { eventDomId, eventPhaseId, eventScopeLabel, eventTypeMeta, isActiveBlockerEvent } from '~/utils/eventScope'
import type { EventSummary, ProjectTree } from '~~/shared/types/entities'

const { events, tree } = defineProps<{ events: EventSummary[]; tree: ProjectTree }>()
const uiApi = inject(projectUiKey)!

const sorted = computed(() =>
  [...events].sort((a, b) => {
    const rank = (event: EventSummary) => (event.status === 'upcoming' ? 0 : 1)
    const byRank = rank(a) - rank(b)
    if (byRank !== 0) return byRank
    const aTime = a.expectedAt ? new Date(a.expectedAt).getTime() : Infinity
    const bTime = b.expectedAt ? new Date(b.expectedAt).getTime() : Infinity
    return aTime - bTime
  }),
)

function formatDate(value: string | null) {
  if (!value) return null
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Expands the event's containing phase (if collapsed) and scrolls the
 * affected project/phase/task element into view with a brief highlight,
 * so clicking an event makes it easy to find what it's about. */
function locate(event: EventSummary) {
  const phaseId = eventPhaseId(event, tree)
  if (phaseId !== null) uiApi.expandPhase(phaseId)

  nextTick(() => {
    const el = document.getElementById(eventDomId(event))
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('flash-highlight')
    setTimeout(() => el.classList.remove('flash-highlight'), 1400)
  })
}
</script>

<template>
  <div v-if="events.length > 0" class="rail">
    <button
      v-for="event in sorted"
      :key="event.id"
      type="button"
      class="chip"
      :class="{ blocker: isActiveBlockerEvent(event), resolved: event.status !== 'upcoming' }"
      :title="event.description ?? undefined"
      @click="locate(event)"
    >
      <span class="icon">{{ eventTypeMeta[event.type].icon }}</span>
      <span class="text">
        <span class="title">{{ event.title }}</span>
        <span class="meta">
          <span class="scope">{{ eventScopeLabel(event, tree) }}</span>
          <span v-if="formatDate(event.expectedAt)">&middot; {{ formatDate(event.expectedAt) }}</span>
          <span v-if="event.status !== 'upcoming'">&middot; {{ event.status }}</span>
        </span>
      </span>
    </button>
  </div>
</template>

<style scoped>
.rail {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
}

.chip {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.6rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  max-width: 14rem;
  text-align: left;
}

.chip:hover {
  border-color: var(--accent);
}

.chip.blocker {
  border-color: var(--danger);
}

.chip.resolved {
  opacity: 0.55;
}

.icon {
  flex: none;
  font-size: 0.9rem;
}

.text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.title {
  font-size: 0.8rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta {
  font-size: 0.7rem;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chip.blocker .meta {
  color: var(--danger);
}
</style>
