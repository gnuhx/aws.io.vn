/**
 * BẢN DỊCH THẲNG TỪ C# (để so sánh — đừng dùng): mỗi tool tự đo giờ bằng Stopwatch + tự mở Activity,
 * kế thừa 1 base class. Qua tsc. Vấn đề:
 *  - 12 tool = 12 chỗ phải nhớ gọi base; tool quên kế thừa → không có số liệu, không ai báo;
 *  - đo trong handler nên KHÔNG thấy thời gian ở transport/client (S8.3: 99.8% của tool chậm nhất nằm ở client);
 *  - console.log ra stdout — với server stdio là phá kênh JSON-RPC (Bẫy 2);
 *  - không có trace context: số đo của server không nối được với câu hỏi nào của người dùng.
 */
import { performance } from "node:perf_hooks";

export abstract class TimedToolBase<TArgs, TResult> {
  abstract readonly name: string;
  protected abstract executeCore(args: TArgs): Promise<TResult>;

  async execute(args: TArgs): Promise<TResult> {
    const sw = performance.now(); // Stopwatch.StartNew()
    try {
      return await this.executeCore(args);
    } finally {
      console.log(`[${this.name}] ${(performance.now() - sw).toFixed(1)} ms`); // _logger.LogInformation(...)
    }
  }
}

export class GetCustomerTool extends TimedToolBase<{ id: string }, { name: string }> {
  readonly name = "nexus_get_customer";
  protected async executeCore(args: { id: string }): Promise<{ name: string }> {
    return { name: `khách ${args.id}` };
  }
}
