<script setup lang="ts">
import type { EventSummary } from '~~/shared/types/entities'

const { blockers } = defineProps<{ blockers: EventSummary[] }>()

const label = computed(() => {
  if (blockers.length === 0) return ''
  if (blockers.length === 1) return `Blocked by ${blockers[0]!.title}`
  return `Blocked by ${blockers.length} events`
})
</script>

<template>
  <span v-if="blockers.length > 0" class="badge" :title="blockers.map(b => b.title).join(', ')">
    {{ label }}
  </span>
</template>

<style scoped>
.badge {
  font-size: 0.7rem;
  padding: 0.05rem 0.5rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--danger) 15%, transparent);
  color: var(--danger);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 12rem;
}
</style>
