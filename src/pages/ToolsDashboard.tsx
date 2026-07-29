import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/layout/PageHeader';
import PageContent from '../components/layout/PageContent';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useNotification } from '../context/NotificationContext';
import {
  Wrench,
  RefreshCw,
  Cpu,
  HardDrive,
  Boxes,
  FolderOpen,
  Download,
  RotateCcw,
  TerminalSquare,
  Sparkles,
  ShieldCheck,
  Image,
  UserRound,
  PackageOpen,
  Gauge,
} from 'lucide-react';

type ToolStats = {
  instances: number;
  runtimes: number;
  processes: number;
  platform: string;
  version: string;
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  hint?: string;
}) => (
  <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-card/80 via-card/55 to-card/40 p-4 shadow-[0_10px_30px_-20px_rgba(124,58,237,0.55)] backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-[0_14px_38px_-20px_rgba(124,58,237,0.7)]">
    <div className="mb-2 flex items-center justify-between">
      <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
      <div className="rounded-lg border border-primary/25 bg-primary/15 p-1.5">
        <Icon className="h-3.5 w-3.5 text-primary" />
      </div>
    </div>
    <div className="text-2xl font-bold text-foreground">{value}</div>
    {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
  </div>
);

const ToolCard = ({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) => (
  <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card/80 via-card/55 to-card/40 p-4 shadow-[0_12px_36px_-26px_rgba(79,70,229,0.75)] backdrop-blur-sm">
    <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-primary/10 blur-2xl transition-opacity group-hover:opacity-90" />
    <div className="relative mb-3 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="rounded-lg border border-primary/25 bg-primary/10 p-2">
        <Icon className="h-4 w-4 text-primary" />
      </div>
    </div>
    <Separator className="mb-4" />
    <div className="relative">{children}</div>
  </div>
);

function ToolsDashboard() {
  const { addNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [instances, setInstances] = useState<any[]>([]);
  const [selectedInstance, setSelectedInstance] = useState('');
  const [skinUsername, setSkinUsername] = useState('');
  const [resourcePackUrl, setResourcePackUrl] = useState('');
  const [perfSettings, setPerfSettings] = useState({
    optimization: true,
    focusMode: false,
    lowGraphicsMode: false,
    legacyGpuSupport: false,
  });
  const [stats, setStats] = useState<ToolStats>({
    instances: 0,
    runtimes: 0,
    processes: 0,
    platform: 'unknown',
    version: '-',
  });

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const [instanceList, runtimes, processes, version, settingsRes] = await Promise.all([
        window.electronAPI.getInstances().catch(() => []),
        window.electronAPI.getJavaRuntimes().catch(() => []),
        window.electronAPI.getActiveProcesses().catch(() => []),
        window.electronAPI.getVersion().catch(() => '-'),
        window.electronAPI.getSettings().catch(() => ({ success: false })),
      ]);

      const launcherInstances = Array.isArray(instanceList)
        ? instanceList.filter((inst: any) => inst.type === 'launcher' || !inst.type)
        : [];
      setInstances(launcherInstances);
      if (!selectedInstance && launcherInstances.length > 0) {
        setSelectedInstance(launcherInstances[0].name);
      }

      if (settingsRes?.success && settingsRes.settings) {
        setPerfSettings({
          optimization: settingsRes.settings.optimization !== false,
          focusMode: settingsRes.settings.focusMode === true,
          lowGraphicsMode: settingsRes.settings.lowGraphicsMode === true,
          legacyGpuSupport: settingsRes.settings.legacyGpuSupport === true,
        });
      }

      setStats({
        instances: launcherInstances.length,
        runtimes: Array.isArray(runtimes) ? runtimes.length : 0,
        processes: Array.isArray(processes) ? processes.length : 0,
        platform: window.electronAPI.platform || 'unknown',
        version: version || '-',
      });
    } finally {
      setLoading(false);
    }
  }, [selectedInstance]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const runAction = useCallback(async (id: string, fn: () => Promise<any>) => {
    setBusy(id);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  }, []);

  const runAndNotify = useCallback(
    async (id: string, fn: () => Promise<any>, successMessage: string) => {
      await runAction(id, async () => {
        try {
          const result = await fn();
          if (result?.success === false && result?.error) {
            addNotification(`❌ ${result.error}`, 'error');
            return;
          }
          addNotification(successMessage, 'success');
        } catch (error: any) {
          addNotification(`❌ ${error?.message || 'Aktion fehlgeschlagen'}`, 'error');
        }
      });
    },
    [runAction, addNotification]
  );

  const savePerfSettings = useCallback(async (next: typeof perfSettings) => {
    setPerfSettings(next);
    const settingsRes = await window.electronAPI.getSettings();
    if (!settingsRes?.success) return;
    await window.electronAPI.saveSettings({
      ...settingsRes.settings,
      ...next,
    });
  }, []);

  const quickActions = useMemo(
    () => [
      {
        id: 'open-java',
        label: 'Java Ordner',
        icon: FolderOpen,
        run: () => window.electronAPI.openJavaFolder(),
      },
      {
        id: 'check-updates',
        label: 'Nach Updates suchen',
        icon: Download,
        run: () => window.electronAPI.checkForUpdates(),
      },
      {
        id: 'restart-app',
        label: 'App Neustart',
        icon: RotateCcw,
        run: () => window.electronAPI.restartApp(),
      },
      {
        id: 'select-folder',
        label: 'Ordner wählen',
        icon: TerminalSquare,
        run: () => window.electronAPI.selectFolder(),
      },
    ],
    []
  );

  return (
    <div className="relative flex h-full flex-col bg-gradient-to-br from-background via-background to-background/95">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70rem_26rem_at_10%_-5%,rgba(124,58,237,0.12),transparent),radial-gradient(50rem_24rem_at_90%_110%,rgba(59,130,246,0.08),transparent)]" />
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            Tools Dashboard
          </span>
        }
        description="System-Werkzeuge, Status und Wartung an einem Ort"
      >
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="h-8 px-3 gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            v{stats.version}
          </Badge>
          <Button
            variant="outline"
            className="h-8 gap-2"
            onClick={loadStats}
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Aktualisieren
          </Button>
        </div>
      </PageHeader>

      <PageContent className="relative">
        <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            icon={Boxes}
            label="Instanzen"
            value={loading ? '...' : stats.instances}
            hint="Launcher Instanzen"
          />
          <StatCard
            icon={HardDrive}
            label="Java Runtimes"
            value={loading ? '...' : stats.runtimes}
            hint="Installierte Java-Versionen"
          />
          <StatCard
            icon={Cpu}
            label="Aktive Prozesse"
            value={loading ? '...' : stats.processes}
            hint={`Plattform: ${stats.platform}`}
          />
        </div>

        <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-card/75 via-card/50 to-card/35 p-4 shadow-[0_12px_36px_-26px_rgba(59,130,246,0.6)] backdrop-blur-sm">
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground">
              Quick Actions
            </h2>
          </div>
          <Separator className="mb-4" />
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              const isBusy = busy === action.id;
              return (
                <Button
                  key={action.id}
                  variant="outline"
                  className="h-11 justify-start gap-2 border-border/60 bg-background/35 transition-all hover:border-primary/30 hover:bg-primary/5"
                  disabled={Boolean(busy)}
                  onClick={() => runAction(action.id, action.run)}
                >
                  <Icon className={`h-4 w-4 ${isBusy ? 'animate-pulse' : ''}`} />
                  {action.label}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <ToolCard
            icon={Image}
            title="Skin Editor Helper"
            subtitle="Skins schnell importieren und lokal verwalten"
          >
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Username Import</Label>
                <div className="flex gap-2">
                  <Input
                    value={skinUsername}
                    onChange={(e) => setSkinUsername(e.target.value)}
                    placeholder="Minecraft Name"
                    className="h-9"
                  />
                  <Button
                    variant="outline"
                    className="h-9 border-border/60 bg-background/35 hover:border-primary/30 hover:bg-primary/5"
                    disabled={!skinUsername.trim() || Boolean(busy)}
                    onClick={() =>
                      runAndNotify(
                        'skin-username',
                        () => window.electronAPI.saveLocalSkinFromUsername(skinUsername.trim()),
                        'Skin von Username gespeichert'
                      )
                    }
                  >
                    <UserRound className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button
                variant="outline"
                className="h-9 w-full justify-start gap-2 border-border/60 bg-background/35 hover:border-primary/30 hover:bg-primary/5"
                disabled={Boolean(busy)}
                onClick={() =>
                  runAndNotify('skin-file', () => window.electronAPI.saveLocalSkin(), 'Skin-Datei importiert')
                }
              >
                <Image className="h-4 w-4" />
                Skin Datei importieren
              </Button>
            </div>
          </ToolCard>

          <ToolCard
            icon={PackageOpen}
            title="Ressourcenpack Helper"
            subtitle="Packs für deine Instanzen verwalten"
          >
            <div className="space-y-4">
              <div className="rounded-lg border border-border/60 bg-background/30 p-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  Client Instanz
                </div>
                <div className="space-y-3">
              <Select value={selectedInstance} onValueChange={setSelectedInstance}>
                <SelectTrigger className="h-9 border-border/60 bg-background/35">
                  <SelectValue placeholder="Instanz wählen" />
                </SelectTrigger>
                <SelectContent>
                  {instances.map((inst) => (
                    <SelectItem key={inst.name} value={inst.name}>
                      {inst.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="h-9 w-full justify-start gap-2 border-border/60 bg-background/35 hover:border-primary/30 hover:bg-primary/5"
                disabled={!selectedInstance || Boolean(busy)}
                onClick={() =>
                  runAndNotify(
                    'rp-folder',
                    () => window.electronAPI.openResourcePacksFolder(selectedInstance),
                    'Ressourcenpack-Ordner geöffnet'
                  )
                }
              >
                <FolderOpen className="h-4 w-4" />
                Ordner öffnen
              </Button>
              <Button
                variant="outline"
                className="h-9 w-full justify-start gap-2 border-border/60 bg-background/35 hover:border-primary/30 hover:bg-primary/5"
                disabled={!selectedInstance || Boolean(busy)}
                onClick={() =>
                  runAction('rp-file', async () => {
                    const pick = await window.electronAPI.openFileDialog({
                      filters: [{ name: 'Zip Files', extensions: ['zip'] }],
                    });
                    const filePath = pick?.filePaths?.[0];
                    if (!filePath) return;
                    const result = await window.electronAPI.installResourcePack(selectedInstance, filePath);
                    if (result?.success) addNotification('✅ Ressourcenpack installiert', 'success');
                    else addNotification(`❌ ${result?.error || 'Install fehlgeschlagen'}`, 'error');
                  })
                }
              >
                <Download className="h-4 w-4" />
                Von Datei installieren
              </Button>
              <div className="flex gap-2">
                <Input
                  value={resourcePackUrl}
                  onChange={(e) => setResourcePackUrl(e.target.value)}
                  placeholder="https://..."
                  className="h-9 border-border/60 bg-background/35"
                />
                <Button
                  className="h-9 bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:from-violet-500/90 hover:to-indigo-500/90"
                  disabled={!selectedInstance || !resourcePackUrl.trim() || Boolean(busy)}
                  onClick={() =>
                    runAndNotify(
                      'rp-url',
                      () => window.electronAPI.downloadResourcePack(selectedInstance, resourcePackUrl.trim()),
                      'Ressourcenpack heruntergeladen'
                    )
                  }
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
                </div>
              </div>
            </div>
          </ToolCard>

          <ToolCard
            icon={Gauge}
            title="Performance Helper"
            subtitle="Client-Performance schnell steuern"
          >
            <div className="space-y-3">
              <div className="rounded-lg border border-border/60 bg-background/30 p-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  Client
                </div>
              {[
                { key: 'optimization', label: 'Optimierung aktiv' },
                { key: 'focusMode', label: 'Fokusmodus' },
                { key: 'lowGraphicsMode', label: 'Low Graphics Mode' },
                { key: 'legacyGpuSupport', label: 'Legacy GPU Support' },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-background/30 px-3 py-2 transition-all hover:border-primary/30 hover:bg-primary/5"
                >
                  <span className="text-sm">{item.label}</span>
                  <Switch
                    checked={Boolean((perfSettings as any)[item.key])}
                    onCheckedChange={(checked) =>
                      savePerfSettings({
                        ...perfSettings,
                        [item.key]: checked,
                      } as typeof perfSettings)
                    }
                  />
                </div>
              ))}
              </div>
            </div>
          </ToolCard>
        </div>
      </PageContent>
    </div>
  );
}

export default ToolsDashboard;
