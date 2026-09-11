<script setup lang="ts">
import { projectUiKey } from '~/composables/useProjectDetailUi'

const uiApi = inject(projectUiKey)!
</script>

<template>
  <div class="filters">
    <UCheckbox v-model="uiApi.filters.hideBlocked" label="Hide blocked" />
    <UCheckbox v-model="uiApi.filters.actionableOnly" label="Actionable only" />
    <UCheckbox v-model="uiApi.filters.showCompleted" label="Show completed" />
  </div>
</template>

<style scoped>
.filters {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}
</style>
