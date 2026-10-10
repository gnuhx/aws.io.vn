export const RESOURCE = {
  glossary: "nexus://docs/glossary",
  customerTemplate: "nexus://customers/{id}",
} as const;

export const customerUri = (id: string): string => `nexus://customers/${id}`;
