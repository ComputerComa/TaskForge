<script setup lang="ts">
const { user, clear } = useUserSession()

async function logout() {
  await clear()
  await navigateTo('/login')
}
</script>

<template>
  <div class="shell">
    <header class="topbar">
      <NuxtLink to="/" class="brand">TaskForge</NuxtLink>
      <div class="spacer" />
      <span v-if="user" class="username">{{ user.username }}</span>
      <button type="button" class="link-button" @click="logout">Log out</button>
    </header>
    <main class="content">
      <slot />
    </main>
  </div>
</template>

<style>
:root {
  color-scheme: light dark;
  --bg: #fafafa;
  --surface: #ffffff;
  --border: #dcdcdc;
  --text: #1a1a1a;
  --text-muted: #666666;
  --accent: #2b5fd9;
  --danger: #c0392b;
  font-family:
    ui-sans-serif,
    system-ui,
    -apple-system,
    'Segoe UI',
    sans-serif;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #14161a;
    --surface: #1c1f24;
    --border: #33373d;
    --text: #e8e8e8;
    --text-muted: #9a9a9a;
    --accent: #6d93ff;
  }
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
}

button,
input,
select,
textarea {
  font: inherit;
  color: inherit;
}

a {
  color: var(--accent);
}

/* Briefly highlights an element jumped to from the event rail. */
.flash-highlight {
  animation: flash-highlight 1.4s ease-out;
}

@keyframes flash-highlight {
  0% {
    background-color: color-mix(in srgb, var(--accent) 25%, transparent);
  }
  100% {
    background-color: transparent;
  }
}
</style>

<style scoped>
.shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.topbar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 1rem;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}

.brand {
  font-weight: 600;
  text-decoration: none;
  color: var(--text);
}

.spacer {
  flex: 1;
}

.username {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.link-button {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0.25rem 0.4rem;
}

.link-button:hover {
  color: var(--text);
}

.content {
  flex: 1;
  padding: 1rem;
  max-width: 960px;
  width: 100%;
  margin: 0 auto;
}
</style>
