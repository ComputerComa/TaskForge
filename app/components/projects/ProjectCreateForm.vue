<script setup lang="ts">
import type { ProjectSummary } from '~~/shared/types/entities'

const emit = defineEmits<{ created: [project: ProjectSummary] }>()

const open = ref(false)
const identifier = ref('')
const name = ref('')
const description = ref('')
const error = ref('')
const submitting = ref(false)

async function submit() {
  error.value = ''
  submitting.value = true
  try {
    const project = await $fetch<ProjectSummary>('/api/projects', {
      method: 'POST',
      body: { identifier: identifier.value, name: name.value, description: description.value },
    })
    identifier.value = ''
    name.value = ''
    description.value = ''
    open.value = false
    emit('created', project)
  } catch (err: any) {
    error.value = err?.data?.statusMessage ?? err?.data?.message ?? 'Could not create project'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="create">
    <button v-if="!open" type="button" class="primary" @click="open = true">New project</button>
    <form v-else class="form" @submit.prevent="submit">
      <label>
        Identifier
        <input v-model="identifier" placeholder="HOMELABREFRESH" required autofocus />
      </label>
      <label>
        Name
        <input v-model="name" placeholder="Homelab Server Migration" required />
      </label>
      <label>
        Description
        <textarea v-model="description" rows="2" />
      </label>
      <p v-if="error" class="error">{{ error }}</p>
      <div class="actions">
        <button type="submit" class="primary" :disabled="submitting">Create</button>
        <button type="button" @click="open = false">Cancel</button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface);
  max-width: 24rem;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.8rem;
  color: var(--text-muted);
}

input,
textarea {
  padding: 0.35rem 0.5rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--bg);
}

.actions {
  display: flex;
  gap: 0.5rem;
}

button {
  padding: 0.35rem 0.7rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--surface);
  cursor: pointer;
}

button.primary {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
}

.error {
  margin: 0;
  color: var(--danger);
  font-size: 0.8rem;
}
</style>
