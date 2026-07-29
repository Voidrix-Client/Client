import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../context/NotificationContext';
import ExtensionSlot from '../components/Extensions/ExtensionSlot';
import { isFeatureEnabled } from '../config/featureFlags';
import { ToggleSwitch } from '../components/common/inputs';
import { ConfirmDialog } from '../components/modals';
import { VOIDRIX_THEME_PRESETS } from '../config/themes';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { ScrollArea } from '../components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { cn } from '../lib/utils';
import {
    Save, FolderOpen, Download, Trash2, Check, Loader2, RefreshCw, Info,
    FlaskConical, Search, Plus, X, Coffee, Globe,
    RotateCcw, Palette, Award, Gem, Gamepad2, Gauge,
    Star, Bug, Paintbrush, Play, PartyPopper, Sparkle,
    HardDrive, Calendar, ChevronRight, Sparkles, TrendingUp,
    Image as ImageIcon
} from 'lucide-react';

// ============================================
// THEME & LANGUAGE CATALOGUES
// ============================================
const THEME_PRESETS = [
    { value: 'voidrix_forest', label: 'Forest' },
    { value: 'voidrix_horizon', label: 'Horizon' },
    { value: 'voidrix_night', label: 'Night' },
    { value: 'voidrix_lava', label: 'Lava' },
    { value: 'voidrix_water', label: 'Water' },
    { value: 'voidrix_light', label: 'Light' },
    { value: 'voidrix_cyberpunk', label: 'Cyberpunk' },
    { value: 'voidrix_neon', label: 'Neon' },
    { value: 'voidrix_aurora', label: 'Aurora' },
    { value: 'voidrix_sunset', label: 'Sunset' },
    { value: 'voidrix_twilight', label: 'Twilight' },
    { value: 'voidrix_mint', label: 'Mint' },
];

const LANGUAGES = [
    { value: 'de_de', native: 'Deutsch', english: 'German (Germany)' },
    { value: 'de_ch', native: 'Deutsch (Schweiz)', english: 'German (Switzerland)' },
    { value: 'en_us', native: 'English (US)', english: 'English (United States)' },
    { value: 'en_uk', native: 'English (UK)', english: 'English (United Kingdom)' },
    { value: 'es_es', native: 'Español', english: 'Spanish' },
    { value: 'fr_fr', native: 'Français', english: 'French' },
    { value: 'it_it', native: 'Italiano', english: 'Italian' },
    { value: 'pl_pl', native: 'Polski', english: 'Polish' },
    { value: 'pt_br', native: 'Português (Brasil)', english: 'Portuguese (Brazil)' },
    { value: 'pt_pt', native: 'Português', english: 'Portuguese (Portugal)' },
    { value: 'ro_ro', native: 'Română', english: 'Romanian' },
    { value: 'ru_ru', native: 'Русский', english: 'Russian' },
    { value: 'sk_sk', native: 'Slovenčina', english: 'Slovak' },
    { value: 'sl_si', native: 'Slovenščina', english: 'Slovenian' },
    { value: 'sv_se', native: 'Svenska', english: 'Swedish' },
];

// ============================================
// LAYOUT PRIMITIVES
// ============================================
const SettingsGroup = memo(({ title, description, children, className }: any) => (
    <section className={cn('mb-8 last:mb-2', className)}>
        {title && <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>}
        {description && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>}
        <div className={cn(title && 'mt-4')}>{children}</div>
    </section>
));
SettingsGroup.displayName = 'SettingsGroup';

const SettingRow = memo(({ title, description, note, children }: any) => (
    <div className="flex items-start justify-between gap-6 py-3.5">
        <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            {description && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>}
            {note && <p className="mt-1 text-xs text-muted-foreground/80">{note}</p>}
        </div>
        {children && <div className="shrink-0 pt-0.5">{children}</div>}
    </div>
));
SettingRow.displayName = 'SettingRow';

const RadioDot = memo(({ active }: { active: boolean }) => (
    <span
        className={cn(
            'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors',
            active ? 'border-primary' : 'border-muted-foreground/50'
        )}
    >
        {active && <span className="h-2 w-2 rounded-full bg-primary" />}
    </span>
));
RadioDot.displayName = 'RadioDot';

// ============================================
// THEME PREVIEW CARD
// ============================================
const ThemeCard = memo(({ preset, label, active, onSelect }: any) => (
    <button
        type="button"
        onClick={onSelect}
        aria-pressed={active}
        className={cn(
            'group overflow-hidden rounded-xl border text-left transition-all',
            active ? 'border-primary ring-1 ring-primary/40' : 'border-border hover:border-primary/40'
        )}
    >
        <div className="p-4" style={{ backgroundColor: preset.backgroundColor }}>
            <div className="flex items-center gap-2.5 rounded-lg p-3" style={{ backgroundColor: preset.surfaceColor }}>
                <div className="h-7 w-7 shrink-0 rounded-md" style={{ backgroundColor: preset.primaryColor }} />
                <div className="flex-1 space-y-1.5">
                    <div className="h-2 rounded-full" style={{ backgroundColor: preset.textOnSurface, opacity: 0.75 }} />
                    <div className="h-2 w-2/3 rounded-full" style={{ backgroundColor: preset.textOnSurface, opacity: 0.4 }} />
                </div>
            </div>
        </div>
        <div className="flex items-center gap-2 bg-card px-3 py-2.5">
            <RadioDot active={active} />
            <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
    </button>
));
ThemeCard.displayName = 'ThemeCard';

// ============================================
// UPDATE CARD
// ============================================
const UpdateInfoCard = memo(({ updateInfo, isDownloading, downloadProgress, downloadedFile, onDownload, onInstall }: any) => {
    const latestVersion = updateInfo?.latestVersion || updateInfo?.version || 'Unbekannt';
    const currentVersion = updateInfo?.currentVersion || 'Unbekannt';
    const releaseNotes = updateInfo?.releaseNotes || updateInfo?.changelog || updateInfo?.body || '';
    const releaseDate = updateInfo?.releaseDate || updateInfo?.publishedAt || null;
    const updateSize = updateInfo?.size || null;
    const isMajorUpdate = updateInfo?.major || (latestVersion.split('.')[0] !== currentVersion.split('.')[0]);

    const changelogItems = useMemo(() => {
        if (!releaseNotes) return [];
        return releaseNotes
            .split('\n')
            .filter((l: string) => l.trim())
            .map((line: string) => {
                const trimmed = line.trim().replace(/^[-*•]\s*/, '');
                const lower = trimmed.toLowerCase();
                if (lower.includes('fix') || lower.includes('bug') || lower.includes('behoben')) return { type: 'fix', text: trimmed };
                if (lower.includes('neu') || lower.includes('new') || lower.includes('feature') || lower.includes('add')) return { type: 'feature', text: trimmed };
                if (lower.includes('verbesser') || lower.includes('improve') || lower.includes('optimier')) return { type: 'improvement', text: trimmed };
                if (lower.includes('design') || lower.includes('ui') || lower.includes('style')) return { type: 'design', text: trimmed };
                return { type: 'other', text: trimmed };
            })
            .slice(0, 6);
    }, [releaseNotes]);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'feature': return <Sparkles className="h-3.5 w-3.5 shrink-0 text-violet-400" />;
            case 'fix': return <Bug className="h-3.5 w-3.5 shrink-0 text-rose-400" />;
            case 'improvement': return <TrendingUp className="h-3.5 w-3.5 shrink-0 text-emerald-400" />;
            case 'design': return <Paintbrush className="h-3.5 w-3.5 shrink-0 text-purple-400" />;
            default: return <Check className="h-3.5 w-3.5 shrink-0 text-primary/60" />;
        }
    };

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    const formatSize = (size: number) => {
        if (!size) return null;
        const mb = size / 1024 / 1024;
        return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(size / 1024).toFixed(0)} KB`;
    };

    if (!updateInfo?.needsUpdate) return null;

    return (
        <div className="overflow-hidden rounded-xl border border-primary/30 bg-primary/5">
            <div className="p-4">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
                            <PartyPopper className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
                                Update verfügbar
                                {isMajorUpdate && (
                                    <Badge variant="secondary" className="gap-1 text-[10px]">
                                        <Star className="h-3 w-3" />
                                        Major
                                    </Badge>
                                )}
                            </h3>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="outline" className="border-emerald-500/40 text-emerald-400">v{latestVersion}</Badge>
                                <ChevronRight className="h-3 w-3" />
                                <span>v{currentVersion}</span>
                                {releaseDate && (
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {formatDate(releaseDate)}
                                    </span>
                                )}
                                {updateSize && (
                                    <span className="flex items-center gap-1">
                                        <HardDrive className="h-3 w-3" />
                                        {formatSize(updateSize)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex shrink-0 gap-2">
                        {!downloadedFile && !isDownloading && (
                            <Button onClick={onDownload} size="sm" className="h-8">
                                <Download className="mr-1.5 h-3.5 w-3.5" />
                                Download
                            </Button>
                        )}
                        {downloadedFile && (
                            <Button onClick={onInstall} size="sm" className="h-8">
                                <Play className="mr-1.5 h-3.5 w-3.5" />
                                Installieren
                            </Button>
                        )}
                    </div>
                </div>

                {isDownloading && (
                    <div className="mb-3">
                        <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                                Download läuft...
                            </span>
                            <span className="font-mono font-semibold text-primary">{Math.round(downloadProgress)}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${downloadProgress}%` }} />
                        </div>
                    </div>
                )}

                {changelogItems.length > 0 && (
                    <>
                        <Separator className="my-3" />
                        <h4 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            <Sparkle className="h-3 w-3 text-primary" />
                            Was ist neu?
                        </h4>
                        <div className="max-h-52 space-y-1.5 overflow-y-auto pr-1">
                            {changelogItems.map((item: any, idx: number) => (
                                <div key={idx} className="flex items-start gap-2 rounded-lg border border-border bg-card/50 p-2">
                                    <div className="mt-0.5">{getTypeIcon(item.type)}</div>
                                    <span className="text-xs leading-relaxed text-foreground">{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
});
UpdateInfoCard.displayName = 'UpdateInfoCard';

// ============================================
// SMALL ITEM COMPONENTS
// ============================================
const JavaRuntimeItem = memo(({ runtime, activePath, onSelect, onDelete }: any) => (
    <div className="group flex items-center justify-between rounded-lg border border-border bg-card/50 p-2.5 transition-colors hover:border-primary/30">
        <div className="mr-3 min-w-0 flex-1">
            <p className="flex items-center gap-1.5 truncate text-sm text-foreground">
                <Coffee className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                {runtime.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">{runtime.path}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
            {activePath === runtime.path ? (
                <Badge variant="outline" className="border-emerald-500/40 text-xs text-emerald-400">
                    <Check className="mr-0.5 h-3 w-3" /> Aktiv
                </Badge>
            ) : (
                <Button variant="outline" size="sm" onClick={() => onSelect(runtime.path)} className="h-7 text-xs">
                    Auswählen
                </Button>
            )}
            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => onDelete(runtime.dirPath)}
            >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
            </Button>
        </div>
    </div>
));
JavaRuntimeItem.displayName = 'JavaRuntimeItem';

const AutoInstallModItem = memo(({ mod, metadata, onRemove }: any) => (
    <div className="group flex items-center justify-between rounded-lg border border-border bg-card/50 px-3 py-2 transition-colors hover:border-primary/30">
        <div className="min-w-0">
            <p className="flex items-center gap-1.5 truncate text-sm text-foreground">
                <Gem className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                {metadata[mod] || mod}
            </p>
            <code className="text-xs text-muted-foreground">{mod}</code>
        </div>
        <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(mod)}
            className="h-7 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
        >
            <X className="h-3.5 w-3.5" />
        </Button>
    </div>
));
AutoInstallModItem.displayName = 'AutoInstallModItem';

const CloudProviderCard = memo(({ provider, status, onLogin, onLogout }: any) => (
    <div className={cn('rounded-xl border p-4 transition-all', status?.loggedIn ? 'border-primary/30 bg-primary/5' : 'border-border bg-card/50 hover:border-primary/30')}>
        <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">{provider.name}</span>
            {status?.loggedIn && <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />}
        </div>
        {status?.loggedIn ? (
            <div>
                <p className="truncate text-sm text-foreground">{status.user?.name}</p>
                <p className="mb-3 truncate text-xs text-muted-foreground">{status.user?.email}</p>
                <Button variant="destructive" size="sm" className="h-8 w-full text-xs" onClick={() => onLogout(provider.id)}>
                    Abmelden
                </Button>
            </div>
        ) : (
            <Button size="sm" className="h-8 w-full text-xs" onClick={() => onLogin(provider.id)}>
                Anmelden
            </Button>
        )}
    </div>
));
CloudProviderCard.displayName = 'CloudProviderCard';

const MaintenanceCard = memo(({ title, description, features, buttonText, icon: Icon, variant, onAction }: any) => {
    const isDangerous = variant === 'dangerous';
    return (
        <div className={cn('rounded-xl border p-4', isDangerous ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-card/50')}>
            <div className="mb-2 flex items-center gap-2">
                <Icon className={cn('h-4 w-4 shrink-0', isDangerous ? 'text-destructive' : 'text-primary')} />
                <h3 className={cn('text-sm font-medium', isDangerous && 'text-destructive')}>{title}</h3>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">{description}</p>
            {features && (
                <div className="mb-3 space-y-1">
                    {features.map((feature: string, i: number) => (
                        <p key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Check className="h-3 w-3 shrink-0 text-primary/70" /> {feature}
                        </p>
                    ))}
                </div>
            )}
            <Button variant={isDangerous ? 'destructive' : 'secondary'} size="sm" className="h-8 w-full text-xs" onClick={onAction}>
                <Icon className="mr-1.5 h-3.5 w-3.5" />
                {buttonText}
            </Button>
        </div>
    );
});
MaintenanceCard.displayName = 'MaintenanceCard';

// ============================================
// MAIN SETTINGS PAGE
// ============================================
function Settings() {
    const { t, i18n } = useTranslation();
    const { addNotification } = useNotification();

    const [settings, setSettings] = useState({
        javaPath: '',
        voidrixTheme: 'voidrix_default',
        voidrixUI: true,
        instancesPath: '',
        minMemory: 1024,
        maxMemory: 4096,
        resolutionWidth: 1920,
        resolutionHeight: 1080,
        autoUploadLogs: true,
        showDisabledFeatures: false,
        optimization: false,
        focusMode: false,
        enableAutoInstallMods: false,
        autoInstallMods: [] as string[],
        language: 'de_de',
        startPage: 'dashboard',
        javaProfile: 'default',
        minimizeToTray: false,
        lowGraphicsMode: false,
        legacyGpuSupport: false,
        cloudBackupSettings: {
            enabled: false,
            provider: 'GOOGLE_DRIVE',
            autoRestore: false
        },
        theme: {} as { bgMedia?: { url: string; type: string }; bgOverlay?: number; [key: string]: any }
    });

    const [cloudStatus, setCloudStatus] = useState<any>({
        GOOGLE_DRIVE: { loggedIn: false, user: null },
        DROPBOX: { loggedIn: false, user: null }
    });

    const [activeCategory, setActiveCategory] = useState('appearance');
    const [languageSearch, setLanguageSearch] = useState('');
    const [showSoftResetModal, setShowSoftResetModal] = useState(false);
    const [showFactoryResetModal, setShowFactoryResetModal] = useState(false);
    const [showRestartModal, setShowRestartModal] = useState(false);
    const [isInstallingJava, setIsInstallingJava] = useState(false);
    const [javaInstallProgress, setJavaInstallProgress] = useState<any>(null);
    const [showJavaModal, setShowJavaModal] = useState(false);
    const [installedRuntimes, setInstalledRuntimes] = useState<any[]>([]);
    const [autoInstallModsInput, setAutoInstallModsInput] = useState('');
    const [autoInstallModsSearchResults, setAutoInstallModsSearchResults] = useState<any[]>([]);
    const [autoInstallModsMetadata, setAutoInstallModsMetadata] = useState<Record<string, string>>({});
    const [autoInstallModsListSearch, setAutoInstallModsListSearch] = useState('');
    const [updateInfo, setUpdateInfo] = useState<any>(null);
    const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
    const [isDownloadingUpdate, setIsDownloadingUpdate] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [downloadedFilePath, setDownloadedFilePath] = useState<string | null>(null);
    const [testVersion, setTestVersion] = useState('');
    const [selectedResolutionPreset, setSelectedResolutionPreset] = useState('1080p (Full HD)');
    const [selectedRamPreset, setSelectedRamPreset] = useState('4096');

    const hasUnsavedChanges = useRef(false);
    const initialSettingsRef = useRef<any>(null);

    const activeTheme = settings.voidrixTheme === 'voidrix_default' ? 'voidrix_forest' : settings.voidrixTheme;

    const filteredAutoInstallMods = useMemo(() => {
        const mods = settings.autoInstallMods || [];
        if (!autoInstallModsListSearch) return mods;
        const searchLower = autoInstallModsListSearch.toLowerCase();
        return mods.filter(mod => {
            const modName = autoInstallModsMetadata[mod] || mod;
            return modName.toLowerCase().includes(searchLower) || mod.toLowerCase().includes(searchLower);
        });
    }, [settings.autoInstallMods, autoInstallModsMetadata, autoInstallModsListSearch]);

    const filteredLanguages = useMemo(() => {
        const query = languageSearch.trim().toLowerCase();
        if (!query) return LANGUAGES;
        return LANGUAGES.filter(l =>
            l.native.toLowerCase().includes(query) || l.english.toLowerCase().includes(query)
        );
    }, [languageSearch]);

    const ramOptions = useMemo(() => [
        { value: '1024', label: '1 GB' },
        { value: '2048', label: '2 GB' },
        { value: '4096', label: '4 GB' },
        { value: '6144', label: '6 GB' },
        { value: '8192', label: '8 GB' },
        { value: '12288', label: '12 GB' },
        { value: '16384', label: '16 GB' },
        { value: 'custom', label: 'Custom' }
    ], []);

    const resolutionOptions = useMemo(() => [
        { value: '720p (HD)', label: '1280x720 (HD)', width: 1280, height: 720 },
        { value: '1080p (Full HD)', label: '1920x1080 (Full HD)', width: 1920, height: 1080 },
        { value: '1440p (2K)', label: '2560x1440 (2K)', width: 2560, height: 1440 },
        { value: 'custom', label: 'Custom', width: 0, height: 0 }
    ], []);

    const cloudProviders = useMemo(() => [
        { id: 'GOOGLE_DRIVE', name: 'Google Drive' },
        { id: 'DROPBOX', name: 'Dropbox' }
    ], []);

    const saveSettings = useCallback(async (newSettings: any, silent = false) => {
        if (!window.electronAPI?.saveSettings) return;
        const res = await window.electronAPI.saveSettings(newSettings);
        if (res.success) {
            initialSettingsRef.current = newSettings;
            hasUnsavedChanges.current = false;
            if (!silent) addNotification(t('settings.saved_success'), 'success');
        } else {
            addNotification(t('settings.save_failed'), 'error');
        }
    }, [addNotification, t]);

    const handleChange = useCallback((key: string, value: any) => {
        if (key === 'legacyGpuSupport' && value === true) {
            setShowRestartModal(true);
            return;
        }
        setSettings(prev => {
            const newSettings = { ...prev, [key]: value };
            if (initialSettingsRef.current) {
                hasUnsavedChanges.current = true;
            }
            saveSettings(newSettings, true);
            return newSettings;
        });
    }, [saveSettings]);

    const handleLanguageSelect = useCallback((value: string) => {
        handleChange('language', value);
        i18n.changeLanguage(value);
        localStorage.setItem('voidrix.language', value);
    }, [handleChange, i18n]);

    const handleThemeSelect = useCallback((value: string) => {
        handleChange('voidrixTheme', value);
        if (!settings.voidrixUI) handleChange('voidrixUI', true);
    }, [handleChange, settings.voidrixUI]);

    const handleThemeFieldChange = useCallback((key: string, value: any) => {
        handleChange('theme', { ...settings.theme, [key]: value });
    }, [handleChange, settings.theme]);

    const handleSelectBackground = useCallback(async () => {
        if (!window.electronAPI?.selectBackgroundMedia) return;
        try {
            const res = await window.electronAPI.selectBackgroundMedia();
            if (res?.success && res.url) {
                handleThemeFieldChange('bgMedia', { url: res.url, type: res.type });
            }
        } catch (e) {
            console.error('Failed to select background', e);
        }
    }, [handleThemeFieldChange]);

    const handleRemoveBackground = useCallback(async () => {
        const url = settings.theme?.bgMedia?.url;
        try {
            if (url && window.electronAPI?.deleteBackgroundMedia) {
                await window.electronAPI.deleteBackgroundMedia(url);
            }
        } catch (e) {
            console.error('Failed to delete background', e);
        }
        handleThemeFieldChange('bgMedia', { url: '', type: 'none' });
    }, [settings.theme, handleThemeFieldChange]);

    const handleResolutionPresetChange = useCallback((value: string) => {
        setSelectedResolutionPreset(value);
        const preset = resolutionOptions.find(opt => opt.value === value);
        if (preset && preset.value !== 'custom') {
            handleChange('resolutionWidth', preset.width);
            handleChange('resolutionHeight', preset.height);
        }
    }, [resolutionOptions, handleChange]);

    const handleRamPresetChange = useCallback((value: string) => {
        setSelectedRamPreset(value);
        if (value !== 'custom') {
            handleChange('maxMemory', parseInt(value, 10));
        }
    }, [handleChange]);

    const loadCloudStatus = useCallback(async () => {
        if (!window.electronAPI?.cloudGetStatus) return;
        try {
            const status = await window.electronAPI.cloudGetStatus();
            setCloudStatus(status);
        } catch (e) { }
    }, []);

    const loadSettings = useCallback(async () => {
        if (!window.electronAPI?.getSettings) return;
        const res = await window.electronAPI.getSettings();
        if (res.success) {
            const loadedSettings = { ...settings, ...res.settings };
            setSettings(loadedSettings);
            initialSettingsRef.current = loadedSettings;
            i18n.changeLanguage(loadedSettings.language || 'de_de');
        }
        loadCloudStatus();
    }, []);

    const loadJavaRuntimes = useCallback(async () => {
        if (!window.electronAPI?.getJavaRuntimes) return;
        try {
            const res = await window.electronAPI.getJavaRuntimes();
            if (res.success) setInstalledRuntimes(res.runtimes);
        } catch (err) { }
    }, []);

    const handleManualSave = useCallback(() => saveSettings(settings, false), [settings, saveSettings]);

    const handleBrowseJava = useCallback(async () => {
        if (!window.electronAPI?.openFileDialog) return;
        const result = await window.electronAPI.openFileDialog({
            properties: ['openFile'],
            filters: [{ name: 'Java Executable', extensions: ['exe', 'bin'] }]
        });
        if (!result.canceled && result.filePaths?.length) {
            handleChange('javaPath', result.filePaths[0]);
        }
    }, [handleChange]);

    const handleInstallJava = useCallback(async (version: number) => {
        if (!window.electronAPI?.installJava) return;
        setShowJavaModal(false);
        setIsInstallingJava(true);
        try {
            const result = await window.electronAPI.installJava(String(version));
            if (result.success) {
                handleChange('javaPath', result.path);
                addNotification(`Java ${version} installiert`, 'success');
                loadJavaRuntimes();
            }
        } catch (e: any) {
            addNotification(`Fehler: ${e.message}`, 'error');
        } finally {
            setIsInstallingJava(false);
        }
    }, [addNotification, handleChange, loadJavaRuntimes]);

    const handleDeleteRuntime = useCallback(async (dirPath: string) => {
        if (!window.electronAPI?.deleteJavaRuntime) return;
        if (!confirm('Java-Version löschen?')) return;
        try {
            const res = await window.electronAPI.deleteJavaRuntime(dirPath);
            if (res.success) {
                addNotification('Java-Version gelöscht', 'success');
                loadJavaRuntimes();
            }
        } catch (e: any) { }
    }, [addNotification, loadJavaRuntimes]);

    const handleCloudLogin = useCallback(async (providerId: string) => {
        if (!window.electronAPI?.cloudLogin) return;
        try {
            const res = await window.electronAPI.cloudLogin(providerId);
            if (res.success) {
                addNotification(`Angemeldet bei ${providerId}`, 'success');
                loadCloudStatus();
            }
        } catch (e: any) { }
    }, [addNotification, loadCloudStatus]);

    const handleCloudLogout = useCallback(async (providerId: string) => {
        if (!window.electronAPI?.cloudLogout) return;
        try {
            const res = await window.electronAPI.cloudLogout(providerId);
            if (res.success) {
                addNotification(`Abgemeldet von ${providerId}`, 'success');
                loadCloudStatus();
            }
        } catch (e: any) { }
    }, [addNotification, loadCloudStatus]);

    const handleCheckUpdate = useCallback(async () => {
        if (!window.electronAPI?.checkForUpdates) return;
        setIsCheckingUpdate(true);
        setUpdateInfo(null);
        setDownloadedFilePath(null);
        try {
            const res = await window.electronAPI.checkForUpdates();
            if (res.error) {
                addNotification(`Update-Check fehlgeschlagen: ${res.error}`, 'error');
            } else {
                setUpdateInfo(res);
                if (!res.needsUpdate) addNotification('Du hast die neueste Version!', 'success');
            }
        } catch (e: any) {
            addNotification(`Fehler: ${e.message}`, 'error');
        } finally {
            setIsCheckingUpdate(false);
        }
    }, [addNotification]);

    const handleDownloadUpdate = useCallback(async () => {
        if (!window.electronAPI?.downloadUpdate || !updateInfo?.asset) return;
        setIsDownloadingUpdate(true);
        setDownloadProgress(0);
        try {
            const res = await window.electronAPI.downloadUpdate(updateInfo.asset.url, updateInfo.asset.name);
            if (res.success) {
                setDownloadedFilePath(res.path);
                addNotification('Update erfolgreich heruntergeladen!', 'success');
            } else {
                addNotification(`Download fehlgeschlagen: ${res.error}`, 'error');
            }
        } catch (e: any) {
            addNotification(`Fehler: ${e.message}`, 'error');
        } finally {
            setIsDownloadingUpdate(false);
        }
    }, [updateInfo, addNotification]);

    const handleInstallUpdate = useCallback(async () => {
        if (!window.electronAPI?.installUpdate || !downloadedFilePath) return;
        try {
            const res = await window.electronAPI.installUpdate(downloadedFilePath);
            if (!res.success) addNotification(`Installation fehlgeschlagen: ${res.error}`, 'error');
        } catch (e: any) {
            addNotification(`Fehler: ${e.message}`, 'error');
        }
    }, [downloadedFilePath, addNotification]);

    const searchModrinthMod = useCallback(async (query: string) => {
        if (!query.trim()) {
            setAutoInstallModsSearchResults([]);
            return;
        }
        try {
            const response = await window.electronAPI?.searchModrinth(query, [], { limit: 5 });
            if (response?.success) {
                setAutoInstallModsSearchResults(response.results || []);
            }
        } catch (err) { }
    }, []);

    const addAutoInstallMod = useCallback(async () => {
        const input = autoInstallModsInput.trim();
        if (!input) return;
        if (settings.autoInstallMods.includes(input)) {
            addNotification('Mod bereits in Liste', 'warning');
            return;
        }

        handleChange('autoInstallMods', [...settings.autoInstallMods, input]);
        setAutoInstallModsMetadata(prev => ({ ...prev, [input]: input }));
        setAutoInstallModsInput('');
        setAutoInstallModsSearchResults([]);
        addNotification('Mod hinzugefügt', 'success');
    }, [autoInstallModsInput, settings.autoInstallMods, handleChange, addNotification]);

    const removeAutoInstallMod = useCallback((modId: string) => {
        handleChange('autoInstallMods', settings.autoInstallMods.filter(m => m !== modId));
        addNotification('Mod entfernt', 'success');
    }, [settings.autoInstallMods, handleChange, addNotification]);

    const handleConfirmRestart = useCallback(() => {
        setSettings(prev => ({ ...prev, legacyGpuSupport: true }));
        window.electronAPI?.restartApp();
    }, []);

    const handleSoftReset = useCallback(async () => {
        if (!window.electronAPI?.softReset) return;
        await window.electronAPI.softReset();
    }, []);

    const handleFactoryReset = useCallback(async () => {
        if (!window.electronAPI?.factoryReset) return;
        await window.electronAPI.factoryReset();
    }, []);

    const handleSetTestVersion = useCallback(async () => {
        if (!window.electronAPI?.setTestVersion) return;
        try {
            const res = await window.electronAPI.setTestVersion(testVersion);
            if (res.success) {
                addNotification(`Test-Version gesetzt auf ${res.currentVersion}`, 'success');
                handleCheckUpdate();
            }
        } catch (e: any) { }
    }, [testVersion, handleCheckUpdate, addNotification]);

    // Effects
    useEffect(() => {
        const currentRam = settings.maxMemory.toString();
        const isPreset = ramOptions.some(opt => opt.value === currentRam);
        setSelectedRamPreset(isPreset ? currentRam : 'custom');
    }, [settings.maxMemory, ramOptions]);

    useEffect(() => {
        const preset = resolutionOptions.find(opt =>
            opt.width === settings.resolutionWidth && opt.height === settings.resolutionHeight
        );
        setSelectedResolutionPreset(preset?.value || 'custom');
    }, [settings.resolutionWidth, settings.resolutionHeight, resolutionOptions]);

    useEffect(() => {
        if (window.electronAPI?.onJavaProgress) {
            return window.electronAPI.onJavaProgress((data: any) => setJavaInstallProgress(data));
        }
    }, []);

    useEffect(() => {
        if (window.electronAPI?.onUpdaterProgress) {
            return window.electronAPI.onUpdaterProgress((progress: number) => setDownloadProgress(progress));
        }
    }, []);

    useEffect(() => {
        loadSettings();
        loadJavaRuntimes();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            if (hasUnsavedChanges.current) saveSettings(settings, true);
        }, 5000);
        return () => clearInterval(interval);
    }, [settings, saveSettings]);

    // ============================================
    // CATEGORY PANELS
    // ============================================
    const appearancePanel = (
        <>
            <SettingsGroup
                title={t('settings.cat.color_theme', 'Color theme')}
                description={t('settings.cat.color_theme_desc', 'Select your preferred color theme for Voidrix Client.')}
            >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {THEME_PRESETS.map(preset => (
                        <ThemeCard
                            key={preset.value}
                            preset={VOIDRIX_THEME_PRESETS[preset.value]}
                            label={preset.label}
                            active={activeTheme === preset.value}
                            onSelect={() => handleThemeSelect(preset.value)}
                        />
                    ))}
                </div>
            </SettingsGroup>

            <SettingsGroup
                title={t('settings.cat.background', 'Background')}
                description={t('settings.cat.background_desc', 'Set a custom image or video as the launcher background.')}
            >
                <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
                    <button
                        type="button"
                        onClick={handleSelectBackground}
                        className="group relative aspect-video overflow-hidden rounded-xl border-2 border-dashed border-border transition-colors hover:border-primary/50 hover:bg-primary/5"
                    >
                        {settings.theme?.bgMedia?.url ? (
                            <>
                                {settings.theme.bgMedia.type === 'video' ? (
                                    <video
                                        key={settings.theme.bgMedia.url}
                                        src={`app-media:///${settings.theme.bgMedia.url.replace(/\\/g, '/')}`}
                                        className="absolute inset-0 h-full w-full object-cover opacity-60 transition-opacity group-hover:opacity-80"
                                        autoPlay
                                        muted
                                        loop
                                        playsInline
                                    />
                                ) : (
                                    <img
                                        key={settings.theme.bgMedia.url}
                                        src={`app-media:///${settings.theme.bgMedia.url.replace(/\\/g, '/')}`}
                                        className="absolute inset-0 h-full w-full object-cover opacity-60 transition-opacity group-hover:opacity-80"
                                        alt=""
                                    />
                                )}
                                <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-background/80 py-1.5 text-xs font-medium text-foreground backdrop-blur-sm">
                                    <ImageIcon className="h-3.5 w-3.5" />
                                    {t('settings.cat.background_change', 'Change')}
                                </span>
                            </>
                        ) : (
                            <div className="flex h-full flex-col items-center justify-center gap-2 px-4">
                                <ImageIcon className="h-6 w-6 text-muted-foreground/60" />
                                <p className="text-center text-xs text-muted-foreground">
                                    {t('settings.cat.background_empty', 'Click to select an image or video')}
                                </p>
                            </div>
                        )}
                    </button>

                    <div className="space-y-4">
                        {settings.theme?.bgMedia?.url ? (
                            <>
                                <div>
                                    <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                                        <span>{t('settings.cat.background_overlay', 'Overlay intensity')}</span>
                                        <span className="font-mono font-semibold text-foreground">
                                            {Math.round((settings.theme?.bgOverlay ?? 0.4) * 100)}%
                                        </span>
                                    </div>
                                    <Slider
                                        min={0}
                                        max={100}
                                        step={5}
                                        value={[Math.round((settings.theme?.bgOverlay ?? 0.4) * 100)]}
                                        onValueChange={(v) => handleThemeFieldChange('bgOverlay', v[0] / 100)}
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRemoveBackground}
                                    className="h-8 gap-1.5 text-destructive hover:text-destructive"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    {t('settings.cat.background_remove', 'Remove background')}
                                </Button>
                            </>
                        ) : (
                            <p className="text-sm leading-relaxed text-muted-foreground">
                                {t('settings.cat.background_hint', 'Images or short videos work best. The background is dimmed behind an overlay so text stays readable.')}
                            </p>
                        )}
                    </div>
                </div>
            </SettingsGroup>

            <SettingsGroup title={t('settings.cat.interface', 'Interface')}>
                <div className="divide-y divide-border">
                    <SettingRow
                        title={t('settings.cat.advanced_rendering', 'Advanced rendering')}
                        description={t('settings.cat.advanced_rendering_desc', 'Enables animations and glass effects. May cost performance on weaker hardware.')}
                    >
                        <ToggleSwitch checked={settings.voidrixUI} onChange={(v: boolean) => handleChange('voidrixUI', v)} />
                    </SettingRow>

                    <SettingRow
                        title={t('settings.cat.low_graphics', 'Low graphics mode')}
                        description={t('settings.cat.low_graphics_desc', 'Reduces visual effects for better performance.')}
                    >
                        <ToggleSwitch checked={settings.lowGraphicsMode} onChange={(v: boolean) => handleChange('lowGraphicsMode', v)} />
                    </SettingRow>

                    <SettingRow
                        title={t('settings.cat.start_page', 'Start page')}
                        description={t('settings.general.startup_page_desc')}
                    >
                        <Select value={settings.startPage} onValueChange={(v) => handleChange('startPage', v)}>
                            <SelectTrigger className="h-9 w-[180px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="dashboard">{t('common.dashboard')}</SelectItem>
                                <SelectItem value="library">{t('common.library')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </SettingRow>

                    <SettingRow
                        title={t('settings.cat.focus_mode', 'Focus mode')}
                        description={t('settings.cat.focus_mode_desc', 'Hides distractions and pauses background animations.')}
                    >
                        <ToggleSwitch checked={settings.focusMode} onChange={(v: boolean) => handleChange('focusMode', v)} />
                    </SettingRow>
                </div>
            </SettingsGroup>
        </>
    );

    const languagePanel = (
        <SettingsGroup
            title={t('settings.cat.language', 'Language')}
            description={t('settings.cat.language_desc', 'Choose your preferred language. Untranslated content is shown in English.')}
        >
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <p className="text-sm leading-relaxed text-foreground">
                    {t('settings.cat.language_warning', 'The client is not fully translated yet. For some languages parts will stay in English.')}
                </p>
            </div>

            <div className="relative mb-3">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={languageSearch}
                    onChange={(e) => setLanguageSearch(e.target.value)}
                    placeholder={t('settings.cat.language_search', 'Search for a language...')}
                    className="h-10 pl-9"
                />
            </div>

            <div className="space-y-1">
                {filteredLanguages.map(language => {
                    const active = settings.language === language.value;
                    return (
                        <button
                            key={language.value}
                            type="button"
                            onClick={() => handleLanguageSelect(language.value)}
                            aria-pressed={active}
                            className={cn(
                                'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors',
                                active ? 'border-primary/50 bg-primary/10' : 'border-transparent bg-muted/40 hover:bg-muted'
                            )}
                        >
                            <RadioDot active={active} />
                            <span className="flex-1 truncate text-sm font-medium text-foreground">{language.native}</span>
                            <span className="shrink-0 text-sm text-muted-foreground">{language.english}</span>
                        </button>
                    );
                })}
                {filteredLanguages.length === 0 && (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                        {t('settings.cat.language_empty', 'No language found.')}
                    </p>
                )}
            </div>
        </SettingsGroup>
    );

    const javaPanel = (
        <>
            <SettingsGroup
                title={t('settings.java.title')}
                description={t('settings.cat.java_desc', 'Choose which Java installation is used to launch Minecraft.')}
            >
                <Label className="mb-1.5 block text-sm font-semibold text-foreground">{t('settings.java.path')}</Label>
                <div className="flex gap-2">
                    <Input value={settings.javaPath || ''} readOnly placeholder="Automatisch erkannt" className="h-9 flex-1 text-sm" />
                    <Button variant="outline" size="sm" onClick={handleBrowseJava} className="h-9 gap-1.5">
                        <FolderOpen className="h-3.5 w-3.5" />
                        {t('settings.cat.browse', 'Browse')}
                    </Button>
                    <Button size="sm" onClick={() => setShowJavaModal(true)} disabled={isInstallingJava} className="h-9 gap-1.5">
                        {isInstallingJava ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                        {t('settings.cat.install', 'Install')}
                    </Button>
                </div>
                {isInstallingJava && javaInstallProgress && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-primary">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        {javaInstallProgress.step}
                    </p>
                )}
            </SettingsGroup>

            <SettingsGroup title={t('settings.java.installed_versions')}>
                {installedRuntimes.length > 0 ? (
                    <>
                        <div className="mb-2 flex justify-end">
                            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => window.electronAPI?.openJavaFolder?.()}>
                                {t('settings.cat.open_folder', 'Open folder')}
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {installedRuntimes.map((runtime: any) => (
                                <JavaRuntimeItem
                                    key={runtime.dirPath}
                                    runtime={runtime}
                                    activePath={settings.javaPath}
                                    onSelect={(path: string) => handleChange('javaPath', path)}
                                    onDelete={handleDeleteRuntime}
                                />
                            ))}
                        </div>
                    </>
                ) : (
                    <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                        {t('settings.cat.no_java', 'No Java version installed yet.')}
                    </p>
                )}
            </SettingsGroup>
        </>
    );

    const instancePanel = (
        <>
            <SettingsGroup
                title={t('settings.resolution.title')}
                description={t('settings.cat.resolution_desc', 'Window size Minecraft is launched with.')}
            >
                <div className="divide-y divide-border">
                    <SettingRow title={t('settings.resolution.preset')}>
                        <Select value={selectedResolutionPreset} onValueChange={handleResolutionPresetChange}>
                            <SelectTrigger className="h-9 w-[200px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {resolutionOptions.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </SettingRow>

                    {selectedResolutionPreset === 'custom' && (
                        <>
                            <SettingRow title={t('settings.resolution.width')}>
                                <Input
                                    type="number"
                                    value={settings.resolutionWidth}
                                    onChange={(e) => handleChange('resolutionWidth', parseInt(e.target.value) || 1920)}
                                    className="h-9 w-[200px]"
                                />
                            </SettingRow>
                            <SettingRow title={t('settings.resolution.height')}>
                                <Input
                                    type="number"
                                    value={settings.resolutionHeight}
                                    onChange={(e) => handleChange('resolutionHeight', parseInt(e.target.value) || 1080)}
                                    className="h-9 w-[200px]"
                                />
                            </SettingRow>
                        </>
                    )}
                </div>
            </SettingsGroup>

            <SettingsGroup
                title={t('settings.memory.title')}
                description={t('settings.cat.memory_desc', 'Memory allocated to each instance when it is run.')}
            >
                <div className="divide-y divide-border">
                    <SettingRow title={t('settings.memory.java_profile')}>
                        <Select value={settings.javaProfile} onValueChange={(v) => handleChange('javaProfile', v)}>
                            <SelectTrigger className="h-9 w-[200px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="default">{t('settings.ui.ram_profiles.default')}</SelectItem>
                                <SelectItem value="performance">{t('settings.ui.ram_profiles.performance')}</SelectItem>
                                <SelectItem value="low-end">{t('settings.ui.ram_profiles.low_end')}</SelectItem>
                                <SelectItem value="zgc">ZGC (Java 17+)</SelectItem>
                            </SelectContent>
                        </Select>
                    </SettingRow>

                    <SettingRow title={t('settings.ui.general.max_ram')}>
                        <Select value={selectedRamPreset} onValueChange={handleRamPresetChange}>
                            <SelectTrigger className="h-9 w-[200px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {ramOptions.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </SettingRow>

                    <SettingRow title={`${t('settings.memory.min')} (MB)`}>
                        <Input
                            type="number"
                            value={settings.minMemory}
                            onChange={(e) => handleChange('minMemory', parseInt(e.target.value) || 1024)}
                            className="h-9 w-[200px]"
                        />
                    </SettingRow>
                </div>

                {selectedRamPreset === 'custom' && (
                    <div className="mt-4 rounded-xl border border-border bg-card/50 p-4">
                        <div className="mb-2 flex justify-between text-xs text-muted-foreground">
                            <span>512 MB</span>
                            <span className="font-mono font-semibold text-foreground">
                                {settings.maxMemory} MB ({(settings.maxMemory / 1024).toFixed(1)} GB)
                            </span>
                            <span>16384 MB</span>
                        </div>
                        <Slider
                            min={512}
                            max={16384}
                            step={512}
                            value={[settings.maxMemory]}
                            onValueChange={(v) => handleChange('maxMemory', v[0])}
                        />
                    </div>
                )}
            </SettingsGroup>

            <SettingsGroup title={t('settings.cat.launch_behaviour', 'Launch behaviour')}>
                <div className="divide-y divide-border">
                    <SettingRow
                        title={t('settings.cat.performance_mods', 'Performance mods')}
                        description={t('settings.cat.performance_mods_desc', 'Automatically installs optimization mods for new instances.')}
                    >
                        <ToggleSwitch checked={settings.optimization} onChange={(v: boolean) => handleChange('optimization', v)} />
                    </SettingRow>

                    <SettingRow
                        title={t('settings.cat.auto_mods', 'Auto mod installation')}
                        description={t('settings.cat.auto_mods_desc', 'Installs a fixed mod list for every new instance.')}
                    >
                        <ToggleSwitch checked={settings.enableAutoInstallMods} onChange={(v: boolean) => handleChange('enableAutoInstallMods', v)} />
                    </SettingRow>

                    <SettingRow
                        title={t('settings.cat.minimize_tray', 'Minimize to tray')}
                        description={t('settings.cat.minimize_tray_desc', 'The launcher keeps running in the background when you close the window.')}
                    >
                        <ToggleSwitch checked={settings.minimizeToTray} onChange={(v: boolean) => handleChange('minimizeToTray', v)} />
                    </SettingRow>

                    <SettingRow
                        title={t('settings.cat.legacy_gpu', 'Legacy GPU support')}
                        description={t('settings.cat.legacy_gpu_desc', 'For older graphics cards. Requires a launcher restart.')}
                    >
                        <ToggleSwitch checked={settings.legacyGpuSupport} onChange={(v: boolean) => handleChange('legacyGpuSupport', v)} />
                    </SettingRow>
                </div>
            </SettingsGroup>
        </>
    );

    const resourcePanel = (
        <>
            <SettingsGroup
                title={t('settings.cloud.title')}
                description={t('settings.cloud.desc')}
            >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {cloudProviders.map(provider => (
                        <CloudProviderCard
                            key={provider.id}
                            provider={provider}
                            status={cloudStatus[provider.id]}
                            onLogin={handleCloudLogin}
                            onLogout={handleCloudLogout}
                        />
                    ))}
                </div>

                <div className="mt-2 divide-y divide-border">
                    <SettingRow title={t('settings.cat.cloud_enable', 'Enable cloud backup')}>
                        <ToggleSwitch
                            checked={settings.cloudBackupSettings.enabled}
                            onChange={(v: boolean) => handleChange('cloudBackupSettings', { ...settings.cloudBackupSettings, enabled: v })}
                        />
                    </SettingRow>

                    {settings.cloudBackupSettings.enabled && (
                        <>
                            <SettingRow title={t('settings.cloud.default_provider')}>
                                <Select
                                    value={settings.cloudBackupSettings.provider}
                                    onValueChange={(v) => handleChange('cloudBackupSettings', { ...settings.cloudBackupSettings, provider: v })}
                                >
                                    <SelectTrigger className="h-9 w-[200px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="GOOGLE_DRIVE">Google Drive</SelectItem>
                                        <SelectItem value="DROPBOX">Dropbox</SelectItem>
                                    </SelectContent>
                                </Select>
                            </SettingRow>
                            <SettingRow title="Auto-Restore">
                                <ToggleSwitch
                                    checked={settings.cloudBackupSettings.autoRestore}
                                    onChange={(v: boolean) => handleChange('cloudBackupSettings', { ...settings.cloudBackupSettings, autoRestore: v })}
                                />
                            </SettingRow>
                        </>
                    )}
                </div>
            </SettingsGroup>

            {settings.enableAutoInstallMods && (
                <SettingsGroup
                    title={t('settings.auto_install.title')}
                    description={t('settings.auto_install.management_desc')}
                >
                    <div className="flex gap-2">
                        <Input
                            value={autoInstallModsInput}
                            onChange={(e) => { setAutoInstallModsInput(e.target.value); searchModrinthMod(e.target.value); }}
                            placeholder="Mod ID (z.B. sodium)"
                            className="h-9 flex-1"
                            onKeyDown={(e) => e.key === 'Enter' && addAutoInstallMod()}
                        />
                        <Button size="sm" onClick={addAutoInstallMod} className="h-9">
                            <Plus className="h-3.5 w-3.5" />
                        </Button>
                    </div>

                    {autoInstallModsSearchResults.length > 0 && (
                        <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-border bg-card">
                            {autoInstallModsSearchResults.map((mod: any) => (
                                <button
                                    key={mod.project_id}
                                    onClick={() => { setAutoInstallModsInput(mod.project_id); setAutoInstallModsSearchResults([]); }}
                                    className="w-full border-b border-border px-3 py-2 text-left last:border-0 hover:bg-muted"
                                >
                                    <p className="flex items-center gap-1.5 text-sm text-foreground">
                                        <Gem className="h-3 w-3 text-primary/60" />
                                        {mod.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{mod.project_id}</p>
                                </button>
                            ))}
                        </div>
                    )}

                    {settings.autoInstallMods.length > 0 && (
                        <div className="mt-3 space-y-2">
                            <Input
                                value={autoInstallModsListSearch}
                                onChange={(e) => setAutoInstallModsListSearch(e.target.value)}
                                placeholder="Filter..."
                                className="h-9"
                            />
                            {filteredAutoInstallMods.map(mod => (
                                <AutoInstallModItem
                                    key={mod}
                                    mod={mod}
                                    metadata={autoInstallModsMetadata}
                                    onRemove={removeAutoInstallMod}
                                />
                            ))}
                        </div>
                    )}
                </SettingsGroup>
            )}

            <SettingsGroup
                title={t('settings.maintenance.title')}
                description={t('settings.ui.advanced.reset_options')}
            >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <MaintenanceCard
                        title={t('settings.maintenance.soft_reset_title')}
                        description={t('settings.ui.advanced.soft_reset_desc')}
                        features={[t('settings.maintenance.soft_reset_keep')]}
                        buttonText={t('settings.maintenance.soft_reset_btn')}
                        icon={RotateCcw}
                        onAction={() => setShowSoftResetModal(true)}
                    />
                    <MaintenanceCard
                        title={t('settings.maintenance.factory_reset_title')}
                        description={t('settings.ui.advanced.factory_reset_desc')}
                        features={[t('settings.ui.advanced.not_reversible')]}
                        buttonText={t('settings.maintenance.factory_reset_btn')}
                        icon={Trash2}
                        variant="dangerous"
                        onAction={() => setShowFactoryResetModal(true)}
                    />
                </div>
            </SettingsGroup>
        </>
    );

    const updatePanel = (
        <>
            <SettingsGroup
                title={t('settings.update.title')}
                description={t('settings.cat.update_desc', 'Keep the launcher up to date.')}
            >
                <div className="flex items-center justify-between rounded-xl border border-border bg-card/50 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Award className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('settings.update.current_version')}</p>
                            <p className="font-mono text-base font-bold text-foreground">
                                {updateInfo?.currentVersion || <span className="text-sm text-muted-foreground">{t('common.loading')}</span>}
                            </p>
                        </div>
                    </div>
                    <Button onClick={handleCheckUpdate} disabled={isCheckingUpdate} variant="outline" size="sm" className="h-9">
                        {isCheckingUpdate ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
                        {isCheckingUpdate ? 'Suche...' : 'Prüfen'}
                    </Button>
                </div>

                <div className="mt-3">
                    <UpdateInfoCard
                        updateInfo={updateInfo}
                        isDownloading={isDownloadingUpdate}
                        downloadProgress={downloadProgress}
                        downloadedFile={downloadedFilePath}
                        onDownload={handleDownloadUpdate}
                        onInstall={handleInstallUpdate}
                    />

                    {updateInfo && !updateInfo.needsUpdate && updateInfo.currentVersion && (
                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
                            <Check className="mx-auto mb-1 h-5 w-5 text-emerald-400" />
                            <p className="text-sm font-medium text-foreground">{t('settings.update.latest')}</p>
                        </div>
                    )}
                </div>
            </SettingsGroup>

            <SettingsGroup title={t('settings.cat.diagnostics', 'Diagnostics')}>
                <div className="divide-y divide-border">
                    <SettingRow
                        title={t('settings.cat.upload_logs', 'Upload logs automatically')}
                        description={t('settings.cat.upload_logs_desc', 'Sends crash logs so problems can be found faster.')}
                    >
                        <ToggleSwitch checked={settings.autoUploadLogs} onChange={(v: boolean) => handleChange('autoUploadLogs', v)} />
                    </SettingRow>

                    <SettingRow
                        title={t('settings.cat.show_disabled', 'Show disabled features')}
                        description={t('settings.cat.show_disabled_desc', 'Shows features that are not finished yet.')}
                    >
                        <ToggleSwitch checked={settings.showDisabledFeatures} onChange={(v: boolean) => handleChange('showDisabledFeatures', v)} />
                    </SettingRow>
                </div>
            </SettingsGroup>

            {isFeatureEnabled('settingsDevelopmentTesting') && (
                <SettingsGroup title={t('settings.ui.advanced.test_version')}>
                    <div className="flex gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 p-3">
                        <Input value={testVersion} onChange={(e) => setTestVersion(e.target.value)} placeholder="1.0.0" className="h-9 flex-1" />
                        <Button size="sm" variant="outline" className="h-9 border-violet-500/40 text-violet-400" onClick={handleSetTestVersion}>
                            <FlaskConical className="mr-1.5 h-3.5 w-3.5" />
                            {t('settings.ui.advanced.set')}
                        </Button>
                    </div>
                </SettingsGroup>
            )}

            <ExtensionSlot name="settings.bottom" />
        </>
    );

    const categories = useMemo(() => [
        { id: 'appearance', label: t('settings.cat.appearance', 'Appearance'), icon: Palette },
        { id: 'language', label: t('settings.cat.language', 'Language'), icon: Globe },
        { id: 'java', label: t('settings.cat.java', 'Java installations'), icon: Coffee },
        { id: 'instance', label: t('settings.cat.instance', 'Default instance options'), icon: Gamepad2 },
        { id: 'resources', label: t('settings.cat.resources', 'Resource management'), icon: Gauge },
        { id: 'updates', label: t('settings.cat.updates', 'Updates & system'), icon: RefreshCw },
    ], [t]);

    const panels: Record<string, React.ReactNode> = {
        appearance: appearancePanel,
        language: languagePanel,
        java: javaPanel,
        instance: instancePanel,
        resources: resourcePanel,
        updates: updatePanel,
    };

    return (
        <div className="flex h-full flex-col overflow-hidden">
            <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
                <div className="flex items-center gap-2.5">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight text-foreground">{t('settings.title')}</h1>
                        <p className="text-sm text-muted-foreground">{t('settings.desc')}</p>
                    </div>
                </div>
                <Button onClick={handleManualSave} size="sm" className="h-9 gap-1.5">
                    <Save className="h-3.5 w-3.5" />
                    {t('common.save')}
                </Button>
            </div>

            <div className="flex min-h-0 flex-1">
                <nav className="w-[232px] shrink-0 space-y-1 overflow-y-auto border-r border-border p-3">
                    {categories.map(category => {
                        const Icon = category.icon;
                        const active = activeCategory === category.id;
                        return (
                            <button
                                key={category.id}
                                type="button"
                                onClick={() => setActiveCategory(category.id)}
                                aria-current={active ? 'page' : undefined}
                                className={cn(
                                    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors',
                                    active
                                        ? 'bg-primary/15 text-primary'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                )}
                            >
                                <Icon className="h-4 w-4 shrink-0" />
                                <span className="truncate">{category.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <ScrollArea className="flex-1">
                    <div className="mx-auto max-w-3xl px-6 py-6">
                        {panels[activeCategory]}
                    </div>
                </ScrollArea>
            </div>

            {/* Dialogs */}
            <Dialog open={showJavaModal} onOpenChange={setShowJavaModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('settings.java.install')}</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">{t('settings.java.install_desc')}</p>
                    <div className="space-y-2">
                        {[8, 17, 21].map(v => (
                            <Button
                                key={v}
                                variant="outline"
                                className="h-10 w-full justify-between"
                                onClick={() => handleInstallJava(v)}
                            >
                                Java {v} {v >= 17 ? '(LTS)' : ''}
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {showSoftResetModal && (
                <ConfirmDialog
                    title={t('settings.maintenance.soft_reset_title')}
                    message={t('settings.ui.modals.soft_reset_message')}
                    confirmText={t('settings.ui.modals.reset')}
                    onConfirm={handleSoftReset}
                    onCancel={() => setShowSoftResetModal(false)}
                />
            )}

            {showFactoryResetModal && (
                <ConfirmDialog
                    title={t('settings.maintenance.factory_reset_title')}
                    message={t('settings.ui.modals.factory_reset_message')}
                    confirmText={t('settings.ui.modals.delete_all')}
                    isDangerous={true}
                    onConfirm={handleFactoryReset}
                    onCancel={() => setShowFactoryResetModal(false)}
                />
            )}

            {showRestartModal && (
                <ConfirmDialog
                    title={t('common.restart_app')}
                    message={t('settings.ui.modals.restart_required')}
                    confirmText={t('common.restart_app')}
                    onConfirm={handleConfirmRestart}
                    onCancel={() => setShowRestartModal(false)}
                />
            )}
        </div>
    );
}

export default Settings;
