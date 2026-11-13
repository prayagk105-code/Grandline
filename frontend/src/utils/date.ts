export function toIsoDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(isoDate: string, days: number): string {
  const dt = new Date(`${isoDate}T12:00:00`);
  dt.setDate(dt.getDate() + days);
  return toIsoDate(dt);
}

export function formatDisplayDate(
  isoDate: string,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
): string {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString(undefined, options);
}

export function formatDurationMinutes(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = String(minutes % 60).padStart(2, '0');
    return `${h}h ${m}m`;
  }
  return `${minutes}m`;
}

export function getGreetingWord(date: Date = new Date()): 'morning' | 'afternoon' | 'evening' {
  const hr = date.getHours();
  if (hr < 12) return 'morning';
  if (hr < 18) return 'afternoon';
  return 'evening';
}

const ART_GRADIENTS = [
  ['#7b9c91', '#304f54'],
  ['#e6a77b', '#9d6470'],
  ['#b9a58d', '#6c5a4a'],
  ['#a7b88b', '#526e55'],
  ['#8297b0', '#465b78'],
  ['#b4a9d1', '#696080']
];

export function memoryGradient(index: number): string {
  const pair = ART_GRADIENTS[Math.abs(index) % ART_GRADIENTS.length];
  return `linear-gradient(145deg, ${pair[0]}, ${pair[1]})`;
}

