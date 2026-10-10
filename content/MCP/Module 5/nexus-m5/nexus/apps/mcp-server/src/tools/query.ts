import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { QueryInputSchema, QueryOutputSchema, RESOURCE, TOOL } from "@nexus/shared";
import type { Deps } from "../deps.ts";
import { instrument } from "../instrument.ts";
import { FIELDS } from "../query/catalog.ts";
import { checkFilter } from "../query/filter-guard.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export function registerQuery(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.query,
    {
      title: "Truy vấn dữ liệu (chỉ đọc)",
      description:
        `Truy vấn chỉ đọc trên customers hoặc orders bằng filter kiểu MongoDB. Field và toán tử hợp lệ ở resource ${RESOURCE.schema}. ` +
        "Dùng khi các tool chuyên biệt (nexus_list_customers, nexus_search_customers) không đủ. " +
        "Đếm bằng matched; items tối đa 50.",
      inputSchema: QueryInputSchema.shape,
      outputSchema: QueryOutputSchema.shape,
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    instrument(TOOL.query, deps.log, async ({ collection, filter, fields, sort, limit }) => {
      const guard = checkFilter(collection, filter);
      if (!guard.ok) {
        deps.log.warn("query filter rejected", { collection, at: guard.at, problem: guard.problem });
        return toolFail({ what: `Filter bị từ chối tại "${guard.at}": ${guard.problem}.`, next: `Sửa filter theo ${RESOURCE.schema} rồi gọi lại.` });
      }
      const known = FIELDS[collection];
      const bad = [...(fields ?? []), ...(sort ? [sort.field] : [])].filter((f) => !known.has(f));
      if (bad.length > 0) {
        return toolFail({ what: `Field không có trong ${collection}: ${bad.join(", ")}.`, next: `Field hợp lệ: ${[...known].join(", ")}.` });
      }
      const r = await deps.query.find(collection, filter, { fields, sort, limit });
      return toolOk(QueryOutputSchema, { collection, matched: r.matched, returned: r.items.length, items: r.items.map((x) => ({ ...x })) });
    }),
  );
}
