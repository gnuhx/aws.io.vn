import { z } from "zod";
import { CustomerIdSchema } from "./customer.ts";

export const TASK_STATUSES = ["todo", "doing", "done"] as const;
export const ASSIGNEES = ["lan", "minh", "huy", "trang", "an"] as const;

export const TaskIdSchema = z
  .string()
  .regex(/^task_\d{4,}$/, { error: "id việc có dạng task_ + 4 chữ số, ví dụ task_0042" })
  .brand<"TaskId">();
export type TaskId = z.infer<typeof TaskIdSchema>;

const Day = z.iso.date();

export const TaskSchema = z.object({
  id: TaskIdSchema,
  title: z.string().min(3).max(120),
  status: z.enum(TASK_STATUSES),
  assignee: z.enum(ASSIGNEES),
  customerId: CustomerIdSchema.nullable(),
  dueDate: Day.nullable(),
  createdAt: z.iso.datetime(),
});
export type Task = z.infer<typeof TaskSchema>;

export const ListTasksInputSchema = z.object({
  status: z.enum(TASK_STATUSES).optional(),
  assignee: z.enum(ASSIGNEES).optional(),
  customerId: CustomerIdSchema.optional(),
  dueBefore: Day.optional().describe("Hạn trước ngày này (YYYY-MM-DD)"),
  cursor: z.string().max(400).optional().describe("Chép nguyên văn nextCursor của lần gọi trước; bỏ trống để lấy trang đầu"),
  limit: z.number().int().min(1).max(50).default(20),
});
export type TaskFilter = Omit<z.infer<typeof ListTasksInputSchema>, "cursor" | "limit">;
export const ListTasksOutputSchema = z.object({
  items: z.array(TaskSchema),
  hasMore: z.boolean(),
  nextCursor: z.string().optional(),
});

export const CreateTaskInputSchema = z.object({
  title: z.string().min(3).max(120),
  assignee: z.enum(ASSIGNEES),
  customerId: CustomerIdSchema.optional(),
  dueDate: Day.optional(),
});
export const TaskOutputSchema = z.object({ task: TaskSchema });

export const UpdateTaskInputSchema = z
  .object({
    id: TaskIdSchema,
    title: z.string().min(3).max(120).optional(),
    status: z.enum(TASK_STATUSES).optional(),
    assignee: z.enum(ASSIGNEES).optional(),
    dueDate: Day.nullable().optional(),
  })
  .refine((x) => x.title !== undefined || x.status !== undefined || x.assignee !== undefined || x.dueDate !== undefined, {
    error: "cần ít nhất 1 thay đổi (title, status, assignee hoặc dueDate)",
  });
export const UpdateTaskOutputSchema = z.object({ task: TaskSchema, changed: z.array(z.string()) });

export const DeleteTaskInputSchema = z.object({ id: TaskIdSchema });
export const DeleteTaskOutputSchema = z.object({
  deleted: z.boolean(),
  id: TaskIdSchema,
  note: z.string().describe("Vì sao xóa / không xóa — nói lại cho người dùng"),
});

export const ExportTasksInputSchema = z.object({
  filename: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]{0,60}\.csv$/, { error: "tên file: chữ thường, số, gạch ngang, đuôi .csv — ví dụ viec-cua-lan.csv" }),
  status: z.enum(TASK_STATUSES).optional(),
  assignee: z.enum(ASSIGNEES).optional(),
  overwrite: z.boolean().default(false),
});
export const ExportTasksOutputSchema = z.object({
  written: z.boolean(),
  location: z.enum(["client_root", "server_dir"]).describe("client_root = thư mục làm việc client khai báo (roots)"),
  root: z.string(),
  path: z.string().describe("Đường dẫn tương đối trong root"),
  rows: z.number().int(),
  bytes: z.number().int(),
  note: z.string(),
});
