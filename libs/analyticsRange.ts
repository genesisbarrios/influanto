// Shared date-range resolution + bucketing for every analytics GET route
// (link in bio, release pages, QR codes) so "last 30 days" vs "custom range"
// vs bucket granularity is computed identically everywhere.

// Resolve the requested range key (+ optional custom start/end) into a concrete window.
export function resolveRange(range: string | null, startParam: string | null, endParam: string | null): { start: Date; end: Date } {
  const end = range === "custom" && endParam ? new Date(`${endParam}T23:59:59.999Z`) : new Date();

  if (range === "custom" && startParam) {
    return { start: new Date(`${startParam}T00:00:00.000Z`), end };
  }

  const start = new Date();
  switch (range) {
    case "60d": start.setDate(start.getDate() - 60); break;
    case "90d": start.setDate(start.getDate() - 90); break;
    case "6m": start.setMonth(start.getMonth() - 6); break;
    case "9m": start.setMonth(start.getMonth() - 9); break;
    case "1y": start.setFullYear(start.getFullYear() - 1); break;
    case "2y": start.setFullYear(start.getFullYear() - 2); break;
    case "30d":
    default: start.setDate(start.getDate() - 30); break;
  }
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

// Buckets the [start, end] window into days/weeks/months depending on span,
// so a 2-year range doesn't render as 730 unreadable daily bars.
export function buildBuckets(start: Date, end: Date) {
  const spanDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
  const granularity: "day" | "week" | "month" = spanDays > 400 ? "month" : spanDays > 100 ? "week" : "day";

  const keyFor = (d: Date) => {
    if (granularity === "month") return d.toISOString().slice(0, 7); // YYYY-MM
    if (granularity === "week") {
      const monday = new Date(d);
      const dow = (monday.getUTCDay() + 6) % 7; // 0 = Monday
      monday.setUTCDate(monday.getUTCDate() - dow);
      return monday.toISOString().slice(0, 10);
    }
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  };

  const labelFor = (key: string) => {
    if (granularity === "month") {
      const [y, m] = key.split("-").map(Number);
      return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });
    }
    return key.slice(5); // MM-DD
  };

  const counts = new Map<string, number>();
  const orderedKeys: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const key = keyFor(cursor);
    if (!counts.has(key)) { counts.set(key, 0); orderedKeys.push(key); }
    if (granularity === "day") cursor.setUTCDate(cursor.getUTCDate() + 1);
    else if (granularity === "week") cursor.setUTCDate(cursor.getUTCDate() + 7);
    else cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return { keyFor, labelFor, counts, orderedKeys };
}
