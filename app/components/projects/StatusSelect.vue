<script setup lang="ts">
const props = defineProps<{
  modelValue: string
  options: readonly string[]
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const items = computed(() => props.options.map(option => ({ label: option.replace(/_/g, ' '), value: option })))

// Maps each status word to one of Nuxt UI's semantic color tokens, so the
// select's color communicates state without a bespoke per-status palette.
const colorByStatus: Record<string, 'success' | 'primary' | 'warning' | 'neutral'> = {
  done: 'success',
  occurred: 'success',
  in_progress: 'primary',
  ready: 'primary',
  upcoming: 'primary',
  waiting: 'warning',
  on_hold: 'warning',
  blocker: 'warning',
  archived: 'neutral',
  active: 'neutral',
  backlog: 'neutral',
  pending: 'neutral',
  cancelled: 'neutral',
}

const color = computed(() => colorByStatus[props.modelValue] ?? 'neutral')
</script>

<template>
  <USelect
    :model-value="modelValue"
    :items="items"
    :color="color"
    size="xs"
    class="min-w-28 capitalize"
    @update:model-value="value => emit('update:modelValue', value as string)"
  />
</template>
