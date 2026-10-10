import type { Customer } from "@nexus/shared";

export interface CustomerQuery {
  /** Tên thành phố người dùng gõ; repository tự chuẩn hóa. */
  city?: string | undefined;
  limit: number;
}

export interface CustomerPage {
  /** Tổng số bản ghi khớp filter — KHÔNG bị cắt bởi limit. */
  total: number;
  items: Customer[];
}

/** Cổng dữ liệu mà tool phụ thuộc vào. Tool không biết Mongo tồn tại. */
export interface CustomerRepository {
  list(query: CustomerQuery): Promise<CustomerPage>;
}
