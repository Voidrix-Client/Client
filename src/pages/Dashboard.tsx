import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { SelectDropdown } from '../components/common/inputs';
import { useNotification } from '../context/NotificationContext';
import { LoadingOverlay } from '../components/shared';
import { ConfirmDialog, ModpackShareDialog, PixelEditorDialog } from '../components/modals';
import { Analytics } from '../services/Analytics';
import { LazyImage } from '../components/common';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/layout/PageHeader';
import PageContent from '../components/layout/PageContent';
import EmptyState from '../components/layout/EmptyState';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Separator } from '../components/ui/separator';
import { filterInstancesForMode } from '../utils/instanceTypes';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '../components/ui/context-menu';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import {
  Play,
  Square,
  Clock,
  Plus,
  Search,
  MoreVertical,
  Box,
  Eye,
  Copy,
  Download,
  FolderOpen,
  Trash2,
  Loader2,
  ChevronDown,
  FileCode,
  FileDown,
  Zap,
  ImageIcon,
  ArrowUpDown,
  Layers,
  Sparkles,
  Check,
  ChevronLeft,
  Hammer,
  Shirt,
  Flame,
  LayoutGrid,
} from 'lucide-react';

const DEFAULT_ICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z'%3E%3C/path%3E%3Cpolyline points='3.27 6.96 12 12.01 20.73 6.96'%3E%3C/polyline%3E%3Cline x1='12' y1='22.08' x2='12' y2='12'%3E%3C/line%3E%3C/svg%3E";

// Interface for InstanceCard props
interface InstanceCardProps {
  instance: any;
  runningInstances: Record<string, any>;
  runningInstanceStats: Record<string, any>;
  activeDownloads: Record<string, any>;
  pendingLaunches: Record<string, any>;
  onInstanceClick: (instance: any) => void;
  onContextAction: (e: any, inst: any) => void;
  actionMenu: React.ReactElement;
  addNotification: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  loadInstances: () => void;
  setPendingLaunches: (launches: Record<string, any>) => void;
  t: (key: string, options?: any) => string;
  isGuest: boolean;
}

// Memoized InstanceCard component to prevent unnecessary re-renders
const InstanceCard = React.memo<InstanceCardProps>(({
  instance,
  runningInstances,
  runningInstanceStats,
  activeDownloads,
  pendingLaunches,
  onInstanceClick,
  onContextAction,
  actionMenu,
  addNotification,
  loadInstances,
  setPendingLaunches,
  t,
  isGuest,
}) => {
  const formatPlaytime = useCallback((ms) => {
    if (!ms || ms <= 0) return t('common.time.0h');
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    if (hours > 0) return t('common.time.hours_minutes', { hours, minutes });
    return t('common.time.minutes', { minutes });
  }, [t]);

  const instanceStats = runningInstanceStats?.[instance.name] || {};
  const instanceFpsDisplay = instanceStats.fps ? `${instanceStats.fps} FPS` : null;

  const liveStatus = runningInstances[instance.name];
  const persistedStatus = instance.status;
  const installStateKey = Object.keys(activeDownloads).find(
    k => k.toLowerCase() === instance.name.toLowerCase()
  );
  const installState = installStateKey ? activeDownloads[installStateKey] : null;
  const isInstalling = !!installState;
  const status = useMemo(() => {
    if (isInstalling) return 'installing';
    return liveStatus || (persistedStatus === 'installing' ? 'installing' : null);
  }, [isInstalling, liveStatus, persistedStatus]);

  const isRunning = status === 'running';
  const isLaunching = status === 'launching';

  const handleCardClick = useCallback(() => {
    onInstanceClick(instance);
  }, [onInstanceClick, instance]);

  const handlePlayStopClick = useCallback(async (e) => {
    e.stopPropagation();
    if (isGuest) {
      addNotification('To do that you have to be logged in', 'error');
      return;
    }

    if (isRunning) {
      window.electronAPI.killGame(instance.name);
      addNotification(`Stopping ${instance.name}...`, 'info');
    } else if (!isInstalling && !isLaunching && !pendingLaunches[instance.name]) {
      setPendingLaunches(prev => ({ ...prev, [instance.name]: true }));
      try {
        const result = await window.electronAPI.launchGame(instance.name);
        if (!result.success) {
          addNotification(`Launch failed: ${result.error}`, 'error');
        } else {
          addNotification(`Launching ${instance.name}...`, 'info');
        }
      } catch (err) {
        addNotification(`Launch error: ${err.message}`, 'error');
      } finally {
        setPendingLaunches(prev => {
          const next = { ...prev };
          delete next[instance.name];
          return next;
        });
      }
    }
  }, [isGuest, isRunning, isInstalling, isLaunching, pendingLaunches, instance.name, addNotification, setPendingLaunches]);

  const formatTime = useMemo(() => formatPlaytime(instance.playtime), [formatPlaytime, instance.playtime]);
  const statusLabel = isInstalling
    ? installState
      ? `${t('common.installing')} (${installState.progress}%)`
      : t('common.installing')
    : isLaunching
      ? t('common.starting')
      : isRunning
        ? t('common.running')
        : t('common.ready', 'Ready');

  return (
    <div
      onClick={handleCardClick}
      className={`group relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 cursor-pointer ${
        isRunning
          ? 'border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-[0_0_0_1px_rgba(120,119,198,0.2)]'
          : 'border-border/80 bg-card/80 hover:border-primary/20 hover:bg-card active:bg-card/95'
      }`}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_45%)]" />

      <div className="relative z-10 flex items-start gap-3.5 mb-3">
        {instance.icon &&
          (instance.icon.startsWith('data:') ||
            instance.icon.startsWith('app-media://') ||
            instance.icon.startsWith('http')) ? (
          <LazyImage
            src={instance.icon}
            alt={instance.name}
            className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center overflow-hidden border border-border/80 shrink-0"
            fallback={<Box className="w-6 h-6 text-muted-foreground" />}
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center border border-border/80 shrink-0">
            <span className="text-xl">{instance.icon || ''}</span>
            {!instance.icon && <Box className="w-6 h-6 text-muted-foreground" />}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-medium text-foreground truncate">{instance.name}</h3>
            {instanceFpsDisplay && (
              <span className="text-[10px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded">{instanceFpsDisplay}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
            <span className="capitalize">{instance.loader || 'Vanilla'}</span>
            <span className="text-border">·</span>
            <span>{instance.version}</span>
          </div>

          <div className="mt-1.5 flex items-center gap-1.5">
            <Badge
              variant={isRunning ? 'default' : 'secondary'}
              className="text-[10px] px-1.5 py-0 h-4 gap-1"
            >
              {isRunning && <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
              {statusLabel}
            </Badge>
          </div>
        </div>

        {actionMenu ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            {actionMenu}
          </DropdownMenu>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onContextAction && onContextAction(e, instance);
            }}
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        )}
      </div>

      <Separator className="mb-2.5 opacity-60" />

      <div className="relative z-10 flex justify-between items-center">
        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Clock className="h-3 w-3" />
          {formatTime}
        </span>

        <Button
          variant={isRunning ? 'destructive' : 'default'}
          size="sm"
          className={`h-7 gap-1 text-xs ${
            !isRunning && !isInstalling && !isLaunching && !pendingLaunches[instance.name]
              ? 'opacity-0 group-hover:opacity-100 transition-opacity'
              : ''
          }`}
          onClick={handlePlayStopClick}
          disabled={isInstalling || isLaunching || pendingLaunches[instance.name]}
          title={
            isRunning
              ? t('common.stop')
              : isInstalling
                ? installState?.status || t('common.installing')
                : isLaunching || pendingLaunches[instance.name]
                  ? t('common.starting')
                  : t('dashboard.launch_game')
          }
        >
          {isRunning ? (
            <>
              <Square className="w-3 h-3" />
              {t('common.stop')}
            </>
          ) : isInstalling || isLaunching || pendingLaunches[instance.name] ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              {isInstalling ? t('common.installing') : t('common.starting')}
            </>
          ) : (
            <>
              <Play className="w-3 h-3" />
              {t('common.play')}
            </>
          )}
        </Button>
      </div>
    </div>
  );
});

InstanceCard.displayName = 'InstanceCard';

function Dashboard({
  onInstanceClick,
  runningInstances = {},
  runningInstanceStats = {},
  activeDownloads = {},
  triggerCreate,
  onCreateHandled,
  isGuest,
}) {
  const { addNotification } = useNotification();
  const { t } = useTranslation();

  // State
  const [instances, setInstances] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPixelEditor, setShowPixelEditor] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [instanceToDelete, setInstanceToDelete] = useState(null);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [selectedVersion, setSelectedVersion] = useState('');
  const [selectedLoader, setSelectedLoader] = useState('Vanilla');
  const [newInstanceIcon, setNewInstanceIcon] = useState(DEFAULT_ICON);
  const [availableVersions, setAvailableVersions] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [loaderVersions, setLoaderVersions] = useState([]);
  const [selectedLoaderVersion, setSelectedLoaderVersion] = useState('');
  const [availableLoaders] = useState({
    Vanilla: true,
    Fabric: true,
    Forge: true,
    NeoForge: true,
    Quilt: true,
  });
  const [pendingLaunches, setPendingLaunches] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMethod, setSortMethod] = useState('playtime');
  const [groupMethod, setGroupMethod] = useState('version');
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [actionBarActions, setActionBarActions] = useState([]);
  const [showSnapshots, setShowSnapshots] = useState(false);

  const deferredSearchQuery = React.useDeferredValue(searchQuery);
  const fileInputRef = useRef(null);

  // Memoized values
  const versionOptions = useMemo(() =>
    availableVersions.map(v => ({ value: v.id, label: v.id })),
    [availableVersions]
  );

  const loaderCards = useMemo(() => [
    { value: 'Vanilla', label: 'Vanilla', icon: Box, description: t('dashboard.wizard.loader_desc_vanilla', 'Pure Minecraft, no mods') },
    { value: 'Fabric', label: 'Fabric', icon: Shirt, description: t('dashboard.wizard.loader_desc_fabric', 'Lightweight, modern mod loader') },
    { value: 'Forge', label: 'Forge', icon: Hammer, description: t('dashboard.wizard.loader_desc_forge', 'The classic with the biggest mod selection') },
    { value: 'NeoForge', label: 'NeoForge', icon: Flame, description: t('dashboard.wizard.loader_desc_neoforge', "Forge's successor with better performance") },
    { value: 'Quilt', label: 'Quilt', icon: LayoutGrid, description: t('dashboard.wizard.loader_desc_quilt', 'Fabric-compatible with more features') },
  ], [t]);

  const wizardSteps = useMemo(() => {
    const steps = [
      { id: 'identity', label: t('dashboard.wizard.step_identity', 'Name & Icon') },
      { id: 'loader', label: t('dashboard.wizard.step_loader', 'Loader') },
      { id: 'version', label: t('dashboard.wizard.step_version', 'Version') },
    ];
    if (selectedLoader.toLowerCase() !== 'vanilla') {
      steps.push({ id: 'loaderVersion', label: t('dashboard.wizard.step_loader_version', 'Loader Version') });
    }
    steps.push({ id: 'review', label: t('dashboard.wizard.step_review', 'Review') });
    return steps;
  }, [selectedLoader, t]);

  const currentStepId = wizardSteps[stepIndex]?.id || wizardSteps[0].id;
  const isLastStep = stepIndex === wizardSteps.length - 1;

  const sortOptions = useMemo(() => [
    { value: 'name', label: t('dashboard.sort.name') },
    { value: 'version', label: t('dashboard.sort.version') },
    { value: 'playtime', label: t('dashboard.sort.playtime') },
  ], [t]);

  const groupOptions = useMemo(() => [
    { value: 'none', label: t('dashboard.group.none') },
    { value: 'version', label: t('dashboard.group.version') },
    { value: 'loader', label: t('dashboard.group.loader') },
  ], [t]);

  // Callbacks
  const loadInstances = useCallback(async () => {
    const list = await window.electronAPI.getInstances();
    setInstances(filterInstancesForMode(list, 'launcher'));
  }, []);

  const handleCodeImportComplete = useCallback(async (modpackData) => {
    addNotification(t('dashboard.import_starting', { name: modpackData.name }), 'info');

    try {
      const createRes = await window.electronAPI.createInstance(
        modpackData.name,
        modpackData.instanceVersion || modpackData.version,
        modpackData.instanceLoader || modpackData.loader,
        null
      );

      if (createRes.success) {
        const instanceName = createRes.instanceName;
        window.electronAPI.installSharedContent(instanceName, modpackData);
        addNotification(t('dashboard.instance_created', { name: instanceName }), 'success');
        loadInstances();
      } else {
        addNotification(t('dashboard.create_failed', { error: createRes.error }), 'error');
      }
    } catch (error) {
      console.error('Code import error:', error);
      addNotification(t('dashboard.import_failed', { error: error.message }), 'error');
    }
  }, [addNotification, t, loadInstances]);

  const fetchVersions = useCallback(async () => {
    setLoadingVersions(true);
    const res = await window.electronAPI.getVanillaVersions();
    setLoadingVersions(false);
    if (res.success) {
      const versions = res.versions.filter(v => v.type === 'release');
      setAvailableVersions(versions);
      if (versions.length > 0) setSelectedVersion(versions[0].id);
    }
  }, []);

  // Effects
  useEffect(() => {
    if (triggerCreate) {
      setShowCreateModal(true);
      if (onCreateHandled) onCreateHandled();
    }
  }, [triggerCreate, onCreateHandled]);

  useEffect(() => {
    loadInstances();

    const removeListener = window.electronAPI.onInstanceStatus(({ instanceName, status }) => {
      if (status === 'stopped' || status === 'ready' || status === 'error' || status === 'deleted') {
        loadInstances();
      }
    });

    return () => {
      if (removeListener) removeListener();
    };
  }, [loadInstances]);

  useEffect(() => {
    const loadActionBarActions = async () => {
      try {
        const settingsRes = await window.electronAPI.getSettings();
        if (settingsRes?.success) {
          const existingActions = Array.isArray(settingsRes.settings?.actionBarActions)
            ? settingsRes.settings.actionBarActions
            : [];
          setActionBarActions(existingActions);
        }
      } catch (e) {
        // Silent fail
      }
    };

    loadActionBarActions();

    const removeSettingsListener = window.electronAPI?.onSettingsUpdated?.((newSettings) => {
      const existingActions = Array.isArray(newSettings?.actionBarActions)
        ? newSettings.actionBarActions
        : [];
      setActionBarActions(existingActions);
    });

    return () => {
      if (removeSettingsListener) removeSettingsListener();
    };
  }, []);

  useEffect(() => {
    if (showCreateModal) {
      fetchVersions();
      setNewInstanceName('');
      setNewInstanceIcon(DEFAULT_ICON);
      setSelectedLoader('Vanilla');
      setIsCreating(false);
      setStepIndex(0);
      setLoaderVersions([]);
      setSelectedLoaderVersion('');
    }
  }, [showCreateModal, fetchVersions]);

  useEffect(() => {
    if (!showCreateModal) return;

    const updateVersions = async () => {
      setLoadingVersions(true);
      try {
        if (selectedLoader === 'Vanilla') {
          const res = await window.electronAPI.getVanillaVersions();
          if (res.success) {
            const versions = res.versions.filter(v => (showSnapshots ? true : v.type === 'release'));
            setAvailableVersions(versions);
            if (versions.length > 0 && (!selectedVersion || !versions.find(v => v.id === selectedVersion))) {
              setSelectedVersion(versions[0].id);
            }
          }
        } else {
          const res = await window.electronAPI.getSupportedGameVersions(selectedLoader);
          if (res.success) {
            let versions = res.versions;
            if (!showSnapshots) {
              versions = versions.filter(v => /^\d+\.\d+(\.\d+)?$/.test(v));
            }
            const versionObjs = versions.map(v => ({ id: v, type: 'release' }));
            setAvailableVersions(versionObjs);
            if (versionObjs.length > 0 && (!selectedVersion || !versionObjs.find(v => v.id === selectedVersion))) {
              setSelectedVersion(versionObjs[0].id);
            } else if (versionObjs.length === 0) {
              setSelectedVersion('');
            }
          } else {
            setAvailableVersions([]);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingVersions(false);
      }
    };

    updateVersions();
  }, [showCreateModal, selectedLoader, showSnapshots, selectedVersion]);

  const hasInstanceAction = useCallback((instanceName) => {
    return actionBarActions.some(
      (action) =>
        action?.target === instanceName &&
        (action?.type === 'instance:start' || action?.type === 'instance:stop')
    );
  }, [actionBarActions]);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewInstanceIcon(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const canAdvanceStep = useCallback((stepId) => {
    if (stepId === 'version') return Boolean(selectedVersion) && !loadingVersions;
    if (stepId === 'loaderVersion') return Boolean(selectedLoaderVersion) && !loadingVersions;
    return true;
  }, [selectedVersion, selectedLoaderVersion, loadingVersions]);

  const handleBack = useCallback(() => {
    setStepIndex(i => Math.max(0, i - 1));
  }, []);

  const handleSubmitCreate = useCallback(async () => {
    if (isCreating) return;
    setIsCreating(true);

    const loaderForApi = selectedLoader.toLowerCase();
    const nameToUse = newInstanceName.trim() || t('dashboard.wizard.name_placeholder', 'New Instance');

    try {
      const result = await window.electronAPI.createInstance(
        nameToUse,
        selectedVersion,
        loaderForApi,
        newInstanceIcon,
        loaderForApi !== 'vanilla' ? selectedLoaderVersion : null
      );

      if (result.success) {
        setShowCreateModal(false);
        await loadInstances();
        addNotification(`Started creating: ${result.instanceName || nameToUse}`, 'success');
        Analytics.trackInstanceCreation(loaderForApi, selectedVersion);
      } else {
        addNotification(`Failed to create instance: ${result.error}`, 'error');
      }
    } catch (err) {
      addNotification(`Error creating instance: ${err.message}`, 'error');
    } finally {
      setIsCreating(false);
    }
  }, [isCreating, selectedLoader, selectedVersion, newInstanceName, newInstanceIcon, selectedLoaderVersion, addNotification, loadInstances, t]);

  const handleNext = useCallback(async (e) => {
    e.preventDefault();
    if (isCreating) return;

    if (!canAdvanceStep(currentStepId)) {
      if (currentStepId === 'version') {
        addNotification(t('dashboard.wizard.version_required', 'Please select a Minecraft version first.'), 'error');
      }
      return;
    }

    if (isLastStep) {
      await handleSubmitCreate();
      return;
    }

    // Leaving the loader step for a non-vanilla loader: fetch its available builds first.
    if (currentStepId === 'loader' && selectedLoader.toLowerCase() !== 'vanilla') {
      setLoadingVersions(true);
      try {
        const res = await window.electronAPI.getLoaderVersions(selectedLoader.toLowerCase(), selectedVersion);
        setLoadingVersions(false);

        if (res.success && res.versions && res.versions.length > 0) {
          setLoaderVersions(res.versions);
          setSelectedLoaderVersion(res.versions[0].version);
        } else {
          addNotification(t('dashboard.wizard.no_loader_versions', 'No specific loader versions found, using latest.'), 'info');
        }
      } catch (err) {
        setLoadingVersions(false);
        addNotification(t('dashboard.wizard.loader_versions_failed', { error: err.message }), 'error');
        return;
      }
    }

    setStepIndex(i => Math.min(wizardSteps.length - 1, i + 1));
  }, [isCreating, canAdvanceStep, currentStepId, isLastStep, selectedLoader, selectedVersion, addNotification, t, handleSubmitCreate, wizardSteps.length]);

  const handleContextAction = useCallback(async (action, instance) => {
    switch (action) {
      case 'add-to-actionbar':
        try {
          const settingsRes = await window.electronAPI.getSettings();
          if (!settingsRes?.success) {
            addNotification('Failed to load settings', 'error');
            break;
          }

          const existingActions = Array.isArray(settingsRes.settings?.actionBarActions)
            ? settingsRes.settings.actionBarActions
            : [];

          const liveStatus = runningInstances[instance.name];
          const isRunning = liveStatus === 'running';
          const nextAction = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: isRunning
              ? `${instance.name} (${t('common.stop')})`
              : `${instance.name} (${t('common.play')})`,
            type: isRunning ? 'instance:stop' : 'instance:start',
            icon: instance.icon && instance.icon.startsWith('data:') ? instance.icon : '',
            path: '',
            target: instance.name,
          };

          const saveRes = await window.electronAPI.saveSettings({
            ...settingsRes.settings,
            actionBarActions: [...existingActions, nextAction],
          });

          if (saveRes?.success) {
            addNotification(t('action_bar.added', 'Added to Actionbar'), 'success');
            setActionBarActions([...existingActions, nextAction]);
          } else {
            addNotification('Failed to save action', 'error');
          }
        } catch (e) {
          addNotification(`Failed to add action: ${e.message}`, 'error');
        }
        break;

      case 'remove-from-actionbar':
        try {
          const settingsRes = await window.electronAPI.getSettings();
          if (!settingsRes?.success) {
            addNotification('Failed to load settings', 'error');
            break;
          }

          const existingActions = Array.isArray(settingsRes.settings?.actionBarActions)
            ? settingsRes.settings.actionBarActions
            : [];

          const filteredActions = existingActions.filter(
            (entry) =>
              !(
                entry?.target === instance.name &&
                (entry?.type === 'instance:start' || entry?.type === 'instance:stop')
              )
          );

          const saveRes = await window.electronAPI.saveSettings({
            ...settingsRes.settings,
            actionBarActions: filteredActions,
          });

          if (saveRes?.success) {
            addNotification(t('action_bar.removed', 'Removed from Actionbar'), 'success');
            setActionBarActions(filteredActions);
          } else {
            addNotification('Failed to remove action', 'error');
          }
        } catch (e) {
          addNotification(`Failed to remove action: ${e.message}`, 'error');
        }
        break;

      case 'play':
        window.electronAPI.launchGame(instance.name);
        break;

      case 'view':
        onInstanceClick(instance);
        break;

      case 'duplicate':
        try {
          const result = await window.electronAPI.duplicateInstance(instance.name);
          if (result.success) {
            addNotification(`Duplicated instance: ${instance.name}`, 'success');
            await loadInstances();
          } else {
            addNotification(`Duplicate failed: ${result.error}`, 'error');
          }
        } catch (e) {
          addNotification(`Duplicate failed: ${e.message}`, 'error');
        }
        break;

      case 'export':
        try {
          const exportResult = await window.electronAPI.exportInstance(instance.name);
          if (exportResult.success) {
            addNotification(`Exported to ${exportResult.path}`, 'success');
          } else if (exportResult.error !== 'Cancelled') {
            addNotification(`Export failed: ${exportResult.error}`, 'error');
          }
        } catch (e) {
          addNotification(`Export failed: ${e.message}`, 'error');
        }
        break;

      case 'export-voidrixmodpack':
        try {
          const exportResult = await window.electronAPI.exportVoidrixModpack(instance.name);
          if (exportResult.success) {
            addNotification(`Exported Voidrix Modpack to ${exportResult.path}`, 'success');
          } else if (exportResult.error !== 'Cancelled') {
            addNotification(`Voidrix Modpack export failed: ${exportResult.error}`, 'error');
          }
        } catch (e) {
          addNotification(`Voidrix Modpack export failed: ${e.message}`, 'error');
        }
        break;

      case 'export-mrpack':
        try {
          const exportResult = await window.electronAPI.exportMrpack(instance.name);
          if (exportResult.success) {
            addNotification(`Exported .mrpack to ${exportResult.path}`, 'success');
          } else if (exportResult.error !== 'Cancelled') {
            addNotification(`.mrpack export failed: ${exportResult.error}`, 'error');
          }
        } catch (e) {
          addNotification(`.mrpack export failed: ${e.message}`, 'error');
        }
        break;

      case 'export-zip':
        try {
          const exportResult = await window.electronAPI.exportInstanceZip(instance.name);
          if (exportResult.success) {
            addNotification(`Exported .zip to ${exportResult.path}`, 'success');
          } else if (exportResult.error !== 'Cancelled') {
            addNotification(`.zip export failed: ${exportResult.error}`, 'error');
          }
        } catch (e) {
          addNotification(`.zip export failed: ${e.message}`, 'error');
        }
        break;

      case 'folder':
        window.electronAPI.openInstanceFolder(instance.name);
        break;

      case 'delete':
        setInstanceToDelete(instance);
        setShowDeleteModal(true);
        break;
    }
  }, [addNotification, t, runningInstances, onInstanceClick, loadInstances]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!instanceToDelete) return;

    setIsLoading(true);
    try {
      const status = runningInstances[instanceToDelete.name];
      if (status) {
        await window.electronAPI.killGame(instanceToDelete.name);
        addNotification(`Stopped ${instanceToDelete.name}`, 'info');
      }
      await window.electronAPI.deleteInstance(instanceToDelete.name);
      addNotification(`Deleted instance: ${instanceToDelete.name}`, 'info');
      await loadInstances();
    } catch (e) {
      addNotification(`Failed to delete: ${e.message}`, 'error');
    } finally {
      setIsLoading(false);
      setShowDeleteModal(false);
      setInstanceToDelete(null);
    }
  }, [instanceToDelete, runningInstances, addNotification, loadInstances]);

  // Memoized filtered and sorted instances
  const filteredInstances = useMemo(() =>
    instances.filter(
      inst =>
        inst.name.toLowerCase().includes(deferredSearchQuery.toLowerCase()) ||
        inst.version.toLowerCase().includes(deferredSearchQuery.toLowerCase())
    ), [instances, deferredSearchQuery]
  );

  const sortedInstances = useMemo(() =>
    [...filteredInstances].sort((a, b) => {
      if (sortMethod === 'name') return a.name.localeCompare(b.name);
      if (sortMethod === 'playtime') return (b.playtime || 0) - (a.playtime || 0);
      if (sortMethod === 'version') {
        return b.version.localeCompare(a.version, undefined, {
          numeric: true,
          sensitivity: 'base',
        });
      }
      return 0;
    }), [filteredInstances, sortMethod]
  );

  const groupedData = useMemo(() => {
    if (groupMethod === 'none') {
      return [{ title: null, items: sortedInstances }];
    }

    const groups = {};
    sortedInstances.forEach(inst => {
      const key = groupMethod === 'version' ? inst.version : inst.loader || 'Vanilla';
      if (!groups[key]) groups[key] = [];
      groups[key].push(inst);
    });

    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (groupMethod === 'version') {
        return b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' });
      }
      return a.localeCompare(b);
    });

    return sortedKeys.map(key => ({ title: key, items: groups[key] }));
  }, [sortedInstances, groupMethod]);

  const isEmpty = useMemo(() =>
    groupedData.length === 0 || (groupedData.length === 1 && groupedData[0].items.length === 0),
    [groupedData]
  );

  const totalCount = instances.length;
  const runningCount = Object.values(runningInstances || {}).filter((s) => s === 'running').length;
  const filteredCount = sortedInstances.length;

  // Menu items memoization
  const instanceMenuItems = useCallback((instance) => (
    <>
      <ContextMenuItem onClick={() => handleContextAction('play', instance)}>
        <Play className="w-4 h-4 mr-2" />
        {t('dashboard.context.play')}
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem onClick={() => handleContextAction('view', instance)}>
        <Eye className="w-4 h-4 mr-2" />
        {t('dashboard.context.view')}
      </ContextMenuItem>
      <ContextMenuItem onClick={() => handleContextAction('duplicate', instance)}>
        <Copy className="w-4 h-4 mr-2" />
        {t('dashboard.context.duplicate')}
      </ContextMenuItem>
      <ContextMenuItem onClick={() => handleContextAction('export-voidrixmodpack', instance)}>
        <FileDown className="w-4 h-4 mr-2" />
        {t('dashboard.context.export_voidrixmodpack', 'Export als .voidrixmodpack')}
      </ContextMenuItem>
      <ContextMenuItem onClick={() => handleContextAction('export-mrpack', instance)}>
        <Download className="w-4 h-4 mr-2" />
        {t('dashboard.context.export_mrpack', 'Export als .mrpack (Modrinth)')}
      </ContextMenuItem>
      <ContextMenuItem onClick={() => handleContextAction('export-zip', instance)}>
        <Download className="w-4 h-4 mr-2" />
        {t('dashboard.context.export_zip', 'Export als .zip')}
      </ContextMenuItem>
      <ContextMenuItem onClick={() => handleContextAction('folder', instance)}>
        <FolderOpen className="w-4 h-4 mr-2" />
        {t('dashboard.context.folder')}
      </ContextMenuItem>
      {hasInstanceAction(instance.name) ? (
        <ContextMenuItem onClick={() => handleContextAction('remove-from-actionbar', instance)}>
          <Zap className="w-4 h-4 mr-2" />
          {t('action_bar.remove_from_actionbar', 'Remove from Actionbar')}
        </ContextMenuItem>
      ) : (
        <ContextMenuItem onClick={() => handleContextAction('add-to-actionbar', instance)}>
          <Zap className="w-4 h-4 mr-2" />
          {t('action_bar.add_to_actionbar', 'Add to Actionbar')}
        </ContextMenuItem>
      )}
      <ContextMenuSeparator />
      <ContextMenuItem
        className="text-destructive focus:text-destructive"
        onClick={() => handleContextAction('delete', instance)}
      >
        <Trash2 className="w-4 h-4 mr-2" />
        {t('dashboard.context.delete')}
      </ContextMenuItem>
    </>
  ), [handleContextAction, t, hasInstanceAction]);

  const renderInstanceCard = useCallback((instance) => (
    <ContextMenu key={instance.name}>
      <ContextMenuTrigger>
        <InstanceCard
          instance={instance}
          runningInstances={runningInstances}
          runningInstanceStats={runningInstanceStats}
          activeDownloads={activeDownloads}
          pendingLaunches={pendingLaunches}
          onInstanceClick={onInstanceClick}
          onContextAction={(e, inst) => e.stopPropagation()}
          actionMenu={
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleContextAction('play', instance); }}>
                <Play className="w-4 h-4 mr-2" />
                {t('dashboard.context.play')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleContextAction('view', instance); }}>
                <Eye className="w-4 h-4 mr-2" />
                {t('dashboard.context.view')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleContextAction('duplicate', instance); }}>
                <Copy className="w-4 h-4 mr-2" />
                {t('dashboard.context.duplicate')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleContextAction('export-voidrixmodpack', instance); }}>
                <FileDown className="w-4 h-4 mr-2" />
                {t('dashboard.context.export_voidrixmodpack', 'Export als .voidrixmodpack')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleContextAction('export-mrpack', instance); }}>
                <Download className="w-4 h-4 mr-2" />
                {t('dashboard.context.export_mrpack', 'Export als .mrpack (Modrinth)')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleContextAction('export-zip', instance); }}>
                <Download className="w-4 h-4 mr-2" />
                {t('dashboard.context.export_zip', 'Export als .zip')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleContextAction('folder', instance); }}>
                <FolderOpen className="w-4 h-4 mr-2" />
                {t('dashboard.context.folder')}
              </DropdownMenuItem>
              {hasInstanceAction(instance.name) ? (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleContextAction('remove-from-actionbar', instance); }}>
                  <Zap className="w-4 h-4 mr-2" />
                  {t('action_bar.remove_from_actionbar', 'Remove from Actionbar')}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleContextAction('add-to-actionbar', instance); }}>
                  <Zap className="w-4 h-4 mr-2" />
                  {t('action_bar.add_to_actionbar', 'Add to Actionbar')}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => { e.stopPropagation(); handleContextAction('delete', instance); }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t('dashboard.context.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          }
          addNotification={addNotification}
          loadInstances={loadInstances}
          setPendingLaunches={setPendingLaunches}
          t={t}
          isGuest={isGuest}
        />
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {instanceMenuItems(instance)}
      </ContextMenuContent>
    </ContextMenu>
  ), [runningInstances, activeDownloads, pendingLaunches, onInstanceClick, handleContextAction, addNotification, loadInstances, setPendingLaunches, t, isGuest, instanceMenuItems, hasInstanceAction]);

  return (
    <div className="flex flex-col h-full relative">
      {isLoading && <LoadingOverlay message="Processing..." />}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.08] via-transparent to-blue-500/[0.08]" />
        <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <PageHeader
        title={t('dashboard.title')}
        description={t('dashboard.desc')}
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-border/80 bg-card/60 py-1 pl-1 pr-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15">
              <Box className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground">{totalCount}</span>
            <span className="text-xs text-muted-foreground">{t('dashboard.instances', 'Instanzen')}</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-border/80 bg-card/60 py-1 pl-1 pr-3">
            <div className={`flex h-6 w-6 items-center justify-center rounded-full ${runningCount > 0 ? 'bg-emerald-500/15' : 'bg-muted'}`}>
              <Play className={`h-3.5 w-3.5 ${runningCount > 0 ? 'text-emerald-400' : 'text-muted-foreground'}`} />
            </div>
            <span className="text-sm font-semibold text-foreground">{runningCount}</span>
            <span className="text-xs text-muted-foreground">{t('common.running')}</span>
          </div>

          {filteredCount !== totalCount && (
            <Badge variant="outline" className="h-7 px-3 text-xs">
              {filteredCount} {t('common.visible', 'sichtbar')}
            </Badge>
          )}
        </div>
      </PageHeader>

      <PageContent className="relative z-10">
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-border/80 bg-card/50 p-3 md:flex-row md:items-end md:p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('dashboard.search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pl-9"
            />
          </div>

          <div className="flex flex-wrap items-end gap-2.5">
            <div className="w-[168px] space-y-1">
              <span className="flex items-center gap-1.5 px-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                <ArrowUpDown className="h-3 w-3" />
                {t('dashboard.sort_by', 'Sortierung')}
              </span>
              <SelectDropdown options={sortOptions} value={sortMethod} onChange={setSortMethod} />
            </div>

            <div className="w-[168px] space-y-1">
              <span className="flex items-center gap-1.5 px-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                <Layers className="h-3 w-3" />
                {t('dashboard.group_by', 'Gruppierung')}
              </span>
              <SelectDropdown options={groupOptions} value={groupMethod} onChange={setGroupMethod} />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="h-10 gap-2">
                  <Plus className="w-4 h-4" />
                  {t('dashboard.new_instance')}
                  <ChevronDown className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('dashboard.manual_creation')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    try {
                      if (!window.electronAPI.importFile) {
                        throw new Error('electronAPI.importFile is not defined. Please restart the application.');
                      }
                      const result = await window.electronAPI.importFile();
                      if (result.success) {
                        addNotification(`Importing Modpack: ${result.instanceName}...`, 'info');
                        loadInstances();
                      } else if (result.error !== 'Cancelled') {
                        addNotification(`Import failed: ${result.error}`, 'error');
                      }
                    } catch (err) {
                      console.error('[Dashboard] Import error:', err);
                      addNotification(`Import error: ${err.message}`, 'error');
                    }
                  }}
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  {t('dashboard.import_file')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    try {
                      const result = await window.electronAPI.importVoidrixModpackStrict();
                      if (result.success) {
                        addNotification(`Imported: ${result.instanceName}`, 'success');
                        loadInstances();
                      } else if (result.error !== 'Cancelled') {
                        addNotification(`Import failed: ${result.error}`, 'error');
                      }
                    } catch (err) {
                      console.error('[Dashboard] Import Voidrix Modpack strict error:', err);
                      addNotification(`Import error: ${err.message}`, 'error');
                    }
                  }}
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  {t('dashboard.import_voidrixmodpack', 'Import .voidrixmodpack only')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowCodeModal(true)}>
                  <FileCode className="w-4 h-4 mr-2" />
                  {t('dashboard.import_code')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {isEmpty ? (
          searchQuery ? (
            <EmptyState
              icon={Search}
              title={t('dashboard.no_instances')}
              description={t('dashboard.no_search_results', 'Versuch es mit einem anderen Suchbegriff.')}
            />
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/30 px-8 py-16 text-center">
              <div className="relative mb-5">
                <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-2xl" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/20 to-primary/5">
                  <Box className="h-7 w-7 text-primary" />
                </div>
              </div>
              <h3 className="text-base font-semibold text-foreground">{t('dashboard.no_instances')}</h3>
              <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{t('dashboard.create_to_start')}</p>
              <div className="mt-6 flex items-center gap-2">
                <Button onClick={() => setShowCreateModal(true)} className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  {t('dashboard.new_instance')}
                </Button>
                <Button variant="outline" onClick={() => setShowCodeModal(true)} className="gap-1.5">
                  <FileCode className="h-4 w-4" />
                  {t('dashboard.import_code')}
                </Button>
              </div>
              <div className="mt-8 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary/70" />
                {t('dashboard.empty_hint', 'Du kannst Instanzen auch per Rechtsklick duplizieren oder exportieren.')}
              </div>
            </div>
          )
        ) : (
          <div className="space-y-6">
            {groupedData.map((group) => (
              <div key={group.title || 'all'}>
                {group.title && (
                  <div className="mb-3 flex items-center gap-3">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.14em] whitespace-nowrap">
                      {group.title}
                    </span>
                    <Separator className="flex-1" />
                    <Badge variant="outline" className="h-6 px-2 text-[10px]">
                      {group.items.length}
                    </Badge>
                  </div>
                )}
                <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
                  {group.items.map(renderInstanceCard)}
                </div>
              </div>
            ))}
          </div>
        )}
      </PageContent>

      {/* Modals */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-2xl overflow-hidden p-0">
          <DialogHeader>
            <div className="border-b border-border/70 px-6 py-4">
              <DialogTitle className="text-xl">{t('dashboard.wizard.title', 'Create New Instance')}</DialogTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('dashboard.wizard.subtitle', 'Build a profile with a custom name, loader and icon.')}
              </p>
            </div>
          </DialogHeader>

          <form onSubmit={handleNext} className="space-y-0">
            <div className="px-6 py-5">
              {/* Stepper */}
              <div className="mb-6 flex items-center">
                {wizardSteps.map((step, idx) => {
                  const state = idx < stepIndex ? 'done' : idx === stepIndex ? 'active' : 'upcoming';
                  return (
                    <React.Fragment key={step.id}>
                      <div className="flex flex-col items-center gap-1.5">
                        <div
                          className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
                            state === 'done' && 'border-primary bg-primary text-primary-foreground',
                            state === 'active' && 'border-primary bg-primary/10 text-primary',
                            state === 'upcoming' && 'border-border text-muted-foreground'
                          )}
                        >
                          {state === 'done' ? <Check className="h-4 w-4" /> : idx + 1}
                        </div>
                        <span
                          className={cn(
                            'whitespace-nowrap text-[10px] font-medium uppercase tracking-wide',
                            state === 'upcoming' ? 'text-muted-foreground' : 'text-foreground'
                          )}
                        >
                          {step.label}
                        </span>
                      </div>
                      {idx < wizardSteps.length - 1 && (
                        <div className={cn('mx-2 h-px flex-1 -translate-y-2.5', idx < stepIndex ? 'bg-primary' : 'bg-border')} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {currentStepId === 'identity' && (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
                  <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                    <p className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                      {t('dashboard.wizard.icon_label', 'Instance Icon')}
                    </p>
                    <div
                      className="group relative mx-auto flex h-28 w-28 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-background transition-colors hover:border-primary/50"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <img src={newInstanceIcon} alt="Icon" className="object-cover w-full h-full" loading="lazy" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                        <ImageIcon className="h-6 w-6 text-white" />
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full"
                      onClick={() => setShowPixelEditor(true)}
                    >
                      {t('dashboard.pixel_editor_btn', 'Pixel Editor')}
                    </Button>
                    <p className="mt-2 text-center text-[11px] text-muted-foreground">
                      {t('dashboard.click_to_upload_icon', 'Click icon to upload')}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t('dashboard.wizard.name_label', 'Name')}</Label>
                      <Input
                        type="text"
                        value={newInstanceName}
                        onChange={(e) => setNewInstanceName(e.target.value)}
                        placeholder={t('dashboard.wizard.name_placeholder', 'New Instance')}
                        className="h-10"
                        autoFocus
                      />
                    </div>

                    <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-xs text-muted-foreground">
                      {t('dashboard.wizard.subtitle', 'Build a profile with a custom name, loader and icon.')}
                    </div>
                  </div>
                </div>
              )}

              {currentStepId === 'loader' && (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {loaderCards.map((loaderCard) => {
                    const Icon = loaderCard.icon;
                    const active = selectedLoader === loaderCard.value;
                    return (
                      <button
                        key={loaderCard.value}
                        type="button"
                        onClick={() => setSelectedLoader(loaderCard.value)}
                        aria-pressed={active}
                        className={cn(
                          'flex items-center gap-3 rounded-xl border p-3.5 text-left transition-colors',
                          active ? 'border-primary bg-primary/10' : 'border-border/70 bg-muted/20 hover:border-primary/40'
                        )}
                      >
                        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', active ? 'bg-primary/20 text-primary' : 'bg-background text-muted-foreground')}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">{loaderCard.label}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{loaderCard.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {currentStepId === 'version' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">{t('dashboard.version')}</Label>
                    <div className="flex items-center gap-1.5">
                      <Switch
                        checked={showSnapshots}
                        onCheckedChange={setShowSnapshots}
                        className="h-3.5 w-7 [&>span]:h-2.5 [&>span]:w-2.5"
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {t('dashboard.dev_builds')}
                      </span>
                    </div>
                  </div>

                  {loadingVersions ? (
                    <div className="flex h-10 items-center justify-center rounded-md border border-border bg-muted text-xs text-muted-foreground">
                      <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                      {t('common.loading')}
                    </div>
                  ) : (
                    <SelectDropdown
                      options={versionOptions}
                      value={selectedVersion}
                      onChange={setSelectedVersion}
                      placeholder={t('dashboard.select_version')}
                      className="w-full"
                    />
                  )}
                </div>
              )}

              {currentStepId === 'loaderVersion' && (
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    {t('dashboard.select_loader_version', { loader: selectedLoader })}
                  </Label>
                  {loadingVersions ? (
                    <div className="flex h-10 items-center justify-center rounded-md border border-border bg-muted text-xs text-muted-foreground">
                      <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                      {t('common.loading')}
                    </div>
                  ) : (
                    <SelectDropdown
                      options={loaderVersions.map(v => ({ value: v.version, label: v.version }))}
                      value={selectedLoaderVersion}
                      onChange={setSelectedLoaderVersion}
                      placeholder={t('dashboard.select_loader_version_placeholder')}
                    />
                  )}
                  <p className="text-xs text-muted-foreground mt-1">Minecraft {selectedVersion}</p>
                </div>
              )}

              {currentStepId === 'review' && (
                <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                  <div className="flex items-start gap-3.5">
                    <img src={newInstanceIcon} alt="" className="h-14 w-14 shrink-0 rounded-xl border border-border/70 object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold text-foreground">
                        {newInstanceName.trim() || t('dashboard.wizard.name_placeholder', 'New Instance')}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{t('dashboard.wizard.review_desc', 'Double-check your choices and get started.')}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2.5">
                    <div className="rounded-lg border border-border/60 bg-background/40 p-2.5">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('dashboard.loader')}</p>
                      <p className="mt-0.5 text-sm font-medium text-foreground">{selectedLoader}</p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-background/40 p-2.5">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('dashboard.version')}</p>
                      <p className="mt-0.5 text-sm font-medium text-foreground">{selectedVersion || '-'}</p>
                    </div>
                    {selectedLoader.toLowerCase() !== 'vanilla' && (
                      <div className="col-span-2 rounded-lg border border-border/60 bg-background/40 p-2.5">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('dashboard.wizard.step_loader_version', 'Loader Version')}</p>
                        <p className="mt-0.5 text-sm font-medium text-foreground">{selectedLoaderVersion || '-'}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 border-t border-border/70 bg-muted/20 px-6 py-4">
              {stepIndex === 0 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" size="sm" className="gap-1.5 mr-auto">
                      <Download className="w-3.5 h-3.5" />
                      {t('dashboard.import_options')}
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuItem
                      onClick={async () => {
                        try {
                          if (!window.electronAPI.importFile) {
                            throw new Error(
                              'electronAPI.importFile is not defined. Please restart the application.'
                            );
                          }
                          const result = await window.electronAPI.importFile();
                          if (result.success) {
                            addNotification(`Importing Modpack: ${result.instanceName}...`, 'info');
                            setShowCreateModal(false);
                            loadInstances();
                          } else if (result.error !== 'Cancelled') {
                            addNotification(`Import failed: ${result.error}`, 'error');
                          }
                        } catch (err) {
                          console.error('[Dashboard] Import error:', err);
                          addNotification(`Import error: ${err.message}`, 'error');
                        }
                      }}
                    >
                      <FileDown className="w-4 h-4 mr-2" />
                      {t('dashboard.import_file')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setShowCreateModal(false);
                        setShowCodeModal(true);
                      }}
                    >
                      <FileCode className="w-4 h-4 mr-2" />
                      {t('dashboard.import_code')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  disabled={isCreating}
                  className="mr-auto gap-1.5"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  {t('common.back')}
                </Button>
              )}

              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isCreating}
                onClick={() => setShowCreateModal(false)}
              >
                {t('common.cancel')}
              </Button>

              <Button
                type="submit"
                size="sm"
                disabled={isCreating || loadingVersions}
                className="gap-1.5"
              >
                {isCreating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isCreating
                  ? t('common.creating')
                  : isLastStep
                    ? t('common.create')
                    : t('common.next')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <PixelEditorDialog
        isOpen={showPixelEditor}
        onClose={() => setShowPixelEditor(false)}
        onSave={(dataUrl) => setNewInstanceIcon(dataUrl)}
        initialIcon={newInstanceIcon}
      />

      {showCodeModal && (
        <ModpackShareDialog
          isOpen={showCodeModal}
          mode="import"
          instance={null}
          onClose={() => setShowCodeModal(false)}
          onImportComplete={handleCodeImportComplete}
        />
      )}

      {showDeleteModal && (
        <ConfirmDialog
          title={t('dashboard.delete_title')}
          message={t('dashboard.delete_message', { name: instanceToDelete?.name })}
          confirmText={t('common.delete')}
          isDangerous={true}
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setShowDeleteModal(false);
            setInstanceToDelete(null);
          }}
        />
      )}
    </div>
  );
}

export default Dashboard;
