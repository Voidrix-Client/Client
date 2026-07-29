import React, { useState } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { Upload, FileUp, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ImportDropZoneProps {
  onImportStart?: () => void;
  onImportComplete?: (instanceName: string) => void;
}

const ModpackImportZone = React.memo(function ModpackImportZone({
  onImportStart,
  onImportComplete
}: ImportDropZoneProps) {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await importFile(files[0]);
    }
  };

  const importFile = async (file: File) => {
    const supportedFormats = ['.voidrixmodpack', '.mrpack', '.zip'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!supportedFormats.includes(fileExtension)) {
      addNotification(
        t('import.unsupported_format', 'Unsupported format. Use .voidrixmodpack, .mrpack, or .zip'),
        'error'
      );
      return;
    }

    const filePath = (file as any).path;
    if (fileExtension !== '.voidrixmodpack' || !filePath) {
      addNotification(
        t('import.use_select_file', 'Drag & drop only supports .voidrixmodpack. Use "Select a file" for other formats.'),
        'info'
      );
      return;
    }

    setIsImporting(true);
    onImportStart?.();

    try {
      const res = await window.electronAPI.importVoidrixModpackFile(filePath);
      if (res.success) {
        addNotification(
          t('import.success', 'Modpack imported: {{name}}', { name: res.instanceName }),
          'success'
        );
        onImportComplete?.(res.instanceName);
      } else if (res.error !== 'Cancelled') {
        addNotification(
          t('import.error', 'Import failed: {{error}}', { error: res.error }),
          'error'
        );
      }
    } catch (error) {
      addNotification(
        t('import.error', 'Import failed: {{error}}', { error: String(error) }),
        'error'
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleSelectFile = async () => {
    setIsImporting(true);
    onImportStart?.();

    try {
      const res = await window.electronAPI.importFile();
      if (res.success) {
        addNotification(
          t('import.success', 'Modpack imported: {{name}}', { name: res.instanceName }),
          'success'
        );
        onImportComplete?.(res.instanceName);
      } else if (res.error !== 'Cancelled') {
        addNotification(
          t('import.error', 'Import failed: {{error}}', { error: res.error }),
          'error'
        );
      }
    } catch (error) {
      addNotification(
        t('import.error', 'Import failed: {{error}}', { error: String(error) }),
        'error'
      );
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative p-6 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
        isDragging
          ? 'border-primary bg-primary/10'
          : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50'
      } ${isImporting ? 'opacity-75' : ''}`}
    >
      <div className="flex flex-col items-center justify-center gap-3">
        {isImporting ? (
          <>
            <div className="animate-spin">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {t('import.importing', 'Importing modpack...')}
            </p>
          </>
        ) : (
          <>
            <FileUp className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">
                {t('import.drag_drop', 'Drag and drop your modpack here')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('import.formats', 'Supported: .voidrixmodpack, .mrpack, .zip')}
              </p>
            </div>
            <button
              type="button"
              onClick={handleSelectFile}
              disabled={isImporting}
              className="mt-2 px-4 py-2 bg-primary text-black rounded-lg text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Upload className="inline w-4 h-4 mr-2" />
              {t('import.select_file', 'Or select a file')}
            </button>
          </>
        )}
      </div>
    </div>
  );
});

export default ModpackImportZone;
