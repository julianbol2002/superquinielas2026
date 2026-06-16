const READ_KEY = "quiniela_daily_recap_read";
const MAX_READ = 30;

function loadReadDates(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(READ_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveReadDates(dates: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(READ_KEY, JSON.stringify(dates.slice(-MAX_READ)));
}

export function markRecapRead(date: string): void {
  const read = loadReadDates();
  if (read.includes(date)) return;
  saveReadDates([...read, date]);
}

export function isRecapRead(date: string): boolean {
  return loadReadDates().includes(date);
}

export function countUnreadRecaps(dates: string[]): number {
  const read = new Set(loadReadDates());
  return dates.filter((d) => !read.has(d)).length;
}
