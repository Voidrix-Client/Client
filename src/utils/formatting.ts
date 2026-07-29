/**
 * Formatting utilities for common data types
 */

/** Format large numbers as K, M, B (e.g., 1500 → 1.5K) */
export function formatNumber(num?: number): string {
  if (!num) return '0';
  if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

/** Format date to locale string (e.g., "1/15/2024") */
export function formatDate(date?: string | Date): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString();
}

/** Format date with time (e.g., "1/15/2024, 10:30 AM") */
export function formatDateTime(date?: string | Date): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString();
}

/** Format date as relative time (e.g., "2 hours ago") */
export function formatRelativeTime(date?: string | Date): string {
  if (!date) return 'Unknown';

  const now = new Date();
  const then = new Date(date);
  const diff = now.getTime() - then.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  if (months < 12) return `${months}mo ago`;
  return `${years}y ago`;
}

/** Format bytes as KB, MB, GB */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/** Format duration in seconds to HH:MM:SS */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

/** Format percentage (0-100) */
export function formatPercentage(value: number): string {
  return `${Math.min(100, Math.max(0, Math.round(value)))}%`;
}

/** Truncate string to max length with ellipsis */
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 3)}...`;
}

/** Capitalize first letter */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Convert camelCase to Title Case */
export function camelCaseToTitle(str: string): string {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
}
