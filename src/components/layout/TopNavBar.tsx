import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ExtensionSlot from '../Extensions/ExtensionSlot';
import WindowControls from './WindowControls';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuSeparator, DropdownMenuLabel
} from '../ui/dropdown-menu';
import { Search, Newspaper, Download } from 'lucide-react';

function TopNavBar({
  userProfile,
  onProfileUpdate,
  isMaximized,
  onOpenCommandPalette,
  onNavigate,
  runningInstances,
  activeDownloads,
  isCommandPaletteAvailable
}) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!userProfile?.access_token || userProfile.skinUrl) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await window.electronAPI.getCurrentSkin(userProfile.access_token);
        if (!cancelled && res.success && res.url) {
          onProfileUpdate?.({ ...userProfile, skinUrl: res.url });
        }
      } catch (e) { }
    })();

    return () => { cancelled = true; };
  }, [userProfile, onProfileUpdate]);

  const runningCount = Object.keys(runningInstances).filter(k => runningInstances[k] === 'running').length;
  const activeDownloadEntries = Object.entries(activeDownloads);
  const activeDownloadCount = activeDownloadEntries.length;

  return (
    <div className="h-16 w-full titlebar flex items-center justify-between px-3 lg:px-5 border-b border-border bg-background/80 backdrop-blur-md flex-none relative z-[60]">
      <div className="flex items-center gap-1.5 lg:gap-2.5 no-drag shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-10 gap-2.5 rounded-xl px-2 lg:px-3.5 text-sm font-semibold text-muted-foreground hidden sm:flex"
          onClick={() => onNavigate('news')}
        >
          <Newspaper className="h-4 w-4" />
          <span className="hidden lg:inline">{t('common.news', 'News')}</span>
        </Button>
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 no-drag pointer-events-none" style={{ maxWidth: 'calc(100% - 480px)' }}>
        <div className="pointer-events-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-10 w-full max-w-[280px] gap-2 rounded-xl border-border/50 bg-background/50 px-2 lg:px-4 text-sm text-muted-foreground justify-start"
            onClick={onOpenCommandPalette}
            disabled={!isCommandPaletteAvailable}
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="hidden md:inline truncate">{t('dashboard.search_placeholder', 'Search...')}</span>
            <kbd className="hidden lg:inline-flex ml-auto pointer-events-none h-6 select-none items-center gap-1 rounded-md border border-border bg-muted px-2 font-mono text-[11px] font-medium text-muted-foreground">
              Ctrl+K
            </kbd>
          </Button>
          <ExtensionSlot name="header.center" className="flex items-center gap-2" />
        </div>
      </div>

      <div className="flex items-center justify-end gap-1.5 lg:gap-2 no-drag shrink-0">
        <ExtensionSlot name="header.right" className="hidden sm:flex items-center gap-2" />

        {activeDownloadCount > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-10 gap-2 rounded-xl px-3 text-sm">
                <Download className="h-4 w-4 text-primary animate-pulse" />
                <span className="tabular-nums">
                  {Math.round(activeDownloadEntries.reduce((t, [, d]) => t + ((d as any)?.progress || 0), 0) / activeDownloadCount)}%
                </span>
                {activeDownloadCount > 1 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[11px]">{activeDownloadCount}</Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider">{t('common.downloads')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {activeDownloadEntries.map(([name, data]: [string, any]) => (
                <div key={name} className="px-2 py-1.5 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium truncate pr-2">{name}</span>
                    <span className="text-primary font-mono text-[10px]">{data.progress}%</span>
                  </div>
                  <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-300 rounded-full" style={{ width: `${data.progress}%` }} />
                  </div>
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="h-10 gap-2 rounded-xl px-2 lg:px-3 text-sm hidden sm:flex"
        >
          <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', runningCount > 0 ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/50')} />
          <span className="text-muted-foreground hidden lg:inline">
            {runningCount === 0 ? t('common.idle') : `${runningCount} ${t('common.running')}`}
          </span>
        </Button>

        <Separator orientation="vertical" className="h-5" />
        <WindowControls isMaximized={isMaximized} />
      </div>
    </div>
  );
}

export default TopNavBar;
