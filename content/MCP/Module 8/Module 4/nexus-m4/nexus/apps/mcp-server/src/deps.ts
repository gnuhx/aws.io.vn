import type { Logger } from "./log.ts";
import type { CustomerRepository } from "./customers/repository.ts";
import type { RatesClient } from "./rates/client.ts";

/** Phụ thuộc của mọi tool — composition root (index.ts) tạo, test tạo bản giả. */
export interface Deps {
  customers: CustomerRepository;
  rates: RatesClient;
  log: Logger;
  now: () => Date;
}
