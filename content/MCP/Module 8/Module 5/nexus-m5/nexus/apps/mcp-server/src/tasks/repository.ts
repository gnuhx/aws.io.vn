import type { Task, TaskId } from "@nexus/shared";

export interface TaskFilter {
  status?: Task["status"] | undefined;
  assignee?: string | undefined;
  customerId?: string | undefined;
  dueBefore?: string | undefined;
}
/** Khóa sắp xếp ổn định: createdAt có thể trùng (tạo hàng loạt) → thêm id để phân định. */
export interface TaskKey {
  createdAt: string;
  id: string;
}
export interface TaskPatch {
  status?: Task["status"] | undefined;
  assignee?: string | undefined;
  dueDate?: string | null | undefined;
  title?: string | undefined;
}

export interface TaskRepository {
  /** Keyset: trả các việc có (createdAt, id) > after, theo thứ tự tăng dần, tối đa limit. */
  page(filter: TaskFilter, after: TaskKey | undefined, limit: number): Promise<{ items: Task[]; hasMore: boolean }>;
  get(id: TaskId): Promise<Task | null>;
  create(input: { title: string; assignee: string; customerId?: string | undefined; dueDate?: string | undefined }): Promise<Task>;
  update(id: TaskId, patch: TaskPatch): Promise<{ task: Task; changed: string[] } | null>;
  delete(id: TaskId): Promise<boolean>;
}

export const keyOf = (t: Task): TaskKey => ({ createdAt: t.createdAt, id: t.id });
export const afterKey = (t: Task, k: TaskKey): boolean => t.createdAt > k.createdAt || (t.createdAt === k.createdAt && t.id > k.id);
export const byKey = (a: Task, b: Task): number => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);

export const matches = (t: Task, f: TaskFilter): boolean =>
  (f.status === undefined || t.status === f.status) &&
  (f.assignee === undefined || t.assignee === f.assignee) &&
  (f.customerId === undefined || t.customerId === f.customerId) &&
  (f.dueBefore === undefined || (t.dueDate !== null && t.dueDate < f.dueBefore));
