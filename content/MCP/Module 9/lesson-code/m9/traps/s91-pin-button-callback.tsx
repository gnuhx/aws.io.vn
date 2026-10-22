"use client";
import { useState } from "react";

// Thói quen React/Blazor: cha truyền callback xuống con.
export function PinButton({ name, onPin }: { name: string; onPin: (pinned: boolean) => void }) {
  const [pinned, setPinned] = useState(false);
  return (
    <button type="button" onClick={() => { setPinned(!pinned); onPin(!pinned); }}>
      {pinned ? `★ Đã ghim ${name}` : "☆ Ghim"}
    </button>
  );
}
