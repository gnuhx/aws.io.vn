import { z } from "zod";
import { CustomerIdSchema } from "./customer.ts";

export const TASK_STATUSES = ["todo", "doing", "done"] as const;
export const TaskStatusSchema = z.enum(TASK_STATUSES);
export const TaskIdSchema = z.string().regex(/^task_\d{4,}$/, "id việc có dạng task_0042").brand<"TaskId">();
export type TaskId = z.infer<typeof TaskIdSchema>;
const DateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "ngày dạng YYYY-MM-DD");
const Assignee = z.string().regex(/^[a-z][a-z0-9._-]{1,31}$/, "assignee là tên đăng nhập, ví dụ lan hoặc minh.tran");

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: TaskStatusSchema,
  assignee: z.string(),
  customerId: z.string().nullable(),
  dueDate: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Task = z.infer<typeof TaskSchema>;

// ---------- nexus_list_tasks: lọc theo cách người dùng hỏi + cursor ----------
export const ListTasksInputSchema = z.object({
  status: TaskStatusSchema.optional(),
  assignee: Assignee.optional().describe("Việc của ai"),
  customerId: CustomerIdSchema.optional(),
  dueBefore: DateOnly.optional().describe("Hạn trước ngày này (YYYY-MM-DD) — dùng cho \"việc quá hạn\""),
  cursor: z.string().max(200).optional().describe("nextCursor của trang trước; bỏ trống = trang đầu"),
  limit: z.number().int().min(1).max(50).default(20),
});
export const ListTasksOutputSchema = z.object({
  returned: z.number().int(),
  items: z.array(TaskSchema),
  hasMore: z.boolean().describe("false = đây là trang cuối"),
  nextCursor: z.string().optional().describe("Chỉ có khi hasMore = true; truyền nguyên văn vào lần gọi sau CÙNG bộ lọc"),
});

// ---------- nexus_create_task ----------
export const CreateTaskInputSchema = z.object({
  title: z.string().trim().min(3).max(120),
  assignee: Assignee,
  customerId: CustomerIdSchema.optional(),
  dueDate: DateOnly.optional(),
});
export const TaskResultSchema = z.object({ task: TaskSchema });

// ---------- nexus_update_task: đổi trạng thái, giao lại, dời hạn — 1 tool cho cả 3 việc ----------
export const UpdateTaskInputSchema = z
  .object({
    id: TaskIdSchema,
    status: TaskStatusSchema.optional().describe("done = hoàn thành"),
    assignee: Assignee.optional().describe("Giao lại cho người khác"),
    dueDate: DateOnly.nullable().optional().describe("Dời hạn; null = bỏ hạn"),
    title: z.string().trim().min(3).max(120).optional(),
  })
  .refine((v) => v.status !== undefined || v.assignee !== undefined || v.dueDate !== undefined || v.title !== undefined, {
    message: "cần ít nhất 1 thay đổi: status, assignee, dueDate hoặc title",
  });
export const UpdateTaskOutputSchema = z.object({ task: TaskSchema, changed: z.array(z.string()) });

// ---------- nexus_delete_task ----------
export const DeleteTaskInputSchema = z.object({ id: TaskIdSchema });
export const DeleteTaskOutputSchema = z.object({ id: z.string(), deleted: z.literal(true) });
