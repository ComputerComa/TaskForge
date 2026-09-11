# Todos

## UI

- Better Render / handle Block Tasks. (Instead of showing message maybe hide all following Tasks / Phases?)
- Reorder mode for tasks and phases -- an explicit toggle that shows drag handles / up-down controls only while active, instead of always-visible per-item arrows. `swapPositions` in `app/composables/useProjectTree.ts` already does the position-swap; this is just the missing UI.

## App Wide

- Implement Reminders / Overdue Task notifications with Email / integrated app notifications
- Follow up - implement user preferences. (hide upcoming phases by default)
- Consider a real task dependency graph (blocked-by relationships between tasks), deferred when comparing against `homelab-migration.yml`'s `depends_on`. Today, blocking is sequential-order + blocker Events only.
