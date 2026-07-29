export const resolveAssetPath = (assetUrl: string | undefined | null): string | undefined | null => {
  if (!assetUrl || typeof assetUrl !== 'string') return assetUrl;

  if (typeof window !== 'undefined' && window.location.protocol === 'file:' && assetUrl.startsWith('/')) {
    try {
      return new URL(`.${assetUrl}`, window.location.href).href;
    } catch {
      return assetUrl;
    }
  }

  return assetUrl;
};

export const toFileUrl = (filePath: string): string => {
  return `file:///${`${filePath}`.replace(/\\/g, '/')}`;
};

export const getToolsSkinSourceDebugInfo = (skinSource: any) => {
  if (typeof skinSource !== 'string') {
    return {
      sourceType: skinSource == null ? 'empty' : typeof skinSource,
      sourcePreview: null,
      sourceLength: 0
    };
  }

  const value = skinSource.trim();
  if (!value) {
    return {
      sourceType: 'empty-string',
      sourcePreview: '',
      sourceLength: 0
    };
  }

  let sourceType = 'unknown';
  if (/^data:image\//i.test(value)) {
    sourceType = 'data-url';
  } else if (/^https?:\/\//i.test(value)) {
    sourceType = 'http-url';
  } else if (/^file:\/\//i.test(value)) {
    sourceType = 'file-url';
  } else if (value.startsWith('/assets/')) {
    sourceType = 'asset-path';
  } else if (/^[a-zA-Z]:\\/.test(value) || value.includes('\\')) {
    sourceType = 'windows-path';
  }

  return {
    sourceType,
    sourcePreview: sourceType === 'data-url' ? `${value.slice(0, 64)}...` : value.slice(0, 256),
    sourceLength: value.length
  };
};
