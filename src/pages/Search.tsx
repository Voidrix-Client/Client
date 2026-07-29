import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNotification } from '../context/NotificationContext';
import { useTranslation } from 'react-i18next';
import { Analytics } from '../services/Analytics';
import { ModDependencyDialog } from '../components/modals';
import PageHeader from '../components/layout/PageHeader';
import PageContent from '../components/layout/PageContent';
import EmptyState from '../components/layout/EmptyState';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { filterInstancesForMode } from '../utils/instanceTypes';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '../components/ui/pagination';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Skeleton } from '../components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
    Search as SearchIcon,
    Download,
    Plus,
    Check,
    X,
    Eye,
    Image as ImageIcon,
    Loader2,
    Package,
    Blocks,
    Paintbrush,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    Heart,
    Clock,
    TrendingUp,
    Globe,
    Zap,
    Calendar,
    Users,
    Hash,
    Info
} from 'lucide-react';
import { cn } from '../lib/utils';
import { getSourceTags } from '../utils/sourceTags';

// ============================================================================
// Types
// ============================================================================

interface Mod {
    project_id: string;
    title: string;
    description?: string;
    icon_url?: string;
    author?: string;
    downloads?: number;
    follows?: number;
    updated?: string;
    project_type: string;
    source?: string;
    sources?: string[];
    slug?: string;
    curseforge_project_id?: string | null;
    gallery?: Array<{ url: string; title?: string }>;
}

interface Instance {
    name: string;
    icon?: string;
    loader?: string;
    version?: string;
}

interface Dependency {
    projectId: string;
    versionId: string;
    filename: string;
    url: string;
    projectType: string;
    title: string;
}

// ============================================================================
// Memoized Components
// ============================================================================

const SearchResultCard = React.memo(({
    mod,
    projectType,
    installedIds,
    installing,
    formatDownloads,
    onOpenInstall,
    onPreview,
    t
}: {
    mod: Mod;
    projectType: string;
    installedIds: Set<string>;
    installing: boolean;
    formatDownloads: (num?: number) => string;
    onOpenInstall: (mod: Mod) => void;
    onPreview: (mod: Mod) => void;
    t: any;
}) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const isPromoted = mod.project_id === 'oMskb4v5';

    const getTypeIcon = () => {
        switch (mod.project_type) {
            case 'modpack': return <Package className="h-3 w-3" />;
            case 'shader': return <Paintbrush className="h-3 w-3" />;
            case 'resourcepack': return <Paintbrush className="h-3 w-3" />;
            default: return <Blocks className="h-3 w-3" />;
        }
    };

    return (
        <div
            className={cn(
                "group relative rounded-2xl border transition-all duration-300 bg-gradient-to-br from-card/95 to-card/80 overflow-hidden",
                "hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-0.5",
                'border-border/50',
                installedIds.has(mod.project_id) && 'border-emerald-500/40 bg-gradient-to-br from-emerald-500/5 to-transparent'
            )}
        >
            {/* Promoted Badge */}
            {isPromoted && (
                <div className="absolute top-0 right-0 z-20">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-blue-500 blur-md opacity-50 animate-pulse" />
                        <Badge className="relative m-3 bg-gradient-to-r from-violet-500 to-blue-500 text-white border-0 shadow-lg px-2.5 py-1">
                            <Sparkles className="h-3 w-3 mr-1.5" />
                            Empfohlen
                        </Badge>
                    </div>
                </div>
            )}

            <div className="p-5 flex flex-col h-full relative z-10">
                {/* Header with Icon and Title */}
                <div className="flex items-start gap-4 mb-4">
                    <div className="relative shrink-0">
                        <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-muted to-muted/50 overflow-hidden border border-border/50 shadow-lg">
                            {!imageLoaded && (
                                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                </div>
                            )}
                            <img
                                src={mod.icon_url || 'https://cdn.modrinth.com/placeholder.svg'}
                                alt=""
                                className={cn(
                                    "w-full h-full object-cover transition-all duration-700",
                                    imageLoaded ? "opacity-100 scale-100 group-hover:scale-110" : "opacity-0"
                                )}
                                onLoad={() => setImageLoaded(true)}
                                onError={(e) => (e.target as HTMLImageElement).src = 'https://cdn.modrinth.com/placeholder.svg'}
                                loading="lazy"
                            />
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base text-foreground truncate group-hover:text-primary transition-colors" title={mod.title}>
                            {mod.title}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">
                                {mod.author || 'Unbekannt'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground/80 mb-4 line-clamp-2 leading-relaxed">
                    {mod.description || 'Keine Beschreibung verfügbar.'}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                    <Badge variant="secondary" className="text-[10px] capitalize px-2 py-0.5 gap-1">
                        {getTypeIcon()}
                        {mod.project_type === 'modpack' ? 'Modpack' :
                            mod.project_type === 'shader' ? 'Shader' :
                                mod.project_type === 'resourcepack' ? 'Ressourcenpaket' : 'Mod'}
                    </Badge>

                    {getSourceTags(mod.source, mod.sources).map((sourceTag: string) => (
                        <Badge key={`${mod.project_id}-${sourceTag}`} variant="outline" className="text-[10px] uppercase px-2 py-0.5 gap-1">
                            {sourceTag === 'Modrinth' && <Globe className="h-2.5 w-2.5" />}
                            {sourceTag === 'CurseForge' && <Zap className="h-2.5 w-2.5" />}
                            {sourceTag}
                        </Badge>
                    ))}

                    <Badge variant="outline" className="text-[10px] px-2 py-0.5 gap-1">
                        <Download className="h-2.5 w-2.5" />
                        {formatDownloads(mod.downloads)}
                    </Badge>

                    {mod.follows && (
                        <Badge variant="outline" className="text-[10px] px-2 py-0.5 gap-1">
                            <Heart className="h-2.5 w-2.5" />
                            {formatDownloads(mod.follows)}
                        </Badge>
                    )}

                    {mod.updated && (
                        <Badge variant="outline" className="text-[10px] px-2 py-0.5 gap-1">
                            <Calendar className="h-2.5 w-2.5" />
                            {new Date(mod.updated).toLocaleDateString('de-DE')}
                        </Badge>
                    )}
                </div>

                <div className="mb-4 text-[11px] text-muted-foreground flex items-center justify-between">
                    <span className="truncate max-w-[60%]">
                        Quelle: {getSourceTags(mod.source, mod.sources)[0] || 'Unknown'}
                    </span>
                    <span className="font-mono text-primary/80">#{mod.project_id.slice(0, 6)}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-auto">
                    {mod.project_type === 'shader' && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-9 text-xs gap-1.5 hover:bg-primary/10"
                            onClick={(e) => {
                                e.stopPropagation();
                                onPreview(mod);
                            }}
                        >
                            <Eye className="h-3.5 w-3.5" />
                            Vorschau
                        </Button>
                    )}

                    <Button
                        variant={installedIds.has(mod.project_id) ? 'default' : 'secondary'}
                        size="sm"
                        className={cn(
                            mod.project_type === 'shader' ? 'flex-1' : 'w-full',
                            'h-9 text-xs font-medium transition-all duration-200 gap-1.5',
                            installedIds.has(mod.project_id) && 'bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-500 shadow-lg',
                            !installedIds.has(mod.project_id) && 'hover:shadow-md'
                        )}
                        onClick={() => onOpenInstall(mod)}
                        disabled={installing}
                    >
                        {installedIds.has(mod.project_id) ? (
                            <>
                                <Check className="h-3.5 w-3.5" />
                                {projectType === 'modpack' ? 'Wird erstellt' : 'Installiert'}
                            </>
                        ) : (
                            <>
                                <Plus className="h-3.5 w-3.5" />
                                {projectType === 'modpack' ? 'Modpack erstellen' : 'Installieren'}
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
});

SearchResultCard.displayName = 'SearchResultCard';

const SearchSkeleton = React.memo(() => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/90 p-5 space-y-4">
                <div className="flex items-start gap-3">
                    <Skeleton className="w-14 h-14 rounded-xl" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-2/3" />
                        <Skeleton className="h-3 w-1/3" />
                    </div>
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-full rounded-lg" />
                </div>
            </div>
        ))}
    </div>
));

SearchSkeleton.displayName = 'SearchSkeleton';

const Lightbox = React.memo(({ 
    project, 
    index, 
    onClose, 
    onNext, 
    onPrev 
}: { 
    project: Mod | null; 
    index: number; 
    onClose: () => void; 
    onNext: () => void; 
    onPrev: () => void;
}) => {
    if (!project?.gallery || index === -1) return null;

    const currentImage = project.gallery[index];

    return (
        <div
            className="fixed inset-0 bg-black/98 z-[70] flex items-center justify-center backdrop-blur-2xl select-none"
            onClick={onClose}
        >
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-6 right-6 z-50 rounded-full bg-white/10 hover:bg-white/20 text-white h-12 w-12 backdrop-blur-md transition-all hover:scale-110"
                onClick={onClose}
            >
                <X className="h-6 w-6" />
            </Button>

            <Button
                variant="ghost"
                size="icon"
                className="absolute left-6 top-1/2 -translate-y-1/2 z-50 rounded-full bg-black/50 hover:bg-white/20 text-white h-12 w-12 backdrop-blur-md group transition-all hover:scale-110"
                onClick={onPrev}
            >
                <ChevronLeft className="h-6 w-6 group-hover:-translate-x-0.5 transition-transform" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className="absolute right-6 top-1/2 -translate-y-1/2 z-50 rounded-full bg-black/50 hover:bg-white/20 text-white h-12 w-12 backdrop-blur-md group transition-all hover:scale-110"
                onClick={onNext}
            >
                <ChevronRight className="h-6 w-6 group-hover:translate-x-0.5 transition-transform" />
            </Button>

            <div className="absolute top-6 left-6 text-white text-sm font-medium bg-black/60 px-4 py-2 rounded-full backdrop-blur-md">
                {index + 1} / {project.gallery.length}
            </div>

            <div
                className="w-full h-full flex items-center justify-center p-4 md:p-20"
                onClick={(e) => e.stopPropagation()}
            >
                <img
                    src={currentImage.url}
                    alt={currentImage.title || "Galerie Bild"}
                    className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl animate-scale-in"
                    loading="lazy"
                />
                {currentImage.title && (
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-xl px-6 py-3 rounded-full text-white text-sm font-medium animate-slide-up">
                        {currentImage.title}
                    </div>
                )}
            </div>
        </div>
    );
});

Lightbox.displayName = 'Lightbox';

// ============================================================================
// Main Component
// ============================================================================

function Search({ initialCategory, onCategoryConsumed }: { initialCategory?: string; onCategoryConsumed?: () => void }) {
    const { t } = useTranslation();
    const { addNotification } = useNotification();

    // State
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Mod[]>([]);
    const [loading, setLoading] = useState(false);
    const [projectType, setProjectType] = useState(initialCategory || 'mod');
    const [offset, setOffset] = useState(0);
    const limit = 21;
    const [totalHits, setTotalHits] = useState(0);
    const [sortMethod, setSortMethod] = useState('relevance');
    const [provider, setProvider] = useState('modrinth');
    const [showInstallModal, setShowInstallModal] = useState(false);
    const [selectedMod, setSelectedMod] = useState<Mod | null>(null);
    const [instances, setInstances] = useState<Instance[]>([]);
    const [selectedInstance, setSelectedInstance] = useState('');
    const [installing, setInstalling] = useState(false);
    const [installedIds, setInstalledIds] = useState<Set<string>>(new Set());
    const [instanceInstalledIds, setInstanceInstalledIds] = useState<Set<string>>(new Set());
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewProject, setPreviewProject] = useState<Mod | null>(null);
    const [lightboxIndex, setLightboxIndex] = useState(-1);
    const [showDependencyModal, setShowDependencyModal] = useState(false);
    const [pendingDependencies, setPendingDependencies] = useState<Dependency[]>([]);
    const [resolvedForInstance, setResolvedForInstance] = useState<Instance | null>(null);
    const [jumpPopover, setJumpPopover] = useState<string | null>(null);
    const [jumpValue, setJumpValue] = useState('');

    const liveSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const didInitLiveSearchRef = useRef(false);

    // Memoized values
    const totalPages = useMemo(() => Math.max(1, Math.ceil(totalHits / limit)), [totalHits, limit]);
    const currentPage = useMemo(() => Math.floor(offset / limit) + 1, [offset, limit]);

    // Effects
    useEffect(() => {
        if (initialCategory) {
            setProjectType(initialCategory);
            if (onCategoryConsumed) onCategoryConsumed();
        }
    }, [initialCategory, onCategoryConsumed]);

    useEffect(() => {
        handleSearch();
    }, [offset, sortMethod, projectType, provider]);

    useEffect(() => {
        if (!didInitLiveSearchRef.current) {
            didInitLiveSearchRef.current = true;
            return;
        }

        if (liveSearchTimeoutRef.current) clearTimeout(liveSearchTimeoutRef.current);

        liveSearchTimeoutRef.current = setTimeout(() => {
            if (offset === 0) {
                handleSearch();
            } else {
                setOffset(0);
            }
        }, 300);

        return () => {
            if (liveSearchTimeoutRef.current) {
                clearTimeout(liveSearchTimeoutRef.current);
                liveSearchTimeoutRef.current = null;
            }
        };
    }, [query]);

    useEffect(() => {
        if (showInstallModal && selectedInstance) {
            checkInstanceInstalled();
        } else {
            setInstanceInstalledIds(new Set());
        }
    }, [selectedInstance, showInstallModal, projectType]);

    // Keyboard handler for lightbox
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (lightboxIndex === -1) return;
            if (e.key === 'ArrowRight') handleNextImage();
            if (e.key === 'ArrowLeft') handlePrevImage();
            if (e.key === 'Escape') setLightboxIndex(-1);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxIndex]);

    const handleNextImage = useCallback(() => {
        if (previewProject?.gallery) {
            setLightboxIndex((prev) => (prev + 1) % previewProject.gallery!.length);
        }
    }, [previewProject]);

    const handlePrevImage = useCallback(() => {
        if (previewProject?.gallery) {
            setLightboxIndex((prev) => (prev - 1 + previewProject.gallery!.length) % previewProject.gallery!.length);
        }
    }, [previewProject]);

    const formatDownloads = useCallback((downloads?: number) => {
        if (downloads === undefined || downloads === null) return '0';

        if (downloads >= 1_000_000_000) {
            return (downloads / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + ' Mrd.';
        }
        if (downloads >= 1_000_000) {
            return (downloads / 1_000_000).toFixed(1).replace(/\.0$/, '') + ' Mio.';
        }
        if (downloads >= 1_000) {
            return (downloads / 1_000).toFixed(1).replace(/\.0$/, '') + ' Tsd.';
        }
        return downloads.toString();
    }, []);

    const handleSearch = useCallback(async () => {
        setLoading(true);
        try {
            const res = await window.electronAPI.searchModrinth(query, [], {
                offset,
                limit,
                index: sortMethod,
                projectType,
                provider
            });

            if (res.success) {
                let finalResults = res.results;

                if (projectType === 'modpack' && offset === 0 && !query) {
                    try {
                        const gCraftRes = await window.electronAPI.getModrinthProject('oMskb4v5');
                        if (gCraftRes.success) {
                            const gCraft = {
                                ...gCraftRes.project,
                                project_id: gCraftRes.project.id,
                                project_type: 'modpack'
                            };
                            finalResults = [gCraft, ...finalResults.filter((r: Mod) => r.project_id !== 'oMskb4v5')];
                        }
                    } catch (err) {
                        console.error("Fehler beim Laden des empfohlenen Modpacks:", err);
                    }
                }

                setResults(finalResults);
                setTotalHits(res.total_hits);
            } else {
                addNotification(`❌ Suche fehlgeschlagen: ${res.error}`, 'error');
            }
        } catch (err: any) {
            addNotification(`⚠️ Fehler bei der Suche: ${err.message}`, 'error');
        } finally {
            setLoading(false);
        }
    }, [query, offset, limit, sortMethod, projectType, provider, addNotification]);

    const checkInstanceInstalled = useCallback(async () => {
        try {
            let res;
            if (projectType === 'mod') {
                res = await window.electronAPI.getMods(selectedInstance);
                if (res.success) {
                    const ids = new Set(res.mods.filter((m: any) => m.projectId).map((m: any) => m.projectId));
                    setInstanceInstalledIds(ids);
                }
            } else if (projectType === 'resourcepack') {
                res = await window.electronAPI.getResourcePacks(selectedInstance);
                if (res.success) {
                    const ids = new Set(res.packs.filter((p: any) => p.projectId).map((p: any) => p.projectId));
                    setInstanceInstalledIds(ids);
                }
            } else if (projectType === 'shader') {
                res = await window.electronAPI.getShaders(selectedInstance);
                if (res.success) {
                    const ids = new Set(res.shaders.filter((s: any) => s.projectId).map((s: any) => s.projectId));
                    setInstanceInstalledIds(ids);
                }
            }
        } catch (e) {
            console.error("Fehler beim Prüfen installierter Inhalte", e);
        }
    }, [selectedInstance, projectType]);

    const handleNext = useCallback(() => {
        if (offset + limit < totalHits) setOffset(offset + limit);
    }, [offset, limit, totalHits]);

    const handlePrev = useCallback(() => {
        if (offset - limit >= 0) setOffset(offset - limit);
    }, [offset, limit]);

    const handlePageChange = useCallback((page: number) => {
        const nextPage = Math.min(Math.max(page, 1), totalPages);
        const nextOffset = (nextPage - 1) * limit;
        if (nextOffset !== offset) setOffset(nextOffset);
    }, [totalPages, limit, offset]);

    const handleJumpSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        const parsedPage = Number.parseInt(jumpValue, 10);
        if (!Number.isNaN(parsedPage)) handlePageChange(parsedPage);
        setJumpPopover(null);
        setJumpValue('');
    }, [jumpValue, handlePageChange]);

    const pageItems = useMemo(() => {
        if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);

        if (currentPage <= 3) return [1, 2, 3, 4, 'end-ellipsis', totalPages];
        if (currentPage >= totalPages - 2) return [1, 'start-ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        return [1, 'start-ellipsis', currentPage - 1, currentPage, currentPage + 1, 'end-ellipsis', totalPages];
    }, [totalPages, currentPage]);

    const hasActiveFilters = useMemo(() => {
        return Boolean(query.trim()) || sortMethod !== 'relevance' || provider !== 'modrinth';
    }, [query, sortMethod, provider]);

    const toggleProjectType = useCallback((type: string) => {
        setProjectType(type);
        setOffset(0);
        setResults([]);
        setTotalHits(0);
    }, []);

    const handleProviderChange = useCallback((value: string) => {
        setProvider(value);
        setOffset(0);
    }, []);

    const handleSortChange = useCallback((value: string) => {
        setSortMethod(value);
        setOffset(0);
    }, []);

    const handlePreview = useCallback(async (mod: Mod) => {
        try {
            const projectId = mod.project_id;
            if (!projectId) {
                addNotification('⚠️ Keine Projekt-ID gefunden', 'error');
                return;
            }

            addNotification(`🔍 Lade Vorschau für ${mod.title}...`, 'info');
            const res = await window.electronAPI.getModrinthProject(projectId);
            if (res.success) {
                const fullProject: Mod = {
                    ...res.project,
                    project_id: res.project.id,
                    project_type: mod.project_type
                };
                setPreviewProject(fullProject);
                setShowPreviewModal(true);
            } else {
                addNotification(`❌ Vorschau fehlgeschlagen: ${res.error}`, 'error');
            }
        } catch (e) {
            console.error(e);
            addNotification('⚠️ Fehler beim Laden der Vorschau', 'error');
        }
    }, [addNotification]);

    const handleModpackInstall = useCallback(async (mod: Mod) => {
        if (installing) return;
        setInstalling(true);
        try {
            addNotification(`📦 Suche Versionen für ${mod.title}...`, 'info');

            const res = await window.electronAPI.getModVersions(mod.slug, [], []);

            if (!res?.success || !res.versions?.length) {
                addNotification('❌ Keine kompatiblen Versionen gefunden', 'error');
                return;
            }

            const versions = res.versions;
            const latestVersion = versions[0];
            const primaryFile = latestVersion.files?.find((f: any) => f.primary) || latestVersion.files?.[0];

            if (!primaryFile) {
                addNotification('❌ Keine Installationsdateien gefunden', 'error');
                return;
            }

            addNotification(`🚀 Erstelle Modpack ${mod.title}...`, 'info');
            const installRes = await window.electronAPI.installModpack(primaryFile.url, mod.title, mod.icon_url);

            if (installRes.success) {
                addNotification(`✅ ${mod.title} wurde erfolgreich erstellt!`, 'success');
                setInstalledIds(prev => new Set(prev).add(mod.project_id));
                Analytics.trackDownload('modpack', mod.title, mod.project_id);
                Analytics.trackInstanceCreation('modpack', 'latest');
            } else {
                addNotification(`❌ Fehler beim Erstellen: ${installRes.error}`, 'error');
            }

        } catch (e: any) {
            console.error("Modpack Installationsfehler:", e);
            addNotification('⚠️ Ein Fehler ist aufgetreten', 'error');
        } finally {
            setInstalling(false);
        }
    }, [installing, addNotification]);

    const openInstall = useCallback(async (mod: Mod) => {
        if (projectType === 'modpack') {
            await handleModpackInstall(mod);
            return;
        }

        setSelectedMod(mod);
        const list = await window.electronAPI.getInstances();
        const launcherInstances = filterInstancesForMode(list, 'launcher');
        setInstances(launcherInstances);
        setSelectedInstance(launcherInstances.length > 0 ? launcherInstances[0].name : '');
        setShowInstallModal(true);
    }, [projectType, handleModpackInstall]);

    const executeInstallList = useCallback(async (installList: Dependency[]) => {
        if (!installList?.length) return;

        setInstalling(true);
        try {
            for (let i = 0; i < installList.length; i++) {
                const item = installList[i];
                addNotification(`📦 Installiere ${item.title} (${i + 1}/${installList.length})...`, 'info');

                const res = await window.electronAPI.installMod({
                    instanceName: item.instanceName,
                    projectId: item.projectId,
                    fallbackCurseForgeProjectId: null,
                    versionId: item.versionId,
                    filename: item.filename,
                    url: item.url,
                    projectType: item.projectType
                });

                if (res.success) {
                    setInstalledIds(prev => new Set(prev).add(item.projectId));
                    setInstanceInstalledIds(prev => new Set(prev).add(item.projectId));
                    Analytics.trackDownload(item.projectType, item.title, item.projectId);
                } else {
                    addNotification(`❌ Fehler bei ${item.title}: ${res.error}`, 'error');
                }
            }
            addNotification(`✅ ${installList.length} ${installList.length === 1 ? 'Inhalt wurde' : 'Inhalte wurden'} erfolgreich installiert!`, 'success');
            setShowInstallModal(false);
            setShowDependencyModal(false);
        } catch (e: any) {
            addNotification(`⚠️ Fehler: ${e.message}`, 'error');
        } finally {
            setInstalling(false);
        }
    }, [addNotification]);

    const handleInstall = useCallback(async () => {
        if (!selectedInstance || !selectedMod) return;

        const instance = instances.find(i => i.name === selectedInstance);
        if (!instance) return;

        setInstalling(true);
        try {
            addNotification(`🔍 Prüfe Abhängigkeiten für ${selectedMod.title}...`, 'info');
            const loaders = (selectedMod.project_type === 'shader' || selectedMod.project_type === 'resourcepack' || !instance.loader || instance.loader.toLowerCase() === 'vanilla')
                ? []
                : [instance.loader];

            const res = await window.electronAPI.getModVersions(
                selectedMod.project_id,
                loaders,
                [instance.version],
                selectedMod.curseforge_project_id || null
            );

            if (res.success && res.versions.length > 0) {
                const version = res.versions[0];
                const depRes = await window.electronAPI.resolveDependencies(version.id, loaders, [instance.version]);

                if (depRes.success && depRes.dependencies.length > 1) {
                    setPendingDependencies(depRes.dependencies);
                    setResolvedForInstance(instance);
                    setShowDependencyModal(true);
                    setShowInstallModal(false);
                } else {
                    const file = version.files.find((f: any) => f.primary) || version.files[0];
                    const installProjectId = version.project_id || selectedMod.project_id;
                    await executeInstallList([{
                        instanceName: instance.name,
                        projectId: installProjectId,
                        versionId: version.id,
                        filename: file.filename,
                        url: file.url,
                        projectType: selectedMod.project_type,
                        title: selectedMod.title
                    }]);
                }
            } else {
                addNotification(`❌ Keine kompatible Version für ${instance.loader} ${instance.version} gefunden`, 'error');
            }
        } catch (e: any) {
            addNotification(`⚠️ Fehler: ${e.message}`, 'error');
        } finally {
            setInstalling(false);
        }
    }, [selectedInstance, selectedMod, instances, addNotification, executeInstallList]);

    const handleDependencyConfirm = useCallback(async (selectedMods: any[]) => {
        if (!resolvedForInstance) return;

        const installList: Dependency[] = selectedMods.map(m => ({
            instanceName: resolvedForInstance.name,
            projectId: m.projectId,
            versionId: m.versionId,
            filename: m.filename,
            url: m.url,
            projectType: m.projectType,
            title: m.title
        }));

        await executeInstallList(installList);
    }, [resolvedForInstance, executeInstallList]);

    const getTypeName = () => {
        switch (projectType) {
            case 'mod': return 'Mods';
            case 'resourcepack': return 'Ressourcenpakete';
            case 'modpack': return 'Modpacks';
            case 'shader': return 'Shader';
            default: return 'Inhalte';
        }
    };

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-background via-background to-background/95">
            {/* Decorative Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/8 rounded-full blur-3xl animate-float-delayed" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl" />
            </div>

            <PageHeader
                title={
                    <span className="flex items-center gap-2">
                        <SearchIcon className="h-5 w-5 text-primary" />
                        {t('search.title', 'Inhalte durchsuchen')}
                    </span>
                }
                description={
                    <span className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Entdecke tausende Mods, Ressourcenpakete und mehr
                    </span>
                }
            >
                <Tabs value={projectType} onValueChange={toggleProjectType}>
                    <TabsList className="bg-muted/40 backdrop-blur-sm p-1 rounded-xl border border-border/40">
                        <TabsTrigger value="mod" className="gap-2 data-[state=active]:bg-primary/10">
                            <Blocks className="h-4 w-4" />
                            Mods
                        </TabsTrigger>
                        <TabsTrigger value="resourcepack" className="gap-2 data-[state=active]:bg-primary/10">
                            <Paintbrush className="h-4 w-4" />
                            Ressourcen
                        </TabsTrigger>
                        <TabsTrigger value="modpack" className="gap-2 data-[state=active]:bg-primary/10">
                            <Package className="h-4 w-4" />
                            Modpacks
                        </TabsTrigger>
                        <TabsTrigger value="shader" className="gap-2 data-[state=active]:bg-primary/10">
                            <Paintbrush className="h-4 w-4" />
                            Shader
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </PageHeader>

            <PageContent noScroll>
                <div className="flex flex-col h-full gap-5 relative z-10">
                    {/* Search Controls */}
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        if (liveSearchTimeoutRef.current) clearTimeout(liveSearchTimeoutRef.current);
                        if (offset === 0) {
                            handleSearch();
                        } else {
                            setOffset(0);
                        }
                    }} className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm p-3">
                        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-[minmax(0,1fr)_170px_170px_auto]">
                            <div className="relative group">
                                <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder={`${getTypeName()} durchsuchen...`}
                                    className="pl-10 h-10 bg-background/70 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all rounded-xl"
                                />
                            </div>

                            <Select value={provider} onValueChange={handleProviderChange}>
                                <SelectTrigger className="h-10 bg-background/70 border-border/50 text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="modrinth">
                                        <span className="flex items-center gap-2">
                                            <Globe className="h-3.5 w-3.5" />
                                            Modrinth
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="curseforge">
                                        <span className="flex items-center gap-2">
                                            <Zap className="h-3.5 w-3.5" />
                                            CurseForge
                                        </span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={sortMethod} onValueChange={handleSortChange}>
                                <SelectTrigger className="h-10 bg-background/70 border-border/50 text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="relevance">Nach Relevanz</SelectItem>
                                    <SelectItem value="downloads">Meiste Downloads</SelectItem>
                                    <SelectItem value="newest">Neueste zuerst</SelectItem>
                                    <SelectItem value="updated">Kürzlich aktualisiert</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="flex items-center gap-2">
                                <Button
                                    type="submit"
                                    className="h-10 px-4 gap-2"
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SearchIcon className="h-4 w-4" />}
                                    Suchen
                                </Button>
                                {hasActiveFilters && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-10 px-3"
                                        onClick={() => {
                                            setQuery('');
                                            setProvider('modrinth');
                                            setSortMethod('relevance');
                                            setOffset(0);
                                        }}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </form>

                    {/* Filters Bar */}
                    <div className="flex flex-wrap justify-between items-center gap-2 bg-muted/20 backdrop-blur-sm rounded-xl p-2.5 border border-border/40">
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="h-7 px-2.5 gap-1.5">
                                <TrendingUp className="h-3.5 w-3.5" />
                                {totalHits.toLocaleString('de-DE')}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                                {getTypeName()} gefunden
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="h-7 px-2.5 capitalize">{projectType}</Badge>
                            <Badge variant="outline" className="h-7 px-2.5">{provider}</Badge>
                            <Badge variant="outline" className="h-7 px-2.5">{sortMethod}</Badge>
                        </div>
                    </div>

                    {/* Results Grid */}
                    <div className="flex-1 overflow-y-auto min-h-0 pr-1 custom-scrollbar">
                        {loading ? (
                            <SearchSkeleton />
                        ) : results.length === 0 ? (
                            <EmptyState
                                icon={SearchIcon}
                                title="Keine Ergebnisse gefunden"
                                description={
                                    query
                                        ? `Für "${query}" wurden leider keine ${getTypeName().toLowerCase()} gefunden. Versuche es mit einem anderen Suchbegriff.`
                                        : `Noch keine ${getTypeName().toLowerCase()} durchsucht. Gib einen Suchbegriff ein oder entdecke die beliebtesten Inhalte.`
                                }
                                action={
                                    query && (
                                        <Button
                                            variant="outline"
                                            onClick={() => setQuery('')}
                                            className="mt-4 gap-2"
                                        >
                                            <X className="h-4 w-4" />
                                            Suche zurücksetzen
                                        </Button>
                                    )
                                }
                            />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                                {results.map((mod) => (
                                    <SearchResultCard
                                        key={mod.project_id}
                                        mod={mod}
                                        projectType={projectType}
                                        installedIds={installedIds}
                                        installing={installing}
                                        formatDownloads={formatDownloads}
                                        onOpenInstall={openInstall}
                                        onPreview={handlePreview}
                                        t={t}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex flex-col gap-3 border-t border-border/50 pt-3 sm:flex-row sm:items-center sm:justify-between bg-card/30 backdrop-blur-sm rounded-xl p-3">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground px-2">
                                <div className="p-1 rounded-md bg-primary/10">
                                    <Hash className="h-3 w-3 text-primary" />
                                </div>
                                <span className="font-medium">
                                    Seite {currentPage}
                                </span>
                                <span className="text-xs">
                                    von {totalPages}
                                </span>
                            </div>

                            <Pagination className="mx-0 w-auto justify-end">
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            onClick={handlePrev}
                                            disabled={offset === 0}
                                            className="hover:bg-primary/10 transition-colors cursor-pointer"
                                        />
                                    </PaginationItem>

                                    {pageItems.map((item) => (
                                        <PaginationItem key={item}>
                                            {typeof item === 'number' ? (
                                                <PaginationLink
                                                    isActive={item === currentPage}
                                                    onClick={() => handlePageChange(item)}
                                                    className={cn(
                                                        "transition-all cursor-pointer",
                                                        item === currentPage && "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                                                    )}
                                                >
                                                    {item}
                                                </PaginationLink>
                                            ) : (
                                                <Popover
                                                    open={jumpPopover === item}
                                                    onOpenChange={(open) => {
                                                        setJumpPopover(open ? item : null);
                                                        if (open) setJumpValue('');
                                                    }}
                                                >
                                                    <PopoverTrigger asChild>
                                                        <button
                                                            type="button"
                                                            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                                                            aria-label="Zu Seite springen"
                                                        >
                                                            <PaginationEllipsis />
                                                        </button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-28 p-2" align="center">
                                                        <form onSubmit={handleJumpSubmit} className="flex flex-col gap-2">
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                max={totalPages}
                                                                value={jumpValue}
                                                                onChange={(e) => setJumpValue(e.target.value)}
                                                                placeholder={`${currentPage}/${totalPages}`}
                                                                autoFocus
                                                                className="h-8 text-center"
                                                            />
                                                        </form>
                                                    </PopoverContent>
                                                </Popover>
                                            )}
                                        </PaginationItem>
                                    ))}

                                    <PaginationItem>
                                        <PaginationNext
                                            onClick={handleNext}
                                            disabled={offset + limit >= totalHits}
                                            className="hover:bg-primary/10 transition-colors cursor-pointer"
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </div>
            </PageContent>

            {/* Install Modal */}
            <Dialog open={showInstallModal} onOpenChange={setShowInstallModal}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <div className="p-1.5 rounded-lg bg-primary/10">
                                <Plus className="h-4 w-4 text-primary" />
                            </div>
                            {selectedMod?.title} installieren
                        </DialogTitle>
                        <DialogDescription>
                            Wähle eine Instanz aus, in der der Inhalt installiert werden soll.
                        </DialogDescription>
                    </DialogHeader>

                    <Select value={selectedInstance} onValueChange={setSelectedInstance}>
                        <SelectTrigger className="w-full rounded-xl">
                            <SelectValue placeholder="Instanz auswählen" />
                        </SelectTrigger>
                        <SelectContent>
                            {instances.map(inst => (
                                <SelectItem key={inst.name} value={inst.name} className="gap-2">
                                    <div className="flex items-center gap-2">
                                        {inst.icon && (
                                            <img src={inst.icon} alt="" className="w-5 h-5 rounded" />
                                        )}
                                        <span className="font-medium">{inst.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                            ({inst.loader} {inst.version})
                                        </span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <DialogFooter className="gap-2">
                        <Button variant="ghost" onClick={() => setShowInstallModal(false)}>
                            Abbrechen
                        </Button>
                        <Button
                            onClick={handleInstall}
                            disabled={installing || !selectedInstance}
                            className={cn(
                                "min-w-[120px] gap-1.5",
                                instanceInstalledIds.has(selectedMod?.project_id || '') && 'bg-emerald-600 hover:bg-emerald-700'
                            )}
                        >
                            {installing && <Loader2 className="h-4 w-4 animate-spin" />}
                            {installing ? 'Installiere...' :
                                instanceInstalledIds.has(selectedMod?.project_id || '') ? 'Bereits installiert' :
                                    'Installieren'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Preview Modal */}
            <Dialog open={showPreviewModal && !!previewProject} onOpenChange={(open) => { if (!open) setShowPreviewModal(false); }}>
                <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 gap-0 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-border/50 flex items-start gap-4 shrink-0 bg-gradient-to-r from-muted/30 to-transparent">
                        <img
                            src={previewProject?.icon_url || 'https://cdn.modrinth.com/placeholder.svg'}
                            className="w-14 h-14 rounded-xl border border-border/50 shadow-lg"
                            alt=""
                            loading="lazy"
                        />
                        <div className="min-w-0 flex-1">
                            <DialogTitle className="text-xl flex items-center gap-2">
                                {previewProject?.title}
                                {previewProject?.project_id === 'oMskb4v5' && (
                                    <Badge className="bg-gradient-to-r from-violet-500 to-blue-500 border-0">
                                        <Sparkles className="h-3 w-3 mr-1" />
                                        Empfohlen
                                    </Badge>
                                )}
                            </DialogTitle>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {previewProject?.description}
                            </p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 min-h-0 custom-scrollbar">
                        {previewProject?.gallery && previewProject.gallery.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {previewProject.gallery.map((img, idx) => (
                                    <div
                                        key={idx}
                                        className="relative group rounded-xl overflow-hidden border border-border/50 bg-muted aspect-video cursor-zoom-in shadow-lg transition-all hover:shadow-2xl"
                                        onClick={() => setLightboxIndex(idx)}
                                    >
                                        <img
                                            src={img.url}
                                            alt={img.title || 'Galerie Bild'}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        {img.title && (
                                            <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/70 backdrop-blur-md text-xs text-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                {img.title}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState icon={ImageIcon} title="Keine Galerie-Bilder" />
                        )}
                    </div>

                    <div className="p-4 border-t border-border/50 flex justify-end gap-2 shrink-0 bg-muted/20">
                        <Button variant="ghost" onClick={() => setShowPreviewModal(false)}>
                            Schließen
                        </Button>
                        <Button
                            onClick={() => {
                                setShowPreviewModal(false);
                                if (previewProject) openInstall(previewProject);
                            }}
                            disabled={installedIds.has(previewProject?.project_id || '')}
                            className={cn(
                                "gap-1.5",
                                installedIds.has(previewProject?.project_id || '') && 'bg-emerald-600 hover:bg-emerald-700'
                            )}
                        >
                            {installedIds.has(previewProject?.project_id || '') ? (
                                <>
                                    <Check className="h-4 w-4" />
                                    Installiert
                                </>
                            ) : (
                                <>
                                    <Plus className="h-4 w-4" />
                                    Installieren
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Lightbox */}
            <Lightbox
                project={previewProject}
                index={lightboxIndex}
                onClose={() => setLightboxIndex(-1)}
                onNext={handleNextImage}
                onPrev={handlePrevImage}
            />

            {/* Dependency Modal */}
            {showDependencyModal && (
                <ModDependencyDialog
                    mods={pendingDependencies}
                    onConfirm={handleDependencyConfirm}
                    onCancel={() => setShowDependencyModal(false)}
                />
            )}

            {/* Global Styles */}
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(-20px, -20px); }
                }
                @keyframes float-delayed {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(20px, 20px); }
                }
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scale-in {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                @keyframes slide-up {
                    from { transform: translate(-50%, 20px); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
                .animate-float {
                    animation: float 20s ease-in-out infinite;
                }
                .animate-float-delayed {
                    animation: float-delayed 25s ease-in-out infinite;
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
                .animate-scale-in {
                    animation: scale-in 0.3s ease-out;
                }
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: hsl(var(--muted));
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: hsl(var(--primary) / 0.3);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: hsl(var(--primary) / 0.5);
                }
            `}</style>
        </div>
    );
}

export default Search;