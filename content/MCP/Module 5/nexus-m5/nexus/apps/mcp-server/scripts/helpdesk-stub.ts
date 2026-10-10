// node scripts/helpdesk-stub.ts [--port 4020] [--capacity 5] [--refill 1] [--retry-after 30] [--http-date]
import { parseArgs } from "node:util";
import { startHelpdeskStub } from "./stub/helpdesk.ts";

const { values } = parseArgs({
  options: {
    port: { type: "string", default: "4020" },
    token: { type: "string", default: "dev-helpdesk-token" },
    capacity: { type: "string", default: "5" },
    refill: { type: "string", default: "1" },
    "retry-after": { type: "string" },
    "http-date": { type: "boolean", default: false },
  },
});
await startHelpdeskStub({
  port: Number(values.port),
  token: values.token,
  capacity: Number(values.capacity),
  refillPerSec: Number(values.refill),
  ...(values["retry-after"] ? { retryAfterSec: Number(values["retry-after"]) } : {}),
  httpDate: values["http-date"],
});
process.stderr.write(`helpdesk-stub :${values.port}\n`);
