export const uniqueEmail = (label: string): string =>
  `${label}-${Date.now()}-${Math.floor(Math.random() * 100000)}@e2e.test`;
