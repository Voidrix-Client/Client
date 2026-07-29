import React from 'react';
import { Grip } from 'lucide-react';
import { Button } from '../ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { cn } from '../../lib/utils';
import {
    VBrush,
    VChartUp,
    VGlobe,
    VPackage,
    VSpark,
    VTrophy,
    VTile,
    type VIconProps,
} from '../VoidrixIcons';

type DashboardSection = {
    id: string;
    visible?: boolean;
    width?: number;
};

type DashboardSettings = {
    welcomeMessage?: string;
    layout?: DashboardSection[];
};

type DashboardLayoutCustomizerProps = {
    open: boolean;
    settings: DashboardSettings;
    onUpdate: (settings: DashboardSettings) => void;
    onClose: () => void;
    onEnterEditor: () => void;
    isEditing?: boolean;
};

const sections: { id: string; title: string; description: string; icon: React.FC<VIconProps>; g1: string; g2: string; glow: string }[] = [
    {
        id: 'recent-instances',
        title: 'Weiter geht’s',
        description: 'Deine zuletzt gespielten Instanzen ganz oben auf dem Dashboard.',
        icon: VChartUp,
        g1: '#c084fc', g2: '#818cf8', glow: 'rgba(139,92,246,0.3)',
    },
    {
        id: 'recent-worlds',
        title: 'Deine Welten',
        description: 'Schneller Zugriff auf die zuletzt geöffneten Welten.',
        icon: VGlobe,
        g1: '#34d399', g2: '#22d3ee', glow: 'rgba(16,185,129,0.3)',
    },
    {
        id: 'modpacks',
        title: 'Entdecke Modpacks',
        description: 'Kuratierte Modpack-Empfehlungen auf der Startseite.',
        icon: VPackage,
        g1: '#38bdf8', g2: '#22d3ee', glow: 'rgba(56,189,248,0.3)',
    },
    {
        id: 'mod-of-the-day',
        title: 'Mod des Tages',
        description: 'Jeden Tag ein neues Mod-Highlight zum Entdecken.',
        icon: VTrophy,
        g1: '#fbbf24', g2: '#c084fc', glow: 'rgba(234,179,8,0.3)',
    },
];

function DashboardLayoutCustomizer({ open, settings, onUpdate, onClose, onEnterEditor, isEditing }: DashboardLayoutCustomizerProps) {
    const handleChange = (key: keyof DashboardSettings, value: DashboardSettings[keyof DashboardSettings]) => {
        onUpdate({
            ...settings,
            [key]: value
        });
    };

    const toggleSection = (id: string) => {
        const newLayout = (settings.layout || []).map(section => {
            if (section.id === id) {
                return { ...section, visible: !section.visible };
            }
            return section;
        });
        handleChange('layout', newLayout);
    };

    const isVisible = (id: string) => {
        return settings.layout?.find(s => s.id === id)?.visible !== false;
    };

    const visibleCount = sections.filter(s => isVisible(s.id)).length;

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
            <DialogContent animationVariant="zoom" className="max-w-xl overflow-hidden border-border/70 bg-card/95 p-0 shadow-2xl backdrop-blur-xl duration-150">
                {/* Licht-Kante + Header */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
                <DialogHeader className="relative gap-0 overflow-hidden border-b border-border/70 px-6 py-5 text-left">
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/10 via-primary/[0.03] to-transparent" />
                    <div className="pointer-events-none absolute -top-10 right-10 h-28 w-28 rounded-full bg-violet-500/15 blur-3xl" />
                    <div className="relative flex items-center gap-4 pr-8">
                        <VTile icon={VSpark} className="h-11 w-11" iconClassName="h-5 w-5" />
                        <div className="flex min-w-0 flex-1 flex-col justify-center">
                            <DialogTitle className="text-xl font-semibold">
                                <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent">
                                    Dashboard anpassen
                                </span>
                            </DialogTitle>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Gestalte deine Startseite so, wie sie dir gefällt.
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="max-h-[66vh] overflow-y-auto px-6 py-5">
                    <div className="flex flex-col gap-5">
                        {/* Visueller Editor */}
                        <div className="group relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card/60 to-card/30 p-4 transition-colors hover:border-primary/40">
                            <span className="pointer-events-none absolute inset-y-0 w-1/3 -translate-x-[240%] skew-x-[-20deg] bg-white/[0.05] blur-sm transition-transform duration-700 group-hover:translate-x-[440%]" />
                            <div className="relative flex flex-wrap items-center gap-3">
                                <VTile icon={VBrush} className="h-10 w-10" />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-foreground">Visueller Layout-Editor</p>
                                        {isEditing && (
                                            <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                                                Aktiv
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                                        Bereiche per Drag &amp; Drop anordnen und in der Größe anpassen.
                                    </p>
                                </div>
                                <Button onClick={onEnterEditor} className="gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 text-white shadow-lg shadow-violet-500/25 hover:opacity-95">
                                    <Grip className="h-4 w-4" />
                                    Editor öffnen
                                </Button>
                            </div>
                        </div>

                        {/* Willkommensnachricht */}
                        <div className="flex flex-col gap-2.5">
                            <div>
                                <h3 className="text-sm font-semibold text-foreground">Willkommensnachricht</h3>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    Dieser Text erscheint oben auf dem Dashboard.
                                </p>
                            </div>
                            <Input
                                type="text"
                                value={settings.welcomeMessage || 'Willkommen zurück!'}
                                onChange={(e) => handleChange('welcomeMessage', e.target.value)}
                                placeholder="Willkommen zurück!"
                                className="h-11 rounded-xl bg-background/60 focus-visible:ring-primary/30"
                            />
                        </div>

                        {/* Bereiche */}
                        <div className="flex flex-col gap-2.5">
                            <div className="flex items-end justify-between gap-2">
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground">Bereiche</h3>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        Wähle, welche Karten auf der Startseite sichtbar bleiben.
                                    </p>
                                </div>
                                <span className="shrink-0 rounded-full border border-border/70 bg-background/60 px-2.5 py-1 text-[11px] text-muted-foreground">
                                    <span className="font-semibold text-foreground">{visibleCount}</span> / {sections.length} aktiv
                                </span>
                            </div>

                            <div className="flex flex-col gap-2">
                                {sections.map(({ id, title, description, icon, g1, g2, glow }, index) => {
                                    const active = isVisible(id);
                                    return (
                                        <div
                                            key={id}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => toggleSection(id)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    toggleSection(id);
                                                }
                                            }}
                                            className={cn(
                                                'group/row relative flex w-full cursor-pointer items-center gap-3 overflow-hidden rounded-2xl border p-3 text-left transition-all duration-200 animate-in fade-in slide-in-from-bottom-1 fill-mode-backwards',
                                                active
                                                    ? 'border-border/70 bg-background/60 hover:border-primary/30'
                                                    : 'border-border/40 bg-background/30 opacity-60 hover:opacity-90'
                                            )}
                                            style={{ animationDelay: `${index * 50}ms`, animationDuration: '300ms' }}
                                        >
                                            {/* Farbiger Akzent links, wenn aktiv */}
                                            <span
                                                className={cn('absolute inset-y-2 left-0 w-1 rounded-r-full transition-opacity duration-300', active ? 'opacity-100' : 'opacity-0')}
                                                style={{ background: `linear-gradient(to bottom, ${g1}, ${g2})` }}
                                            />
                                            <VTile
                                                icon={icon}
                                                className={cn('h-10 w-10 transition-all duration-300 group-hover/row:scale-105', !active && 'grayscale')}
                                                g1={g1} g2={g2} glow={glow}
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-foreground">{title}</p>
                                                <p className="mt-0.5 pr-2 text-xs leading-5 text-muted-foreground">{description}</p>
                                            </div>
                                            <Switch
                                                checked={active}
                                                onCheckedChange={() => toggleSection(id)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="border-t border-border/70 bg-muted/20 px-6 py-4 sm:justify-between sm:gap-4">
                    <p className="hidden text-xs text-muted-foreground sm:block">
                        Änderungen werden sofort gespeichert.
                    </p>
                    <Button onClick={onClose} className="min-w-24 rounded-xl">
                        Fertig
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default DashboardLayoutCustomizer;
