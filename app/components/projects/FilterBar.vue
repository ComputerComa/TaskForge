<script setup lang="ts">
import { projectUiKey } from '~/composables/useProjectDetailUi'

const uiApi = inject(projectUiKey)!
</script>

<template>
  <div class="filters">
    <label>
      <input v-model="uiApi.filters.hideBlocked" type="checkbox" />
      Hide blocked
    </label>
    <label>
      <input v-model="uiApi.filters.actionableOnly" type="checkbox" />
      Actionable only
    </label>
    <label>
      <input v-model="uiApi.filters.showCompleted" type="checkbox" />
      Show completed
    </label>
  </div>
</template>

<style scoped>
.filters {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  font-size: 0.8rem;
  color: var(--text-muted);
}

label {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  cursor: pointer;
}

input[type='checkbox'] {
  cursor: pointer;
}
</style>
