/** Format large numbers: 12847 -> "12.8K", 1234567 -> "1.2M" */
export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/** Relative time: "2 min ago", "1 hr ago", "3 days ago" */
export function relativeTime(isoString: string): string {
  if (!isoString) return 'just now';
  const ts = new Date(isoString).getTime();
  if (isNaN(ts)) return 'just now';
  const delta = Date.now() - ts;
  if (delta < 0) return 'just now';
  const seconds = Math.floor(delta / 1000);
  if (seconds < 60) return 'moments ago';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)   return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

/** Format date: "May 21, 2026" */
export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

/** Latency color based on ms value */
export function latencyColor(ms: number): string {
  if (ms < 1000)  return 'var(--success)';
  if (ms < 3000)  return 'var(--warning)';
  return 'var(--error)';
}

/** Status code color */
export function statusColor(code: number): string {
  if (code >= 500) return 'var(--error)';
  if (code >= 400) return 'var(--warning)';
  return 'var(--success)';
}

/** Generate a mock API key in the required opctx_<hex> format */
export function mockApiKey(): string {
  const hex = Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  return `opctx_${hex}`;
}

/** Truncate string to maxLen with ASCII ellipsis */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '...';
}

/** Clamp value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Copy to clipboard with fallback */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    const success = document.execCommand('copy');
    document.body.removeChild(el);
    return success;
  }
}
