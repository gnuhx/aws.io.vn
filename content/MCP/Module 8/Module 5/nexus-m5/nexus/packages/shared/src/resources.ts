/** URI resource: 1 nguồn cho server, host web và resource_link (M4). */
export const RESOURCE = {
  glossary: "nexus://docs/glossary",
  chartByCity: "nexus://charts/customers-by-city.png",
  schema: "nexus://schema", // M5 · S5.2
} as const;

export const RESOURCE_TEMPLATE = {
  customer: "nexus://customers/{id}",
} as const;

export const customerUri = (id: string): string => `nexus://customers/${id}`;
