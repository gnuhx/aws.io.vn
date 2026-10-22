/**
 * BẢN DỊCH THẲNG TỪ C# (để so sánh — đừng dùng): eval kiểu xUnit [Theory][InlineData] với đáp án CỨNG.
 * Qua tsc. Vấn đề: seed đổi (S8.2 thêm cus_031, S8.4 đổi ngày) là cả bảng đỏ dù server đúng; đáp án "133" không nói
 * vì sao; không ghi model đã đi đường nào (tool nào) — sai thì không biết sửa description hay sửa tool.
 */
export interface EvalCase {
  question: string;
  expected: string;
}

export class CapstoneTests {
  static readonly cases: EvalCase[] = [
    { question: "Doanh thu tháng 9/2026?", expected: "601.400.000" },
    { question: "Lan còn bao nhiêu việc chưa xong?", expected: "133" },
    { question: "Có bao nhiêu khách gói enterprise?", expected: "7" },
  ];

  static run(ask: (q: string) => string): number {
    let pass = 0;
    for (const c of CapstoneTests.cases) if (ask(c.question).includes(c.expected)) pass++; // "133" khớp cả "1330", "2133"…
    return pass;
  }
}
