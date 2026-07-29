import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { SelectDropdown, ToggleSwitch } from '../components/common/inputs';
import { InstanceSettingsDialog, ModpackShareDialog, BackupManagerDialog, ConfirmDialog } from '../components/modals';
import { useNotification } from '../context/NotificationContext';
import { Analytics } from '../services/Analytics';
import ExtensionSlot from '../components/Extensions/ExtensionSlot';
import { getSourceTags } from '../utils/sourceTags';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import {
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
    DropdownMenuItem, DropdownMenuSeparator
} from '../components/ui/dropdown-menu';
import {
    Box, Package, Image, Globe, Terminal, Settings, MoreVertical,
    Play, Square, Folder, Download, Upload, RefreshCw, Trash2,
    Search, Plus, X, Check, Loader2, Sparkles, Save
} from 'lucide-react';

// ============================================
// MEMOIZED KOMPONENTEN
// ============================================

const TabButton = memo(({ id, active, onClick, icon: Icon, label }: any) => (
    <button
        onClick={() => onClick(id)}
        className={cn(
            'flex items-center gap-2 rounded-t-lg border-b-2 px-5 py-2.5 font-medium transition-all duration-200',
            active === id
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-transparent text-muted-foreground hover:border-primary/20 hover:bg-muted/40 hover:text-foreground'
        )}
    >
        <Icon className="h-4 w-4" />
        {label}
    </button>
));

const ContentTabButton = memo(({ view, active, onClick, icon: Icon, label, badge }: any) => (
    <button
        onClick={() => onClick(view)}
        className={cn(
            'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200',
            active === view
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'border border-border bg-card/50 text-muted-foreground hover:bg-primary/5 hover:text-foreground'
        )}
    >
        <Icon className="h-4 w-4" />
        {label}
        {badge > 0 && (
            <span className="ml-1 rounded-full bg-black/15 px-1.5 py-0.5 text-xs dark:bg-white/20">
                {badge}
            </span>
        )}
    </button>
));

const CategoryTabButton = memo(({ category, active, onClick, label }: any) => (
    <button
        onClick={() => onClick(category)}
        className={cn(
            'rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all',
            active === category
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'border border-border bg-card/50 text-muted-foreground hover:text-foreground'
        )}
    >
        {label}
    </button>
));

const ModCard = memo(({ mod, onToggle, onDelete, onUpdate, updateData, isUpdating }: any) => (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card/50 transition-colors duration-200 hover:border-primary/30">
        <div className="relative flex items-center justify-between p-3">
            <div className="flex min-w-0 items-center gap-3">
                {mod.icon ? (
                    <img src={mod.icon} alt="" className="h-10 w-10 shrink-0 rounded-lg bg-muted object-cover" />
                ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Box className="h-5 w-5 text-primary/60" />
                    </div>
                )}
                <div className="min-w-0">
                    <div className={cn('truncate font-medium', !mod.enabled ? 'text-muted-foreground line-through' : 'text-foreground')}>
                        {mod.title || mod.name}
                    </div>
                    <div className="mt-0.5 flex gap-2 text-[10px] text-muted-foreground">
                        <span className="rounded bg-muted px-1.5">{mod.version || '?'}</span>
                        <span className="truncate">{mod.name}</span>
                    </div>
                </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
                {updateData && (
                    <button
                        onClick={() => onUpdate(updateData)}
                        disabled={isUpdating}
                        className={cn(
                            'rounded-lg p-2 text-emerald-600 transition-all dark:text-emerald-400',
                            isUpdating ? 'bg-emerald-500/15' : 'bg-emerald-500/15 hover:bg-emerald-500 hover:text-white'
                        )}
                    >
                        {isUpdating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Download className="h-4 w-4" />
                        )}
                    </button>
                )}
                <ToggleSwitch checked={mod.enabled} onChange={() => onToggle(mod.name)} />
                <button
                    onClick={() => onDelete(mod.name)}
                    className="p-2 text-muted-foreground opacity-0 transition-colors hover:text-destructive group-hover:opacity-100"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>
        </div>
    </div>
));

const WorldCard = memo(({ world, onOpen, onBackup, onExport, onDelete }: any) => (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card/50 transition-colors duration-200 hover:border-primary/30">
        <div className="relative h-28 overflow-hidden bg-muted">
            {world.hasIcon ? (
                <img src={world.iconData} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                    <Globe className="h-10 w-10 text-muted-foreground/50 transition-colors group-hover:text-muted-foreground" />
                </div>
            )}
            <div className="absolute left-2 top-2 flex gap-1.5">
                <span className={cn(
                    'rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white',
                    world.gameMode === 'Creative' ? 'bg-purple-500/85' :
                    world.gameMode === 'Survival' ? 'bg-emerald-500/85' :
                    world.gameMode === 'Adventure' ? 'bg-violet-500/85' : 'bg-gray-500/85'
                )}>
                    {world.gameMode || 'Unknown'}
                </span>
                {world.hardcore && (
                    <span className="rounded-md bg-red-500/85 px-2 py-0.5 text-[9px] font-bold uppercase text-white">
                        Hardcore
                    </span>
                )}
            </div>
        </div>
        <div className="p-3">
            <h3 className="mb-2 truncate font-medium text-foreground" title={world.name}>{world.name}</h3>
            <div className="grid grid-cols-4 gap-1">
                <button onClick={() => onOpen(world)} className="flex justify-center rounded-lg bg-muted/60 p-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground" title="Ordner öffnen">
                    <Folder className="h-4 w-4" />
                </button>
                <button onClick={() => onBackup(world)} className="flex justify-center rounded-lg bg-muted/60 p-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground" title="Backup">
                    <Save className="h-4 w-4" />
                </button>
                <button onClick={() => onExport(world)} className="flex justify-center rounded-lg bg-muted/60 p-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground" title="Exportieren">
                    <Upload className="h-4 w-4" />
                </button>
                <button onClick={() => onDelete(world)} className="flex justify-center rounded-lg bg-destructive/10 p-2 text-destructive transition-all hover:bg-destructive/20" title="Löschen">
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>
        </div>
    </div>
));

const SearchResultCard = memo(({ result, onView, onInstall, installStatus }: any) => (
    <div
        className="group relative cursor-pointer overflow-hidden rounded-xl border border-border bg-card/50 transition-colors duration-200 hover:border-primary/30"
        onClick={() => onView(result)}
    >
        <div className="relative flex items-center gap-3 p-3">
            <img
                src={result.icon_url || 'https://cdn.modrinth.com/placeholder.svg'}
                alt=""
                className="h-12 w-12 shrink-0 rounded-lg bg-muted object-cover"
            />
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-medium text-foreground">{result.title}</h3>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] uppercase text-muted-foreground">
                        {result.project_type}
                    </span>
                    {getSourceTags(result.source, result.sources).map((tag: string) => (
                        <span key={tag} className="rounded bg-muted/60 px-1.5 py-0.5 text-[9px] uppercase text-muted-foreground/80">
                            {tag}
                        </span>
                    ))}
                </div>
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{result.description}</p>
            </div>
            <button
                onClick={(e) => { e.stopPropagation(); onInstall(result); }}
                disabled={installStatus === 'installing' || installStatus === 'success'}
                className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                    installStatus === 'success' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
                    installStatus === 'failed' ? 'bg-destructive/15 text-destructive' :
                    installStatus === 'installing' ? 'bg-muted text-muted-foreground' :
                    'bg-primary/15 text-primary hover:bg-primary hover:text-primary-foreground'
                )}
            >
                {installStatus === 'installing' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : installStatus === 'success' ? (
                    <Check className="h-3.5 w-3.5" />
                ) : (
                    <Download className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">
                    {installStatus === 'installing' ? 'Installiere...' :
                     installStatus === 'success' ? 'Installiert' :
                     installStatus === 'failed' ? 'Fehler' : 'Installieren'}
                </span>
            </button>
        </div>
    </div>
));

// Display Names
TabButton.displayName = 'TabButton';
ContentTabButton.displayName = 'ContentTabButton';
CategoryTabButton.displayName = 'CategoryTabButton';
ModCard.displayName = 'ModCard';
WorldCard.displayName = 'WorldCard';
SearchResultCard.displayName = 'SearchResultCard';

// ============================================
// HAUPTSETTINGS
// ============================================
function InstanceDetails({ instance, onBack, runningInstances, onInstanceUpdate, isGuest }: any) {
    const { t } = useTranslation();
    const { addNotification } = useNotification();

    // State
    const [activeTab, setActiveTab] = useState('content');
    const [contentView, setContentView] = useState('mods');
    const [searchCategory, setSearchCategory] = useState('mod');
    const [mods, setMods] = useState<any[]>([]);
    const [resourcePacks, setResourcePacks] = useState<any[]>([]);
    const [loadingResourcePacks, setLoadingResourcePacks] = useState(false);
    const [shaders, setShaders] = useState<any[]>([]);
    const [loadingShaders, setLoadingShaders] = useState(false);
    const [installationStatus, setInstallationStatus] = useState<Record<string, string>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
    const [sortMethod, setSortMethod] = useState('relevance');
    const [provider, setProvider] = useState('modrinth');
    const [searchOffset, setSearchOffset] = useState(0);
    const [totalHits, setTotalHits] = useState(0);
    const limit = 10;
    const [showCodeModal, setShowCodeModal] = useState(false);
    const [codeModalMode, setCodeModalMode] = useState('export');
    const [localSearchQuery, setLocalSearchQuery] = useState('');
    const [worlds, setWorlds] = useState<any[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [log, setLog] = useState('');
    const [logFiles, setLogFiles] = useState<string[]>([]);
    const [selectedLog, setSelectedLog] = useState('latest.log');
    const [logFilters, setLogFilters] = useState({ info: true, warn: true, error: true, debug: false });
    const [autoScroll, setAutoScroll] = useState(true);
    const logContainerRef = useRef<HTMLDivElement>(null);
    const status = runningInstances[instance.name];
    const isRunning = status === 'running';
    const isLaunching = status === 'launching';
    const isInstalling = status === 'installing';
    const [showSettings, setShowSettings] = useState(false);
    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [projectVersions, setProjectVersions] = useState<any[]>([]);
    const [loadingVersions, setLoadingVersions] = useState(false);
    const [localPending, setLocalPending] = useState(false);
    const [modToDelete, setModToDelete] = useState<any>(null);
    const [updates, setUpdates] = useState<Record<string, any>>({});
    const [checkingUpdates, setCheckingUpdates] = useState(false);
    const [updatingMod, setUpdatingMod] = useState<string | null>(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewProject, setPreviewProject] = useState<any>(null);
    const [lightboxIndex, setLightboxIndex] = useState(-1);
    const [worldToDelete, setWorldToDelete] = useState<any>(null);
    const [showBackupManager, setShowBackupManager] = useState(false);
    const prevStatusRef = useRef(status);

    // Memoized Values
    const filteredMods = useMemo(() =>
        mods.filter((m: any) =>
            (m.title || m.name || '').toLowerCase().includes(localSearchQuery.toLowerCase())
        ).sort((a, b) => (a.title || a.name || '').localeCompare(b.title || b.name || '')),
    [mods, localSearchQuery]);

    const filteredPacks = useMemo(() =>
        resourcePacks.filter((p: any) =>
            (p.title || p.name || '').toLowerCase().includes(localSearchQuery.toLowerCase())
        ).sort((a, b) => (a.title || a.name || '').localeCompare(b.title || b.name || '')),
    [resourcePacks, localSearchQuery]);

    const filteredShaders = useMemo(() =>
        shaders.filter((s: any) =>
            (s.title || s.name || '').toLowerCase().includes(localSearchQuery.toLowerCase())
        ).sort((a, b) => (a.title || a.name || '').localeCompare(b.title || b.name || '')),
    [shaders, localSearchQuery]);

    const filteredLogLines = useMemo(() => {
        if (!log) return [];
        return log.split('\n').filter(line => {
            const lower = line.toLowerCase();
            if (!lower.trim()) return false;
            if (logFilters.error && lower.includes('error')) return true;
            if (logFilters.warn && lower.includes('warn')) return true;
            if (logFilters.info && lower.includes('info')) return true;
            if (logFilters.debug && lower.includes('debug')) return true;
            return !lower.includes('error') && !lower.includes('warn') && !lower.includes('info') && !lower.includes('debug');
        });
    }, [log, logFilters]);

    const updateCount = useMemo(() => Object.keys(updates).length, [updates]);

    // Callbacks
    const loadMods = useCallback(async () => {
        const res = await window.electronAPI.getMods(instance.name);
        if (res.success) setMods(res.mods);
    }, [instance.name]);

    const loadResourcePacks = useCallback(async () => {
        setLoadingResourcePacks(true);
        try {
            const res = await window.electronAPI.getResourcePacks(instance.name);
            if (res.success) setResourcePacks(res.packs);
        } finally {
            setLoadingResourcePacks(false);
        }
    }, [instance.name]);

    const loadShaders = useCallback(async () => {
        setLoadingShaders(true);
        try {
            const res = await window.electronAPI.getShaders(instance.name);
            if (res.success) setShaders(res.shaders);
        } finally {
            setLoadingShaders(false);
        }
    }, [instance.name]);

    const loadWorlds = useCallback(async () => {
        const res = await window.electronAPI.getWorlds(instance.name);
        if (res.success) setWorlds(res.worlds);
    }, [instance.name]);

    const loadLogFiles = useCallback(async () => {
        const res = await window.electronAPI.getLogFiles(instance.name);
        if (res.success) setLogFiles(res.files.map((f: any) => f.name));
    }, [instance.name]);

    const loadLog = useCallback(async () => {
        if (selectedLog === 'latest.log' && isRunning) {
            const live = await window.electronAPI.getLiveLogs(instance.name);
            setLog(live.join('\n'));
        } else {
            const res = await window.electronAPI.getLog(instance.name, selectedLog);
            if (res.success) setLog(res.content);
        }
    }, [instance.name, selectedLog, isRunning]);

    const handleToggleMod = useCallback(async (fileName: string) => {
        await window.electronAPI.toggleMod(instance.name, fileName);
        loadMods();
    }, [instance.name, loadMods]);

    const handleCheckUpdates = useCallback(async (silent = false) => {
        setCheckingUpdates(true);
        try {
            const contentToCheck = [
                ...mods.filter((m: any) => m.projectId).map((m: any) => ({ projectId: m.projectId, versionId: m.versionId, source: m.source, type: 'mod', name: m.name })),
                ...resourcePacks.filter((p: any) => p.projectId).map((p: any) => ({ projectId: p.projectId, versionId: p.versionId, source: p.source, type: 'resourcepack', name: p.name })),
                ...shaders.filter((s: any) => s.projectId).map((s: any) => ({ projectId: s.projectId, versionId: s.versionId, source: s.source, type: 'shader', name: s.name }))
            ];
            if (contentToCheck.length === 0) {
                if (!silent) addNotification("Keine Modrinth-Inhalte zum Prufen gefunden.", 'info');
                return;
            }
            const res = await window.electronAPI.checkUpdates(instance.name, contentToCheck);
            if (res.success) {
                const updateMap: Record<string, any> = {};
                res.updates.forEach((u: any) => { updateMap[u.projectId] = u; });
                setUpdates(updateMap);
                if (Object.keys(updateMap).length > 0) {
                    if (!silent) addNotification(`${Object.keys(updateMap).length} Update(s) gefunden!`, 'success');
                } else if (!silent) {
                    addNotification("Alle Inhalte sind aktuell.", 'success');
                }
            }
        } finally {
            setCheckingUpdates(false);
        }
    }, [instance.name, mods, resourcePacks, shaders, addNotification]);

    const handleUpdateMod = useCallback(async (updateData: any) => {
        setUpdatingMod(updateData.projectId);
        try {
            const res = await window.electronAPI.updateFile({
                instanceName: instance.name,
                projectType: updateData.type,
                oldFileName: updateData.name,
                newFileName: updateData.filename,
                url: updateData.downloadUrl
            });
            if (res.success) {
                addNotification(`${updateData.filename} aktualisiert!`, 'success');
                setUpdates(prev => { const next = { ...prev }; delete next[updateData.projectId]; return next; });
                if (updateData.type === 'mod') loadMods();
                else if (updateData.type === 'shader') loadShaders();
                else loadResourcePacks();
            }
        } finally {
            setUpdatingMod(null);
        }
    }, [instance.name, loadMods, loadShaders, loadResourcePacks, addNotification]);

    const handleUpdateAll = useCallback(async () => {
        const updateList = Object.values(updates);
        if (updateList.length === 0) return;
        addNotification(`${updateList.length} Element(e) werden aktualisiert...`, 'info');
        for (const updateData of updateList) {
            await handleUpdateMod(updateData);
        }
        addNotification("Alle Updates abgeschlossen!", 'success');
    }, [updates, handleUpdateMod, addNotification]);

    const handleSearch = useCallback(async (e?: any, resetOffset = false) => {
        if (e) e.preventDefault();
        const offset = resetOffset ? 0 : searchOffset;
        if (resetOffset) setSearchOffset(0);
        setSearching(true);
        try {
            const facets = [[`versions:${instance.version}`]];
            if (searchCategory === 'mod' && instance.loader?.toLowerCase() !== 'vanilla') {
                facets.push([`categories:${instance.loader.toLowerCase()}`]);
            }
            const res = await window.electronAPI.searchModrinth(searchQuery, facets, {
                index: sortMethod,
                offset,
                limit,
                projectType: searchCategory,
                provider
            });
            if (res.success) {
                setSearchResults(res.results);
                setTotalHits(res.total_hits || 0);
            }
        } finally {
            setSearching(false);
        }
    }, [searchQuery, searchCategory, sortMethod, provider, searchOffset, instance.version, instance.loader]);

    const handleInstall = useCallback(async (project: any) => {
        try {
            setInstallationStatus(prev => ({ ...prev, [project.project_id]: 'installing' }));
            const loaders = (searchCategory === 'resourcepack' || searchCategory === 'shader' || !instance.loader || instance.loader.toLowerCase() === 'vanilla')
                ? [] : [instance.loader.toLowerCase()];
            const res = await window.electronAPI.getModVersions(
                project.project_id, loaders, [instance.version], project.curseforge_project_id || null
            );
            if (!res?.success || !res.versions?.length) {
                addNotification("Keine kompatible Version gefunden!", 'error');
                setInstallationStatus(prev => ({ ...prev, [project.project_id]: 'failed' }));
                return;
            }
            const targetVersion = res.versions[0];
            const file = targetVersion.files.find((f: any) => f.primary) || targetVersion.files[0];
            const installRes = await window.electronAPI.installMod({
                instanceName: instance.name,
                projectId: targetVersion.project_id || project.project_id,
                fallbackCurseForgeProjectId: project.curseforge_project_id || null,
                versionId: targetVersion.id,
                filename: file.filename,
                url: file.url,
                projectType: searchCategory
            });
            if (installRes?.success) {
                addNotification(`${project.title} installiert!`, 'success');
                setInstallationStatus(prev => ({ ...prev, [project.project_id]: 'success' }));
                Analytics.trackDownload(searchCategory, project.title, project.project_id);
                if (contentView === 'mods') loadMods();
                if (contentView === 'resourcepacks') loadResourcePacks();
                if (contentView === 'shaders') loadShaders();
            } else {
                setInstallationStatus(prev => ({ ...prev, [project.project_id]: 'failed' }));
            }
        } catch (e: any) {
            addNotification(`Installationsfehler: ${e.message}`, 'error');
            setInstallationStatus(prev => ({ ...prev, [project.project_id]: 'failed' }));
        }
    }, [searchCategory, instance, contentView, loadMods, loadResourcePacks, loadShaders, addNotification]);

    const handleLaunch = useCallback(async () => {
        if (isGuest) {
            addNotification("Du musst eingeloggt sein.", 'error');
            return;
        }
        if (isRunning || isLaunching || isInstalling || localPending) return;
        setLocalPending(true);
        try {
            const result = await window.electronAPI.launchGame(instance.name);
            if (!result.success) addNotification(`Start fehlgeschlagen: ${result.error}`, 'error');
        } finally {
            setLocalPending(false);
        }
    }, [isGuest, isRunning, isLaunching, isInstalling, localPending, instance.name, addNotification]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (contentView === 'mods' || contentView === 'resourcepacks') setIsDragging(true);
    }, [contentView]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (contentView !== 'mods' && contentView !== 'resourcepacks') return;
        const files = Array.from(e.dataTransfer.files);
        if (contentView === 'mods') {
            const validFiles = files.filter(f => f.name.toLowerCase().endsWith('.jar'));
            if (validFiles.length === 0) {
                addNotification("Nur .jar Dateien erlaubt", 'error');
                return;
            }
            let addedCount = 0;
            for (const file of validFiles) {
                if ((file as any).path) {
                    const res = await window.electronAPI.installLocalMod(instance.name, (file as any).path);
                    if (res.success) addedCount++;
                }
            }
            if (addedCount > 0) {
                addNotification(`${addedCount} Mod(s) hinzugefugt`, 'success');
                loadMods();
            }
        } else {
            const validFiles = files.filter(f => f.name.toLowerCase().endsWith('.zip') || f.name.toLowerCase().endsWith('.rar'));
            if (validFiles.length === 0) {
                addNotification("Nur .zip oder .rar Dateien erlaubt", 'error');
                return;
            }
            let addedCount = 0;
            for (const file of validFiles) {
                if ((file as any).path) {
                    const res = await window.electronAPI.installLocalMod(instance.name, (file as any).path, 'resourcepack');
                    if (res.success) addedCount++;
                }
            }
            if (addedCount > 0) {
                addNotification(`${addedCount} Resource Pack(s) hinzugefugt`, 'success');
                loadResourcePacks();
            }
        }
    }, [contentView, instance.name, loadMods, loadResourcePacks, addNotification]);

    // Effects
    useEffect(() => {
        loadWorlds();
        if (activeTab === 'content') {
            if (contentView === 'mods') loadMods();
            if (contentView === 'resourcepacks') loadResourcePacks();
            if (contentView === 'shaders') loadShaders();
        }
        if (activeTab === 'logs') {
            loadLogFiles();
            loadLog();
        }
    }, [activeTab, contentView]);

    useEffect(() => {
        const installedIds: Record<string, string> = {};
        mods.forEach((m: any) => { if (m.projectId) installedIds[m.projectId] = 'success'; });
        resourcePacks.forEach((p: any) => { if (p.projectId) installedIds[p.projectId] = 'success'; });
        shaders.forEach((s: any) => { if (s.projectId) installedIds[s.projectId] = 'success'; });
        setInstallationStatus(prev => ({ ...prev, ...installedIds }));
    }, [mods, resourcePacks, shaders]);

    useEffect(() => {
        if (activeTab === 'content' && contentView === 'search') {
            handleSearch();
        }
    }, [sortMethod, searchOffset, provider]);

    useEffect(() => {
        if (contentView !== 'search') return;
        if (searchTimeout) clearTimeout(searchTimeout);
        const timeout = setTimeout(() => handleSearch(null, true), 300);
        setSearchTimeout(timeout);
        return () => clearTimeout(timeout);
    }, [searchQuery, searchCategory]);

    useEffect(() => {
        if (autoScroll && logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [log, autoScroll]);

    useEffect(() => {
        if (activeTab === 'content' && (mods.length > 0 || resourcePacks.length > 0 || shaders.length > 0)) {
            if (Object.keys(updates).length === 0 && !checkingUpdates) {
                handleCheckUpdates(true);
            }
        }
    }, [mods.length, resourcePacks.length, shaders.length]);

    useEffect(() => {
        if (isInstalling && selectedLog === 'latest.log') setSelectedLog('install.log');
        const isLiveRequest = (activeTab === 'logs' && selectedLog === 'latest.log' && (isRunning || isLaunching)) ||
            (activeTab === 'logs' && selectedLog === 'install.log' && isInstalling);
        if (isLiveRequest) {
            const removeListener = window.electronAPI.onLaunchLog((line: string) => setLog(prev => prev + '\n' + line));
            return () => removeListener?.();
        }
    }, [activeTab, isRunning, isLaunching, isInstalling, selectedLog]);

    useEffect(() => {
        const wasStopped = !prevStatusRef.current || prevStatusRef.current === 'stopped';
        const isStarting = status === 'launching' || status === 'installing';
        if (wasStopped && isStarting) {
            setActiveTab('logs');
            setSelectedLog(status === 'installing' ? 'install.log' : 'latest.log');
        }
        prevStatusRef.current = status;
    }, [status]);

    const menuItems = [
        { icon: Folder, label: 'Ordner öffnen', action: () => window.electronAPI.openInstanceFolder(instance.name) },
        { icon: Upload, label: 'Export als .voidrixmodpack', action: async () => {
            const res = await window.electronAPI.exportVoidrixModpack(instance.name);
            if (res.success) addNotification(`Exportiert: ${res.path}`, 'success');
            else if (res.error !== 'Cancelled') addNotification(`Export fehlgeschlagen: ${res.error}`, 'error');
        }},
        { icon: Package, label: 'Export als .mrpack (Modrinth)', action: async () => {
            const res = await window.electronAPI.exportMrpack(instance.name);
            if (res.success) addNotification(`Exportiert: ${res.path}`, 'success');
            else if (res.error !== 'Cancelled') addNotification(`Export fehlgeschlagen: ${res.error}`, 'error');
        }},
        { icon: Package, label: 'Export als .zip', action: async () => {
            const res = await window.electronAPI.exportInstanceZip(instance.name);
            if (res.success) addNotification(`Exportiert: ${res.path}`, 'success');
            else if (res.error !== 'Cancelled') addNotification(`Export fehlgeschlagen: ${res.error}`, 'error');
        }},
        { icon: Download, label: 'Modpack importieren', action: async () => {
            const res = await window.electronAPI.importVoidrixModpackStrict();
            if (res.success) addNotification(`Importiert: ${res.instanceName}`, 'success');
            else if (res.error !== 'Cancelled') addNotification(`Import fehlgeschlagen: ${res.error}`, 'error');
        }},
        { icon: Save, label: 'Backup Manager', action: () => setShowBackupManager(true), highlight: true },
        { icon: RefreshCw, label: 'Neu installieren', action: () => window.electronAPI.reinstallInstance(instance.name), warning: true },
    ];

    return (
        <div className="relative flex h-full flex-col bg-gradient-to-br from-background via-background to-background/95">
            {/* Decorative Background */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/8 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
            </div>

            {/* Header */}
            <div className="relative flex items-center gap-5 border-b border-border bg-gradient-to-r from-card/45 via-card/25 to-transparent p-6 pb-4 backdrop-blur-sm">
                <div className="relative">
                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
                        {instance.icon && (instance.icon.startsWith('data:') || instance.icon.startsWith('app-media://')) ? (
                            <img src={instance.icon} alt="" className="h-full w-full object-cover" />
                        ) : (
                            <Box className="h-10 w-10 text-muted-foreground" />
                        )}
                    </div>
                </div>

                <div className="flex-1">
                    <h1 className="mb-1 flex items-center gap-3 text-3xl font-bold text-foreground">
                        {instance.name}
                        {isRunning && (
                            <Badge className="gap-1.5 border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" variant="outline">
                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                                Läuft
                            </Badge>
                        )}
                    </h1>
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 rounded-full border border-border bg-card/50 px-3 py-1 text-sm capitalize text-muted-foreground">
                            <div className={cn('h-2 w-2 rounded-full', instance.loader && instance.loader.toLowerCase() !== 'vanilla' ? 'bg-primary' : 'bg-muted-foreground/50')} />
                            {instance.loader || 'Vanilla'}
                        </span>
                        <span className="text-muted-foreground/40">•</span>
                        <span className="font-mono text-sm text-muted-foreground">{instance.version}</span>
                    </div>
                </div>

                <div className="flex shrink-0 gap-2">
                    {isRunning ? (
                        <Button
                            onClick={() => window.electronAPI.killGame(instance.name)}
                            variant="outline"
                            className="h-11 gap-2 border-destructive/30 bg-destructive/10 px-5 text-destructive hover:bg-destructive/20 hover:text-destructive"
                        >
                            <Square className="h-5 w-5" />
                            Stop
                        </Button>
                    ) : (
                        <Button
                            onClick={handleLaunch}
                            disabled={isLaunching || isInstalling || localPending}
                            className="h-11 gap-2 px-5"
                        >
                            {isLaunching || localPending ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Startet...
                                </>
                            ) : isInstalling ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Installiert...
                                </>
                            ) : (
                                <>
                                    <Play className="h-5 w-5" />
                                    Spielen
                                </>
                            )}
                        </Button>
                    )}

                    <Button
                        onClick={() => setShowSettings(true)}
                        variant="outline"
                        size="icon"
                        className="h-11 w-11"
                        title="Einstellungen"
                    >
                        <Settings className="h-5 w-5" />
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="h-11 w-11">
                                <MoreVertical className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            {menuItems.map((item, i) => {
                                const Icon = item.icon;
                                return (
                                    <React.Fragment key={item.label}>
                                        {i === menuItems.length - 2 && <DropdownMenuSeparator />}
                                        <DropdownMenuItem
                                            onClick={() => item.action()}
                                            className={cn(
                                                'gap-2.5',
                                                item.highlight && 'text-primary',
                                                item.warning && 'text-amber-600 dark:text-amber-400'
                                            )}
                                        >
                                            <Icon className="h-4 w-4" />
                                            {item.label}
                                        </DropdownMenuItem>
                                    </React.Fragment>
                                );
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Extension Slot */}
            <div className="relative mt-3 px-6">
                <ExtensionSlot name="instance.details" context={{ instanceName: instance.name, status, isRunning }} className="flex w-full gap-4 overflow-visible" />
            </div>

            {/* Tabs */}
            <div className="relative mt-3 flex gap-1 border-b border-border px-6">
                <TabButton id="content" active={activeTab} onClick={setActiveTab} icon={Box} label="Inhalte" />
                <TabButton id="worlds" active={activeTab} onClick={setActiveTab} icon={Globe} label="Welten" />
                <TabButton id="logs" active={activeTab} onClick={setActiveTab} icon={Terminal} label="Logs" />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden p-6 pt-4">
                {activeTab === 'content' && (
                    <div className="flex h-full min-h-0 flex-col">
                        {/* Content Header */}
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex gap-1 rounded-xl border border-border bg-card/40 p-1">
                                <ContentTabButton
                                    view="mods"
                                    active={contentView}
                                    onClick={setContentView}
                                    icon={Box}
                                    label="Mods"
                                    badge={mods.length}
                                />
                                <ContentTabButton
                                    view="resourcepacks"
                                    active={contentView}
                                    onClick={setContentView}
                                    icon={Image}
                                    label="Resource Packs"
                                    badge={resourcePacks.length}
                                />
                                <ContentTabButton
                                    view="shaders"
                                    active={contentView}
                                    onClick={setContentView}
                                    icon={Sparkles}
                                    label="Shader"
                                    badge={shaders.length}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                {contentView === 'search' && (
                                    <div className="mr-2 flex gap-1 rounded-xl border border-border bg-card/40 p-1">
                                        <CategoryTabButton category="mod" active={searchCategory} onClick={setSearchCategory} label="Mods" />
                                        <CategoryTabButton category="resourcepack" active={searchCategory} onClick={setSearchCategory} label="Packs" />
                                        <CategoryTabButton category="shader" active={searchCategory} onClick={setSearchCategory} label="Shader" />
                                    </div>
                                )}

                                {contentView !== 'search' ? (
                                    <>
                                        <Button
                                            onClick={() => setContentView('search')}
                                            size="icon"
                                            className="h-9 w-9 bg-primary/15 text-primary hover:bg-primary hover:text-primary-foreground"
                                            title="Inhalte hinzufügen"
                                        >
                                            <Plus className="h-5 w-5" />
                                        </Button>

                                        {updateCount > 0 && (
                                            <Button
                                                onClick={handleUpdateAll}
                                                variant="outline"
                                                className="h-9 gap-1.5 border-emerald-500/30 bg-emerald-500/15 text-sm font-medium text-emerald-600 hover:bg-emerald-500/25 dark:text-emerald-400"
                                            >
                                                <Download className="h-4 w-4" />
                                                Alle updaten ({updateCount})
                                            </Button>
                                        )}

                                        <Button
                                            onClick={() => handleCheckUpdates()}
                                            disabled={checkingUpdates}
                                            variant="outline"
                                            size="icon"
                                            className="h-9 w-9"
                                        >
                                            {checkingUpdates ? (
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                            ) : (
                                                <RefreshCw className="h-5 w-5" />
                                            )}
                                        </Button>

                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                type="text"
                                                placeholder="Filtern..."
                                                value={localSearchQuery}
                                                onChange={(e) => setLocalSearchQuery(e.target.value)}
                                                className="h-9 w-48 pl-9 transition-all focus:w-64"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <Button
                                        onClick={() => setContentView('mods')}
                                        size="icon"
                                        className="h-9 w-9"
                                    >
                                        <X className="h-5 w-5" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Content Views */}
                        {contentView === 'mods' && (
                            <div
                                className={cn(
                                    'relative flex-1 space-y-2 overflow-y-auto rounded-xl pr-2 custom-scrollbar transition-all',
                                    isDragging && 'bg-primary/5 ring-2 ring-dashed ring-primary/50'
                                )}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                {isDragging && (
                                    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-primary/10 backdrop-blur-sm">
                                        <div className="mb-2 animate-bounce rounded-full bg-primary p-4 text-primary-foreground shadow-lg">
                                            <Plus className="h-8 w-8" />
                                        </div>
                                        <div className="text-lg font-bold text-primary">Mods hier ablegen</div>
                                        <div className="mt-1 text-xs text-muted-foreground">.jar Dateien</div>
                                    </div>
                                )}

                                {filteredMods.length === 0 ? (
                                    <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
                                        <Box className="mb-4 h-12 w-12 opacity-50" />
                                        <p className="text-lg font-medium">Keine Mods</p>
                                        <button onClick={() => setContentView('search')} className="mt-4 text-primary hover:underline">
                                            Mods durchsuchen
                                        </button>
                                    </div>
                                ) : (
                                    filteredMods.map((mod: any) => (
                                        <ModCard
                                            key={mod.name}
                                            mod={mod}
                                            onToggle={handleToggleMod}
                                            onDelete={(name: string) => setModToDelete({ name, type: 'mod' })}
                                            onUpdate={handleUpdateMod}
                                            updateData={updates[mod.projectId]}
                                            isUpdating={updatingMod === mod.projectId}
                                        />
                                    ))
                                )}
                            </div>
                        )}

                        {contentView === 'resourcepacks' && (
                            <div className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                                {loadingResourcePacks ? (
                                    <div className="flex justify-center py-20">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                                ) : filteredPacks.length === 0 ? (
                                    <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
                                        <Image className="mb-4 h-12 w-12 opacity-50" />
                                        <p className="text-lg font-medium">Keine Resource Packs</p>
                                        <button onClick={() => { setContentView('search'); setSearchCategory('resourcepack'); }} className="mt-4 text-primary hover:underline">
                                            Packs durchsuchen
                                        </button>
                                    </div>
                                ) : (
                                    filteredPacks.map((pack: any) => (
                                        <ModCard
                                            key={pack.name}
                                            mod={pack}
                                            onToggle={() => {}}
                                            onDelete={(name: string) => setModToDelete({ name, type: 'resourcepack' })}
                                            onUpdate={handleUpdateMod}
                                            updateData={updates[pack.projectId]}
                                            isUpdating={updatingMod === pack.projectId}
                                        />
                                    ))
                                )}
                            </div>
                        )}

                        {contentView === 'shaders' && (
                            <div className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                                {loadingShaders ? (
                                    <div className="flex justify-center py-20">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                                ) : filteredShaders.length === 0 ? (
                                    <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
                                        <Sparkles className="mb-4 h-12 w-12 opacity-50" />
                                        <p className="text-lg font-medium">Keine Shader</p>
                                        <button onClick={() => { setContentView('search'); setSearchCategory('shader'); }} className="mt-4 text-primary hover:underline">
                                            Shader durchsuchen
                                        </button>
                                    </div>
                                ) : (
                                    filteredShaders.map((shader: any) => (
                                        <ModCard
                                            key={shader.name}
                                            mod={shader}
                                            onToggle={() => {}}
                                            onDelete={(name: string) => setModToDelete({ name, type: 'shader' })}
                                            onUpdate={handleUpdateMod}
                                            updateData={updates[shader.projectId]}
                                            isUpdating={updatingMod === shader.projectId}
                                        />
                                    ))
                                )}
                            </div>
                        )}

                        {contentView === 'search' && (
                            <div className="flex min-h-0 flex-1 flex-col">
                                {/* Search Form */}
                                <form onSubmit={handleSearch} className="mb-4 flex gap-3">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Suchen..."
                                            className="h-11 pl-11"
                                            autoFocus
                                        />
                                    </div>
                                    <Button type="submit" className="h-11 px-6">
                                        Suchen
                                    </Button>
                                </form>

                                {/* Search Options */}
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="text-sm text-muted-foreground">
                                        {searchResults.length} Ergebnisse
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex rounded-lg border border-border bg-card/40 p-1">
                                            <button
                                                onClick={() => setProvider('modrinth')}
                                                className={cn(
                                                    'rounded px-3 py-1 text-xs font-medium transition-all',
                                                    provider === 'modrinth' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                                                )}
                                            >
                                                Modrinth
                                            </button>
                                            <button
                                                onClick={() => setProvider('curseforge')}
                                                className={cn(
                                                    'rounded px-3 py-1 text-xs font-medium transition-all',
                                                    provider === 'curseforge' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                                                )}
                                            >
                                                CurseForge
                                            </button>
                                        </div>
                                        <div className="w-40">
                                            <SelectDropdown
                                                options={[
                                                    { value: 'relevance', label: 'Relevanz' },
                                                    { value: 'downloads', label: 'Downloads' },
                                                    { value: 'newest', label: 'Neueste' },
                                                    { value: 'updated', label: 'Aktualisiert' }
                                                ]}
                                                value={sortMethod}
                                                onChange={setSortMethod}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Search Results */}
                                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                                    {searching ? (
                                        <div className="flex justify-center py-20">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        </div>
                                    ) : searchResults.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                            <Search className="mb-4 h-12 w-12 opacity-50" />
                                            <p>Keine Ergebnisse für "{searchQuery}"</p>
                                        </div>
                                    ) : (
                                        searchResults.map((result: any) => (
                                            <SearchResultCard
                                                key={result.project_id}
                                                result={result}
                                                onView={(p: any) => setSelectedProject(p)}
                                                onInstall={handleInstall}
                                                installStatus={installationStatus[result.project_id]}
                                            />
                                        ))
                                    )}
                                </div>

                                {/* Pagination */}
                                {totalHits > limit && (
                                    <div className="mt-4 flex shrink-0 items-center justify-between rounded-xl border border-border bg-card/40 p-2">
                                        <Button
                                            onClick={() => setSearchOffset(prev => prev - limit)}
                                            disabled={searchOffset === 0}
                                            variant="ghost"
                                            size="sm"
                                        >
                                            ← Zurück
                                        </Button>
                                        <span className="text-sm text-muted-foreground">
                                            Seite {Math.floor(searchOffset / limit) + 1} von {Math.ceil(totalHits / limit)}
                                        </span>
                                        <Button
                                            onClick={() => setSearchOffset(prev => prev + limit)}
                                            disabled={searchOffset + limit >= totalHits}
                                            variant="ghost"
                                            size="sm"
                                        >
                                            Weiter →
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'worlds' && (
                    <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {worlds.length === 0 ? (
                                <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/30 py-20 text-muted-foreground">
                                    <Globe className="mb-4 h-16 w-16 opacity-50" />
                                    <p className="text-lg font-medium">Keine Welten</p>
                                    <p className="mt-1 text-sm opacity-70">Starte das Spiel um eine Welt zu erstellen</p>
                                </div>
                            ) : (
                                worlds.map((world: any) => (
                                    <WorldCard
                                        key={world.folderName}
                                        world={world}
                                        onOpen={(w: any) => window.electronAPI.openWorldFolder(instance.name, w.folderName)}
                                        onBackup={(w: any) => {
                                            addNotification(`Backup von ${w.name} wird erstellt...`, 'info');
                                            window.electronAPI.backupWorld(instance.name, w.folderName).then((res: any) => {
                                                if (res.success) addNotification('Backup erstellt!', 'success');
                                            });
                                        }}
                                        onExport={(w: any) => {
                                            addNotification(`Exportiere ${w.name}...`, 'info');
                                            window.electronAPI.exportWorld(instance.name, w.folderName).then((res: any) => {
                                                if (res.success) addNotification('Export abgeschlossen!', 'success');
                                            });
                                        }}
                                        onDelete={(w: any) => setWorldToDelete(w)}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'logs' && (
                    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card/30">
                        {/* Log Header */}
                        <div className="flex items-center justify-between border-b border-border bg-muted/30 p-3">
                            <div className="w-48">
                                <SelectDropdown
                                    options={[
                                        { value: 'latest.log', label: 'latest.log' },
                                        ...logFiles.filter(f => f !== 'latest.log').map(f => ({ value: f, label: f }))
                                    ]}
                                    value={selectedLog}
                                    onChange={setSelectedLog}
                                />
                            </div>

                            <div className="flex gap-4">
                                {['Info', 'Warn', 'Error', 'Debug'].map(level => (
                                    <label key={level} className="flex cursor-pointer items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={logFilters[level.toLowerCase() as keyof typeof logFilters]}
                                            onChange={() => setLogFilters(prev => ({ ...prev, [level.toLowerCase()]: !prev[level.toLowerCase() as keyof typeof logFilters] }))}
                                            className="hidden"
                                        />
                                        <div className={cn(
                                            'flex h-3 w-3 items-center justify-center rounded border',
                                            logFilters[level.toLowerCase() as keyof typeof logFilters] ? 'border-primary bg-primary' : 'border-muted-foreground/40'
                                        )}>
                                            {logFilters[level.toLowerCase() as keyof typeof logFilters] && (
                                                <Check className="h-2.5 w-2.5 text-primary-foreground" />
                                            )}
                                        </div>
                                        <span className={cn('text-xs font-medium', logFilters[level.toLowerCase() as keyof typeof logFilters] ? 'text-foreground' : 'text-muted-foreground')}>
                                            {level}
                                        </span>
                                    </label>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <label className="flex cursor-pointer items-center gap-2">
                                    <input type="checkbox" checked={autoScroll} onChange={() => setAutoScroll(prev => !prev)} className="hidden" />
                                    <div className={cn('flex h-3 w-3 items-center justify-center rounded border', autoScroll ? 'border-primary bg-primary' : 'border-muted-foreground/40')}>
                                        {autoScroll && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                                    </div>
                                    <span className={cn('text-xs font-medium', autoScroll ? 'text-foreground' : 'text-muted-foreground')}>Auto-Scroll</span>
                                </label>
                                <button onClick={() => { loadLogFiles(); loadLog(); }} className="rounded bg-muted px-3 py-1 text-xs text-muted-foreground transition-all hover:bg-muted/70 hover:text-foreground">
                                    Aktualisieren
                                </button>
                                <button onClick={() => navigator.clipboard?.writeText(log)} className="rounded bg-muted px-3 py-1 text-xs text-muted-foreground transition-all hover:bg-muted/70 hover:text-foreground">
                                    Kopieren
                                </button>
                                <button onClick={() => setLog('')} className="rounded bg-muted px-3 py-1 text-xs text-muted-foreground transition-all hover:bg-destructive/15 hover:text-destructive">
                                    Löschen
                                </button>
                            </div>
                        </div>

                        {/* Log Content */}
                        <div ref={logContainerRef} className="flex-1 overflow-y-auto p-4 font-mono text-xs custom-scrollbar">
                            {filteredLogLines.length > 0 ? (
                                filteredLogLines.map((line, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            'whitespace-pre-wrap py-0.5 leading-relaxed',
                                            line.toLowerCase().includes('error') ? 'text-destructive' :
                                            line.toLowerCase().includes('warn') ? 'text-amber-600 dark:text-amber-400' :
                                            'text-muted-foreground'
                                        )}
                                    >
                                        {line}
                                    </div>
                                ))
                            ) : (
                                <div className="py-10 text-center italic text-muted-foreground/60">
                                    Keine Logs vorhanden
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showSettings && (
                <InstanceSettingsDialog
                    instance={instance}
                    onClose={() => setShowSettings(false)}
                    onSave={onInstanceUpdate}
                    onDelete={onBack}
                />
            )}

            {showCodeModal && (
                <ModpackShareDialog
                    isOpen={showCodeModal}
                    onClose={() => setShowCodeModal(false)}
                    mode={codeModalMode}
                    instanceData={instance}
                    mods={mods}
                    resourcePacks={resourcePacks}
                    shaders={shaders}
                    onImportComplete={async (data: any) => {
                        addNotification(`Importiere "${data.name}"...`, 'info');
                        const res = await window.electronAPI.createInstance(data.name, data.version, data.loader, null);
                        if (res.success) {
                            window.electronAPI.installSharedContent(res.instanceName, data);
                            addNotification(`Instanz "${res.instanceName}" erstellt!`, 'success');
                        }
                    }}
                />
            )}

            {/* Project Version Picker */}
            <Dialog open={Boolean(selectedProject)} onOpenChange={(open) => !open && setSelectedProject(null)}>
                <DialogContent className="max-h-[80vh] max-w-3xl overflow-hidden p-0">
                    {selectedProject && (
                        <>
                            <DialogHeader className="border-b border-border p-5">
                                <div className="flex items-center gap-4">
                                    <img src={selectedProject.icon_url || 'https://cdn.modrinth.com/placeholder.svg'} alt="" className="h-14 w-14 rounded-xl" />
                                    <div className="flex-1 text-left">
                                        <DialogTitle>{selectedProject.title}</DialogTitle>
                                        <DialogDescription>{selectedProject.description}</DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>
                            <div className="flex-1 overflow-y-auto p-4">
                                {loadingVersions ? (
                                    <div className="flex justify-center py-20">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {projectVersions.map((version: any) => (
                                            <div key={version.id} className="flex items-center gap-3 rounded-lg border border-border bg-card/50 p-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-foreground">{version.version_number}</span>
                                                        <span className={cn(
                                                            'rounded px-2 py-0.5 text-xs',
                                                            version.version_type === 'release' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
                                                            version.version_type === 'beta' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' :
                                                            'bg-destructive/15 text-destructive'
                                                        )}>
                                                            {version.version_type}
                                                        </span>
                                                    </div>
                                                    <div className="mt-1 text-xs text-muted-foreground">
                                                        MC: {version.game_versions?.slice(0, 3).join(', ')}
                                                    </div>
                                                </div>
                                                <Button size="sm" variant="secondary">
                                                    Installieren
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Mod Confirm */}
            {modToDelete && (
                <ConfirmDialog
                    title={
                        modToDelete.type === 'mod' ? 'Mod löschen?' :
                        modToDelete.type === 'shader' ? 'Shader löschen?' :
                        'Resource Pack löschen?'
                    }
                    message={`"${modToDelete.name}" wird dauerhaft gelöscht.`}
                    confirmText="Löschen"
                    isDangerous
                    onCancel={() => setModToDelete(null)}
                    onConfirm={async () => {
                        const res = await window.electronAPI.deleteMod(instance.name, modToDelete.name, modToDelete.type);
                        if (res?.success) {
                            addNotification('Gelöscht!', 'success');
                            if (modToDelete.type === 'mod') loadMods();
                            else if (modToDelete.type === 'resourcepack') loadResourcePacks();
                            else loadShaders();
                        }
                        setModToDelete(null);
                    }}
                />
            )}

            {/* Delete World Confirm */}
            {worldToDelete && (
                <ConfirmDialog
                    title="Welt löschen?"
                    message={`"${worldToDelete.name}" wird dauerhaft gelöscht.`}
                    confirmText="Löschen"
                    isDangerous
                    onCancel={() => setWorldToDelete(null)}
                    onConfirm={async () => {
                        const res = await window.electronAPI.deleteWorld(instance.name, worldToDelete.folderName);
                        if (res.success) {
                            addNotification('Welt gelöscht!', 'success');
                            loadWorlds();
                        }
                        setWorldToDelete(null);
                    }}
                />
            )}

            {/* Backup Manager Modal */}
            {showBackupManager && (
                <BackupManagerDialog
                    instance={instance}
                    worlds={worlds}
                    onClose={() => {
                        setShowBackupManager(false);
                        loadWorlds();
                    }}
                />
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 3px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground) / 0.3); }
            `}</style>
        </div>
    );
}

export default InstanceDetails;
