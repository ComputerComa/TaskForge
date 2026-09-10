<script setup lang="ts">
defineProps<{
  modelValue: string
  options: readonly string[]
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

function label(status: string) {
  return status.replace(/_/g, ' ')
}
</script>

<template>
  <select :value="modelValue" :class="`status status-${modelValue}`" @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)">
    <option v-for="option in options" :key="option" :value="option">{{ label(option) }}</option>
  </select>
</template>

<style scoped>
select {
  padding: 0.15rem 0.3rem;
  border: 1px solid var(--border);
  border-radius: 3px;
  background: var(--surface);
  font-size: 0.8rem;
  text-transform: capitalize;
}

.status-done {
  border-color: #2f9e44;
  color: #2f9e44;
}

.status-in_progress {
  border-color: var(--accent);
  color: var(--accent);
}

.status-waiting,
.status-on_hold {
  border-color: #e08e0b;
  color: #e08e0b;
}

.status-archived {
  opacity: 0.6;
}
</style>
