import { z } from 'zod'

// Self-dependency is the only thing Zod alone can check here -- it has no
// DB access. Cycle detection needs the full existing edge set for the
// project and is layered on top in the API route
// (see server/utils/db-helpers.ts -> assertNoDependencyCycle), following
// the same DFS shape Kahboard-Seeder uses for its YAML `depends_on` graphs.
export const addTaskDependencySchema = z
  .object({
    taskId: z.number().int().positive(),
    dependsOnTaskId: z.number().int().positive(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.taskId === data.dependsOnTaskId) {
      ctx.addIssue({
        code: 'custom',
        message: 'A task cannot depend on itself',
        path: ['dependsOnTaskId'],
      })
    }
  })

export type AddTaskDependencyPayload = z.infer<typeof addTaskDependencySchema>
