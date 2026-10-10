import { TaskIdSchema, type Task, type TaskFilter, type TaskId } from "@nexus/shared";
import { afterKey, byKey, matches, type NewTask, type TaskKey, type TaskPatch, type TaskRepository } from "./repository.ts";

export function createMemoryTasks(seed: readonly Task[], now: () => Date = () => new Date()): TaskRepository {
  const rows = new Map<string, Task>(seed.map((t) => [t.id, { ...t }]));
  let next = seed.length + 1;
  const sorted = (): Task[] => [...rows.values()].sort(byKey);
  return {
    async page(filter: TaskFilter, after: TaskKey | undefined, limit: number) {
      const hit = sorted().filter((t) => matches(t, filter) && (!after || afterKey(t, after)));
      return { items: hit.slice(0, limit), hasMore: hit.length > limit };
    },
    async get(id: TaskId) {
      return rows.get(id);
    },
    async create(input: NewTask) {
      const task: Task = {
        ...input,
        id: TaskIdSchema.parse(`task_${String(next++).padStart(4, "0")}`),
        status: "todo",
        createdAt: now().toISOString(),
      };
      rows.set(task.id, task);
      return task;
    },
    async update(id: TaskId, patch: TaskPatch) {
      const cur = rows.get(id);
      if (!cur) return undefined;
      const changed = (Object.keys(patch) as (keyof TaskPatch)[]).filter((k) => patch[k] !== undefined && patch[k] !== cur[k]);
      const task = { ...cur, ...Object.fromEntries(changed.map((k) => [k, patch[k]])) } as Task;
      rows.set(id, task);
      return { task, changed };
    },
    async delete(id: TaskId) {
      return rows.delete(id);
    },
  };
}
