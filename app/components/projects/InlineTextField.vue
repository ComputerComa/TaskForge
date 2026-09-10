<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: string
    multiline?: boolean
    placeholder?: string
  }>(),
  { multiline: false, placeholder: '(empty)' },
)

const emit = defineEmits<{ save: [value: string] }>()

const editing = ref(false)
const draft = ref(props.modelValue)
const fieldRef = ref<{ inputRef?: HTMLInputElement | null; textareaRef?: HTMLTextAreaElement | null }>()

function startEdit() {
  draft.value = props.modelValue
  editing.value = true
  nextTick(() => (fieldRef.value?.inputRef ?? fieldRef.value?.textareaRef)?.focus())
}

function commit() {
  editing.value = false
  const value = draft.value.trim()
  if (value !== props.modelValue) emit('save', value)
}

function cancel() {
  editing.value = false
  draft.value = props.modelValue
}
</script>

<template>
  <UTextarea
    v-if="editing && multiline"
    ref="fieldRef"
    v-model="draft"
    :rows="3"
    autoresize
    size="sm"
    class="w-full"
    @blur="commit"
    @keydown.esc="cancel"
  />
  <UInput
    v-else-if="editing"
    ref="fieldRef"
    v-model="draft"
    size="sm"
    class="w-full"
    @blur="commit"
    @keydown.enter="commit"
    @keydown.esc="cancel"
  />
  <span v-else class="display" :class="{ empty: !modelValue }" @click="startEdit">
    {{ modelValue || placeholder }}
  </span>
</template>

<style scoped>
.display {
  cursor: text;
  border-bottom: 1px dashed transparent;
}

.display:hover {
  border-bottom-color: var(--border);
}

.display.empty {
  color: var(--text-muted);
  font-style: italic;
}
</style>
