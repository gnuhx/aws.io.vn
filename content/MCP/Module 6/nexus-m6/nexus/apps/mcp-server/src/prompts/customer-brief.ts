import { completable } from "@modelcontextprotocol/sdk/server/completable.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CITIES, CitySchema, CustomerBriefArgsSchema, PROMPT, TOOL } from "@nexus/shared";
import { COMPLETION_FETCH } from "../customers/repository.ts";
import type { Deps } from "../deps.ts";
import { fold } from "../text.ts";

export function registerCustomerBrief(server: McpServer, deps: Deps): void {
  const shape = CustomerBriefArgsSchema.shape;
  server.registerPrompt(
    PROMPT.customerBrief,
    {
      title: "Brief khách trước cuộc gọi",
      description: "Tóm tắt 1 khách: hồ sơ, doanh số 3 tháng gần nhất, việc còn mở.",
      argsSchema: {
        city: completable(shape.city.clone(), (value) => CITIES.filter((c) => fold(c).startsWith(fold(value ?? "")))),
        customer: completable(shape.customer.clone(), async (value, ctx) => {
          // context.arguments: các argument người dùng ĐÃ điền — city đã chọn thì chỉ gợi ý khách ở city đó
          const city = CitySchema.safeParse(ctx?.arguments?.city);
          const hits = await deps.customers.search(value, { city: city.success ? city.data : undefined }, COMPLETION_FETCH);
          return hits.map((c) => c.id);
        }),
      },
    },
    async ({ customer }) => {
      const c = await deps.customers.get(customer);
      return {
        description: `Brief · ${customer}${c ? ` · ${c.name}` : ""}`,
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text:
                `Chuẩn bị brief cho cuộc gọi với khách ${customer}. Gọi ${TOOL.getCustomer} (hồ sơ), ` +
                `${TOOL.findOrders} {customerId, 3 tháng gần nhất} (doanh số), ${TOOL.listTasks} {customerId, status=todo} (việc còn mở). ` +
                "Trình bày: 1 đoạn tóm tắt + 3 gạch đầu dòng việc cần nhắc.",
            },
          },
        ],
      };
    },
  );
}
