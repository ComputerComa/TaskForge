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
const inputRef = ref<HTMLInputElement | HTMLTextAreaElement>()

function startEdit() {
  draft.value = props.modelValue
  editing.value = true
  nextTick(() => inputRef.value?.focus())
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
  <textarea
    v-if="editing && multiline"
    ref="inputRef"
    v-model="draft"
    rows="3"
    @blur="commit"
    @keydown.esc="cancel"
  />
  <input
    v-else-if="editing"
    ref="inputRef"
    v-model="draft"
    type="text"
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

input,
textarea {
  width: 100%;
  padding: 0.2rem 0.35rem;
  border: 1px solid var(--accent);
  border-radius: 3px;
  background: var(--surface);
}
</style>
