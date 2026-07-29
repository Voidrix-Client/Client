import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../context/NotificationContext';
import { resolveClientAutoInstallModIds } from '../config/clientDefaults';
import { filterInstancesForMode, getOpenClientCreateOptions } from '../utils/instanceTypes';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import {
    Play, Download, RefreshCw, CheckCircle, Loader2,
    Package, Sparkles, Zap, Shield, Rocket,
    Layers, Gamepad2, ChevronRight, Gem, ChevronDown,
    Calendar, Star, TrendingUp, Check, X, Server
} from 'lucide-react';

// Helper function for conditional classes
const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

function Client() {
    const { t } = useTranslation();
    const { addNotification } = useNotification();

    const [availableVersions, setAvailableVersions] = useState<any[]>([]);
    const [instances, setInstances] = useState<any[]>([]);
    const [selectedVersion, setSelectedVersion] = useState('');
    const [isLoadingVersions, setIsLoadingVersions] = useState(true);
    const [isBusy, setIsBusy] = useState(false);
    const [configuredModIds, setConfiguredModIds] = useState<string[]>([]);
    const [updates, setUpdates] = useState<Record<string, any>>({});
    const [isUpdating, setIsUpdating] = useState(false);
    const [installState, setInstallState] = useState({
        active: false,
        instanceName: '',
        progress: 0
    });
    const [isVersionDropdownOpen, setIsVersionDropdownOpen] = useState(false);
    const [hoveredVersion, setHoveredVersion] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Schließe Dropdown wenn außerhalb geklickt wird
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsVersionDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const resolveConfiguredModIds = useCallback((settings: any) => {
        if (Array.isArray(settings?.openClientAutoInstallMods)) {
            return resolveClientAutoInstallModIds(settings.openClientAutoInstallMods);
        }
        return resolveClientAutoInstallModIds();
    }, []);

    const loadVersions = useCallback(async () => {
        setIsLoadingVersions(true);
        try {
            const supportedRes = await window.electronAPI.getSupportedGameVersions('Fabric');

            if (supportedRes?.success && Array.isArray(supportedRes.versions) && supportedRes.versions.length > 0) {
                const fabricVersions = supportedRes.versions
                    .filter((version: string) => /^\d+\.\d+(\.\d+)?$/.test(version))
                    .map((version: string) => String(version));

                setAvailableVersions(fabricVersions);
                setSelectedVersion((prev) => {
                    if (prev && fabricVersions.includes(prev)) return prev;
                    return fabricVersions[0] || '';
                });
                return;
            }

            const vanillaRes = await window.electronAPI.getVanillaVersions();
            if (vanillaRes?.success && Array.isArray(vanillaRes.versions)) {
                const releaseVersions = vanillaRes.versions
                    .filter((version: any) => version.type === 'release')
                    .map((version: any) => version.id);

                setAvailableVersions(releaseVersions);
                setSelectedVersion((prev) => {
                    if (prev && releaseVersions.includes(prev)) return prev;
                    return releaseVersions[0] || '';
                });
            } else {
                setAvailableVersions([]);
                setSelectedVersion('');
            }
        } catch (error) {
            console.error('[Client] Failed to load versions:', error);
            addNotification(t('client_page.errors.load_versions', 'Could not load versions.'), 'error');
            setAvailableVersions([]);
            setSelectedVersion('');
        } finally {
            setIsLoadingVersions(false);
        }
    }, [addNotification, t]);

    const loadInstances = useCallback(async () => {
        try {
            const list = await window.electronAPI.getInstances();
            setInstances(filterInstancesForMode(list, 'client'));
        } catch (error) {
            console.error('[Client] Failed to load instances:', error);
        }
    }, []);

    const loadClientSettings = useCallback(async () => {
        try {
            const settingsRes = await window.electronAPI.getSettings();
            if (settingsRes?.success) {
                setConfiguredModIds(resolveConfiguredModIds(settingsRes.settings));
            }
        } catch (error) {
            console.error('[Client] Failed to load settings:', error);
        }
    }, [resolveConfiguredModIds]);

    const checkForUpdates = useCallback(async (instanceName: string) => {
        if (!instanceName) return;

        try {
            const modsRes = await window.electronAPI.getMods(instanceName);
            if (!modsRes?.success || !Array.isArray(modsRes.mods)) {
                setUpdates({});
                return;
            }

            const contentToCheck = modsRes.mods
                .filter((mod: any) => mod.projectId)
                .map((mod: any) => ({
                    projectId: mod.projectId,
                    versionId: mod.versionId,
                    source: mod.source,
                    type: 'mod',
                    name: mod.name
                }));

            if (contentToCheck.length === 0) {
                setUpdates({});
                return;
            }

            const res = await window.electronAPI.checkUpdates(instanceName, contentToCheck);
            if (!res?.success || !Array.isArray(res.updates)) {
                setUpdates({});
                return;
            }

            const nextUpdates: Record<string, any> = {};
            res.updates.forEach((item: any) => {
                nextUpdates[item.projectId] = item;
            });
            setUpdates(nextUpdates);
        } catch (error) {
            console.error('[Client] Failed to check updates:', error);
            setUpdates({});
        }
    }, []);

    const installConfiguredMods = useCallback(async (instanceName: string, mcVersion: string) => {
        if (!configuredModIds.length || !instanceName || !mcVersion) return;

        let installedCount = 0;
        for (const projectId of configuredModIds) {
            try {
                const versionsRes = await window.electronAPI.getModVersions(projectId, ['fabric'], [mcVersion]);
                if (!versionsRes?.success || !Array.isArray(versionsRes.versions) || versionsRes.versions.length === 0) {
                    continue;
                }

                const targetVersion = versionsRes.versions[0];
                const file = targetVersion.files?.find((entry: any) => entry.primary) || targetVersion.files?.[0];
                if (!file) continue;

                const installRes = await window.electronAPI.installMod({
                    instanceName,
                    projectId,
                    versionId: targetVersion.id,
                    filename: file.filename,
                    url: file.url,
                    projectType: 'mod'
                });

                if (installRes?.success) {
                    installedCount += 1;
                }
            } catch (error) {
                console.error(`[Client] Failed to auto-install mod ${projectId}:`, error);
            }
        }

        if (installedCount > 0) {
            addNotification(t('client_page.auto_mods_installed', '{{count}} configured mods installed.', { count: installedCount }), 'success');
        }
    }, [configuredModIds, addNotification, t]);

    useEffect(() => {
        loadVersions();
        loadInstances();
        loadClientSettings();
    }, [loadVersions, loadInstances, loadClientSettings]);

    useEffect(() => {
        const removeStatusListener = window.electronAPI?.onInstanceStatus?.(({ status }: { status: string }) => {
            if (status === 'ready' || status === 'stopped' || status === 'deleted' || status === 'error') {
                loadInstances();
            }
        });

        const removeInstallListener = window.electronAPI?.onInstallProgress?.(({ instanceName, progress }: { instanceName: string; progress: number }) => {
            setInstallState((prev) => {
                if (!prev.instanceName || prev.instanceName !== instanceName) {
                    return prev;
                }

                const nextProgress = typeof progress === 'number' ? progress : prev.progress;
                if (nextProgress >= 100) {
                    return { active: false, instanceName: '', progress: 100 };
                }

                return {
                    ...prev,
                    active: true,
                    progress: nextProgress
                };
            });
        });

        return () => {
            if (removeStatusListener) removeStatusListener();
            if (removeInstallListener) removeInstallListener();
        };
    }, [loadInstances]);

    const installedInstance = useMemo(() => {
        if (!selectedVersion) return null;

        return instances.find((instance) => {
            const loader = String(instance?.loader || '').toLowerCase();
            return loader === 'fabric' && instance?.version === selectedVersion;
        }) || null;
    }, [instances, selectedVersion]);

    const ensureUniqueName = useCallback((baseName: string) => {
        const knownNames = new Set(instances.map((instance) => instance.name));
        if (!knownNames.has(baseName)) return baseName;

        let suffix = 2;
        let nextName = `${baseName} (${suffix})`;
        while (knownNames.has(nextName)) {
            suffix += 1;
            nextName = `${baseName} (${suffix})`;
        }
        return nextName;
    }, [instances]);

    useEffect(() => {
        if (!installedInstance?.name) {
            setUpdates({});
            return;
        }
        checkForUpdates(installedInstance.name);
    }, [installedInstance?.name, checkForUpdates]);

    const handleInstall = useCallback(async () => {
        if (!selectedVersion || isBusy) return;

        setIsBusy(true);
        try {
            let loaderVersion = null;
            try {
                const loaderRes = await window.electronAPI.getLoaderVersions('fabric', selectedVersion);
                if (loaderRes?.success && Array.isArray(loaderRes.versions) && loaderRes.versions.length > 0) {
                    loaderVersion = loaderRes.versions[0].version;
                }
            } catch (error) {
                console.warn('[Client] Failed to resolve loader version, fallback to latest:', error);
            }

            const baseName = `Client ${selectedVersion}`;
            const name = ensureUniqueName(baseName);
            const result = await window.electronAPI.createInstance(
                name,
                selectedVersion,
                'fabric',
                null,
                loaderVersion,
                getOpenClientCreateOptions()
            );

            if (result?.success) {
                const instanceName = result.instanceName || name;
                setInstallState({
                    active: true,
                    instanceName,
                    progress: 0
                });
                addNotification(t('common.installing', 'Installing...'), 'info');
                await installConfiguredMods(instanceName, selectedVersion);
                await loadInstances();
                await checkForUpdates(instanceName);
            } else {
                addNotification(t('client_page.errors.install', 'Installation failed: {{error}}', { error: result?.error || 'unknown error' }), 'error');
            }
        } catch (error: any) {
            addNotification(t('client_page.errors.install', 'Installation failed: {{error}}', { error: error.message }), 'error');
        } finally {
            setIsBusy(false);
        }
    }, [selectedVersion, isBusy, ensureUniqueName, addNotification, t, installConfiguredMods, loadInstances, checkForUpdates]);

    const handlePlay = useCallback(async () => {
        if (!installedInstance || isBusy || isUpdating) return;

        setIsBusy(true);
        try {
            const result = await window.electronAPI.launchGame(installedInstance.name);
            if (result?.success) {
                addNotification(t('client_page.launching', 'Starting client...'), 'info');
            } else {
                addNotification(t('client_page.errors.play', 'Could not start client: {{error}}', { error: result?.error || 'unknown error' }), 'error');
            }
        } catch (error: any) {
            addNotification(t('client_page.errors.play', 'Could not start client: {{error}}', { error: error.message }), 'error');
        } finally {
            setIsBusy(false);
        }
    }, [installedInstance, isBusy, isUpdating, addNotification, t]);

    const handleUpdateAll = useCallback(async () => {
        if (!installedInstance || isUpdating) return;
        const updateList = Object.values(updates);
        if (updateList.length === 0) return;

        setIsUpdating(true);
        try {
            for (const updateData of updateList) {
                await window.electronAPI.updateFile({
                    instanceName: installedInstance.name,
                    projectType: updateData.type,
                    oldFileName: updateData.name,
                    newFileName: updateData.filename,
                    url: updateData.downloadUrl
                });
            }
            await checkForUpdates(installedInstance.name);
            addNotification(t('client_page.updated', 'Updates installed.'), 'success');
        } catch (error: any) {
            addNotification(t('client_page.errors.update', 'Update failed: {{error}}', { error: error.message }), 'error');
        } finally {
            setIsUpdating(false);
        }
    }, [installedInstance, isUpdating, updates, checkForUpdates, addNotification, t]);

    const isInstalled = Boolean(installedInstance);
    const isInstalling = installState.active;
    const hasUpdates = Object.keys(updates).length > 0;
    const updateCount = Object.keys(updates).length;

    // Version Stats (simuliert)
    const getVersionStats = (version: string) => {
        const major = parseInt(version.split('.')[0]);
        const minor = parseInt(version.split('.')[1]);
        if (major === 1 && minor >= 20) return { popularity: 'High', label: 'Latest', color: 'emerald' };
        if (major === 1 && minor >= 18) return { popularity: 'High', label: 'Popular', color: 'blue' };
        if (major === 1 && minor >= 16) return { popularity: 'Medium', label: 'Stable', color: 'amber' };
        return { popularity: 'Low', label: 'Legacy', color: 'slate' };
    };

    return (
        <div className="h-full flex flex-col bg-gradient-to-br from-background via-background to-background/95 overflow-hidden">
            <div className="relative z-10 flex-1 overflow-auto p-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 mb-4">
                            <Gamepad2 className="w-10 h-10 text-purple-400" />
                        </div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground via-foreground/90 to-foreground/80 bg-clip-text text-transparent mb-2">
                            {t('client_page.title', 'Open Client')}
                        </h1>
                        <p className="text-muted-foreground text-sm flex items-center justify-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            {t('client_page.description', 'Select a version and start playing.')}
                        </p>
                    </div>

                    {/* Main Card */}
                    <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm shadow-xl">
                        <CardContent className="p-8">
                            {/* Version Selection */}
                            <div className="space-y-4 mb-6">
                                <div className="flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-primary" />
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        {t('client_page.version', 'Version')}
                                    </label>
                                </div>

                                {/* Custom Dropdown */}
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        onClick={() => setIsVersionDropdownOpen(!isVersionDropdownOpen)}
                                        disabled={isLoadingVersions || isBusy || availableVersions.length === 0}
                                        className={cn(
                                            "w-full flex items-center justify-between bg-background/50 border border-border/50 rounded-xl px-4 py-3 text-foreground transition-all duration-200",
                                            "hover:border-primary/50 hover:bg-background/70",
                                            "focus:outline-none focus:ring-2 focus:ring-primary/20",
                                            (isLoadingVersions || isBusy || availableVersions.length === 0) && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            {selectedVersion ? (
                                                <>
                                                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center">
                                                        <Star className="w-3 h-3 text-primary" />
                                                    </div>
                                                    <span className="font-medium">Minecraft {selectedVersion}</span>
                                                    <Badge variant="outline" className={cn(
                                                        "text-[10px]",
                                                        getVersionStats(selectedVersion).color === 'emerald' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
                                                        getVersionStats(selectedVersion).color === 'blue' && "bg-blue-500/10 text-blue-400 border-blue-500/30",
                                                        getVersionStats(selectedVersion).color === 'amber' && "bg-violet-500/10 text-violet-300 border-violet-500/30",
                                                        getVersionStats(selectedVersion).color === 'slate' && "bg-muted/50 text-muted-foreground border-border/50"
                                                    )}>
                                                        {getVersionStats(selectedVersion).label}
                                                    </Badge>
                                                </>
                                            ) : (
                                                <span className="text-muted-foreground">Select a version</span>
                                            )}
                                        </div>
                                        <ChevronDown className={cn(
                                            "w-4 h-4 text-muted-foreground transition-transform duration-200",
                                            isVersionDropdownOpen && "rotate-180"
                                        )} />
                                    </button>

                                    {/* Dropdown Menu */}
                                    {isVersionDropdownOpen && (
                                        <div className="absolute z-50 mt-2 w-full bg-card border border-border/50 rounded-xl shadow-2xl overflow-hidden animate-slide-down">
                                            <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                                {availableVersions.map((version) => {
                                                    const stats = getVersionStats(version);
                                                    const isSelected = selectedVersion === version;
                                                    const isHovered = hoveredVersion === version;

                                                    return (
                                                        <button
                                                            key={version}
                                                            onClick={() => {
                                                                setSelectedVersion(version);
                                                                setIsVersionDropdownOpen(false);
                                                            }}
                                                            onMouseEnter={() => setHoveredVersion(version)}
                                                            onMouseLeave={() => setHoveredVersion(null)}
                                                            className={cn(
                                                                "w-full px-4 py-3 flex items-center justify-between transition-all duration-150",
                                                                isSelected
                                                                    ? "bg-primary/10 border-l-2 border-primary"
                                                                    : "hover:bg-accent/50",
                                                                isHovered && !isSelected && "bg-accent/30"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={cn(
                                                                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                                                                    isSelected
                                                                        ? "bg-primary/20"
                                                                        : "bg-muted/50 group-hover:bg-muted"
                                                                )}>
                                                                    {isSelected ? (
                                                                        <Check className="w-4 h-4 text-primary" />
                                                                    ) : (
                                                                        <Server className="w-4 h-4 text-muted-foreground" />
                                                                    )}
                                                                </div>
                                                                <div className="text-left">
                                                                    <p className={cn(
                                                                        "font-medium",
                                                                        isSelected ? "text-primary" : "text-foreground"
                                                                    )}>
                                                                        Minecraft {version}
                                                                    </p>
                                                                    <div className="flex items-center gap-2 mt-0.5">
                                                                        <Badge variant="outline" className={cn(
                                                                            "text-[9px] px-1.5",
                                                                            stats.color === 'emerald' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
                                                                            stats.color === 'blue' && "bg-blue-500/10 text-blue-400 border-blue-500/30",
                                                                            stats.color === 'amber' && "bg-violet-500/10 text-violet-300 border-violet-500/30",
                                                                            stats.color === 'slate' && "bg-muted/50 text-muted-foreground border-border/50"
                                                                        )}>
                                                                            {stats.label}
                                                                        </Badge>
                                                                        <span className="text-[9px] text-muted-foreground">
                                                                            {stats.popularity} popularity
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {isSelected && (
                                                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {isLoadingVersions && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        {t('client_page.loading_versions', 'Loading versions...')}
                                    </div>
                                )}
                            </div>

                            {/* Status Display */}
                            <div className="bg-muted/20 rounded-xl p-4 mb-6 border border-border/50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center",
                                            isInstalled ? "bg-emerald-500/20" : "bg-muted/50"
                                        )}>
                                            {isInstalled ? (
                                                <CheckCircle className="w-5 h-5 text-emerald-400" />
                                            ) : isInstalling ? (
                                                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                                            ) : (
                                                <Package className="w-5 h-5 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-foreground">
                                                {isInstalling
                                                    ? t('common.installing', 'Installing...')
                                                    : isInstalled
                                                        ? t('client_page.installed_state', 'Installed')
                                                        : t('client_page.not_installed_state', 'Not installed')}
                                            </p>
                                            {isInstalling && (
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {Math.round(installState.progress)}% completed
                                                </p>
                                            )}
                                            {isInstalled && installedInstance && (
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    Instance: {installedInstance.name}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {hasUpdates && (
                                        <Badge variant="default" className="bg-violet-500/20 text-violet-300 border-violet-500/30 gap-1">
                                            <RefreshCw className="w-3 h-3" />
                                            {updateCount} update{updateCount !== 1 ? 's' : ''} available
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                {isInstalled && hasUpdates ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button
                                            onClick={handleUpdateAll}
                                            disabled={isBusy || isInstalling || isUpdating}
                                            variant="outline"
                                            className="h-12 gap-2"
                                        >
                                            {isUpdating ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <RefreshCw className="w-4 h-4" />
                                            )}
                                            {isUpdating ? t('common.loading', 'Loading...') : t('client_page.update', 'Update All')}
                                        </Button>
                                        <Button
                                            onClick={handlePlay}
                                            disabled={isBusy || isInstalling || isUpdating}
                                            className="h-12 gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary"
                                        >
                                            {isBusy ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Play className="w-4 h-4" />
                                            )}
                                            {isBusy ? t('common.loading', 'Loading...') : t('common.play', 'Play')}
                                        </Button>
                                    </div>
                                ) : isInstalled ? (
                                    <Button
                                        onClick={handlePlay}
                                        disabled={isBusy || isInstalling || isUpdating}
                                        className="w-full h-12 gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary"
                                    >
                                        {isBusy ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Play className="w-4 h-4" />
                                        )}
                                        {isBusy ? t('common.loading', 'Loading...') : t('common.play', 'Play')}
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleInstall}
                                        disabled={isBusy || isInstalling || isUpdating || !selectedVersion || isLoadingVersions}
                                        className="w-full h-12 gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary"
                                    >
                                        {isBusy || isInstalling ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Download className="w-4 h-4" />
                                        )}
                                        {isBusy || isInstalling ? t('common.installing', 'Installing...') : t('client_page.install', 'Install')}
                                    </Button>
                                )}
                            </div>

                            {/* Features Section */}
                            <Separator className="my-6 bg-border/50" />

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                    { icon: Zap, title: 'Fast Launch', description: 'Optimized startup' },
                                    { icon: Shield, title: 'Secure', description: 'Safe downloads' },
                                    { icon: Rocket, title: 'Auto Updates', description: 'Always latest' },
                                    { icon: Gem, title: 'Mod Support', description: 'Fabric compatible' }
                                ].map((feature, idx) => (
                                    <div key={idx} className="text-center p-2 rounded-lg hover:bg-muted/20 transition-colors">
                                        <feature.icon className="w-5 h-5 text-primary mx-auto mb-1" />
                                        <p className="text-[10px] font-semibold text-foreground">{feature.title}</p>
                                        <p className="text-[9px] text-muted-foreground">{feature.description}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Auto Install Info */}
                            {configuredModIds.length > 0 && (
                                <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                                    <div className="flex items-start gap-2">
                                        <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-medium text-foreground">Auto Install Mods</p>
                                            <p className="text-[10px] text-muted-foreground">
                                                {configuredModIds.length} mod{configuredModIds.length !== 1 ? 's' : ''} will be installed automatically
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Update List */}
                    {hasUpdates && !isInstalling && (
                        <Card className="mt-4 border-border/50 bg-gradient-to-br from-card/60 to-card/30 backdrop-blur-sm">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <RefreshCw className="w-4 h-4 text-violet-300" />
                                    <h3 className="text-sm font-semibold text-foreground">Available Updates</h3>
                                </div>
                                <div className="space-y-2">
                                    {Object.values(updates).slice(0, 5).map((update: any, idx) => (
                                        <div key={idx} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                                            <div className="flex items-center gap-2">
                                                <Package className="w-3 h-3 text-muted-foreground" />
                                                <span className="text-sm text-foreground">{update.name}</span>
                                            </div>
                                            <Badge variant="outline" className="text-[10px]">
                                                v{update.newVersion}
                                            </Badge>
                                        </div>
                                    ))}
                                    {updateCount > 5 && (
                                        <p className="text-xs text-muted-foreground text-center pt-2">
                                            +{updateCount - 5} more update{updateCount - 5 !== 1 ? 's' : ''}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(-20px, -20px); }
                }
                @keyframes float-delayed {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(20px, 20px); }
                }
                @keyframes slide-down {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.1; transform: scale(1); }
                    50% { opacity: 0.2; transform: scale(1.1); }
                }
                .animate-float {
                    animation: float 20s ease-in-out infinite;
                }
                .animate-float-delayed {
                    animation: float-delayed 22s ease-in-out infinite;
                }
                .animate-slide-down {
                    animation: slide-down 0.2s ease-out;
                }
                .animate-pulse-slow {
                    animation: pulse-slow 8s ease-in-out infinite;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>
    );
}

export default Client;