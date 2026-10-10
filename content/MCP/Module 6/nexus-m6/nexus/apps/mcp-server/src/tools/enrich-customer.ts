import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  ENRICH_FIELDS,
  EnrichCustomerInputSchema,
  EnrichCustomerOutputSchema,
  TOOL,
  type EnrichCustomerOutput,
} from "@nexus/shared";
import type { CustomerPatch } from "../customers/repository.ts";
import type { Deps } from "../deps.ts";
import { rulesSuggest } from "../enrich/rules.ts";
import { askClientLlm } from "../enrich/sampling.ts";
import { toolFail, toolOk } from "../tool-result.ts";

export function registerEnrichCustomer(server: McpServer, deps: Deps): void {
  server.registerTool(
    TOOL.enrichCustomer,
    {
      title: "Bổ sung hồ sơ khách",
      description:
        "Đề xuất city/industry còn trống của 1 khách (khách nhập từ file cũ). Dùng LLM của client nếu client cho phép " +
        "(người dùng duyệt), không thì dùng luật tại server. Mặc định chỉ đề xuất; apply=true mới ghi.",
      inputSchema: EnrichCustomerInputSchema.shape,
      outputSchema: EnrichCustomerOutputSchema.shape,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ id, apply }, extra) => {
      const c = await deps.customers.get(id);
      if (!c) return toolFail(`Không có khách ${id}. Dùng nexus_list_customers để tìm đúng id.`);
      const missing = ENRICH_FIELDS.filter((f) => c[f] === null);
      const base = { id, missing, applied: [] as EnrichCustomerOutput["applied"] };
      if (missing.length === 0) {
        return toolOk({ ...base, source: "none" as const, suggestion: { city: c.city, industry: c.industry }, note: "Hồ sơ đã đủ city và industry." });
      }

      const sampled = await askClientLlm(server.server, c, missing, {
        signal: extra.signal, // client hủy tool call → hủy luôn request sampling
        timeout: deps.samplingTimeoutMs, // người duyệt có thể đi pha cà phê
        relatedRequestId: extra.requestId,
      });
      let out: Omit<EnrichCustomerOutput, "applied" | "id" | "missing">;
      if (sampled.ok) {
        out = { source: "sampling", model: sampled.model, suggestion: sampled.suggestion, note: "Đề xuất từ LLM của client, người dùng đã duyệt request." };
      } else {
        deps.log.warn("sampling không dùng được, chuyển sang luật", { id, reason: sampled.reason, detail: sampled.detail });
        out = { source: "rules", suggestion: rulesSuggest(c), note: `Không dùng được LLM của client (${sampled.detail}) — đề xuất từ luật tại server.` };
      }

      // chỉ ghi field đang trống và có đề xuất; không bao giờ ghi đè dữ liệu người nhập
      const patch: CustomerPatch = {};
      if (apply && missing.includes("city") && out.suggestion.city) patch.city = out.suggestion.city;
      if (apply && missing.includes("industry") && out.suggestion.industry) patch.industry = out.suggestion.industry;
      const applied = ENRICH_FIELDS.filter((f) => patch[f] !== undefined);
      if (applied.length) await deps.customers.update(id, patch);
      return toolOk({ ...base, ...out, applied });
    },
  );
}
