import { ASSIGNEES, TaskSchema, TASK_STATUSES, type Task } from "@nexus/shared";

const TITLES = ["Gọi lại", "Gửi báo giá cho", "Hẹn demo với", "Thu công nợ", "Khảo sát hài lòng", "Gia hạn hợp đồng"] as const;

/** 1000 việc, 5 việc / 1 thời điểm (nhập hàng loạt) — để keyset chỉ theo createdAt lộ bug (M5 · S5.5). */
export function makeTasks(count = 1000): Task[] {
  const base = Date.UTC(2026, 6, 1);
  return Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    const cust = (i % 30) + 1;
    const due = new Date(Date.UTC(2026, 8, 1) + (i % 60) * 86_400_000).toISOString().slice(0, 10);
    return TaskSchema.parse({
      id: `task_${String(n).padStart(4, "0")}`,
      title: `${TITLES[i % TITLES.length]} cus_${String(cust).padStart(3, "0")}`,
      status: TASK_STATUSES[(i * 7) % 3],
      assignee: ASSIGNEES[(i * 3) % ASSIGNEES.length],
      customerId: i % 4 === 3 ? null : `cus_${String(cust).padStart(3, "0")}`,
      dueDate: i % 5 === 4 ? null : due,
      createdAt: new Date(base + Math.floor(i / 5) * 60_000).toISOString(),
    });
  });
}

export const SEED_TASKS: readonly Task[] = makeTasks();
