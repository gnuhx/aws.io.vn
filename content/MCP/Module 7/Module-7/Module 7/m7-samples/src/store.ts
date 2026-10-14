import { readFileSync, renameSync, writeFileSync, existsSync } from "node:fs";
import { z } from "zod";

export const TaskSchema = z.object({ id: z.string(), title: z.string(), owner: z.string(), done: z.boolean() });
export type Task = z.infer<typeof TaskSchema>;
const FileSchema = z.object({ seq: z.number().int(), tasks: z.array(TaskSchema) });

/** Cổng dữ liệu. Stateless (S7.2) cần store DÙNG CHUNG giữa các instance: file ở đây, Mongo ở M10. */
export type TaskStore = {
  list(owner?: string): Task[];
  create(title: string, owner: string): Task;
  delete(id: string): boolean;
};

const SEED: Task[] = [
  { id: "t1", title: "Gọi lại khách Cà phê Phố Cổ", owner: "lan", done: false },
  { id: "t2", title: "Gửi báo giá quý 4", owner: "minh", done: false },
  { id: "t3", title: "Chốt hợp đồng Tạp hóa Cô Ba", owner: "lan", done: true },
];

export function createMemoryStore(seed: Task[] = SEED): TaskStore {
  const tasks = seed.map((t) => ({ ...t }));
  let seq = tasks.length;
  return {
    list: (owner) => tasks.filter((t) => !owner || t.owner === owner),
    create(title, owner) {
      const t = { id: `t${++seq}`, title, owner, done: false };
      tasks.push(t);
      return t;
    },
    delete(id) {
      const i = tasks.findIndex((t) => t.id === id);
      if (i < 0) return false;
      tasks.splice(i, 1);
      return true;
    },
  };
}

/** Store dùng chung qua 1 file JSON: đủ để 2 process thấy cùng dữ liệu. Ghi qua file tạm + rename (không ghi dở). */
export function createFileStore(path: string): TaskStore {
  type Data = z.infer<typeof FileSchema>;
  const read = (): Data => (existsSync(path) ? FileSchema.parse(JSON.parse(readFileSync(path, "utf8"))) : { seq: SEED.length, tasks: SEED });
  const write = (d: Data): void => {
    writeFileSync(`${path}.${process.pid}.tmp`, JSON.stringify(d));
    renameSync(`${path}.${process.pid}.tmp`, path);
  };
  return {
    list: (owner) => read().tasks.filter((t) => !owner || t.owner === owner),
    create(title, owner) {
      const d = read();
      const t = { id: `t${++d.seq}`, title, owner, done: false };
      d.tasks.push(t);
      write(d);
      return t;
    },
    delete(id) {
      const d = read();
      const n = d.tasks.length;
      d.tasks = d.tasks.filter((t) => t.id !== id);
      write(d);
      return d.tasks.length < n;
    },
  };
}
