export function camelCase(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_m: any, chr) => chr.toUpperCase());
};
