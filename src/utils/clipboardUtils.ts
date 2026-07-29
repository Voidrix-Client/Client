export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}

export function getFileNameFromPath(path: string): string {
  return path.split(/[\\/]/).pop() || path;
}

export function getDirectoryFromPath(path: string): string {
  return path.substring(0, path.lastIndexOf('/')) || path.substring(0, path.lastIndexOf('\\'));
}
