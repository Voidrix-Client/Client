import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../../context/NotificationContext';
import ReinstallDialog from './ReinstallDialog';
import ConfirmDialog from './ConfirmDialog';
import SelectDropdown from '../common/inputs/SelectDropdown';
import ToggleSwitch from '../common/inputs/ToggleSwitch';
import { Dialog, DialogContent } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';
import {
    Save,
    Trash2,
    RefreshCw,
    Upload,
    Monitor,
    Cpu,
    Settings,
    AlertTriangle,
    Terminal,
    Folder,
    Loader2
} from 'lucide-react';

// ============================================
// MEMOIZED KOMPONENTEN
// ============================================

const SettingsNavItem = memo(({ id, active, onClick, icon: Icon, label, isDanger }: any) => (
    <button
        type="button"
        onClick={() => onClick(id)}
        aria-current={active === id ? 'page' : undefined}
        className={cn(
            'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors',
            active === id
                ? isDanger
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-primary/15 text-primary'
                : isDanger
                    ? 'text-muted-foreground hover:bg-destructive/5 hover:text-destructive'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
    >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{label}</span>
    </button>
));
SettingsNavItem.displayName = 'SettingsNavItem';

const FieldLabel = memo(({ label, icon: Icon }: any) => (
    <Label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
    </Label>
));
FieldLabel.displayName = 'FieldLabel';

const InputField = memo(({ label, value, onChange, type = 'text', placeholder, min, step, icon }: any) => (
    <div className="space-y-1.5">
        <FieldLabel label={label} icon={icon} />
        <Input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            min={min}
            step={step}
            className="h-10"
        />
    </div>
));
InputField.displayName = 'InputField';

// ============================================
// HAUPTSETTINGS
// ============================================
function InstanceSettingsDialog({ instance, onClose, onSave, onDelete }: any) {
    const { t } = useTranslation();
    const { addNotification } = useNotification();

    const [activeTab, setActiveTab] = useState('general');
    const [config, setConfig] = useState({ ...instance });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showReinstall, setShowReinstall] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [availableVersions, setAvailableVersions] = useState<any[]>([]);
    const [loadingVersions, setLoadingVersions] = useState(false);
    const [showSnapshots, setShowSnapshots] = useState(false);
    const [isDraggingIcon, setIsDraggingIcon] = useState(false);

    useEffect(() => {
        const loadVersions = async () => {
            setLoadingVersions(true);
            try {
                const loader = config.loader || 'Vanilla';
                if (loader === 'Vanilla') {
                    const res = await window.electronAPI.getVanillaVersions();
                    if (res.success) {
                        const versions = res.versions.filter((v: any) =>
                            showSnapshots ? true : v.type === 'release'
                        );
                        setAvailableVersions(versions);
                    }
                } else {
                    const res = await window.electronAPI.getSupportedGameVersions(loader);
                    if (res.success) {
                        let versions = res.versions;
                        if (!showSnapshots) {
                            versions = versions.filter((v: string) => /^\d+\.\d+(\.\d+)?$/.test(v));
                        }
                        setAvailableVersions(versions.map((v: string) => ({ id: v, type: 'release' })));
                    }
                }
            } catch (e) {
                console.error('Failed to load versions:', e);
            } finally {
                setLoadingVersions(false);
            }
        };
        loadVersions();
    }, [config.loader, showSnapshots]);

    const versionOptions = useMemo(() =>
        availableVersions.map((v: any) => ({ value: v.id, label: v.id })),
        [availableVersions]
    );

    const loaderOptions = useMemo(() => [
        { value: 'Vanilla', label: 'Vanilla' },
        { value: 'Fabric', label: 'Fabric' },
        { value: 'Forge', label: 'Forge' },
        { value: 'NeoForge', label: 'NeoForge' },
        { value: 'Quilt', label: 'Quilt' }
    ], []);

    const hasVersionChanged = config.version !== instance.version || config.loader !== instance.loader;

    const handleSave = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (config.icon !== instance.icon) {
                await window.electronAPI.updateInstanceConfig(instance.name, { icon: config.icon });
            }
            if (config.name !== instance.name) {
                const renameResult = await window.electronAPI.renameInstance(instance.name, config.name);
                if (!renameResult.success) {
                    throw new Error(`Failed to rename: ${renameResult.error}`);
                }
            }
            await window.electronAPI.updateInstance(config.name, config);
            addNotification('Einstellungen gespeichert', 'success');
            onSave(config);
            onClose();
        } catch (e: any) {
            setError(e.message);
            addNotification(`Fehler: ${e.message}`, 'error');
        } finally {
            setLoading(false);
        }
    }, [config, instance, onSave, onClose, addNotification]);

    const handleMigrate = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await window.electronAPI.migrateInstance(instance.name, {
                version: config.version,
                loader: config.loader
            });
            if (res.success) {
                addNotification('Migration gestartet', 'success');
                onClose();
            } else {
                throw new Error(res.error);
            }
        } catch (e: any) {
            setError(e.message);
            setLoading(false);
        }
    }, [instance.name, config.version, config.loader, onClose, addNotification]);

    const handleDelete = useCallback(async () => {
        setLoading(true);
        try {
            await window.electronAPI.deleteInstance(instance.name);
            addNotification('Instanz gelöscht', 'success');
            onClose();
            if (onDelete) onDelete(instance.name);
        } catch (e: any) {
            setError(e.message);
            setLoading(false);
        }
    }, [instance.name, onClose, onDelete, addNotification]);

    const handleReinstall = useCallback(async (type: string) => {
        setShowReinstall(false);
        setLoading(true);
        try {
            const res = await window.electronAPI.reinstallInstance(instance.name, type);
            if (res.success) {
                addNotification('Neuinstallation gestartet', 'success');
                onClose();
            } else {
                throw new Error(res.error);
            }
        } catch (e: any) {
            setError(e.message);
            setLoading(false);
        }
    }, [instance.name, onClose, addNotification]);

    const handleChange = useCallback((field: string, value: any) => {
        setConfig((prev: any) => ({ ...prev, [field]: value }));
    }, []);

    const handleIconUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => handleChange('icon', reader.result);
            reader.readAsDataURL(file);
        }
    }, [handleChange]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingIcon(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingIcon(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingIcon(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => handleChange('icon', reader.result);
            reader.readAsDataURL(file);
        }
    }, [handleChange]);

    const navItems = [
        { id: 'general', icon: Settings, label: 'Allgemein' },
        { id: 'installation', icon: Folder, label: 'Installation' },
        { id: 'window', icon: Monitor, label: 'Fenster' },
        { id: 'java', icon: Cpu, label: 'Java' },
        { id: 'hooks', icon: Terminal, label: 'Hooks' },
    ];

    const sectionTitles: Record<string, React.ReactNode> = {
        general: 'Allgemeine Einstellungen',
        installation: 'Installation',
        window: 'Fenstereinstellungen',
        java: 'Java Einstellungen',
        hooks: 'Hook Einstellungen',
        danger: (
            <>
                <AlertTriangle className="h-5 w-5" />
                Gefahrenzone
            </>
        ),
    };

    return (
        <>
            <Dialog open onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="flex h-[600px] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
                    <div className="flex min-h-0 flex-1">
                        {/* Sidebar */}
                        <div className="flex w-60 shrink-0 flex-col gap-1 border-r border-border bg-muted/20 p-3">
                            <div className="px-2 py-2 mb-1">
                                <h2 className="truncate text-sm font-semibold text-foreground" title={instance.name}>
                                    {instance.name}
                                </h2>
                                <p className="text-xs text-muted-foreground">Einstellungen</p>
                            </div>

                            {navItems.map(item => (
                                <SettingsNavItem
                                    key={item.id}
                                    id={item.id}
                                    active={activeTab}
                                    onClick={setActiveTab}
                                    icon={item.icon}
                                    label={item.label}
                                />
                            ))}

                            <div className="my-2 border-t border-border" />

                            <SettingsNavItem
                                id="danger"
                                active={activeTab}
                                onClick={setActiveTab}
                                icon={AlertTriangle}
                                label="Gefahrenzone"
                                isDanger
                            />
                        </div>

                        {/* Content */}
                        <div className="custom-scrollbar flex-1 overflow-y-auto p-6">
                            <div className="mx-auto max-w-xl">
                                <h2 className={cn(
                                    'mb-5 flex items-center gap-2 text-lg font-semibold',
                                    activeTab === 'danger' ? 'text-destructive' : 'text-foreground'
                                )}>
                                    {sectionTitles[activeTab]}
                                </h2>

                                {error && (
                                    <div className="mb-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                {/* General Tab */}
                                {activeTab === 'general' && (
                                    <div className="space-y-5">
                                        <div className="flex flex-col items-center gap-3">
                                            <div
                                                className={cn(
                                                    'relative h-24 w-24 cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition-colors',
                                                    isDraggingIcon ? 'border-primary bg-primary/10' : 'border-border bg-muted/30 hover:border-primary/50'
                                                )}
                                                onClick={() => document.getElementById('instance-icon-upload')?.click()}
                                                onDragOver={handleDragOver}
                                                onDragLeave={handleDragLeave}
                                                onDrop={handleDrop}
                                            >
                                                {config.icon && (config.icon.startsWith('data:') || config.icon.startsWith('app-media://')) ? (
                                                    <img src={config.icon} alt="Icon" className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center">
                                                        <Upload className="h-8 w-8 text-muted-foreground" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity hover:opacity-100">
                                                    <span className="text-xs font-medium text-white">Ändern</span>
                                                </div>
                                                <input
                                                    id="instance-icon-upload"
                                                    type="file"
                                                    onChange={handleIconUpload}
                                                    accept="image/*"
                                                    className="hidden"
                                                />
                                            </div>
                                            <span className="text-xs text-muted-foreground">Klicken oder Bild ablegen</span>
                                        </div>

                                        <InputField
                                            label="Instanzname"
                                            value={config.name || ''}
                                            onChange={(e: any) => handleChange('name', e.target.value)}
                                        />
                                        <p className="-mt-3 text-xs text-muted-foreground">Ordner wird automatisch umbenannt</p>
                                    </div>
                                )}

                                {/* Installation Tab */}
                                {activeTab === 'installation' && (
                                    <div className="space-y-5">
                                        <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                                            <RefreshCw className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                                            <div>
                                                <p className="font-medium text-primary">Migrations-Info</p>
                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                    Mods und Einstellungen bleiben erhalten. Ein Backup wird empfohlen.
                                                </p>
                                            </div>
                                        </div>

                                        <ToggleSwitch
                                            checked={showSnapshots}
                                            onChange={setShowSnapshots}
                                            label="Snapshots anzeigen"
                                            description="Experimentelle Versionen einblenden"
                                        />

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <FieldLabel label="Spielversion" />
                                                {loadingVersions ? (
                                                    <div className="flex h-10 items-center gap-2 rounded-md border border-border bg-muted px-2.5 text-sm text-muted-foreground">
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        Laden...
                                                    </div>
                                                ) : (
                                                    <SelectDropdown
                                                        options={versionOptions}
                                                        value={config.version}
                                                        onChange={(v: string) => handleChange('version', v)}
                                                    />
                                                )}
                                            </div>
                                            <div className="space-y-1.5">
                                                <FieldLabel label="Mod-Loader" />
                                                <SelectDropdown
                                                    options={loaderOptions}
                                                    value={config.loader || 'Vanilla'}
                                                    onChange={(v: string) => handleChange('loader', v)}
                                                />
                                            </div>
                                        </div>

                                        {hasVersionChanged && (
                                            <div className="border-t border-border pt-4">
                                                <Button
                                                    onClick={handleMigrate}
                                                    disabled={loading}
                                                    className="w-full gap-2"
                                                >
                                                    {loading ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <RefreshCw className="h-4 w-4" />
                                                    )}
                                                    Migration starten
                                                </Button>
                                                <p className="mt-2 text-center text-xs text-muted-foreground">
                                                    Läuft im Hintergrund
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Window Tab */}
                                {activeTab === 'window' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <InputField
                                            label="Breite"
                                            type="number"
                                            value={config.resolutionWidth || 854}
                                            onChange={(e: any) => handleChange('resolutionWidth', parseInt(e.target.value) || 854)}
                                            min={100}
                                            icon={Monitor}
                                        />
                                        <InputField
                                            label="Höhe"
                                            type="number"
                                            value={config.resolutionHeight || 480}
                                            onChange={(e: any) => handleChange('resolutionHeight', parseInt(e.target.value) || 480)}
                                            min={100}
                                            icon={Monitor}
                                        />
                                    </div>
                                )}

                                {/* Java Tab */}
                                {activeTab === 'java' && (
                                    <div className="space-y-5">
                                        <InputField
                                            label="Java Pfad"
                                            value={config.javaPath || ''}
                                            onChange={(e: any) => handleChange('javaPath', e.target.value)}
                                            placeholder="Standard verwenden"
                                            icon={Cpu}
                                        />

                                        <div className="space-y-3">
                                            <FieldLabel label="Arbeitsspeicher" />
                                            <div className="grid grid-cols-2 gap-4">
                                                <InputField
                                                    label="Minimum (MB)"
                                                    type="number"
                                                    value={config.minMemory || 1024}
                                                    onChange={(e: any) => handleChange('minMemory', parseInt(e.target.value) || 1024)}
                                                    min={256}
                                                    step={256}
                                                />
                                                <InputField
                                                    label="Maximum (MB)"
                                                    type="number"
                                                    value={config.maxMemory || 4096}
                                                    onChange={(e: any) => handleChange('maxMemory', parseInt(e.target.value) || 4096)}
                                                    min={512}
                                                    step={256}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <FieldLabel label="Java Profil" />
                                            <select
                                                value={config.javaProfile || 'default'}
                                                onChange={(e) => handleChange('javaProfile', e.target.value)}
                                                className="h-10 w-full cursor-pointer rounded-md border border-input bg-background px-2.5 text-sm text-foreground outline-none focus:border-primary/50"
                                            >
                                                <option value="default">Standard (Globale Einstellungen)</option>
                                                <option value="performance">Performance (Aikar's Flags)</option>
                                                <option value="low-end">Low-End PC (Aggressive GC)</option>
                                                <option value="zgc">ZGC (Stabile FPS - Java 17+)</option>
                                            </select>
                                            <p className="text-xs text-muted-foreground">
                                                Optimiert die Java-Argumente
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Hooks Tab */}
                                {activeTab === 'hooks' && (
                                    <div className="space-y-5">
                                        <p className="text-sm text-muted-foreground">
                                            Führe Befehle vor dem Start oder nach dem Beenden aus.
                                        </p>

                                        <InputField
                                            label="Pre-Launch Hook"
                                            value={config.preLaunchHook || ''}
                                            onChange={(e: any) => handleChange('preLaunchHook', e.target.value)}
                                            placeholder="./setup.sh"
                                            icon={Terminal}
                                        />
                                        <p className="-mt-3 text-xs text-muted-foreground">
                                            Wird vor dem Spielstart ausgeführt
                                        </p>

                                        <InputField
                                            label="Post-Exit Hook"
                                            value={config.postExitHook || ''}
                                            onChange={(e: any) => handleChange('postExitHook', e.target.value)}
                                            placeholder="./cleanup.sh"
                                            icon={Terminal}
                                        />
                                        <p className="-mt-3 text-xs text-muted-foreground">
                                            Wird nach Spielende ausgeführt
                                        </p>
                                    </div>
                                )}

                                {/* Danger Tab */}
                                {activeTab === 'danger' && (
                                    <div className="space-y-4">
                                        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
                                            <h3 className="mb-2 flex items-center gap-2 font-medium text-amber-500">
                                                <RefreshCw className="h-4 w-4" />
                                                Neuinstallation
                                            </h3>
                                            <p className="mb-4 text-sm text-muted-foreground">
                                                Installiert die Instanz neu. Mods und Welten können behalten werden.
                                            </p>
                                            <Button
                                                variant="outline"
                                                onClick={() => setShowReinstall(true)}
                                                className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10 hover:text-amber-500"
                                            >
                                                Neuinstallation starten
                                            </Button>
                                        </div>

                                        <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-4">
                                            <h3 className="mb-2 flex items-center gap-2 font-medium text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                                Instanz löschen
                                            </h3>
                                            <p className="mb-4 text-sm text-muted-foreground">
                                                Löscht die Instanz und alle Daten dauerhaft. Nicht rückgängig!
                                            </p>
                                            <Button
                                                variant="outline"
                                                onClick={() => setShowDeleteConfirm(true)}
                                                className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                            >
                                                Instanz löschen
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                {activeTab !== 'danger' && (
                                    <div className="mt-8 flex justify-end gap-3 border-t border-border pt-5">
                                        <Button variant="ghost" onClick={onClose}>
                                            Abbrechen
                                        </Button>
                                        <Button onClick={handleSave} disabled={loading} className="gap-2">
                                            {loading ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Save className="h-4 w-4" />
                                            )}
                                            Speichern
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modals */}
            {showReinstall && (
                <ReinstallDialog
                    instanceName={instance.name}
                    onClose={() => setShowReinstall(false)}
                    onConfirm={handleReinstall}
                />
            )}

            {showDeleteConfirm && (
                <ConfirmDialog
                    title="Instanz löschen?"
                    message={`"${instance.name}" wird dauerhaft gelöscht. Nicht rückgängig!`}
                    onConfirm={handleDelete}
                    onCancel={() => setShowDeleteConfirm(false)}
                    confirmText="Ja, löschen"
                    isDangerous
                />
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 3px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground) / 0.3); }
            `}</style>
        </>
    );
}

export default InstanceSettingsDialog;
