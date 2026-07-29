import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Droplets, Flame, Info, Loader2, Moon, Palette, Play, Search, Sparkles, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

const MODE_OPTIONS = [
    {
        id: 'voidrix_default',
        titleKey: 'setup.themeDefault',
        descriptionKey: 'setup.themeDefaultDesc',
        actionKey: 'setup.useTheme',
        icon: Moon,
        badge: 'Balanced',
        swatch: 'bg-[linear-gradient(135deg,#1b1524_0%,#2c2140_55%,#8b5cf6_130%)]',
        accentClass: 'from-violet-500/30 to-indigo-700/5',
        buttonClass: 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:opacity-95',
        palette: { bg: '#131019', surface: '#1d1826', card: '#241d31', accent: '#8b5cf6', accent2: '#6366f1', text: 'rgba(244,240,255,0.9)', textDim: 'rgba(244,240,255,0.45)', line: 'rgba(255,255,255,0.07)' }
    },
    {
        id: 'voidrix_horizon',
        titleKey: 'setup.themeHorizon',
        descriptionKey: 'setup.themeHorizonDesc',
        actionKey: 'setup.useTheme',
        icon: Sparkles,
        badge: 'Clean',
        swatch: 'bg-[linear-gradient(135deg,#0b1a2b_0%,#12365f_55%,#38bdf8_130%)]',
        accentClass: 'from-sky-500/30 to-cyan-500/5',
        buttonClass: 'bg-gradient-to-r from-sky-400 to-cyan-500 text-white hover:opacity-95',
        palette: { bg: '#0a1626', surface: '#102338', card: '#152c46', accent: '#38bdf8', accent2: '#22d3ee', text: 'rgba(235,246,255,0.9)', textDim: 'rgba(235,246,255,0.45)', line: 'rgba(255,255,255,0.08)' }
    },
    {
        id: 'voidrix_night',
        titleKey: 'setup.themeNight',
        descriptionKey: 'setup.themeNightDesc',
        actionKey: 'setup.useTheme',
        icon: Moon,
        badge: 'Focus',
        swatch: 'bg-[linear-gradient(135deg,#0f1329_0%,#1a2040_55%,#818cf8_130%)]',
        accentClass: 'from-indigo-500/30 to-violet-500/5',
        buttonClass: 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:opacity-95',
        palette: { bg: '#0d1124', surface: '#151b36', card: '#1b2244', accent: '#818cf8', accent2: '#a78bfa', text: 'rgba(238,240,255,0.9)', textDim: 'rgba(238,240,255,0.45)', line: 'rgba(255,255,255,0.07)' }
    },
    {
        id: 'voidrix_lava',
        titleKey: 'setup.themeLava',
        descriptionKey: 'setup.themeLavaDesc',
        actionKey: 'setup.useTheme',
        icon: Flame,
        badge: 'Hot',
        swatch: 'bg-[linear-gradient(135deg,#1b0b07_0%,#5c1d08_55%,#f97316_130%)]',
        accentClass: 'from-orange-500/30 to-red-500/5',
        buttonClass: 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:opacity-95',
        palette: { bg: '#170a06', surface: '#26100a', card: '#33150c', accent: '#f97316', accent2: '#ef4444', text: 'rgba(255,244,237,0.9)', textDim: 'rgba(255,244,237,0.45)', line: 'rgba(255,255,255,0.07)' }
    },
    {
        id: 'voidrix_water',
        titleKey: 'setup.themeWater',
        descriptionKey: 'setup.themeWaterDesc',
        actionKey: 'setup.useTheme',
        icon: Droplets,
        badge: 'Flow',
        swatch: 'bg-[linear-gradient(135deg,#061520_0%,#0d2f46_55%,#0ea5e9_130%)]',
        accentClass: 'from-sky-500/30 to-blue-500/5',
        buttonClass: 'bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:opacity-95',
        palette: { bg: '#06131d', surface: '#0b2233', card: '#0f2c42', accent: '#0ea5e9', accent2: '#38bdf8', text: 'rgba(234,248,255,0.9)', textDim: 'rgba(234,248,255,0.45)', line: 'rgba(255,255,255,0.08)' }
    },
    {
        id: 'voidrix_light',
        titleKey: 'setup.lightMode',
        descriptionKey: 'setup.lightModeDesc',
        actionKey: 'setup.useTheme',
        icon: Sun,
        badge: 'Bright',
        swatch: 'bg-[linear-gradient(135deg,#eef2ff_0%,#dbeafe_55%,#818cf8_130%)]',
        accentClass: 'from-indigo-400/25 to-violet-500/5',
        buttonClass: 'bg-gradient-to-r from-indigo-400 to-violet-500 text-white hover:opacity-95',
        palette: { bg: '#eef1f8', surface: '#ffffff', card: '#f4f6fc', accent: '#6366f1', accent2: '#8b5cf6', text: 'rgba(23,23,35,0.9)', textDim: 'rgba(23,23,35,0.45)', line: 'rgba(15,23,42,0.10)' }
    },
];

/** Mini-Launcher-Mockup in den Farben des gewählten Themes */
function ThemePreviewMock({ mode }: { mode: (typeof MODE_OPTIONS)[number] }) {
    const p = mode.palette;
    return (
        <div
            className="relative h-48 overflow-hidden rounded-xl border shadow-inner sm:h-52"
            style={{ background: p.bg, borderColor: p.line }}
        >
            {/* Theme-spezifische Stimmung */}
            {mode.id === 'voidrix_lava' && (
                <div className="pointer-events-none absolute inset-0 opacity-40 [background:repeating-linear-gradient(140deg,rgba(255,130,40,0.20)_0px,rgba(255,130,40,0.20)_14px,transparent_14px,transparent_28px)] animate-[lava-card_7s_linear_infinite]" />
            )}
            {mode.id === 'voidrix_water' && (
                <div className="pointer-events-none absolute inset-0 opacity-35 [background:repeating-linear-gradient(160deg,rgba(56,189,248,0.18)_0px,rgba(56,189,248,0.18)_12px,transparent_12px,transparent_24px)] animate-[water-card_6s_ease-in-out_infinite]" />
            )}
            {mode.id === 'voidrix_night' && (
                <div className="pointer-events-none absolute inset-0">
                    {[[12, 18], [30, 8], [55, 22], [72, 12], [88, 30], [42, 38], [64, 45]].map(([x, y], i) => (
                        <span
                            key={i}
                            className="absolute h-[3px] w-[3px] rounded-full bg-indigo-200 animate-pulse"
                            style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.4}s`, opacity: 0.7 }}
                        />
                    ))}
                </div>
            )}
            {mode.id === 'voidrix_light' && (
                <div className="pointer-events-none absolute -top-8 right-6 h-24 w-24 rounded-full bg-amber-200/50 blur-2xl" />
            )}
            <div
                className="pointer-events-none absolute -top-10 right-0 h-40 w-40 rounded-full blur-3xl transition-colors duration-500"
                style={{ background: p.accent, opacity: mode.id === 'voidrix_light' ? 0.22 : 0.18 }}
            />

            {/* Fake-Launcher-UI */}
            <div className="relative flex h-full flex-col">
                {/* Fenster-Titelleiste */}
                <div className="flex h-6 shrink-0 items-center gap-1.5 border-b px-2.5" style={{ background: p.surface, borderColor: p.line }}>
                    <span className="h-2 w-2 rounded-full bg-[#ff5f57]/90" />
                    <span className="h-2 w-2 rounded-full bg-[#febc2e]/90" />
                    <span className="h-2 w-2 rounded-full bg-[#28c840]/90" />
                    <div className="ml-2 h-1.5 w-14 rounded-full" style={{ background: p.textDim, opacity: 0.3 }} />
                    <div
                        className="ml-auto flex h-3.5 items-center rounded px-1.5 text-[7px] font-bold tracking-wider"
                        style={{ background: `${p.accent}26`, color: p.accent }}
                    >
                        v2.0
                    </div>
                </div>

                <div className="flex min-h-0 flex-1">
                    {/* Mini-Sidebar */}
                    <div className="flex w-11 shrink-0 flex-col items-center gap-2 border-r py-2.5" style={{ background: p.surface, borderColor: p.line }}>
                        <div className="mb-1 h-6 w-6 rounded-md" style={{ background: `linear-gradient(135deg, ${p.accent}, ${p.accent2})` }} />
                        {[0, 1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="h-5 w-5 rounded-md"
                                style={{ background: i === 0 ? `${p.accent}33` : p.card, border: i === 0 ? `1px solid ${p.accent}66` : '1px solid transparent' }}
                            />
                        ))}
                        <div className="mt-auto h-5 w-5 rounded-full" style={{ background: p.card }} />
                    </div>

                    {/* Inhalt */}
                    <div className="flex min-w-0 flex-1 flex-col gap-2 p-2.5">
                        {/* Topbar */}
                        <div className="flex items-center gap-2">
                            <div className="flex h-6 flex-1 items-center gap-1.5 rounded-md px-2" style={{ background: p.surface, border: `1px solid ${p.line}` }}>
                                <Search className="h-3 w-3" style={{ color: p.textDim }} />
                                <div className="h-1.5 w-16 rounded-full" style={{ background: p.textDim, opacity: 0.35 }} />
                            </div>
                            <div className="flex h-6 items-center gap-1 rounded-md px-1.5" style={{ background: p.surface, border: `1px solid ${p.line}` }}>
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                <div className="h-1 w-6 rounded-full" style={{ background: p.textDim, opacity: 0.4 }} />
                            </div>
                            <div className="h-6 w-6 rounded-full" style={{ background: `linear-gradient(135deg, ${p.accent}, ${p.accent2})`, opacity: 0.8 }} />
                        </div>

                        {/* Hero-Karte mit Play-Button */}
                        <div className="relative flex-1 overflow-hidden rounded-lg p-2.5" style={{ background: p.card, border: `1px solid ${p.line}` }}>
                            <div className="pointer-events-none absolute inset-0" style={{ background: `linear-gradient(120deg, ${p.accent}26, transparent 55%)` }} />
                            {/* Shimmer-Lauflicht */}
                            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                                <div className="absolute inset-y-0 w-1/3 -translate-x-full animate-[mock-shimmer_2.8s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                            </div>
                            <div className="relative flex h-full flex-col justify-between">
                                <div className="space-y-1.5">
                                    <div className="h-2 w-24 rounded-full" style={{ background: p.text, opacity: 0.75 }} />
                                    <div className="h-1.5 w-32 rounded-full" style={{ background: p.textDim, opacity: 0.5 }} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <div
                                        className="flex h-6 items-center gap-1 rounded-md px-2.5 text-[9px] font-bold text-white shadow-sm"
                                        style={{ background: `linear-gradient(90deg, ${p.accent}, ${p.accent2})`, boxShadow: `0 4px 14px -6px ${p.accent}` }}
                                    >
                                        <Play className="h-2.5 w-2.5 fill-current" />
                                        PLAY
                                    </div>
                                    <div className="h-6 w-14 rounded-md" style={{ background: p.surface, border: `1px solid ${p.line}` }} />
                                </div>
                            </div>
                        </div>

                        {/* Zwei kleine Karten */}
                        <div className="grid grid-cols-2 gap-2">
                            {[0, 1].map((i) => (
                                <div key={i} className="flex items-center gap-1.5 rounded-lg p-1.5" style={{ background: p.surface, border: `1px solid ${p.line}` }}>
                                    <div className="h-5 w-5 shrink-0 rounded" style={{ background: i === 0 ? `${p.accent}44` : p.card }} />
                                    <div className="min-w-0 flex-1 space-y-1">
                                        <div className="h-1.5 w-12 rounded-full" style={{ background: p.text, opacity: 0.6 }} />
                                        <div className="h-1 w-8 rounded-full" style={{ background: p.textDim, opacity: 0.45 }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ThemeSwitcherDialog({ onSelect }) {
    const { t } = useTranslation();
    const [pendingMode, setPendingMode] = useState<string | null>(null);
    const [selectedMode, setSelectedMode] = useState<string>(MODE_OPTIONS[0].id);
    const [hoveredMode, setHoveredMode] = useState<string | null>(null);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });
    const previewRef = useRef<HTMLDivElement>(null);

    // Hover zeigt eine Live-Vorschau, Klick fixiert die Auswahl
    const displayedMode = useMemo(
        () => MODE_OPTIONS.find((m) => m.id === (hoveredMode ?? selectedMode)) ?? MODE_OPTIONS[0],
        [hoveredMode, selectedMode]
    );

    // Pfeiltasten navigieren, Enter übernimmt das Theme
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const idx = MODE_OPTIONS.findIndex((m) => m.id === selectedMode);
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                e.preventDefault();
                setSelectedMode(MODE_OPTIONS[(idx + 1) % MODE_OPTIONS.length].id);
                setHoveredMode(null);
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault();
                setSelectedMode(MODE_OPTIONS[(idx - 1 + MODE_OPTIONS.length) % MODE_OPTIONS.length].id);
                setHoveredMode(null);
            } else if (e.key === 'Enter' && !pendingMode) {
                e.preventDefault();
                handleSelect(displayedMode.id);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedMode, displayedMode.id, pendingMode]);

    // Hintergrund-Partikel (einmalig zufällig erzeugt)
    const particles = useMemo(
        () =>
            Array.from({ length: 14 }, (_, i) => ({
                left: Math.random() * 100,
                size: 2 + Math.random() * 3,
                duration: 9 + Math.random() * 10,
                delay: Math.random() * 10,
                cyan: i % 4 === 0,
            })),
        []
    );

    const handleSelect = async (mode) => {
        if (pendingMode) {
            return;
        }

        setPendingMode(mode);
        try {
            await onSelect(mode);
        } finally {
            setPendingMode(null);
        }
    };

    const handleTilt = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = previewRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
        setTilt({ x, y });
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-background/75 p-5 backdrop-blur-xl sm:p-6">
            {/* Ambient-Hintergrund */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_-5%,hsla(var(--primary),0.20),transparent_35%),radial-gradient(circle_at_90%_105%,hsla(var(--secondary),0.16),transparent_35%)]" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />

            {/* Schwebende Partikel */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                {particles.map((pt, i) => (
                    <span
                        key={i}
                        className={cn('absolute bottom-[-10px] rounded-full', pt.cyan ? 'bg-cyan-300/35' : 'bg-violet-400/35')}
                        style={{
                            left: `${pt.left}%`,
                            width: pt.size,
                            height: pt.size,
                            animation: `particle-rise ${pt.duration}s linear ${pt.delay}s infinite`,
                        }}
                    />
                ))}
            </div>

            <Card className="relative w-full max-w-6xl overflow-hidden border-border/70 bg-card/95 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.85)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300">
                {/* Licht-Kante oben */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-primary/12 via-primary/5 to-transparent" />

                <CardContent className="p-6 sm:p-8 lg:p-10">
                    <div className="mb-7 flex items-start justify-between gap-4">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                                <Palette className="h-3.5 w-3.5 text-primary" />
                                VoidrixClient
                            </div>
                            <div>
                                <h1 className="bg-gradient-to-br from-foreground via-foreground to-foreground/55 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl">
                                    {t('setup.chooseTheme')}
                                </h1>
                                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                                    {t('setup.chooseThemeDesc')}
                                </p>
                            </div>
                        </div>
                        <div className="hidden shrink-0 items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-3 py-1.5 text-[11px] text-muted-foreground sm:flex">
                            <span className="font-semibold text-foreground">{MODE_OPTIONS.length}</span>
                            Themes
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
                        {/* Theme-Liste */}
                        <div className="rounded-2xl border border-border/70 bg-background/50 p-3" onMouseLeave={() => setHoveredMode(null)}>
                            <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                Theme Menu
                            </div>
                            <div className="space-y-1.5">
                                {MODE_OPTIONS.map((mode, index) => {
                                    const Icon = mode.icon;
                                    const isActive = selectedMode === mode.id;
                                    return (
                                        <button
                                            key={mode.id}
                                            onClick={() => setSelectedMode(mode.id)}
                                            onMouseEnter={() => setHoveredMode(mode.id)}
                                            className={cn(
                                                'group w-full rounded-xl border p-2.5 text-left transition-all duration-200 animate-in fade-in slide-in-from-left-2 fill-mode-backwards',
                                                isActive
                                                    ? 'border-primary/40 bg-primary/10 shadow-[0_12px_30px_-22px_rgba(124,58,237,0.9)]'
                                                    : 'border-transparent bg-background/45 hover:translate-x-0.5 hover:border-border/70 hover:bg-background/70'
                                            )}
                                            style={{ animationDelay: `${index * 55}ms`, animationDuration: '350ms' }}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                {/* Theme-Farb-Swatch */}
                                                <div
                                                    className={cn(
                                                        'relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border transition-transform duration-200 group-hover:scale-105',
                                                        mode.swatch,
                                                        isActive ? 'border-primary/50 shadow-[0_0_14px_-2px_rgba(124,58,237,0.55)]' : 'border-border/60'
                                                    )}
                                                >
                                                    <Icon className="h-4 w-4 text-white/85 drop-shadow" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-foreground">{t(mode.titleKey)}</p>
                                                    <p className="truncate text-xs text-muted-foreground">{mode.badge}</p>
                                                </div>
                                                <CheckCircle2
                                                    className={cn(
                                                        'ml-auto h-4 w-4 shrink-0 text-primary transition-all duration-200',
                                                        isActive ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
                                                    )}
                                                />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-3 flex items-start gap-2 rounded-xl border border-border/60 bg-background/45 px-3 py-2 text-[11px] leading-4 text-muted-foreground">
                                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                                <span>Here are our designs that you can use, but you can change them at any time.</span>
                            </div>
                            <div className="mt-2 px-2 text-[10px] text-muted-foreground/60">
                                Tipp: Mit ↑ ↓ wechseln, Enter übernimmt.
                            </div>
                        </div>

                        {/* Vorschau */}
                        <div
                            className="relative overflow-hidden rounded-2xl border border-border/70 bg-background/55 p-4 transition-shadow duration-500"
                            style={{ boxShadow: `0 0 50px -22px ${displayedMode.palette.accent}99` }}
                        >
                            <div className={cn('pointer-events-none absolute inset-0 bg-gradient-to-br opacity-95 transition-opacity duration-500', displayedMode.accentClass)} />
                            <div key={displayedMode.id} className="relative space-y-4 animate-in fade-in zoom-in-[0.98] duration-300">
                                {/* 3D-Tilt beim Bewegen der Maus */}
                                <div
                                    ref={previewRef}
                                    onMouseMove={handleTilt}
                                    onMouseLeave={() => setTilt({ x: 0, y: 0 })}
                                    style={{
                                        transform: `perspective(1000px) rotateY(${tilt.x * 3}deg) rotateX(${tilt.y * -3}deg)`,
                                        transition: 'transform 180ms ease-out',
                                    }}
                                >
                                    <ThemePreviewMock mode={displayedMode} />
                                </div>

                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="mb-1 flex items-center gap-2">
                                            <h2 className="text-2xl font-semibold text-foreground">{t(displayedMode.titleKey)}</h2>
                                            <Badge variant="secondary" className="h-5 px-2 text-[10px] uppercase tracking-wide">
                                                {displayedMode.badge}
                                            </Badge>
                                        </div>
                                        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t(displayedMode.descriptionKey)}</p>
                                    </div>

                                    {/* Farbpalette des Themes */}
                                    <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-2.5 py-1.5">
                                        {[displayedMode.palette.bg, displayedMode.palette.surface, displayedMode.palette.accent, displayedMode.palette.accent2].map((c, i) => (
                                            <span
                                                key={i}
                                                className="h-4 w-4 rounded-full border border-white/15 transition-transform hover:scale-125"
                                                style={{ background: c }}
                                                title={c}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <Button
                                    className={cn('group/btn relative w-full overflow-hidden rounded-xl py-5 text-sm font-semibold shadow-lg transition-transform active:scale-[0.99]', displayedMode.buttonClass)}
                                    disabled={Boolean(pendingMode)}
                                    onClick={() => handleSelect(displayedMode.id)}
                                >
                                    {/* Glanz-Sweep über den Button */}
                                    <span className="pointer-events-none absolute inset-y-0 w-1/3 -translate-x-[220%] skew-x-[-20deg] bg-white/20 blur-sm transition-transform duration-700 group-hover/btn:translate-x-[420%]" />
                                    {pendingMode === displayedMode.id ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            {t('common.loading')}
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="h-4 w-4" />
                                            {t(displayedMode.actionKey)}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <style>{`
                @keyframes lava-card {
                    0% { transform: translateX(-20%); }
                    100% { transform: translateX(20%); }
                }
                @keyframes water-card {
                    0%, 100% { transform: translateX(-4%) translateY(0%); }
                    50% { transform: translateX(4%) translateY(2%); }
                }
                @keyframes mock-shimmer {
                    0% { transform: translateX(-120%); }
                    55%, 100% { transform: translateX(420%); }
                }
                @keyframes particle-rise {
                    0% { transform: translateY(0); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 0.6; }
                    100% { transform: translateY(-105vh); opacity: 0; }
                }
            `}</style>
        </div>
    );
}
