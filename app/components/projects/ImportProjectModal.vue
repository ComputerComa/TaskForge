<script setup lang="ts">
import { exportDocumentSchema } from '~~/shared/schemas/import-export.schema'
import type { ExportDocument } from '~~/shared/schemas/import-export.schema'

const emit = defineEmits<{ imported: [id: number] }>()

const open = ref(false)
const parsedDocument = ref<ExportDocument | null>(null)
const identifier = ref('')
const error = ref('')
const conflict = ref(false)
const submitting = ref(false)

const phaseCount = computed(() => parsedDocument.value?.phases.length ?? 0)
const taskCount = computed(
  () => parsedDocument.value?.phases.reduce((sum, phase) => sum + phase.tasks.length, 0) ?? 0,
)
const eventCount = computed(() => parsedDocument.value?.events.length ?? 0)

function reset() {
  parsedDocument.value = null
  identifier.value = ''
  error.value = ''
  conflict.value = false
  submitting.value = false
}

function launch() {
  reset()
  open.value = true
}

function close() {
  open.value = false
}

async function onFileChange(domEvent: Event) {
  error.value = ''
  conflict.value = false
  parsedDocument.value = null

  const input = domEvent.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  let parsed: unknown
  try {
    parsed = JSON.parse(await file.text())
  } catch {
    error.value = 'That file is not valid JSON.'
    return
  }

  const result = exportDocumentSchema.safeParse(parsed)
  if (!result.success) {
    error.value = result.error.issues[0]?.message ?? 'That file is not a valid project export.'
    return
  }

  parsedDocument.value = result.data
  identifier.value = result.data.project.identifier
}

async function submit(overwrite: boolean) {
  if (!parsedDocument.value) return
  error.value = ''
  conflict.value = false
  submitting.value = true
  try {
    const project = await $fetch<{ id: number }>('/api/projects/import', {
      method: 'POST',
      body: { document: parsedDocument.value, identifier: identifier.value, overwrite },
    })
    emit('imported', project.id)
    open.value = false
    await navigateTo(`/projects/${project.id}`)
  } catch (err: any) {
    const status = err?.response?.status ?? err?.statusCode
    error.value = err?.data?.statusMessage ?? err?.data?.message ?? 'Could not import the project'
    conflict.value = status === 409
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <UButton label="Import project" icon="i-lucide-upload" color="neutral" variant="outline" @click="launch" />

  <UModal v-model:open="open" title="Import project">
    <template #body>
      <div class="flex flex-col gap-4">
        <UFormField label="Export file">
          <input type="file" accept=".json,application/json" class="block w-full text-sm" @change="onFileChange" />
        </UFormField>

        <div v-if="parsedDocument" class="flex flex-col gap-3">
          <div class="rounded-md border border-default p-3 text-sm">
            <p class="font-medium text-default">{{ parsedDocument.project.name }}</p>
            <p v-if="parsedDocument.project.description" class="mt-1 text-muted">
              {{ parsedDocument.project.description }}
            </p>
            <p class="mt-2 text-muted">
              {{ phaseCount }} phase{{ phaseCount === 1 ? '' : 's' }},
              {{ taskCount }} task{{ taskCount === 1 ? '' : 's' }},
              {{ eventCount }} event{{ eventCount === 1 ? '' : 's' }}
            </p>
          </div>

          <UFormField label="Identifier">
            <UInput v-model="identifier" class="w-full" @input="conflict = false" />
          </UFormField>

          <div v-if="conflict" class="flex flex-col gap-2 rounded-md border border-warning p-3 text-sm">
            <p class="text-warning">{{ error }}</p>
            <p class="text-muted">
              Choose a different identifier above, or overwrite the existing project -- this
              permanently deletes its current phases, tasks, and events.
            </p>
            <UButton
              label="Overwrite existing project"
              color="error"
              variant="outline"
              size="sm"
              class="self-start"
              :loading="submitting"
              @click="submit(true)"
            />
          </div>
        </div>

        <p v-if="error && !conflict" class="text-sm text-error">{{ error }}</p>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-between">
        <UButton label="Cancel" color="neutral" variant="ghost" @click="close" />
        <UButton
          :label="submitting ? 'Importing...' : 'Import'"
          :loading="submitting"
          :disabled="!parsedDocument"
          @click="submit(false)"
        />
      </div>
    </template>
  </UModal>
</template>
