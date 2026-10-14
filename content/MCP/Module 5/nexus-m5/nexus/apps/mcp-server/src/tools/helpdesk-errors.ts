import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { ApiError } from "../http/api-client.ts";
import { toolFail } from "../tool-result.ts";

/** Dịch ApiError → câu model đọc được + bước tiếp theo. Lỗi lạ: ném tiếp cho instrument. */
export function helpdeskFailure(err: unknown): CallToolResult {
  if (!(err instanceof ApiError)) throw err;
  const secs = err.retryAfterMs !== undefined ? Math.ceil(err.retryAfterMs / 1000) : undefined;
  switch (err.kind) {
    case "rate_limited":
      return toolFail({
        what: `Helpdesk đang giới hạn tần suất${secs !== undefined ? ` (cần đợi ${secs} giây)` : ""}.`,
        next: `Đừng gọi lại ngay. Báo người dùng thử lại${secs !== undefined ? ` sau ${secs} giây` : " sau ít phút"}.`,
      });
    case "auth":
      return toolFail({ what: "Nexus chưa được cấu hình đúng quyền truy cập helpdesk.", next: "Không thử lại; báo người dùng liên hệ quản trị viên." });
    case "timeout":
    case "unavailable":
      return toolFail({ what: "Helpdesk không phản hồi.", next: "Thử lại sau ít phút; không đoán nội dung ticket." });
    case "bad_request":
      return toolFail({ what: err.message, next: "Sửa dữ liệu theo thông báo rồi gọi lại." });
    case "not_found":
    case "bad_response":
      return toolFail({ what: "Helpdesk trả kết quả không dùng được.", next: "Báo người dùng; không thử lại liên tục." });
  }
}
