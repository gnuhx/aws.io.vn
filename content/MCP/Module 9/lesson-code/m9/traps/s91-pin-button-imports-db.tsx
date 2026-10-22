"use client";
import { useState } from "react";
import { listWorkspaces } from "@/lib/db/workspaces";

// Client Component: chỉ phần cần tương tác. Nhận props đã serialize từ server.
export function PinButton({ name }: { name: string }) {
  const [pinned, setPinned] = useState(false);
  void listWorkspaces; // "tiện tay" lấy luôn danh sách ở client
  return (
    <button type="button" aria-pressed={pinned} onClick={() => setPinned((p) => !p)}>
      {pinned ? `★ Đã ghim ${name}` : "☆ Ghim"}
    </button>
  );
}
