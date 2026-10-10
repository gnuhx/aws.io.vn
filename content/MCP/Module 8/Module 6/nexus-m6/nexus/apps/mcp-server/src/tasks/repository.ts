import type { Task, TaskFilter, TaskId } from "@nexus/shared";

/** Khóa sắp xếp duy nhất cho keyset: (createdAt, id) — M5 · S5.5. */
export interface TaskKey {
  createdAt: string;
  id: string;
}

export type NewTask = Pick<Task, "title" | "assignee" | "customerId" | "dueDate">;
export type TaskPatch = Partial<Pick<Task, "title" | "status" | "assignee" | "dueDate">>;

export interface TaskRepository {
  /** Lấy `limit + 1` bản ghi sau `after` để biết còn trang hay không. */
  page(filter: TaskFilter, after: TaskKey | undefined, limit: number): Promise<{ items: Task[]; hasMore: boolean }>;
  get(id: TaskId): Promise<Task | undefined>;
  create(input: NewTask): Promise<Task>;
  update(id: TaskId, patch: TaskPatch): Promise<{ task: Task; changed: string[] } | undefined>;
  delete(id: TaskId): Promise<boolean>;
}

export const byKey = (a: TaskKey, b: TaskKey): number => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);
export const afterKey = (t: TaskKey, k: TaskKey): boolean => byKey(t, k) > 0;

export function matches(t: Task, f: TaskFilter): boolean {
  return (
    (!f.status || t.status === f.status) &&
    (!f.assignee || t.assignee === f.assignee) &&
    (!f.customerId || t.customerId === f.customerId) &&
    (!f.dueBefore || (t.dueDate !== null && t.dueDate < f.dueBefore))
  );
}
