import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { SkinViewer, IdleAnimation } from 'skinview3d';
import { useNotification } from '../context/NotificationContext';
import { Button } from '../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '../components/ui/dropdown-menu';
import { filterInstancesForMode } from '../utils/instanceTypes';
import { resolveAssetPath } from '../utils/resourceHelper';
import { cn } from '../lib/utils';
import {
  Play,
  Square,
  Loader2,
  ChevronDown,
  Box,
  Sparkles,
  Blocks,
  Check,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface Instance {
  name: string;
  icon?: string;
  version?: string;
  loader?: string;
  lastPlayed?: number;
  playtime?: number;
}

interface HomeProps {
  onInstanceClick: (instance: Instance) => void;
  runningInstances?: Record<string, string>;
  activeDownloads?: Record<string, any>;
  onNavigateSearch?: (type: string) => void;
  isGuest?: boolean;
  userProfile?: { name: string; avatar?: string; level?: number; access_token?: string; skinUrl?: string } | null;
}

const SELECTED_INSTANCE_KEY = 'voidrix_home_selected_instance';
const FALLBACK_SKIN = resolveAssetPath('/assets/skins/steve-classic.png');

// ============================================================================
// 3D skin stage
// ============================================================================

const HomeSkinStage = React.memo(({ src, model }: { src?: string | null; model?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !src) return;
    setFailed(false);

    let viewer: any = null;
    try {
      viewer = new SkinViewer({
        canvas: canvasRef.current,
        width: 320,
        height: 440,
        skin: src,
      });
      viewer.model = model === 'slim' ? 'slim' : 'classic';
      viewer.fov = 55;
      viewer.zoom = 0.65;
      viewer.animation = new IdleAnimation();
      viewer.autoRotate = true;
      viewer.autoRotateSpeed = 0.55;
      viewer.playerObject.rotation.y = 0.4;
      viewer.controls.enableZoom = false;
      viewer.controls.enableRotate = false;
      viewer.controls.enablePan = false;
      viewer.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      canvasRef.current.style.imageRendering = 'pixelated';

      const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) viewer?.setSize(width, height);
        }
      });
      if (containerRef.current) resizeObserver.observe(containerRef.current);

      return () => {
        resizeObserver.disconnect();
        viewer?.dispose();
      };
    } catch (error) {
      console.error('Skin-Vorschau konnte nicht geladen werden', error);
      setFailed(true);
    }
  }, [src, model]);

  if (!src || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Box className="h-16 w-16 text-muted-foreground/40" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full w-full">
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
});
HomeSkinStage.displayName = 'HomeSkinStage';

// ============================================================================
// Main component
// ============================================================================

function Home({
  onInstanceClick,
  runningInstances = {},
  activeDownloads = {},
  onNavigateSearch,
  isGuest,
  userProfile,
}: HomeProps) {
  const { addNotification } = useNotification();

  const [instances, setInstances] = useState<Instance[]>([]);
  const [selectedName, setSelectedName] = useState<string | null>(() => {
    try {
      return localStorage.getItem(SELECTED_INSTANCE_KEY);
    } catch {
      return null;
    }
  });
  const [pending, setPending] = useState(false);
  const [skinUrl, setSkinUrl] = useState<string | null | undefined>(userProfile?.skinUrl ?? null);
  const [skinModel, setSkinModel] = useState<'classic' | 'slim'>('classic');

  const loadInstances = useCallback(async () => {
    const list = await window.electronAPI.getInstances();
    setInstances(filterInstancesForMode(list, 'launcher'));
  }, []);

  useEffect(() => {
    loadInstances();
    const removeListener = window.electronAPI.onInstanceStatus?.(({ status }: any) => {
      if (['stopped', 'ready', 'error', 'deleted'].includes(status)) loadInstances();
    });
    return () => removeListener?.();
  }, [loadInstances]);

  useEffect(() => {
    let cancelled = false;
    const loadSkin = async () => {
      if (!userProfile?.access_token || !window.electronAPI?.getCurrentSkin) {
        if (!cancelled) setSkinUrl(userProfile?.skinUrl ?? null);
        return;
      }
      try {
        const res = await window.electronAPI.getCurrentSkin(userProfile.access_token);
        if (cancelled) return;
        if (res?.success) {
          setSkinUrl(res.url);
          setSkinModel((res.variant || 'classic').toLowerCase() === 'slim' ? 'slim' : 'classic');
        } else {
          setSkinUrl(userProfile?.skinUrl ?? null);
        }
      } catch {
        if (!cancelled) setSkinUrl(userProfile?.skinUrl ?? null);
      }
    };
    loadSkin();
    return () => {
      cancelled = true;
    };
  }, [userProfile?.access_token, userProfile?.skinUrl]);

  const selectedInstance = useMemo(() => {
    if (!instances.length) return null;
    const byName = selectedName ? instances.find(i => i.name === selectedName) : null;
    if (byName) return byName;
    return [...instances].sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0))[0];
  }, [instances, selectedName]);

  const status = selectedInstance
    ? Object.keys(activeDownloads).some(k => k.toLowerCase() === selectedInstance.name.toLowerCase())
      ? 'installing'
      : runningInstances[selectedInstance.name] || null
    : null;

  const isRunning = status === 'running';
  const isBusy = pending || status === 'installing' || status === 'launching';

  const handleSelect = useCallback((instance: Instance) => {
    setSelectedName(instance.name);
    try {
      localStorage.setItem(SELECTED_INSTANCE_KEY, instance.name);
    } catch {
      // Speichern der Auswahl ist optional
    }
  }, []);

  const handleLaunch = useCallback(async () => {
    if (!selectedInstance) return;

    if (isGuest) {
      addNotification('✨ Bitte melde dich an, um zu spielen', 'error');
      return;
    }

    if (isRunning) {
      window.electronAPI.killGame(selectedInstance.name);
      addNotification(`⏹️ ${selectedInstance.name} wurde gestoppt`, 'info');
      return;
    }

    if (isBusy) return;

    setPending(true);
    addNotification(`🚀 Starte ${selectedInstance.name}...`, 'info');

    try {
      await window.electronAPI.launchGame(selectedInstance.name);
      addNotification(`✅ ${selectedInstance.name} wurde gestartet!`, 'success');
    } catch (error) {
      addNotification(`❌ Fehler beim Starten von ${selectedInstance.name}`, 'error');
      console.error(error);
    } finally {
      setPending(false);
    }
  }, [selectedInstance, isGuest, isRunning, isBusy, addNotification]);

  const displayName = userProfile?.name || 'Gast';

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* ---------------- Ambient stage backdrop ---------------- */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[40%] h-[420px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[110px]" />
        <div className="void-stage-ceiling" />
        <div className="void-stage-floor" />
      </div>

      {!instances.length ? (
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card/60">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Willkommen, {displayName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Du hast noch keine Instanz — leg direkt los.</p>
          </div>
          <Button size="lg" onClick={() => onNavigateSearch?.('modpack')} className="mt-2 h-11 gap-2">
            <Blocks className="h-4 w-4" />
            Erstes Modpack finden
          </Button>
        </div>
      ) : (
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-8 overflow-y-auto px-6 py-10">
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {isRunning ? 'Läuft gerade' : 'Bereit zum Start'}
            </p>
            <h1 className="mt-1 text-4xl font-black tracking-tight text-foreground drop-shadow-[0_0_30px_rgba(var(--primary-color-rgb),0.35)]">
              {displayName}
            </h1>
          </div>

          <div className="relative h-[320px] w-[260px] sm:h-[380px] sm:w-[300px]">
            <div className="absolute inset-x-0 bottom-2 flex items-end justify-center">
              <div className="h-6 w-40 rounded-full bg-primary/25 blur-xl" />
            </div>
            <HomeSkinStage src={skinUrl || FALLBACK_SKIN} model={skinModel} />
          </div>

          <div className="flex w-full max-w-md items-stretch overflow-hidden rounded-2xl border border-border/70 bg-card/50 shadow-[0_0_40px_rgba(var(--primary-color-rgb),0.15)] backdrop-blur-xl">
            <button
              type="button"
              onClick={handleLaunch}
              disabled={isBusy}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 px-6 py-4 transition-colors',
                isRunning ? 'bg-destructive/15 hover:bg-destructive/25' : 'bg-primary/15 hover:bg-primary/25',
                isBusy && 'cursor-not-allowed opacity-60'
              )}
            >
              <span className="flex items-center gap-2 text-lg font-bold tracking-wide text-foreground">
                {isBusy ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isRunning ? (
                  <Square className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
                {isBusy ? 'STARTET…' : isRunning ? 'STOPPEN' : 'SPIELEN'}
              </span>
              <span className="max-w-[260px] truncate text-xs text-muted-foreground">
                {selectedInstance?.name}
                {selectedInstance?.version ? ` · ${selectedInstance.loader || 'Vanilla'} ${selectedInstance.version}` : ''}
              </span>
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Instanz wählen"
                  className="flex w-14 shrink-0 items-center justify-center border-l border-border/70 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Instanz auswählen</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {instances.map(instance => (
                  <DropdownMenuItem key={instance.name} onClick={() => handleSelect(instance)} className="gap-2">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded bg-muted">
                      {instance.icon ? (
                        <img src={instance.icon} alt="" className="h-full w-full object-cover image-pixelated" />
                      ) : (
                        <Box className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{instance.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {instance.loader || 'Vanilla'} {instance.version}
                      </p>
                    </div>
                    {selectedInstance?.name === instance.name && (
                      <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => selectedInstance && onInstanceClick?.(selectedInstance)}
                  disabled={!selectedInstance}
                >
                  Instanz verwalten
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
