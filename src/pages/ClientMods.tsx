import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../context/NotificationContext';
import {
    DEFAULT_OPEN_CLIENT_MOD_IDS,
    sanitizeClientCustomAutoInstallModIds
} from '../config/clientDefaults';
import { filterInstancesForMode } from '../utils/instanceTypes';
import { getSourceTags } from '../utils/sourceTags';

function ClientMods() {
    const { t } = useTranslation();
    const { addNotification } = useNotification();

    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [sortMethod, setSortMethod] = useState('relevance');
    const [offset, setOffset] = useState(0);
    const [totalHits, setTotalHits] = useState(0);
    const limit = 20;

    const [settingsSnapshot, setSettingsSnapshot] = useState<Record<string, any>>({});
    const [customAutoInstallMods, setCustomAutoInstallMods] = useState<any[]>([]);
    const [savingAutoInstall, setSavingAutoInstall] = useState(false);
    const [projectTitles, setProjectTitles] = useState<Record<string, any>>({});

    const [clientInstances, setClientInstances] = useState<any[]>([]);
    const [instancesByVersion, setInstancesByVersion] = useState<Record<string, any>>({});
    const [availableVersions, setAvailableVersions] = useState<any[]>([]);
    const [versionFilter, setVersionFilter] = useState('all');
    const [selectedVersions, setSelectedVersions] = useState<any[]>([]);
    const [hasInitializedVersionSelection, setHasInitializedVersionSelection] = useState(false);

    const [installedModsByVersion, setInstalledModsByVersion] = useState<Record<string, any>>({});
    const [loadingInstalledMods, setLoadingInstalledMods] = useState(false);
    const [removingInstalledKey, setRemovingInstalledKey] = useState('');

    const [busyProjectIds, setBusyProjectIds] = useState<Record<string, any>>({});
    const [installingProjectIds, setInstallingProjectIds] = useState<Record<string, any>>({});

    const compareVersionsDesc = (left, right) => {
        return right.localeCompare(left, undefined, { numeric: true, sensitivity: 'base' });
    };

    const setProjectBusy = (projectId, isBusy) => {
        setBusyProjectIds((prev) => {
            const next = { ...prev };
            if (isBusy) {
                next[projectId] = true;
            } else {
                delete next[projectId];
            }
            return next;
        });
    };

    const setProjectInstalling = (projectId, isInstalling) => {
        setInstallingProjectIds((prev) => {
            const next = { ...prev };
            if (isInstalling) {
                next[projectId] = true;
            } else {
                delete next[projectId];
            }
            return next;
        });
    };

    const hydrateProjectTitles = async (projectIds: any) => {
        const ids: any[] = [...new Set((projectIds || []).filter((item: any) => typeof item === 'string' && item.trim()))];
        const missingIds = ids.filter((projectId) => !projectTitles[projectId]);

        if (missingIds.length === 0) return;

        const discoveredTitles: Record<string, any> = {};

        await Promise.all(missingIds.map(async (projectId) => {
            try {
                const response = await window.electronAPI.getModrinthProject(projectId);
                if (response?.success && response.project?.title) {
                    discoveredTitles[projectId] = response.project.title;
                }
            } catch (error) {
                console.error('Failed to fetch project title:', projectId, error);
            }
        }));

        if (Object.keys(discoveredTitles).length > 0) {
            setProjectTitles((prev) => ({ ...prev, ...discoveredTitles }));
        }
    };

    const loadSettings = async () => {
        try {
            const settingsResponse = await window.electronAPI.getSettings();
            if (!settingsResponse?.success) return;

            const nextSettings = settingsResponse.settings || {};
            const customIds = sanitizeClientCustomAutoInstallModIds(nextSettings.openClientAutoInstallMods || []);

            setSettingsSnapshot(nextSettings);
            setCustomAutoInstallMods(customIds);
        } catch (error) {
            addNotification(t('client_mods.errors.load_settings', 'Could not load client settings.'), 'error');
        }
    };

    const persistCustomAutoInstallMods = async (nextIds) => {
        const sanitizedIds = sanitizeClientCustomAutoInstallModIds(nextIds);
        setSavingAutoInstall(true);

        try {
            const latestSettingsResponse = await window.electronAPI.getSettings();
            const baseSettings = latestSettingsResponse?.success ? latestSettingsResponse.settings : settingsSnapshot;

            if (!baseSettings || Object.keys(baseSettings).length === 0) {
                addNotification(t('client_mods.errors.save_settings', 'Could not save client auto install settings.'), 'error');
                return false;
            }

            const nextSettings = {
                ...baseSettings,
                openClientAutoInstallMods: sanitizedIds
            };

            const saveResponse = await window.electronAPI.saveSettings(nextSettings);
            if (!saveResponse?.success) {
                addNotification(t('client_mods.errors.save_settings', 'Could not save client auto install settings.'), 'error');
                return false;
            }

            setSettingsSnapshot(nextSettings);
            setCustomAutoInstallMods(sanitizedIds);
            return true;
        } catch (error) {
            addNotification(t('client_mods.errors.save_settings', 'Could not save client auto install settings.'), 'error');
            return false;
        } finally {
            setSavingAutoInstall(false);
        }
    };

    const loadClientInstances = async () => {
        try {
            const list = await window.electronAPI.getInstances();
            const filteredInstances = filterInstancesForMode(list, 'client')
                .sort((left, right) => {
                    const leftVersion = String(left?.version || '');
                    const rightVersion = String(right?.version || '');
                    return compareVersionsDesc(leftVersion, rightVersion);
                });

            const versionMap = {};
            filteredInstances.forEach((instance) => {
                const version = String(instance?.version || '').trim();
                if (!version) return;
                if (!versionMap[version]) versionMap[version] = [];
                versionMap[version].push(instance);
            });

            const versions = Object.keys(versionMap).sort(compareVersionsDesc);

            setClientInstances(filteredInstances);
            setInstancesByVersion(versionMap);
            setAvailableVersions(versions);
            setSelectedVersions((prev) => {
                if (!hasInitializedVersionSelection) {
                    return versions;
                }
                return prev.filter((version) => versions.includes(version));
            });
            if (!hasInitializedVersionSelection) {
                setHasInitializedVersionSelection(true);
            }

            if (versionFilter !== 'all' && !versions.includes(versionFilter)) {
                setVersionFilter('all');
            }

            return versionMap;
        } catch (error) {
            addNotification(t('client_mods.errors.load_instances', 'Could not load client versions.'), 'error');
            setClientInstances([]);
            setInstancesByVersion({});
            setAvailableVersions([]);
            setSelectedVersions([]);
            return {};
        }
    };

    const loadInstalledMods = async (versionMapOverride?: any) => {
        const versionMap = versionMapOverride || instancesByVersion;
        setLoadingInstalledMods(true);

        try {
            const nextInstalledMap = {};

            for (const version of Object.keys(versionMap)) {
                const versionInstances = versionMap[version] || [];
                const modsMap = new Map();

                for (const versionInstance of versionInstances) {
                    const modsResponse = await window.electronAPI.getMods(versionInstance.name);
                    if (!modsResponse?.success || !Array.isArray(modsResponse.mods)) {
                        continue;
                    }

                    modsResponse.mods.forEach((mod) => {
                        const modKey = mod.projectId ? `project:${mod.projectId}` : `file:${mod.name}`;
                        const existing = modsMap.get(modKey);

                        if (existing) {
                            existing.instanceFiles.push({
                                instanceName: versionInstance.name,
                                fileName: mod.name
                            });
                            if (!existing.title && mod.title) {
                                existing.title = mod.title;
                            }
                            return;
                        }

                        modsMap.set(modKey, {
                            key: modKey,
                            projectId: mod.projectId || null,
                            title: mod.title || mod.name,
                            fileName: mod.name,
                            instanceFiles: [{
                                instanceName: versionInstance.name,
                                fileName: mod.name
                            }]
                        });
                    });
                }

                nextInstalledMap[version] = {
                    items: Array.from(modsMap.values()).sort((left, right) => {
                        const leftTitle = left.title || left.fileName || '';
                        const rightTitle = right.title || right.fileName || '';
                        return leftTitle.localeCompare(rightTitle);
                    })
                };
            }

            setInstalledModsByVersion(nextInstalledMap);
        } catch (error) {
            addNotification(t('client_mods.errors.load_installed', 'Could not load installed client mods.'), 'error');
        } finally {
            setLoadingInstalledMods(false);
        }
    };

    const refreshClientData = async () => {
        const versionMap = await loadClientInstances();
        await loadInstalledMods(versionMap);
    };

    const executeSearch = async (targetOffset = offset) => {
        setLoadingSearch(true);

        try {
            const facets = [['categories:fabric']];
            if (versionFilter !== 'all') {
                facets.push([`versions:${versionFilter}`]);
            }

            const response = await window.electronAPI.searchModrinth(query, facets, {
                offset: targetOffset,
                limit,
                index: sortMethod,
                projectType: 'mod',
                includeCurseforge: true
            });

            if (response?.success) {
                setResults(response.results || []);
                setTotalHits(response.total_hits || 0);
            } else {
                setResults([]);
                setTotalHits(0);
                addNotification(t('client_mods.errors.search', 'Search failed.'), 'error');
            }
        } catch (error) {
            setResults([]);
            setTotalHits(0);
            addNotification(t('client_mods.errors.search', 'Search failed.'), 'error');
        } finally {
            setLoadingSearch(false);
        }
    };

    const findCompatibleVersion = async (projectId, targetVersion, fallbackCurseForgeProjectId = null) => {
        try {
            const versionsResponse = await window.electronAPI.getModVersions(
                projectId,
                ['fabric'],
                [targetVersion],
                fallbackCurseForgeProjectId
            );

            if (versionsResponse?.success && Array.isArray(versionsResponse.versions) && versionsResponse.versions.length > 0) {
                const compatibleVersion = versionsResponse.versions.find(v =>
                    v.loaders?.includes('fabric') &&
                    v.game_versions?.includes(targetVersion)
                ) || versionsResponse.versions[0];

                const file = compatibleVersion.files?.find((entry) => entry.primary) || compatibleVersion.files?.[0];
                if (file) {
                    return {
                        version: compatibleVersion,
                        file: file,
                        projectId: compatibleVersion.project_id || projectId
                    };
                }
            }
            return null;
        } catch (error) {
            console.error('Failed to find compatible version:', error);
            return null;
        }
    };

    const installProjectForVersions = async ({ projectId, projectTitle, targetVersions, fallbackCurseForgeProjectId = null }) => {
        let installedCount = 0;
        let skippedCount = 0;
        let incompatibleCount = 0;
        let failedCount = 0;
        const installationDetails = [];

        for (const version of targetVersions) {
            const versionInstances = instancesByVersion[version] || [];
            if (versionInstances.length === 0) {
                skippedCount += 1;
                continue;
            }

            const existingVersionEntry = installedModsByVersion[version]?.items?.find((item) => item.projectId === projectId);
            const installedInstanceNames = new Set((existingVersionEntry?.instanceFiles || []).map((file) => file.instanceName));
            const pendingInstances = versionInstances.filter((instance) => !installedInstanceNames.has(instance.name));

            if (pendingInstances.length === 0) {
                skippedCount += 1;
                continue;
            }

            const compatibleInfo = await findCompatibleVersion(projectId, version, fallbackCurseForgeProjectId);
            if (!compatibleInfo) {
                incompatibleCount += 1;
                installationDetails.push({
                    version,
                    status: 'incompatible',
                    message: `No compatible version found for Minecraft ${version}`
                });
                continue;
            }

            for (const instance of pendingInstances) {
                try {
                    const installResponse = await window.electronAPI.installMod({
                        instanceName: instance.name,
                        projectId: compatibleInfo.projectId,
                        fallbackCurseForgeProjectId,
                        versionId: compatibleInfo.version.id,
                        filename: compatibleInfo.file.filename,
                        url: compatibleInfo.file.url,
                        projectType: 'mod'
                    });

                    if (installResponse?.success) {
                        installedCount += 1;
                        installationDetails.push({
                            version,
                            instance: instance.name,
                            status: 'success'
                        });
                    } else {
                        failedCount += 1;
                        installationDetails.push({
                            version,
                            instance: instance.name,
                            status: 'failed',
                            error: installResponse?.error || 'Unknown error'
                        });
                    }
                } catch (error) {
                    failedCount += 1;
                    installationDetails.push({
                        version,
                        instance: instance.name,
                        status: 'failed',
                        error: error.message
                    });
                }
            }
        }

        if (installedCount > 0) {
            addNotification(
                t('client_mods.install_summary', '✅ Installed {{count}} time(s): {{title}}', { count: installedCount, title: projectTitle }),
                'success'
            );
        }

        if (incompatibleCount > 0) {
            addNotification(
                t('client_mods.incompatible_versions', '⚠️ No compatible build found for {{count}} selected version(s).', { count: incompatibleCount }),
                'warning'
            );
        }

        if (failedCount > 0) {
            addNotification(
                t('client_mods.install_failed_count', '❌ {{count}} installation(s) failed.', { count: failedCount }),
                'error'
            );
        }

        if (installedCount === 0 && incompatibleCount === 0 && failedCount === 0 && skippedCount > 0) {
            addNotification(
                t('client_mods.already_installed', '📦 {{title}} is already installed in all selected versions.', { title: projectTitle }),
                'info'
            );
        }

        return { installedCount, skippedCount, incompatibleCount, failedCount, installationDetails };
    };

    const handleAddToSelectedVersions = async (project) => {
        const projectId = project.project_id;
        if (!projectId) {
            addNotification(t('client_mods.errors.invalid_project', 'Invalid project ID.'), 'error');
            return;
        }

        if (selectedVersions.length === 0) {
            addNotification(t('client_mods.select_version_first', '⚠️ Please select at least one version first.'), 'error');
            return;
        }

        setProjectInstalling(projectId, true);
        try {
            await installProjectForVersions({
                projectId,
                projectTitle: project.title || project.slug || projectId,
                targetVersions: selectedVersions,
                fallbackCurseForgeProjectId: project.curseforge_project_id || null
            });
            await loadInstalledMods();
        } catch (error) {
            addNotification(t('client_mods.errors.install', 'Installation failed.'), 'error');
        } finally {
            setProjectInstalling(projectId, false);
        }
    };

    const handleAutoInstall = async (project) => {
        const projectId = project.project_id;
        if (!projectId) return;

        setProjectInstalling(projectId, true);
        try {
            const isDefault = DEFAULT_OPEN_CLIENT_MOD_IDS.includes(projectId);
            const existsInCustomList = customAutoInstallMods.includes(projectId);

            if (!isDefault && !existsInCustomList) {
                const persisted = await persistCustomAutoInstallMods([...customAutoInstallMods, projectId]);
                if (!persisted) {
                    return;
                }
            }

            setProjectTitles((prev) => ({ ...prev, [projectId]: project.title || prev[projectId] || projectId }));

            if (availableVersions.length === 0) {
                addNotification(t('client_mods.no_versions_available', 'No client versions available to install mods.'), 'warning');
                return;
            }

            const result = await installProjectForVersions({
                projectId,
                projectTitle: project.title || project.slug || projectId,
                targetVersions: availableVersions,
                fallbackCurseForgeProjectId: project.curseforge_project_id || null
            });

            if (result.installedCount > 0) {
                addNotification(t('client_mods.auto_install_saved', '✨ Auto install enabled for this mod.'), 'success');
            } else if (result.incompatibleCount > 0) {
                addNotification(t('client_mods.auto_install_incompatible', '⚠️ Auto install enabled but no compatible versions found.'), 'warning');
            }

            await loadInstalledMods();
        } catch (error) {
            addNotification(t('client_mods.errors.auto_install', 'Could not enable auto install.'), 'error');
        } finally {
            setProjectInstalling(projectId, false);
        }
    };

    const handleRemoveAutoInstall = async (projectId) => {
        if (DEFAULT_OPEN_CLIENT_MOD_IDS.includes(projectId)) {
            addNotification(t('client_mods.default_locked', '🔒 Default automatic mods are protected.'), 'warning');
            return;
        }

        const nextList = customAutoInstallMods.filter((item) => item !== projectId);
        const persisted = await persistCustomAutoInstallMods(nextList);
        if (!persisted) return;

        addNotification(t('client_mods.auto_install_removed', '🗑️ Removed from client auto install list.'), 'success');
    };

    const handleRemoveInstalledMod = async (version, modItem) => {
        const targetKey = `${version}:${modItem.key}`;

        if (modItem.projectId && DEFAULT_OPEN_CLIENT_MOD_IDS.includes(modItem.projectId)) {
            addNotification(t('client_mods.default_locked', '🔒 Default automatic mods are protected.'), 'warning');
            return;
        }

        setRemovingInstalledKey(targetKey);
        try {
            let removedCount = 0;
            let failedCount = 0;

            for (const fileRef of modItem.instanceFiles) {
                const removeResponse = await window.electronAPI.deleteMod(fileRef.instanceName, fileRef.fileName, 'mod');
                if (removeResponse?.success) {
                    removedCount += 1;
                } else {
                    failedCount += 1;
                }
            }

            if (removedCount > 0) {
                addNotification(
                    t('client_mods.removed_instances', '🗑️ Removed from {{count}} client instance(s).', { count: removedCount }),
                    failedCount > 0 ? 'warning' : 'success'
                );
            } else {
                addNotification(t('client_mods.errors.remove_installed', 'Could not remove this mod.'), 'error');
            }

            await loadInstalledMods();
        } catch (error) {
            addNotification(t('client_mods.errors.remove_installed', 'Could not remove this mod.'), 'error');
        } finally {
            setRemovingInstalledKey('');
        }
    };

    const handleSearchSubmit = async (event) => {
        event.preventDefault();

        if (offset !== 0) {
            setOffset(0);
        }
        await executeSearch(0);
    };

    const toggleSelectedVersion = (version) => {
        setSelectedVersions((prev) => {
            if (prev.includes(version)) {
                return prev.filter((item) => item !== version);
            }
            return [...prev, version].sort(compareVersionsDesc);
        });
    };

    const displayVersions = useMemo(() => {
        if (versionFilter === 'all') return availableVersions;
        return availableVersions.filter((version) => version === versionFilter);
    }, [availableVersions, versionFilter]);

    const installedProjectIds = useMemo(() => {
        const ids = [];
        Object.values(installedModsByVersion || {}).forEach((versionEntry: any) => {
            (versionEntry?.items || []).forEach((item: any) => {
                if (item?.projectId) {
                    ids.push(item.projectId);
                }
            });
        });
        return [...new Set(ids)];
    }, [installedModsByVersion]);

    useEffect(() => {
        const initialize = async () => {
            await Promise.all([
                refreshClientData(),
                loadSettings()
            ]);
        };

        initialize();
    }, []);

    useEffect(() => {
        if (availableVersions.length > 0) {
            executeSearch(offset);
        }
    }, [offset, sortMethod, versionFilter, availableVersions]);

    useEffect(() => {
        const idsToHydrate = [...DEFAULT_OPEN_CLIENT_MOD_IDS, ...customAutoInstallMods];
        hydrateProjectTitles(idsToHydrate);
    }, [customAutoInstallMods]);

    useEffect(() => {
        if (installedProjectIds.length === 0) return;
        hydrateProjectTitles(installedProjectIds);
    }, [installedProjectIds]);

    const maxPage = Math.max(1, Math.ceil(totalHits / limit));
    const currentPage = Math.floor(offset / limit) + 1;

    return (
        <div className="h-full p-8 flex flex-col overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
            {/* Header mit verbessertem Design */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            {t('client_mods.title', 'Client Mods')}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary"></span>
                            {t('client_mods.desc', 'Search Fabric mods, install them to selected client versions, and manage client auto install.')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Suchbereich mit modernem Design */}
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-5 mb-6 shadow-lg">
                <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-3 items-center">
                    <div className="flex-1 min-w-[220px] relative">
                        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder={t('client_mods.search_placeholder', 'Search Fabric mods...')}
                            className="w-full bg-muted border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-all"
                        />
                    </div>

                    <select
                        value={versionFilter}
                        onChange={(event) => {
                            setVersionFilter(event.target.value);
                            setOffset(0);
                        }}
                        className="bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/60 cursor-pointer"
                    >
                        <option value="all">{t('client_mods.all_versions', 'All Versions')}</option>
                        {availableVersions.map((version) => (
                            <option key={version} value={version}>{version}</option>
                        ))}
                    </select>

                    <select
                        value={sortMethod}
                        onChange={(event) => {
                            setSortMethod(event.target.value);
                            setOffset(0);
                        }}
                        className="bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/60 cursor-pointer"
                    >
                        <option value="relevance">{t('search.relevance', 'Relevance')}</option>
                        <option value="downloads">{t('search.downloads', 'Downloads')}</option>
                        <option value="newest">{t('search.newest', 'Newest')}</option>
                        <option value="updated">{t('search.updated', 'Updated')}</option>
                    </select>

                    <button
                        type="submit"
                        className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary/80 text-black rounded-xl text-sm font-bold hover:opacity-90 transition-all hover:scale-105 transform shadow-lg"
                    >
                        {t('search.search_btn', 'Search')}
                    </button>
                </form>

                {/* Version Selection mit verbessertem Design */}
                <div className="mt-5 flex flex-wrap items-center gap-2">
                    <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {t('client_mods.selected_versions', 'Selected Versions')}
                    </span>
                    <button
                        onClick={() => setSelectedVersions(availableVersions)}
                        type="button"
                        className="px-2 py-1 text-[11px] rounded-md bg-muted hover:bg-accent text-foreground border border-border transition-all"
                    >
                        {t('client_mods.select_all', 'Select all')}
                    </button>
                    <button
                        onClick={() => setSelectedVersions([])}
                        type="button"
                        className="px-2 py-1 text-[11px] rounded-md bg-muted hover:bg-accent text-foreground border border-border transition-all"
                    >
                        {t('client_mods.clear_all', 'Clear')}
                    </button>

                    {availableVersions.map((version) => {
                        const active = selectedVersions.includes(version);
                        return (
                            <button
                                key={version}
                                onClick={() => toggleSelectedVersion(version)}
                                type="button"
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${active
                                    ? 'bg-primary/20 text-primary border-primary/40 shadow-sm'
                                    : 'bg-muted text-foreground border-border hover:bg-accent hover:border-primary/30'}`}
                            >
                                {version}
                            </button>
                        );
                    })}

                    {availableVersions.length === 0 && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {t('client_mods.no_versions', 'No client versions found yet.')}
                        </span>
                    )}
                </div>
            </div>

            {/* Hauptinhalt mit zwei Spalten */}
            <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Linke Spalte: Suchergebnisse */}
                <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-5 flex flex-col min-h-0 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            {t('client_mods.search_results', 'Search Results')}
                        </h2>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                            {t('search.found_results', { count: totalHits, type: t('instance_details.content.mods', 'Mods') })}
                        </span>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-3 pr-1">
                        {loadingSearch ? (
                            <div className="h-full flex items-center justify-center">
                                <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                            </div>
                        ) : results.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-sm text-muted-foreground gap-2">
                                <svg className="w-12 h-12 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {t('client_mods.no_results', 'No mods found.')}
                            </div>
                        ) : (
                            results.map((result) => {
                                const projectId = result.project_id;
                                const isInstalling = Boolean(projectId && installingProjectIds[projectId]);
                                const isBusy = Boolean(projectId && busyProjectIds[projectId]);

                                return (
                                    <div key={projectId || result.slug} className="p-4 rounded-xl border border-border bg-muted/50 hover:bg-muted transition-all group">
                                        <div className="flex items-center gap-3 mb-3">
                                            <img
                                                src={result.icon_url || 'https://cdn.modrinth.com/placeholder.svg'}
                                                alt=""
                                                className="w-12 h-12 rounded-xl bg-muted object-cover ring-1 ring-border"
                                                onError={(e) => { e.currentTarget.src = 'https://cdn.modrinth.com/placeholder.svg'; }}
                                            />
                                            <div className="min-w-0 flex-1">
                                                <div className="font-bold text-foreground truncate">{result.title}</div>
                                                <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{result.description}</div>
                                                <div className="flex flex-wrap gap-2 mt-1.5">
                                                    {getSourceTags(result.source, result.sources).map((sourceTag) => (
                                                        <span key={`${projectId || result.slug}-${sourceTag}`} className="text-[10px] text-muted-foreground uppercase tracking-wide bg-muted px-1.5 py-0.5 rounded">
                                                            {sourceTag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                disabled={isInstalling || !projectId || selectedVersions.length === 0}
                                                onClick={() => handleAddToSelectedVersions(result)}
                                                className="px-3 py-2 rounded-lg text-sm font-bold bg-muted hover:bg-accent text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 transform"
                                            >
                                                {isInstalling ? (
                                                    <span className="flex items-center justify-center gap-1">
                                                        <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                        </svg>
                                                        {t('common.loading', 'Loading...')}
                                                    </span>
                                                ) : t('client_mods.add_to_version', 'Add to Version')}
                                            </button>
                                            <button
                                                type="button"
                                                disabled={isInstalling || !projectId}
                                                onClick={() => handleAutoInstall(result)}
                                                className="px-3 py-2 rounded-lg text-sm font-bold bg-gradient-to-r from-primary to-primary/80 text-black hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 transform shadow-md"
                                            >
                                                {isInstalling ? (
                                                    <span className="flex items-center justify-center gap-1">
                                                        <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                        </svg>
                                                        {t('common.loading', 'Loading...')}
                                                    </span>
                                                ) : t('client_mods.auto_install', 'Auto Install')}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Pagination */}
                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
                            disabled={offset === 0 || loadingSearch}
                            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-muted hover:bg-accent disabled:opacity-40 transition-all"
                        >
                            ← {t('instance_details.search.previous', 'Previous')}
                        </button>

                        <span className="text-xs text-muted-foreground font-semibold bg-muted px-3 py-1 rounded-full">
                            {currentPage} / {maxPage}
                        </span>

                        <button
                            type="button"
                            onClick={() => setOffset((prev) => prev + limit)}
                            disabled={offset + limit >= totalHits || loadingSearch}
                            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-muted hover:bg-accent disabled:opacity-40 transition-all"
                        >
                            {t('instance_details.search.next', 'Next')} →
                        </button>
                    </div>
                </div>

                {/* Rechte Spalte: Auto Install und Installierte Mods */}
                <div className="grid grid-rows-2 gap-6 min-h-0">
                    {/* Auto Install Liste */}
                    <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-5 min-h-0 overflow-hidden flex flex-col shadow-lg">
                        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {t('client_mods.auto_install_list', 'Client Auto Install')}
                        </h2>

                        <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-2 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6-4h12a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
                            </svg>
                            {t('client_mods.default_mods', 'Default (protected)')}
                        </div>
                        <div className="space-y-2 mb-4">
                            {DEFAULT_OPEN_CLIENT_MOD_IDS.map((projectId) => (
                                <div key={projectId} className="flex items-center justify-between bg-muted/50 border border-border rounded-xl px-3 py-2.5">
                                    <span className="text-sm text-foreground truncate">{projectTitles[projectId] || t('client_mods.loading_project_name', 'Loading mod name...')}</span>
                                    <span className="text-[10px] px-2 py-1 rounded-full bg-muted text-muted-foreground border border-border flex items-center gap-1">
                                        <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6-4h12a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
                                        </svg>
                                        {t('client_mods.locked', 'Locked')}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-2 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            {t('client_mods.custom_mods', 'Custom Auto Install')}
                        </div>
                        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                            {customAutoInstallMods.length === 0 ? (
                                <div className="text-sm text-muted-foreground flex items-center justify-center h-24 gap-2">
                                    <svg className="w-5 h-5 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                    </svg>
                                    {t('client_mods.no_custom_mods', 'No custom auto install mods yet.')}
                                </div>
                            ) : (
                                customAutoInstallMods.map((projectId) => (
                                    <div key={projectId} className="flex items-center justify-between bg-muted/50 border border-border rounded-xl px-3 py-2.5 gap-2">
                                        <span className="text-sm text-foreground truncate">{projectTitles[projectId] || t('client_mods.loading_project_name', 'Loading mod name...')}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveAutoInstall(projectId)}
                                            disabled={savingAutoInstall}
                                            className="px-2 py-1 rounded-lg text-xs font-bold bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-400/20 disabled:opacity-50 transition-all hover:scale-105"
                                        >
                                            {t('client_mods.remove', 'Remove')}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Installierte Mods */}
                    <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-5 min-h-0 overflow-hidden flex flex-col shadow-lg">
                        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            {t('client_mods.installed_by_version', 'Installed Client Mods')}
                        </h2>

                        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-3 pr-1">
                            {loadingInstalledMods ? (
                                <div className="h-full flex items-center justify-center">
                                    <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                                </div>
                            ) : displayVersions.length === 0 ? (
                                <div className="text-sm text-muted-foreground flex items-center justify-center h-32 gap-2">
                                    <svg className="w-8 h-8 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {t('client_mods.no_versions', 'No client versions found yet.')}
                                </div>
                            ) : (
                                displayVersions.map((version) => {
                                    const versionItems = installedModsByVersion[version]?.items || [];
                                    return (
                                        <div key={version} className="border border-border rounded-xl p-3 bg-muted/30">
                                            <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-2 flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                {version}
                                            </div>

                                            {versionItems.length === 0 ? (
                                                <div className="text-sm text-muted-foreground py-2 text-center">
                                                    {t('client_mods.no_installed_for_version', 'No mods installed for this version.')}
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {versionItems.map((modItem) => {
                                                        const isDefaultProtected = Boolean(modItem.projectId && DEFAULT_OPEN_CLIENT_MOD_IDS.includes(modItem.projectId));
                                                        const removeKey = `${version}:${modItem.key}`;
                                                        const isRemoving = removingInstalledKey === removeKey;

                                                        return (
                                                            <div key={modItem.key} className="flex items-center justify-between gap-2 bg-muted/50 border border-border rounded-xl px-3 py-2">
                                                                <div className="min-w-0">
                                                                    <div className="text-sm text-foreground truncate">{(modItem.projectId && projectTitles[modItem.projectId]) || modItem.title || modItem.fileName}</div>
                                                                    <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                                                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                                                        </svg>
                                                                        {t('client_mods.instances_count', '{{count}} instance(s)', { count: modItem.instanceFiles.length })}
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveInstalledMod(version, modItem)}
                                                                    disabled={isDefaultProtected || isRemoving}
                                                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${isDefaultProtected
                                                                        ? 'bg-muted text-muted-foreground border-border cursor-not-allowed'
                                                                        : 'bg-red-500/10 text-red-300 border-red-400/20 hover:bg-red-500/20 hover:scale-105'} disabled:opacity-60`}
                                                                >
                                                                    {isDefaultProtected
                                                                        ? <span className="flex items-center gap-1"><svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6-4h12a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" /></svg>{t('client_mods.locked', 'Locked')}</span>
                                                                        : isRemoving
                                                                            ? <span className="flex items-center gap-1"><svg className="w-2.5 h-2.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>{t('common.loading', 'Loading...')}</span>
                                                                            : t('client_mods.remove', 'Remove')}
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Refresh Button */}
            <div className="mt-6 flex items-center justify-end">
                <button
                    type="button"
                    onClick={refreshClientData}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold bg-muted hover:bg-accent text-foreground transition-all hover:scale-105 flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {t('client_mods.refresh', 'Refresh Client Mods')}
                </button>
            </div>
        </div>
    );
}

export default ClientMods;