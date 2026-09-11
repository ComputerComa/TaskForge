# Todos

## UI

- Refactor to use Nuxt UI and Nuxt Icons
- Cleanup Project view to make Tasks More Intuitive. (Big drop down for every task? Really? )
- Fix Dashboard page to better fit the Project Cards.
- Better Render / handle Block Tasks. (Instead of showing message maybe hide all following Tasks / Phases?)
- phases in the Project View should only show the current in progress state by default unless the user has a preference set to show all upcoming phases (See App wide / user Preferences)
- Better Dashboard Card overview. (Right now very compact not obvious what is being shown)
  - Items on card Should show:
    • Current Phase
    • Overall Progress
    • Overall State

## App Wide

- Implement Reminders / Overdue Task notifications with Email / integrated app notifications
- Follow up - implement user preferences. (hide upcoming phases by default)
- Consider a real task dependency graph (blocked-by relationships between tasks), deferred when comparing against `homelab-migration.yml`'s `depends_on`. Today, blocking is sequential-order + blocker Events only.

## Misc

- Automatically Mark upcoming phases as Pending / waiting /etc.
