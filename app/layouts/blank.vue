<template>
  <div class="blank">
    <slot />
  </div>
</template>

<style scoped>
.blank {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
}
</style>
