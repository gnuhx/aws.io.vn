/** "Hà Nội" → "ha noi": so khớp không phân biệt dấu/hoa thường (luật enrich S6.2, completion S6.3). */
export const fold = (s: string): string =>
  s.normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
