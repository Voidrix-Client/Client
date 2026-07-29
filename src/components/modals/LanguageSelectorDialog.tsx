import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Info, Languages, MoveRight, Search, SearchX, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';

const languages = [
    { code: 'en_us', name: 'English (US)', region: 'United States' },
    { code: 'en_uk', name: 'English (UK)', region: 'United Kingdom' },
    { code: 'de_de', name: 'Deutsch', region: 'Deutschland' },
    { code: 'de_ch', name: 'Deutsch (CH)', region: 'Schweiz' },
    { code: 'fr_fr', name: 'Français', region: 'France' },
    { code: 'es_es', name: 'Español', region: 'España' },
    { code: 'it_it', name: 'Italiano', region: 'Italia' },
    { code: 'pl_pl', name: 'Polski', region: 'Polska' },
    { code: 'pt_br', name: 'Português (BR)', region: 'Brasil' },
    { code: 'pt_pt', name: 'Português (PT)', region: 'Portugal' },
    { code: 'ru_ru', name: 'Русский', region: 'Россия' },
    { code: 'sv_se', name: 'Svenska', region: 'Sverige' },
    { code: 'sk_sk', name: 'Slovenčina', region: 'Slovensko' },
    { code: 'sl_si', name: 'Slovenščina', region: 'Slovenija' },
    { code: 'ro_ro', name: 'Română', region: 'România' }
];

/** Native Begrüßung pro Sprache — erscheint beim Hover und im Header-Rotator */
const GREETINGS: Record<string, string> = {
    en_us: 'Hello!',
    en_uk: 'Hello!',
    de_de: 'Hallo!',
    de_ch: 'Grüezi!',
    fr_fr: 'Bonjour !',
    es_es: '¡Hola!',
    it_it: 'Ciao!',
    pl_pl: 'Cześć!',
    pt_br: 'Olá!',
    pt_pt: 'Olá!',
    ru_ru: 'Привет!',
    sv_se: 'Hej!',
    sk_sk: 'Ahoj!',
    sl_si: 'Živjo!',
    ro_ro: 'Salut!'
};

/** Frage „erkannt — übernehmen?“ in der jeweils erkannten Sprache */
const DETECTED_PHRASES: Record<string, string> = {
    en_us: 'We detected English — use it?',
    en_uk: 'We detected English (UK) — use it?',
    de_de: 'Deutsch erkannt — übernehmen?',
    de_ch: 'Deutsch (Schweiz) erkannt — übernehmen?',
    fr_fr: 'Français détecté — l’utiliser ?',
    es_es: 'Español detectado — ¿usarlo?',
    it_it: 'Italiano rilevato — usarlo?',
    pl_pl: 'Wykryto język polski — użyć?',
    pt_br: 'Português (BR) detectado — usar?',
    pt_pt: 'Português detectado — usar?',
    ru_ru: 'Обнаружен русский — использовать?',
    sv_se: 'Svenska upptäckt — använd?',
    sk_sk: 'Zistená slovenčina — použiť?',
    sl_si: 'Zaznana slovenščina — uporabi?',
    ro_ro: 'Română detectată — folosiți?'
};

/** Systemsprache auf eine verfügbare Sprache abbilden (z. B. "de-CH" → de_ch, "de" → de_de) */
function detectSystemLanguage(): string | null {
    const candidates = [...(navigator.languages ?? []), navigator.language].filter(Boolean);
    const prefixMap: Record<string, string> = {
        en: 'en_us', de: 'de_de', fr: 'fr_fr', es: 'es_es', it: 'it_it', pl: 'pl_pl',
        pt: 'pt_pt', ru: 'ru_ru', sv: 'sv_se', sk: 'sk_sk', sl: 'sl_si', ro: 'ro_ro'
    };
    for (const raw of candidates) {
        const norm = raw.toLowerCase().replace('-', '_');
        const exact = languages.find((l) => l.code === norm);
        if (exact) return exact.code;
        if (norm === 'en_gb') return 'en_uk';
        const prefix = norm.split('_')[0];
        if (prefixMap[prefix]) return prefixMap[prefix];
    }
    return null;
}

/**
 * Echte Mini-Flaggen als SVG — Emoji-Flaggen werden unter Windows nicht gerendert.
 * viewBox 60x40, wird vom Wrapper abgerundet.
 */
function Flag({ code, className }: { code: string; className?: string }) {
    const flags: Record<string, React.ReactNode> = {
        en_us: (
            <>
                <rect width="60" height="40" fill="#fff" />
                {[0, 2, 4, 6, 8, 10, 12].map((i) => (
                    <rect key={i} y={(i * 40) / 13} width="60" height={40 / 13} fill="#B22234" />
                ))}
                <rect width="26" height={(40 / 13) * 7} fill="#3C3B6E" />
            </>
        ),
        en_uk: (
            <>
                <rect width="60" height="40" fill="#012169" />
                <path d="M0,0 L60,40 M60,0 L0,40" stroke="#fff" strokeWidth="8" />
                <path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" strokeWidth="3.5" />
                <path d="M30,0 V40 M0,20 H60" stroke="#fff" strokeWidth="12" />
                <path d="M30,0 V40 M0,20 H60" stroke="#C8102E" strokeWidth="7" />
            </>
        ),
        de_de: (
            <>
                <rect width="60" height="13.33" fill="#000" />
                <rect y="13.33" width="60" height="13.33" fill="#DD0000" />
                <rect y="26.66" width="60" height="13.34" fill="#FFCE00" />
            </>
        ),
        de_ch: (
            <>
                <rect width="60" height="40" fill="#DA291C" />
                <rect x="26" y="8" width="8" height="24" fill="#fff" />
                <rect x="18" y="16" width="24" height="8" fill="#fff" />
            </>
        ),
        fr_fr: (
            <>
                <rect width="20" height="40" fill="#002654" />
                <rect x="20" width="20" height="40" fill="#fff" />
                <rect x="40" width="20" height="40" fill="#CE1126" />
            </>
        ),
        es_es: (
            <>
                <rect width="60" height="10" fill="#AA151B" />
                <rect y="10" width="60" height="20" fill="#F1BF00" />
                <rect y="30" width="60" height="10" fill="#AA151B" />
                <rect x="12" y="16" width="7" height="9" rx="1.5" fill="#AA151B" />
            </>
        ),
        it_it: (
            <>
                <rect width="20" height="40" fill="#009246" />
                <rect x="20" width="20" height="40" fill="#fff" />
                <rect x="40" width="20" height="40" fill="#CE2B37" />
            </>
        ),
        pl_pl: (
            <>
                <rect width="60" height="20" fill="#fff" />
                <rect y="20" width="60" height="20" fill="#DC143C" />
            </>
        ),
        pt_br: (
            <>
                <rect width="60" height="40" fill="#009C3B" />
                <polygon points="30,5 55,20 30,35 5,20" fill="#FFDF00" />
                <circle cx="30" cy="20" r="8.5" fill="#002776" />
            </>
        ),
        pt_pt: (
            <>
                <rect width="24" height="40" fill="#046A38" />
                <rect x="24" width="36" height="40" fill="#DA291C" />
                <circle cx="24" cy="20" r="7.5" fill="#FFE900" />
                <circle cx="24" cy="20" r="4" fill="#DA291C" />
            </>
        ),
        ru_ru: (
            <>
                <rect width="60" height="13.33" fill="#fff" />
                <rect y="13.33" width="60" height="13.33" fill="#0039A6" />
                <rect y="26.66" width="60" height="13.34" fill="#D52B1E" />
            </>
        ),
        sv_se: (
            <>
                <rect width="60" height="40" fill="#006AA7" />
                <rect x="17" width="8" height="40" fill="#FECC02" />
                <rect y="16" width="60" height="8" fill="#FECC02" />
            </>
        ),
        sk_sk: (
            <>
                <rect width="60" height="13.33" fill="#fff" />
                <rect y="13.33" width="60" height="13.33" fill="#0B4EA2" />
                <rect y="26.66" width="60" height="13.34" fill="#EE1C25" />
                <path d="M14,10 h12 v12 q0,6 -6,8 q-6,-2 -6,-8 z" fill="#EE1C25" stroke="#fff" strokeWidth="1.5" />
                <path d="M20,13 v12 M16.5,17 h7" stroke="#fff" strokeWidth="2" />
            </>
        ),
        sl_si: (
            <>
                <rect width="60" height="13.33" fill="#fff" />
                <rect y="13.33" width="60" height="13.33" fill="#005CE5" />
                <rect y="26.66" width="60" height="13.34" fill="#ED1C24" />
                <path d="M12,8 h12 v9 q0,5 -6,7 q-6,-2 -6,-7 z" fill="#005CE5" stroke="#fff" strokeWidth="1.5" />
                <path d="M14.5,17 l3,-4 2.5,3 2.5,-3 3,4" fill="none" stroke="#fff" strokeWidth="1.5" />
            </>
        ),
        ro_ro: (
            <>
                <rect width="20" height="40" fill="#002B7F" />
                <rect x="20" width="20" height="40" fill="#FCD116" />
                <rect x="40" width="20" height="40" fill="#CE1126" />
            </>
        ),
    };

    return (
        <div className={cn('relative shrink-0 overflow-hidden rounded-md border border-white/15 shadow-md', className)}>
            <svg viewBox="0 0 60 40" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
                {flags[code] ?? <rect width="60" height="40" fill="#334" />}
            </svg>
            {/* Gloss-Overlay */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-black/20" />
        </div>
    );
}

const THEME_ACCENTS = {
    voidrix_lava: {
        glow: 'rgba(249, 115, 22, 0.22)',
        border: 'border-orange-500/30',
        text: 'text-orange-300'
    },
    voidrix_water: {
        glow: 'rgba(56, 189, 248, 0.22)',
        border: 'border-sky-500/30',
        text: 'text-sky-300'
    }
} as const;

export default function LanguageSelectorDialog({ onSelect, themeId = 'voidrix_default' }) {
    const { t, i18n } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [hoveredCode, setHoveredCode] = useState<string | null>(null);
    const [highlightIndex, setHighlightIndex] = useState(-1);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const cardRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

    const handleSelect = (code) => {
        i18n.changeLanguage(code);
        onSelect(code);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (cardRef.current) {
            const rect = cardRef.current.getBoundingClientRect();
            setMousePosition({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            });
        }
    };

    // Empfohlene Sprache anhand der Systemsprache, nach vorne sortiert
    const recommendedCode = useMemo(() => detectSystemLanguage(), []);
    const sortedLanguages = useMemo(() => {
        if (!recommendedCode) return languages;
        return [...languages].sort((a, b) =>
            (a.code === recommendedCode ? -1 : 0) - (b.code === recommendedCode ? -1 : 0)
        );
    }, [recommendedCode]);

    const filteredLanguages = useMemo(
        () =>
            sortedLanguages.filter(
                (lang) =>
                    searchQuery === '' ||
                    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    lang.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    lang.code.toLowerCase().includes(searchQuery.toLowerCase())
            ),
        [searchQuery, sortedLanguages]
    );

    // Rotierender Gruß im Header
    const greetingWords = useMemo(() => [...new Set(Object.values(GREETINGS))], []);
    const [greetingIndex, setGreetingIndex] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setGreetingIndex((i) => (i + 1) % greetingWords.length), 1800);
        return () => clearInterval(id);
    }, [greetingWords.length]);

    // Bei neuer Suche Markierung zurücksetzen
    useEffect(() => {
        setHighlightIndex(-1);
    }, [searchQuery]);

    // Pfeiltasten: Raster navigieren (2 Spalten) · Enter: auswählen · Escape: Suche leeren
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const count = filteredLanguages.length;
            if (count === 0) return;
            const cols = 2;
            const move = (delta: number) => {
                e.preventDefault();
                setHighlightIndex((prev) => {
                    const next = prev === -1 ? 0 : Math.min(count - 1, Math.max(0, prev + delta));
                    const code = filteredLanguages[next]?.code;
                    if (code) itemRefs.current[code]?.scrollIntoView({ block: 'nearest' });
                    return next;
                });
            };
            if (e.key === 'ArrowDown') move(cols);
            else if (e.key === 'ArrowUp') move(-cols);
            else if (e.key === 'ArrowRight') move(1);
            else if (e.key === 'ArrowLeft') move(-1);
            else if (e.key === 'Enter') {
                e.preventDefault();
                const target = highlightIndex >= 0 ? filteredLanguages[highlightIndex] : undefined;
                handleSelect(target ? target.code : i18n.language);
            } else if (e.key === 'Escape') {
                setSearchQuery('');
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filteredLanguages, highlightIndex, i18n.language]);

    // Hintergrund-Partikel (einmalig zufällig erzeugt)
    const particles = useMemo(
        () =>
            Array.from({ length: 12 }, (_, i) => ({
                left: Math.random() * 100,
                size: 2 + Math.random() * 3,
                duration: 10 + Math.random() * 10,
                delay: Math.random() * 10,
                cyan: i % 4 === 0,
            })),
        []
    );

    const currentLanguage = languages.find((lang) => lang.code === i18n.language);
    const accent = (THEME_ACCENTS as any)[themeId] || {
        glow: 'rgba(124, 58, 237, 0.22)',
        border: 'border-primary/30',
        text: 'text-primary'
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-background/75 p-6 backdrop-blur-xl">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-black to-background/70" />
                <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full blur-[110px] animate-pulse" style={{ backgroundColor: accent.glow }} />
                <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full blur-[110px] animate-pulse" style={{ backgroundColor: accent.glow, animationDelay: '2s' }} />
                {/* Dezentes Raster */}
                <div className="absolute inset-0 opacity-[0.3] [background-image:linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
                {/* Schwebende Partikel */}
                {particles.map((pt, i) => (
                    <span
                        key={i}
                        className={cn('absolute bottom-[-10px] rounded-full', pt.cyan ? 'bg-cyan-300/35' : 'bg-violet-400/35')}
                        style={{
                            left: `${pt.left}%`,
                            width: pt.size,
                            height: pt.size,
                            animation: `lang-particle-rise ${pt.duration}s linear ${pt.delay}s infinite`,
                        }}
                    />
                ))}
            </div>

            <div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                className="relative w-full max-w-5xl animate-in fade-in zoom-in-95 duration-300"
            >
                {/* Spotlight folgt der Maus */}
                <div
                    className="pointer-events-none absolute inset-0 rounded-3xl transition-opacity duration-300"
                    style={{
                        background: `radial-gradient(circle 220px at ${mousePosition.x}px ${mousePosition.y}px, ${accent.glow}, transparent)`,
                        opacity: mousePosition.x > 0 ? 1 : 0,
                    }}
                />

                <Card className={cn('relative overflow-hidden border bg-card/90 backdrop-blur-xl shadow-2xl', accent.border)}>
                    <div className="absolute top-0 h-px w-full bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
                    <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full blur-3xl" style={{ backgroundColor: accent.glow }} />
                    <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full blur-3xl" style={{ backgroundColor: accent.glow }} />

                    <CardContent className="p-6 sm:p-8">
                        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-3">
                                <div className={cn('inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em]', accent.border)}>
                                    <Languages className={cn('h-3.5 w-3.5', accent.text)} />
                                    <span className={accent.text}>VoidrixClient</span>
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-baseline gap-3">
                                        <h1 className="bg-gradient-to-br from-foreground via-foreground to-foreground/55 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl">
                                            {t('setup.chooseLanguage')}
                                        </h1>
                                        {/* Rotierender Gruß in wechselnden Sprachen */}
                                        <span
                                            key={greetingIndex}
                                            className="inline-block text-lg font-semibold text-primary/80 animate-in fade-in slide-in-from-bottom-2 duration-300 sm:text-xl"
                                        >
                                            {greetingWords[greetingIndex]}
                                        </span>
                                    </div>
                                    <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                                        {t('setup.chooseLanguageDesc')}
                                    </p>
                                </div>
                            </div>

                            {/* Aktuelle Sprache mit Flagge */}
                            <div className="relative flex items-center gap-3 self-start rounded-2xl border border-border/70 bg-background/45 px-4 py-3 backdrop-blur-sm">
                                {currentLanguage && <Flag code={currentLanguage.code} className="h-7 w-10" />}
                                <div>
                                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{t('settings.general.language')}</p>
                                    <p className="mt-0.5 text-sm font-medium text-foreground">
                                        {currentLanguage?.name || i18n.language}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Systemsprache erkannt → Ein-Klick-Empfehlung */}
                        {recommendedCode && recommendedCode !== i18n.language && (
                            <button
                                onClick={() => handleSelect(recommendedCode)}
                                className="group/rec mb-4 flex w-full items-center gap-3 overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-r from-primary/12 via-primary/5 to-transparent px-4 py-2.5 text-left transition-all hover:border-primary/50 hover:from-primary/18 animate-in fade-in slide-in-from-top-1 duration-300"
                            >
                                <Flag code={recommendedCode} className="h-6 w-9" />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-foreground">
                                        {DETECTED_PHRASES[recommendedCode]}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground">
                                        {languages.find((l) => l.code === recommendedCode)?.name}
                                    </p>
                                </div>
                                <span className="flex h-7 shrink-0 items-center gap-1.5 rounded-full border border-primary/40 bg-primary/15 px-3 text-xs font-semibold text-primary transition-transform group-hover/rec:scale-105">
                                    <Check className="h-3.5 w-3.5" />
                                    OK
                                </span>
                            </button>
                        )}

                        {/* Suche */}
                        <div className="mb-4">
                            <div className="group relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder={`${t('common.search')}…`}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full rounded-xl border border-border bg-background/50 py-2.5 pl-9 pr-16 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
                                />
                                <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 text-[10px] text-muted-foreground/60 sm:flex">
                                    <kbd className="rounded border border-border/70 bg-background/70 px-1 py-0.5">↑↓</kbd>
                                    <kbd className="rounded border border-border/70 bg-background/70 px-1 py-0.5">↵</kbd>
                                </span>
                            </div>
                        </div>

                        {/* Sprachen-Raster */}
                        <div className="grid max-h-[48vh] grid-cols-1 content-start gap-2 overflow-y-auto pr-1 sm:grid-cols-2 custom-scrollbar">
                            {filteredLanguages.map((lang, index) => {
                                const isCurrent = lang.code === i18n.language;
                                const isHovered = hoveredCode === lang.code;
                                const isHighlighted = highlightIndex === index;

                                return (
                                    <button
                                        key={lang.code}
                                        ref={(el) => { itemRefs.current[lang.code] = el; }}
                                        onClick={() => handleSelect(lang.code)}
                                        onMouseEnter={() => setHoveredCode(lang.code)}
                                        onMouseLeave={() => setHoveredCode(null)}
                                        className={cn(
                                            'group relative overflow-hidden rounded-xl border p-3 text-left transition-all duration-200 animate-in fade-in slide-in-from-bottom-1 fill-mode-backwards',
                                            isCurrent
                                                ? 'border-primary/45 bg-primary/10 shadow-lg shadow-primary/10'
                                                : 'border-border bg-background/45 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/5',
                                            isHighlighted && 'ring-2 ring-primary/60'
                                        )}
                                        style={{ animationDelay: `${Math.min(index, 10) * 30}ms`, animationDuration: '300ms' }}
                                    >
                                        {/* Licht-Sweep beim Hover */}
                                        <div
                                            className={cn(
                                                'absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 transition-all duration-500',
                                                isHovered ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
                                            )}
                                        />

                                        <div className="relative flex items-center justify-between">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <Flag
                                                    code={lang.code}
                                                    className={cn(
                                                        'h-8 w-11 origin-left transition-transform duration-300',
                                                        (isHovered || isCurrent) && 'scale-105',
                                                        isHovered && 'animate-[flag-wave_0.9s_ease-in-out]'
                                                    )}
                                                />
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <p className={cn('truncate font-medium transition-colors duration-300', isHovered ? 'text-primary' : 'text-foreground')}>
                                                            {lang.name}
                                                        </p>
                                                        {lang.code === recommendedCode && (
                                                            <span
                                                                title="Systemsprache"
                                                                className="flex h-4 shrink-0 items-center gap-0.5 rounded-full border border-primary/35 bg-primary/12 px-1.5 text-[9px] font-semibold uppercase tracking-wide text-primary"
                                                            >
                                                                <Sparkles className="h-2.5 w-2.5" />
                                                                Auto
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                        {lang.region}
                                                        <span className="ml-1.5 uppercase tracking-[0.14em] text-muted-foreground/60">· {lang.code.replace('_', '-')}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            {/* Native Begrüßung beim Hover */}
                                            <span
                                                className={cn(
                                                    'pointer-events-none ml-auto mr-2 hidden shrink-0 rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary transition-all duration-300 sm:inline-block',
                                                    isHovered ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
                                                )}
                                            >
                                                {GREETINGS[lang.code]}
                                            </span>
                                            <div
                                                className={cn(
                                                    'ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-300',
                                                    isCurrent
                                                        ? 'border-primary/40 bg-primary text-primary-foreground'
                                                        : 'border-border bg-background/60 text-muted-foreground',
                                                    isHovered && !isCurrent && 'scale-110 border-primary/50 bg-primary/10 text-primary'
                                                )}
                                            >
                                                {isCurrent ? (
                                                    <Check className="h-3.5 w-3.5" />
                                                ) : (
                                                    <MoveRight className={cn('h-3.5 w-3.5 transition-transform duration-300', isHovered && 'translate-x-0.5')} />
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}

                            {/* Leerer Zustand */}
                            {filteredLanguages.length === 0 && (
                                <div className="col-span-full flex flex-col items-center gap-2 py-10 text-muted-foreground animate-in fade-in duration-200">
                                    <SearchX className="h-8 w-8 opacity-50" />
                                    <p className="text-sm">„{searchQuery}“ — 0 / {languages.length}</p>
                                    <button onClick={() => setSearchQuery('')} className="text-xs text-primary underline-offset-2 hover:underline">
                                        Reset
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                <span className="text-xs text-muted-foreground">
                                    {searchQuery ? `${filteredLanguages.length} / ${languages.length}` : languages.length} languages
                                </span>
                            </div>
                            <Button
                                onClick={() => handleSelect(i18n.language)}
                                variant="outline"
                                className="group/skip relative overflow-hidden rounded-xl border-border bg-background/50 text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
                            >
                                <span className="pointer-events-none absolute inset-y-0 w-1/3 -translate-x-[220%] skew-x-[-20deg] bg-white/10 blur-sm transition-transform duration-700 group-hover/skip:translate-x-[420%]" />
                                <span>{t('setup.skipSelection')}</span>
                                <MoveRight className="ml-2 h-4 w-4 transition-transform group-hover/skip:translate-x-0.5" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(168, 85, 247, 0.3);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(168, 85, 247, 0.5);
                }
                @keyframes flag-wave {
                    0%, 100% { transform: perspective(200px) rotateY(0deg) scale(1.05); }
                    30% { transform: perspective(200px) rotateY(-14deg) scale(1.05); }
                    60% { transform: perspective(200px) rotateY(9deg) scale(1.05); }
                }
                @keyframes lang-particle-rise {
                    0% { transform: translateY(0); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 0.6; }
                    100% { transform: translateY(-105vh); opacity: 0; }
                }
            `}</style>
        </div>
    );
}
