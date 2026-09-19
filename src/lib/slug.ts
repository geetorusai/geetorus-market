export function slugify(input: string): string {
  const normalized = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || "untitled";
}

export function parseTagInput(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input
      .map((value) => String(value).trim())
      .filter(Boolean)
      .slice(0, 20);
  }

  if (typeof input === "string") {
    return input
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, 20);
  }

  return [];
}
