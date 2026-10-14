import type { Task, TaskId } from "@nexus/shared";
import type { Db, Filter } from "mongodb";
import type { TaskFilter, TaskKey, TaskPatch, TaskRepository } from "./repository.ts";

type TaskDoc = Omit<Task, "id"> & { _id: string };
const toTask = ({ _id, ...rest }: TaskDoc): Task => ({ id: _id, ...rest });

/**
 * Bản Mongo — chưa chạy ở sandbox dựng bài (không có Mongo).
 * Index bắt buộc cho keyset: { createdAt: 1, _id: 1 } (+ { assignee: 1, createdAt: 1, _id: 1 } cho "việc của tôi").
 */
export function createMongoTaskRepository(db: Db): TaskRepository {
  const col = db.collection<TaskDoc>("tasks");
  const where = (f: TaskFilter, after: TaskKey | undefined): Filter<TaskDoc> => ({
    ...(f.status ? { status: f.status } : {}),
    ...(f.assignee ? { assignee: f.assignee } : {}),
    ...(f.customerId ? { customerId: f.customerId } : {}),
    ...(f.dueBefore ? { dueDate: { $ne: null, $lt: f.dueBefore } } : {}),
    ...(after
      ? { $or: [{ createdAt: { $gt: after.createdAt } }, { createdAt: after.createdAt, _id: { $gt: after.id } }] }
      : {}),
  });
  return {
    async page(filter, after, limit) {
      const docs = await col.find(where(filter, after)).sort({ createdAt: 1, _id: 1 }).limit(limit + 1).toArray();
      return { items: docs.slice(0, limit).map(toTask), hasMore: docs.length > limit };
    },
    async get(id: TaskId) {
      const d = await col.findOne({ _id: id });
      return d ? toTask(d) : null;
    },
    async create(input) {
      const at = new Date().toISOString();
      // Id tuần tự qua collection counters (findOneAndUpdate + $inc, upsert)
      const c = await db
        .collection<{ _id: string; seq: number }>("counters")
        .findOneAndUpdate({ _id: "tasks" }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: "after" });
      const doc: TaskDoc = {
        _id: `task_${String(c?.seq ?? Date.now()).padStart(4, "0")}`,
        title: input.title,
        status: "todo",
        assignee: input.assignee,
        customerId: input.customerId ?? null,
        dueDate: input.dueDate ?? null,
        createdAt: at,
        updatedAt: at,
      };
      await col.insertOne(doc);
      return toTask(doc);
    },
    async update(id: TaskId, patch: TaskPatch) {
      const before = await col.findOne({ _id: id });
      if (!before) return null;
      const set: Partial<TaskDoc> = {};
      const changed: string[] = [];
      for (const k of ["status", "assignee", "dueDate", "title"] as const) {
        const v = patch[k];
        if (v !== undefined && before[k] !== v) {
          Object.assign(set, { [k]: v });
          changed.push(k);
        }
      }
      if (changed.length === 0) return { task: toTask(before), changed };
      const after = await col.findOneAndUpdate({ _id: id }, { $set: { ...set, updatedAt: new Date().toISOString() } }, { returnDocument: "after" });
      return after ? { task: toTask(after), changed } : null;
    },
    async delete(id: TaskId) {
      return (await col.deleteOne({ _id: id })).deletedCount === 1;
    },
  };
}
