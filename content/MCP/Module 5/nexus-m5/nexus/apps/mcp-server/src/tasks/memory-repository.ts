import type { Task, TaskId } from "@nexus/shared";
import { afterKey, byKey, matches, type TaskPatch, type TaskRepository } from "./repository.ts";

export function createMemoryTaskRepository(seed: readonly Task[], now: () => Date = () => new Date()): TaskRepository {
  const rows = new Map(seed.map((t) => [t.id, { ...t }]));
  let seq = Math.max(0, ...seed.map((t) => Number(t.id.slice(5))));
  return {
    async page(filter, after, limit) {
      const hit = [...rows.values()].filter((t) => matches(t, filter) && (after === undefined || afterKey(t, after))).sort(byKey);
      return { items: hit.slice(0, limit).map((t) => ({ ...t })), hasMore: hit.length > limit };
    },
    async get(id: TaskId) {
      const t = rows.get(id);
      return t ? { ...t } : null;
    },
    async create(input) {
      const at = now().toISOString();
      const t: Task = {
        id: `task_${String(++seq).padStart(4, "0")}`,
        title: input.title,
        status: "todo",
        assignee: input.assignee,
        customerId: input.customerId ?? null,
        dueDate: input.dueDate ?? null,
        createdAt: at,
        updatedAt: at,
      };
      rows.set(t.id, t);
      return { ...t };
    },
    async update(id: TaskId, patch: TaskPatch) {
      const t = rows.get(id);
      if (!t) return null;
      const changed: string[] = [];
      for (const k of ["status", "assignee", "dueDate", "title"] as const) {
        const v = patch[k];
        if (v !== undefined && t[k] !== v) {
          Object.assign(t, { [k]: v });
          changed.push(k);
        }
      }
      if (changed.length > 0) t.updatedAt = now().toISOString();
      return { task: { ...t }, changed };
    },
    async delete(id: TaskId) {
      return rows.delete(id);
    },
  };
}
