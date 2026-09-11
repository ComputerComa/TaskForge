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
  <UBadge
    v-if="blockers.length > 0"
    color="error"
    variant="subtle"
    size="sm"
    icon="i-lucide-octagon-alert"
    class="max-w-[12rem] self-start"
    :title="blockers.map(b => b.title).join(', ')"
  >
    <span class="min-w-0 truncate">{{ label }}</span>
  </UBadge>
</template>
