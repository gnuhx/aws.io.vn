import type { Task } from "@nexus/shared";

const ASSIGNEES = ["lan", "minh", "hoa", "tuan", "linh"] as const;
const VERBS = ["Gọi lại", "Gửi báo giá cho", "Gia hạn hợp đồng", "Xử lý ticket của", "Đối soát công nợ"] as const;

/** n việc; mỗi 5 việc tạo CÙNG 1 thời điểm (import hàng loạt) → createdAt trùng nhau là chuyện thật. */
export function seedTasks(n = 1_000): Task[] {
  const base = Date.UTC(2026, 6, 1);
  return Array.from({ length: n }, (_, i) => {
    const at = new Date(base + Math.floor(i / 5) * 60_000).toISOString();
    const cus = `cus_${String((i % 30) + 1).padStart(3, "0")}`;
    return {
      id: `task_${String(i + 1).padStart(4, "0")}`,
      title: `${VERBS[i % VERBS.length]} ${cus}`,
      status: i % 7 === 0 ? "done" : i % 3 === 0 ? "doing" : "todo",
      assignee: ASSIGNEES[i % ASSIGNEES.length] ?? "lan",
      customerId: i % 4 === 0 ? null : cus,
      dueDate: i % 6 === 0 ? null : new Date(base + (i % 90) * 86_400_000).toISOString().slice(0, 10),
      createdAt: at,
      updatedAt: at,
    };
  });
}
