import React, { useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ExternalLink } from 'lucide-react';

interface AgreementModalProps {
    onAccept: () => void;
    onDecline: () => void;
    themeId?: string;
}

const THEME_ACCENTS = {
    voidrix_lava: { glow: 'rgba(249,115,22,0.22)', border: 'border-orange-500/30', softBg: 'bg-orange-500/10', text: 'text-orange-300', g1: '#fb923c', g2: '#ef4444' },
    voidrix_water: { glow: 'rgba(56,189,248,0.22)', border: 'border-sky-500/30', softBg: 'bg-sky-500/10', text: 'text-sky-300', g1: '#38bdf8', g2: '#22d3ee' }
} as const;

const DEFAULT_ACCENT = {
    glow: 'rgba(124,58,237,0.22)',
    border: 'border-primary/30',
    softBg: 'bg-primary/10',
    text: 'text-primary',
    g1: '#c084fc',
    g2: '#22d3ee'
};

const LAST_UPDATE = '01. April 2026';

type ViewId = 'main' | 'privacy' | 'collect' | 'optout';
type Accent = typeof DEFAULT_ACCENT;

/* ============================================================
   Eigenes Icon-Set — handgezeichnete SVGs mit Voidrix-Verlauf
   ============================================================ */

type VIconProps = { className?: string; g1?: string; g2?: string };

// Eindeutige Gradient-ID pro Icon UND Farbkombination, damit sich
// mehrfach verwendete Icons mit unterschiedlichen Farben nicht überschreiben.
const iconBase = (name: string, g1: string, g2: string, render: (u: string) => React.ReactNode, className?: string) => {
    const id = `${name}-${g1.replace('#', '')}-${g2.replace('#', '')}`;
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
            <defs>
                <linearGradient id={id} x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stopColor={g1} />
                    <stop offset="1" stopColor={g2} />
                </linearGradient>
            </defs>
            {render(`url(#${id})`)}
        </svg>
    );
};

const VShield = ({ className, g1 = '#c084fc', g2 = '#22d3ee' }: VIconProps) =>
    iconBase('vg-shield', g1, g2, (u) => (
        <>
            <path d="M12 2.8 L19.5 5.6 V11 C19.5 15.8 16.4 19.6 12 21.2 C7.6 19.6 4.5 15.8 4.5 11 V5.6 Z"
                stroke={u} strokeWidth="1.7" strokeLinejoin="round" fill={u} fillOpacity="0.12" />
            <path d="M8.8 11.6 L11 13.8 L15.2 9.4" stroke={u} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </>
    ), className);

const VLock = ({ className, g1 = '#c084fc', g2 = '#22d3ee' }: VIconProps) =>
    iconBase('vg-lock', g1, g2, (u) => (
        <>
            <rect x="4.8" y="10" width="14.4" height="10" rx="2.6" stroke={u} strokeWidth="1.7" fill={u} fillOpacity="0.12" />
            <path d="M8 10 V7.6 A4 4 0 0 1 16 7.6 V10" stroke={u} strokeWidth="1.7" strokeLinecap="round" />
            <circle cx="12" cy="14.4" r="1.5" fill={u} />
            <path d="M12 15.6 V17.4" stroke={u} strokeWidth="1.6" strokeLinecap="round" />
        </>
    ), className);

const VChart = ({ className, g1 = '#c084fc', g2 = '#22d3ee' }: VIconProps) =>
    iconBase('vg-chart', g1, g2, (u) => (
        <>
            <path d="M4 20 H20" stroke={u} strokeWidth="1.7" strokeLinecap="round" />
            <rect x="5.6" y="12" width="3.2" height="5.6" rx="1.1" fill={u} fillOpacity="0.9" />
            <rect x="10.4" y="8.4" width="3.2" height="9.2" rx="1.1" fill={u} fillOpacity="0.65" />
            <rect x="15.2" y="10.4" width="3.2" height="7.2" rx="1.1" fill={u} fillOpacity="0.8" />
            <path d="M18.5 4.2 L19.1 5.7 L20.6 6.3 L19.1 6.9 L18.5 8.4 L17.9 6.9 L16.4 6.3 L17.9 5.7 Z" fill={u} />
        </>
    ), className);

const VDoc = ({ className, g1 = '#c084fc', g2 = '#22d3ee' }: VIconProps) =>
    iconBase('vg-doc', g1, g2, (u) => (
        <>
            <path d="M6.5 3.5 H14 L18.5 8 V20.5 H6.5 Z" stroke={u} strokeWidth="1.7" strokeLinejoin="round" fill={u} fillOpacity="0.1" />
            <path d="M14 3.5 V8 H18.5" stroke={u} strokeWidth="1.7" strokeLinejoin="round" />
            <path d="M9.4 12 H15.6 M9.4 15 H15.6 M9.4 18 H13" stroke={u} strokeWidth="1.5" strokeLinecap="round" />
        </>
    ), className);

const VEyeOff = ({ className, g1 = '#c084fc', g2 = '#22d3ee' }: VIconProps) =>
    iconBase('vg-eyeoff', g1, g2, (u) => (
        <>
            <path d="M3.5 12 C5.5 8 8.5 6 12 6 C15.5 6 18.5 8 20.5 12 C18.5 16 15.5 18 12 18 C8.5 18 5.5 16 3.5 12 Z"
                stroke={u} strokeWidth="1.7" strokeLinejoin="round" fill={u} fillOpacity="0.1" />
            <circle cx="12" cy="12" r="2.6" stroke={u} strokeWidth="1.7" />
            <path d="M5 19.5 L19 4.5" stroke={u} strokeWidth="1.8" strokeLinecap="round" />
        </>
    ), className);

const VData = ({ className, g1 = '#c084fc', g2 = '#22d3ee' }: VIconProps) =>
    iconBase('vg-data', g1, g2, (u) => (
        <>
            <ellipse cx="12" cy="5.6" rx="7" ry="2.6" stroke={u} strokeWidth="1.7" fill={u} fillOpacity="0.15" />
            <path d="M5 5.6 V12 C5 13.4 8.1 14.6 12 14.6 C15.9 14.6 19 13.4 19 12 V5.6" stroke={u} strokeWidth="1.7" />
            <path d="M5 12 V18.4 C5 19.8 8.1 21 12 21 C15.9 21 19 19.8 19 18.4 V12" stroke={u} strokeWidth="1.7" />
        </>
    ), className);

const VClock = ({ className, g1 = '#c084fc', g2 = '#22d3ee' }: VIconProps) =>
    iconBase('vg-clock', g1, g2, (u) => (
        <>
            <circle cx="12" cy="12" r="8.5" stroke={u} strokeWidth="1.7" fill={u} fillOpacity="0.1" />
            <path d="M12 7.5 V12 L15.2 14" stroke={u} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </>
    ), className);

const VMail = ({ className, g1 = '#c084fc', g2 = '#22d3ee' }: VIconProps) =>
    iconBase('vg-mail', g1, g2, (u) => (
        <>
            <rect x="3.5" y="5.5" width="17" height="13" rx="2.4" stroke={u} strokeWidth="1.7" fill={u} fillOpacity="0.1" />
            <path d="M4.5 7.5 L12 13 L19.5 7.5" stroke={u} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </>
    ), className);

const VGear = ({ className, g1 = '#c084fc', g2 = '#22d3ee' }: VIconProps) =>
    iconBase('vg-gear', g1, g2, (u) => (
        <>
            <circle cx="12" cy="12" r="3.2" stroke={u} strokeWidth="1.7" fill={u} fillOpacity="0.15" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
                <path
                    key={a}
                    d="M12 3.2 V5.6"
                    stroke={u}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    transform={`rotate(${a} 12 12)`}
                />
            ))}
            <circle cx="12" cy="12" r="7.2" stroke={u} strokeWidth="1.5" opacity="0.5" />
        </>
    ), className);

const VChat = ({ className, g1 = '#c084fc', g2 = '#22d3ee' }: VIconProps) =>
    iconBase('vg-chat', g1, g2, (u) => (
        <>
            <path d="M4 6.8 C4 5.2 5.2 4 6.8 4 H17.2 C18.8 4 20 5.2 20 6.8 V13.6 C20 15.2 18.8 16.4 17.2 16.4 H10 L6 20 V16.4 H6.8 C5.2 16.4 4 15.2 4 13.6 Z"
                stroke={u} strokeWidth="1.7" strokeLinejoin="round" fill={u} fillOpacity="0.12" />
            <circle cx="8.8" cy="10.2" r="1.1" fill={u} />
            <circle cx="12" cy="10.2" r="1.1" fill={u} />
            <circle cx="15.2" cy="10.2" r="1.1" fill={u} />
        </>
    ), className);

const VCrown = ({ className, g1 = '#c084fc', g2 = '#22d3ee' }: VIconProps) =>
    iconBase('vg-crown', g1, g2, (u) => (
        <>
            <path d="M4.5 17 L3.5 7.5 L8.2 11 L12 5.5 L15.8 11 L20.5 7.5 L19.5 17 Z"
                stroke={u} strokeWidth="1.6" strokeLinejoin="round" fill={u} fillOpacity="0.15" />
            <path d="M4.5 19.5 H19.5" stroke={u} strokeWidth="1.7" strokeLinecap="round" />
        </>
    ), className);

const VSpark = ({ className, g1 = '#c084fc', g2 = '#22d3ee' }: VIconProps) =>
    iconBase('vg-spark', g1, g2, (u) => (
        <>
            <path d="M12 3 L13.6 10.4 L21 12 L13.6 13.6 L12 21 L10.4 13.6 L3 12 L10.4 10.4 Z" fill={u} fillOpacity="0.9" />
        </>
    ), className);

const VGlobe = ({ className, g1 = '#c084fc', g2 = '#22d3ee' }: VIconProps) =>
    iconBase('vg-globe', g1, g2, (u) => (
        <>
            <circle cx="12" cy="12" r="8.5" stroke={u} strokeWidth="1.7" fill={u} fillOpacity="0.08" />
            <path d="M3.5 12 H20.5 M12 3.5 C14.8 6 14.8 18 12 20.5 C9.2 18 9.2 6 12 3.5 Z" stroke={u} strokeWidth="1.5" />
        </>
    ), className);

const VCheckRing = ({ className, g1 = '#34d399', g2 = '#22d3ee' }: VIconProps) =>
    iconBase('vg-okring', g1, g2, (u) => (
        <>
            <circle cx="12" cy="12" r="8.5" stroke={u} strokeWidth="1.7" fill={u} fillOpacity="0.1" />
            <path d="M8.4 12.2 L10.9 14.7 L15.6 9.6" stroke={u} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </>
    ), className);

const VXRing = ({ className, g1 = '#fb7185', g2 = '#f472b6' }: VIconProps) =>
    iconBase('vg-xring', g1, g2, (u) => (
        <>
            <circle cx="12" cy="12" r="8.5" stroke={u} strokeWidth="1.7" fill={u} fillOpacity="0.1" />
            <path d="M9.2 9.2 L14.8 14.8 M14.8 9.2 L9.2 14.8" stroke={u} strokeWidth="1.8" strokeLinecap="round" />
        </>
    ), className);

const VZap = ({ className, g1 = '#fbbf24', g2 = '#c084fc' }: VIconProps) =>
    iconBase('vg-zap', g1, g2, (u) => (
        <>
            <path d="M13.2 2.8 L5.5 13.2 H11 L10.2 21.2 L18.5 10.4 H12.8 Z"
                stroke={u} strokeWidth="1.6" strokeLinejoin="round" fill={u} fillOpacity="0.2" />
        </>
    ), className);

const VScale = ({ className, g1 = '#c084fc', g2 = '#22d3ee' }: VIconProps) =>
    iconBase('vg-scale', g1, g2, (u) => (
        <>
            <path d="M12 4 V19.5 M8 20 H16" stroke={u} strokeWidth="1.7" strokeLinecap="round" />
            <path d="M5.5 7 H18.5" stroke={u} strokeWidth="1.7" strokeLinecap="round" />
            <path d="M5.5 7 L3.2 12.5 A3 3 0 0 0 7.8 12.5 Z" stroke={u} strokeWidth="1.5" strokeLinejoin="round" fill={u} fillOpacity="0.15" />
            <path d="M18.5 7 L16.2 12.5 A3 3 0 0 0 20.8 12.5 Z" stroke={u} strokeWidth="1.5" strokeLinejoin="round" fill={u} fillOpacity="0.15" />
        </>
    ), className);

const VServer = ({ className, g1 = '#c084fc', g2 = '#22d3ee' }: VIconProps) =>
    iconBase('vg-server', g1, g2, (u) => (
        <>
            <rect x="4" y="4" width="16" height="6.4" rx="1.8" stroke={u} strokeWidth="1.7" fill={u} fillOpacity="0.1" />
            <rect x="4" y="13.6" width="16" height="6.4" rx="1.8" stroke={u} strokeWidth="1.7" fill={u} fillOpacity="0.1" />
            <circle cx="7.4" cy="7.2" r="1" fill={u} />
            <circle cx="7.4" cy="16.8" r="1" fill={u} />
            <path d="M11 7.2 H16.6 M11 16.8 H16.6" stroke={u} strokeWidth="1.5" strokeLinecap="round" />
        </>
    ), className);

/* ============================================================
   Wiederverwendbare Bausteine — AUSSERHALB der Hauptkomponente,
   damit React sie bei Re-Renders nicht neu aufbaut (kein
   "Neuladen" der Seite bei Mausbewegung).
   ============================================================ */

function IconTile({ icon: Icon, accent, className }: { icon: React.FC<VIconProps>; accent: Accent; className?: string }) {
    return (
        <div className={`relative flex shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ${className ?? 'h-10 w-10'}`}>
            <div className="absolute inset-0 rounded-xl opacity-40" style={{ background: `radial-gradient(circle at 30% 20%, ${accent.glow}, transparent 70%)` }} />
            <Icon className="relative h-5 w-5" g1={accent.g1} g2={accent.g2} />
        </div>
    );
}

function InfoRow({ icon, title, body, index, accent, numbered }: {
    icon: React.FC<VIconProps>; title: string; body: string; index: number; accent: Accent; numbered?: boolean;
}) {
    return (
        <div
            className="mb-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 transition-colors hover:border-purple-500/25 animate-in fade-in slide-in-from-bottom-1 fill-mode-backwards"
            style={{ animationDelay: `${Math.min(index, 8) * 60}ms`, animationDuration: '300ms' }}
        >
            <div className="flex items-start gap-3">
                <IconTile icon={icon} accent={accent} className="mt-0.5 h-9 w-9" />
                <div className="min-w-0">
                    <h3 className="mb-1 flex items-center gap-2 font-medium text-white">
                        {numbered && (
                            <span className="text-[10px] font-bold tracking-wider text-purple-400/70">
                                {String(index + 1).padStart(2, '0')}
                            </span>
                        )}
                        {title}
                    </h3>
                    <p className="text-sm leading-6 text-gray-400">{body}</p>
                </div>
            </div>
        </div>
    );
}

/** Kennzahl-Chip für die Kopfzeile der Detail-Seiten */
function StatChip({ value, label, index }: { value: string; label: string; index: number }) {
    return (
        <div
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-center animate-in fade-in zoom-in-95 fill-mode-backwards"
            style={{ animationDelay: `${index * 70}ms`, animationDuration: '300ms' }}
        >
            <p className="bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text text-lg font-bold text-transparent">{value}</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wider text-gray-500">{label}</p>
        </div>
    );
}

/** Nummerierter Schritt mit Verbindungslinie (für Anleitungen) */
function StepItem({ step, title, body, isLast }: { step: number; title: string; body: string; isLast?: boolean }) {
    return (
        <div className="relative flex gap-4 pb-5">
            {!isLast && <span className="absolute left-[15px] top-9 bottom-0 w-px bg-gradient-to-b from-purple-500/40 to-transparent" />}
            <span className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-purple-500/40 bg-purple-500/15 text-sm font-bold text-purple-300 shadow-[0_0_14px_-4px_rgba(168,85,247,0.7)]">
                {step}
            </span>
            <div className="pt-1">
                <p className="font-medium text-white">{title}</p>
                <p className="mt-0.5 text-sm leading-6 text-gray-400">{body}</p>
            </div>
        </div>
    );
}

function DetailShell({ title, subtitle, icon, webUrl, accent, onBack, children }: {
    title: string; subtitle: string; icon: React.FC<VIconProps>; webUrl?: string;
    accent: Accent; onBack: () => void; children: React.ReactNode;
}) {
    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Kopf mit Zurück-Button */}
            <div className="mb-5 flex items-center gap-3">
                <button
                    onClick={onBack}
                    className="group flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition-all hover:border-purple-500/40 hover:bg-purple-500/10 hover:text-purple-300"
                >
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                </button>
                <IconTile icon={icon} accent={accent} className="h-9 w-9" />
                <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold text-white">{title}</h2>
                    <p className="truncate text-xs text-gray-500">{subtitle}</p>
                </div>
                <span className="ml-auto hidden shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-gray-500 sm:block">
                    Stand: {LAST_UPDATE}
                </span>
            </div>

            {/* Scrollbarer Inhalt */}
            <div className="max-h-[52vh] overflow-y-auto pr-2 agreement-scrollbar">
                {children}
            </div>

            {/* Fuß: zurück + optional Browser-Version */}
            <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-gray-400 transition-all hover:bg-white/5 hover:text-white"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Zurück
                </button>
                {webUrl && (
                    <a
                        href={webUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-gray-600 transition-colors hover:text-purple-400"
                    >
                        <VGlobe className="h-3.5 w-3.5" g1={accent.g1} g2={accent.g2} />
                        Web-Version öffnen
                        <ExternalLink className="h-3 w-3" />
                    </a>
                )}
            </div>
        </div>
    );
}

/* ====== Inhalte der In-Client-Seiten ====== */

const PRIVACY_SECTIONS: { icon: React.FC<VIconProps>; title: string; body: string }[] = [
    {
        icon: VShield,
        title: 'Kurzfassung',
        body: 'VoidrixClient sammelt so wenig Daten wie möglich. Alles, was wir erfassen, ist anonymisiert, dient ausschließlich der Verbesserung des Launchers und wird niemals verkauft oder für Werbung genutzt.'
    },
    {
        icon: VData,
        title: 'Welche Daten wir verarbeiten',
        body: 'Anonyme Nutzungsstatistiken (z. B. welche Funktionen verwendet werden), technische Basisdaten (App-Version, Betriebssystem) sowie Fehler- und Absturzberichte ohne persönliche Identifikatoren. Modpack-Codes werden nur beim aktiven Erstellen oder Teilen gespeichert und nach 5–7 Tagen automatisch gelöscht.'
    },
    {
        icon: VLock,
        title: 'Speicherung & Sicherheit',
        body: 'Alle Übertragungen sind TLS-verschlüsselt. Daten werden nur so lange gespeichert, wie sie für den jeweiligen Zweck nötig sind, und sind nicht mit deinem Minecraft-Konto verknüpfbar.'
    },
    {
        icon: VClock,
        title: 'Speicherdauer',
        body: 'Nutzungsstatistiken werden aggregiert und spätestens nach 12 Monaten gelöscht. Crash-Berichte werden nach der Auswertung entfernt. Modpack-Codes verfallen automatisch nach 5–7 Tagen.'
    },
    {
        icon: VScale,
        title: 'Rechtsgrundlage',
        body: 'Die Verarbeitung anonymer Nutzungsdaten stützt sich auf dein berechtigtes Interesse an einem stabilen, sich verbessernden Launcher (Art. 6 Abs. 1 lit. f DSGVO) bzw. auf deine Einwilligung, die du mit dieser Zustimmung erteilst und jederzeit widerrufen kannst.'
    },
    {
        icon: VServer,
        title: 'Hosting & Drittanbieter',
        body: 'Unsere Statistik-Server werden von uns selbst betrieben. Es sind keine Werbenetzwerke, Tracking-Dienste oder Social-Media-Pixel eingebunden. Downloads von Mods/Modpacks laufen direkt über die jeweiligen offiziellen Quellen (z. B. Modrinth, CurseForge).'
    },
    {
        icon: VShield,
        title: 'Deine Rechte (DSGVO)',
        body: 'Du hast jederzeit das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung deiner Daten sowie ein Widerspruchsrecht. Ein Opt-Out der Analytics ist jederzeit möglich — ohne Funktionseinschränkung.'
    },
    {
        icon: VGear,
        title: 'Änderungen dieser Erklärung',
        body: 'Wenn sich unsere Datenverarbeitung ändert, aktualisieren wir diese Erklärung und zeigen dir die neue Version beim nächsten Start an. Das Datum oben rechts zeigt immer den aktuellen Stand.'
    },
    {
        icon: VMail,
        title: 'Kontakt',
        body: 'Bei Fragen zum Datenschutz erreichst du uns am schnellsten über den Discord-Server (Antwortzeit < 24h) oder über die Website.'
    }
];

/** Aufbewahrungsfristen für die „Was wird gesammelt?“-Seite */
const RETENTION = [
    { type: 'Nutzungsstatistiken', purpose: 'Verbesserung des Launchers', duration: 'max. 12 Monate' },
    { type: 'Crash-Berichte', purpose: 'Fehlerbehebung', duration: 'bis zur Auswertung' },
    { type: 'App-Version & OS', purpose: 'Kompatibilität', duration: 'max. 12 Monate' },
    { type: 'Modpack-Codes', purpose: 'Teilen mit Freunden', duration: '5–7 Tage' }
];

const COLLECTED = [
    { title: 'App-Version & Betriebssystem', desc: 'Damit Updates und Fehlerbehebungen zur richtigen Umgebung passen.' },
    { title: 'Anonyme Nutzungsstatistiken', desc: 'Welche Bereiche des Launchers genutzt werden — ohne Personenbezug.' },
    { title: 'Crash- & Fehlerberichte', desc: 'Technische Details zum Absturz, bereinigt um persönliche Pfade und Namen.' },
    { title: 'Instanz-/Server-Erstellungen', desc: 'Nur Software und Version (z. B. „Fabric 1.21“), um beliebte Setups zu priorisieren.' }
];

const NOT_COLLECTED = [
    { title: 'Persönliche Identifikatoren', desc: 'Kein Name, keine E-Mail, keine dauerhafte IP-Speicherung.' },
    { title: 'Deine Welten, Chats & Dateien', desc: 'Lokale Inhalte bleiben lokal — wir sehen sie nie.' },
    { title: 'Passwörter & Tokens', desc: 'Zugangsdaten werden ausschließlich lokal und verschlüsselt gespeichert.' },
    { title: 'Werbe-Tracking & Verkauf', desc: 'Keine Werbenetzwerke, kein Verkauf an Dritte. Niemals.' }
];

/* ============================================================ */

const AgreementDialog: React.FC<AgreementModalProps> = ({ onAccept, onDecline, themeId = 'voidrix_default' }) => {
    const [isChecked, setIsChecked] = useState(false);
    const [isAccepted, setIsAccepted] = useState(false);
    const [view, setView] = useState<ViewId>('main');
    const cardRef = useRef<HTMLDivElement>(null);
    const glowRef = useRef<HTMLDivElement>(null);
    const accent: Accent = (THEME_ACCENTS as any)[themeId] || DEFAULT_ACCENT;

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

    // Spotlight folgt der Maus — direkt am DOM, ohne React-State:
    // löst keine Re-Renders aus, die Seite bleibt beim Bewegen stabil.
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current || !glowRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        glowRef.current.style.background = `radial-gradient(circle 200px at ${x}px ${y}px, ${accent.glow}, transparent)`;
        glowRef.current.style.opacity = '1';
    };

    const handleMouseLeave = () => {
        if (glowRef.current) glowRef.current.style.opacity = '0';
    };

    const handleAccept = () => {
        setIsAccepted(true);
        setTimeout(() => onAccept(), 500);
    };

    const goBack = () => setView('main');

    /* ====== Detail-Seiten (im Client, keine Website) ====== */

    const renderPrivacy = () => (
        <DetailShell
            title="Datenschutzerklärung"
            subtitle="Wie VoidrixClient mit deinen Daten umgeht"
            icon={VDoc}
            webUrl="http://voidrixclient.voidrix.de/privacy-policy"
            accent={accent}
            onBack={goBack}
        >
            {/* Auf einen Blick */}
            <div className="mb-4 flex gap-2.5">
                <StatChip value="0" label="Werbetracker" index={0} />
                <StatChip value="100%" label="anonymisiert" index={1} />
                <StatChip value="≤ 12 Mon." label="Speicherdauer" index={2} />
            </div>
            {PRIVACY_SECTIONS.map((s, i) => (
                <InfoRow key={s.title} icon={s.icon} title={s.title} body={s.body} index={i} accent={accent} numbered />
            ))}
        </DetailShell>
    );

    const renderCollect = () => (
        <DetailShell
            title="Was wird gesammelt?"
            subtitle="Volle Transparenz über alle Daten"
            icon={VData}
            webUrl="http://voidrixclient.voidrix.de/data-collection-details"
            accent={accent}
            onBack={goBack}
        >
            <div className="grid gap-4 sm:grid-cols-2">
                {/* Wird gesammelt */}
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4 animate-in fade-in slide-in-from-bottom-1 duration-300">
                    <div className="mb-3 flex items-center gap-2">
                        <VCheckRing className="h-[18px] w-[18px]" />
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-300">Wird erfasst (anonym)</h3>
                    </div>
                    <div className="space-y-3">
                        {COLLECTED.map((item) => (
                            <div key={item.title}>
                                <p className="text-sm font-medium text-white">{item.title}</p>
                                <p className="mt-0.5 text-xs leading-5 text-gray-400">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
                {/* Wird NICHT gesammelt */}
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.05] p-4 animate-in fade-in slide-in-from-bottom-1 duration-300" style={{ animationDelay: '80ms' }}>
                    <div className="mb-3 flex items-center gap-2">
                        <VXRing className="h-[18px] w-[18px]" />
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-rose-300">Wird nie erfasst</h3>
                    </div>
                    <div className="space-y-3">
                        {NOT_COLLECTED.map((item) => (
                            <div key={item.title}>
                                <p className="text-sm font-medium text-white">{item.title}</p>
                                <p className="mt-0.5 text-xs leading-5 text-gray-400">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {/* Datenfluss */}
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-4 animate-in fade-in slide-in-from-bottom-1 duration-300" style={{ animationDelay: '140ms' }}>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">So fließen deine Daten</h3>
                <div className="flex items-center gap-2 text-center">
                    <div className="flex-1 rounded-lg border border-white/10 bg-white/[0.05] px-2 py-3">
                        <VGear className="mx-auto mb-1.5 h-5 w-5" />
                        <p className="text-xs font-medium text-white">Dein Client</p>
                        <p className="mt-0.5 text-[10px] text-gray-500">erzeugt Ereignis</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-purple-400/60" />
                    <div className="flex-1 rounded-lg border border-purple-500/25 bg-purple-500/[0.07] px-2 py-3">
                        <VEyeOff className="mx-auto mb-1.5 h-5 w-5" />
                        <p className="text-xs font-medium text-white">Anonymisierung</p>
                        <p className="mt-0.5 text-[10px] text-gray-500">entfernt Personenbezug</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-purple-400/60" />
                    <div className="flex-1 rounded-lg border border-white/10 bg-white/[0.05] px-2 py-3">
                        <VServer className="mx-auto mb-1.5 h-5 w-5" />
                        <p className="text-xs font-medium text-white">Statistik-Server</p>
                        <p className="mt-0.5 text-[10px] text-gray-500">nur Aggregation</p>
                    </div>
                </div>
            </div>

            {/* Beispiel-Datenpaket */}
            <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/40 animate-in fade-in slide-in-from-bottom-1 duration-300" style={{ animationDelay: '200ms' }}>
                <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-2">
                    <span className="text-xs font-semibold text-gray-400">Beispiel: So sieht ein echtes Analytics-Ereignis aus</span>
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-300">ohne Personenbezug</span>
                </div>
                <pre className="overflow-x-auto p-4 font-mono text-xs leading-6 text-gray-400">
{`{
  "event":    "instance_created",
  "software": "fabric",
  "version":  "1.21.4",
  "app":      "2.0.1",
  "os":       "windows",
  "user":     `}<span className="rounded bg-emerald-500/15 px-1 font-semibold text-emerald-300">null</span>{`   // kein Name, keine ID, keine IP
}`}
                </pre>
            </div>

            {/* Aufbewahrungsfristen */}
            <div className="mt-4 overflow-hidden rounded-xl border border-white/10 animate-in fade-in slide-in-from-bottom-1 duration-300" style={{ animationDelay: '260ms' }}>
                <table className="w-full text-left text-xs">
                    <thead>
                        <tr className="border-b border-white/10 bg-white/[0.05] text-[10px] uppercase tracking-wider text-gray-500">
                            <th className="px-4 py-2.5 font-semibold">Datentyp</th>
                            <th className="px-4 py-2.5 font-semibold">Zweck</th>
                            <th className="px-4 py-2.5 text-right font-semibold">Speicherdauer</th>
                        </tr>
                    </thead>
                    <tbody>
                        {RETENTION.map((row) => (
                            <tr key={row.type} className="border-b border-white/5 bg-white/[0.02] transition-colors last:border-0 hover:bg-purple-500/[0.06]">
                                <td className="px-4 py-2.5 font-medium text-white">{row.type}</td>
                                <td className="px-4 py-2.5 text-gray-400">{row.purpose}</td>
                                <td className="px-4 py-2.5 text-right">
                                    <span className="rounded-full border border-purple-500/25 bg-purple-500/10 px-2 py-0.5 font-medium text-purple-300">{row.duration}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </DetailShell>
    );

    const renderOptout = () => (
        <DetailShell
            title="Analytics Opt-Out"
            subtitle="Deine Daten, deine Entscheidung"
            icon={VChart}
            webUrl="http://voidrixclient.voidrix.de/opt-out"
            accent={accent}
            onBack={goBack}
        >
            <InfoRow
                icon={VEyeOff}
                title="Was bedeutet Opt-Out?"
                body="Mit dem Opt-Out beendet VoidrixClient das Senden anonymer Nutzungsstatistiken vollständig. Der Launcher funktioniert danach ohne jede Einschränkung weiter."
                index={0}
                accent={accent}
            />

            {/* Schritt-für-Schritt-Anleitung */}
            <div className="mb-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 animate-in fade-in slide-in-from-bottom-1 duration-300" style={{ animationDelay: '80ms' }}>
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-400">
                    <VGear className="h-4 w-4" />
                    In 3 Schritten deaktiviert
                </h3>
                <StepItem step={1} title="Einstellungen öffnen" body="Klicke in der Seitenleiste unten auf das Zahnrad." />
                <StepItem step={2} title="Bereich „Datenschutz“ wählen" body="Dort findest du den Punkt Analytics / Nutzungsdaten." />
                <StepItem step={3} title="Schalter deaktivieren" body="Die Änderung gilt sofort — ein Neustart ist nicht nötig." isLast />
                {/* Toggle-Vorschau */}
                <div className="mt-1 flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5">
                    <div>
                        <p className="text-xs font-medium text-white">Anonyme Nutzungsdaten senden</p>
                        <p className="text-[10px] text-gray-500">So sieht der Schalter in den Einstellungen aus</p>
                    </div>
                    <span className="relative inline-flex h-5 w-9 items-center rounded-full border border-white/15 bg-white/10">
                        <span className="ml-0.5 h-4 w-4 rounded-full bg-gray-400 shadow" />
                    </span>
                </div>
            </div>

            {/* Mit / Ohne Analytics */}
            <div className="mb-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 animate-in fade-in slide-in-from-bottom-1 duration-300" style={{ animationDelay: '140ms' }}>
                    <div className="mb-2 flex items-center gap-2">
                        <VCheckRing className="h-[18px] w-[18px]" />
                        <h4 className="text-sm font-semibold text-white">Mit Analytics</h4>
                    </div>
                    <ul className="space-y-1.5 text-xs leading-5 text-gray-400">
                        <li>· Du hilfst, Fehler schneller zu finden</li>
                        <li>· Beliebte Funktionen werden priorisiert</li>
                        <li>· Vollständig anonym</li>
                    </ul>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 animate-in fade-in slide-in-from-bottom-1 duration-300" style={{ animationDelay: '200ms' }}>
                    <div className="mb-2 flex items-center gap-2">
                        <VEyeOff className="h-[18px] w-[18px]" g1="#34d399" g2="#22d3ee" />
                        <h4 className="text-sm font-semibold text-white">Ohne Analytics</h4>
                    </div>
                    <ul className="space-y-1.5 text-xs leading-5 text-gray-400">
                        <li>· Es werden keinerlei Daten gesendet</li>
                        <li>· Alle Funktionen bleiben erhalten</li>
                        <li>· Keine Nachteile, keine Nachfragen</li>
                    </ul>
                </div>
            </div>

            <InfoRow
                icon={VShield}
                title="Was passiert mit bereits gesendeten Daten?"
                body="Bereits erfasste Statistiken sind anonym und können keiner Person zugeordnet werden. Sie fließen nur in aggregierte Auswertungen ein und werden turnusmäßig gelöscht."
                index={4}
                accent={accent}
            />
        </DetailShell>
    );

    /* ====== Hauptansicht ====== */

    const renderMain = () => (
        <div className="animate-in fade-in slide-in-from-left-2 duration-300">
            {/* Header */}
            <div className="mb-7 flex items-start justify-between">
                <div className="space-y-2">
                    <div className={`inline-flex items-center gap-2 rounded-full border ${accent.border} ${accent.softBg} px-3 py-1 text-xs font-medium uppercase tracking-wider`}>
                        <VCrown className="h-3.5 w-3.5" g1={accent.g1} g2={accent.g2} />
                        <span className={accent.text}>VoidrixClient</span>
                        <VSpark className="h-3 w-3" g1={accent.g1} g2={accent.g2} />
                    </div>
                    <h1 className="bg-gradient-to-br from-white via-white to-white/50 bg-clip-text text-3xl font-bold text-transparent">
                        Bevor es losgeht
                    </h1>
                    <p className="max-w-xl text-sm leading-6 text-gray-400">
                        Wir nehmen deine Privatsphäre ernst. Bitte lies dir unsere Richtlinien durch,
                        bevor du VoidrixClient nutzt.
                    </p>
                </div>

                <div className="hidden shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-right sm:block">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500">Letztes Update</p>
                    <p className="mt-0.5 text-sm font-medium text-white">{LAST_UPDATE}</p>
                </div>
            </div>

            {/* Kern-Infos */}
            <div className="mb-5 grid gap-3">
                {[
                    {
                        icon: VChart,
                        title: 'Transparente Analysen',
                        body: 'Wir sammeln nur anonymisierte Nutzungsdaten zur Verbesserung des Launchers – keine persönlichen Identifikatoren.',
                        action: () => setView('optout'),
                        actionLabel: 'Mehr erfahren'
                    },
                    {
                        icon: VLock,
                        title: 'Deine Rechte (DSGVO)',
                        body: 'Du hast jederzeit das Recht auf Auskunft, Löschung und Einschränkung deiner Daten. Kein Verkauf an Dritte.',
                        action: () => setView('privacy'),
                        actionLabel: 'Details ansehen'
                    }
                ].map((card, i) => (
                    <div
                        key={card.title}
                        className="rounded-xl border border-white/10 bg-white/[0.04] p-4 transition-all duration-300 hover:border-purple-500/30 hover:bg-purple-500/5 animate-in fade-in slide-in-from-bottom-1 fill-mode-backwards"
                        style={{ animationDelay: `${i * 70}ms`, animationDuration: '300ms' }}
                    >
                        <div className="flex items-start gap-3">
                            <IconTile icon={card.icon} accent={accent} className="h-10 w-10" />
                            <div>
                                <h3 className="mb-1 font-medium text-white">{card.title}</h3>
                                <p className="text-sm leading-6 text-gray-400">
                                    {card.body}{' '}
                                    <button
                                        onClick={card.action}
                                        className="text-purple-400 underline underline-offset-2 transition-colors hover:text-purple-300"
                                    >
                                        {card.actionLabel}
                                    </button>
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Info-Seiten (im Client) + Discord (extern) */}
            <div className="mb-7 grid gap-3 sm:grid-cols-2">
                {[
                    { id: 'privacy' as ViewId, icon: VDoc, title: 'Datenschutzerklärung', sub: 'Erfahre, wie wir deine Daten schützen' },
                    { id: 'optout' as ViewId, icon: VChart, title: 'Analytics Opt-Out', sub: 'Verwalte deine Datenpräferenzen' },
                    { id: 'collect' as ViewId, icon: VData, title: 'Was wird gesammelt?', sub: 'Volle Transparenz über alle Daten' }
                ].map((link, i) => (
                    <button
                        key={link.id}
                        onClick={() => setView(link.id)}
                        className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-purple-500/50 hover:bg-purple-500/5 hover:shadow-lg hover:shadow-purple-500/10 animate-in fade-in slide-in-from-bottom-1 fill-mode-backwards"
                        style={{ animationDelay: `${150 + i * 60}ms`, animationDuration: '300ms' }}
                    >
                        <span className="pointer-events-none absolute inset-y-0 w-1/3 -translate-x-[220%] skew-x-[-20deg] bg-white/[0.06] blur-sm transition-transform duration-700 group-hover:translate-x-[420%]" />
                        <div className="relative flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <IconTile icon={link.icon} accent={accent} className="h-10 w-10 transition-transform duration-300 group-hover:scale-105" />
                                <div>
                                    <p className="font-medium text-white transition-colors group-hover:text-purple-400">{link.title}</p>
                                    <p className="mt-0.5 text-xs text-gray-500">{link.sub}</p>
                                </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-gray-600 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-purple-400" />
                        </div>
                        <span className="absolute bottom-2 right-3 text-[9px] uppercase tracking-wider text-gray-700">im Client</span>
                    </button>
                ))}

                {/* Discord bleibt extern */}
                <a
                    href="https://discord.gg/ZNJb5xX8pJ"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-500/50 hover:bg-indigo-500/5 hover:shadow-lg hover:shadow-indigo-500/10 animate-in fade-in slide-in-from-bottom-1 fill-mode-backwards"
                    style={{ animationDelay: '330ms', animationDuration: '300ms' }}
                >
                    <span className="pointer-events-none absolute inset-y-0 w-1/3 -translate-x-[220%] skew-x-[-20deg] bg-white/[0.06] blur-sm transition-transform duration-700 group-hover:translate-x-[420%]" />
                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <IconTile icon={VChat} accent={{ ...accent, g1: '#818cf8', g2: '#a5b4fc' } as Accent} className="h-10 w-10 transition-transform duration-300 group-hover:scale-105" />
                            <div>
                                <p className="font-medium text-white transition-colors group-hover:text-indigo-400">Fragen? Discord</p>
                                <p className="mt-0.5 text-xs text-gray-500">{'< 24h'} Antwortzeit</p>
                            </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-gray-600 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-indigo-400" />
                    </div>
                </a>
            </div>

            {/* Checkbox */}
            <label className="group mb-7 flex cursor-pointer items-start gap-3">
                <div className="relative mt-0.5">
                    <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => setIsChecked(e.target.checked)}
                        className="peer h-5 w-5 appearance-none rounded border-2 border-white/20 bg-white/5 transition-all duration-200 checked:border-purple-500 checked:bg-purple-500 checked:shadow-[0_0_12px_-2px_rgba(168,85,247,0.8)]"
                    />
                    <Check className={`absolute left-0.5 top-0.5 h-4 w-4 text-white transition-all duration-200 ${isChecked ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} />
                </div>
                <div>
                    <p className="text-sm text-gray-300 transition-colors group-hover:text-white">
                        Ich habe die{' '}
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); setView('privacy'); }}
                            className="text-purple-400 underline underline-offset-2 transition-colors hover:text-purple-300"
                        >
                            Datenschutzerklärung
                        </button>
                        {' '}gelesen und akzeptiere die Bedingungen.
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                        Du kannst deine Einstellungen jederzeit in den Optionen ändern.
                    </p>
                </div>
            </label>

            {/* Aktionen */}
            <div className="flex flex-col justify-end gap-3 border-t border-white/10 pt-5 sm:flex-row">
                <button
                    onClick={onDecline}
                    className="rounded-xl px-6 py-2.5 text-sm font-medium text-gray-400 transition-all duration-200 hover:bg-white/5 hover:text-white"
                >
                    Ablehnen
                </button>

                <button
                    disabled={!isChecked || isAccepted}
                    onClick={handleAccept}
                    className={`
                        group/go relative flex items-center justify-center gap-2 overflow-hidden rounded-xl
                        px-8 py-2.5 text-sm font-medium transition-all duration-300
                        ${isChecked && !isAccepted
                            ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/25 hover:scale-[1.02] active:scale-[0.98]'
                            : 'cursor-not-allowed bg-white/5 text-gray-500'
                        }
                    `}
                >
                    {isChecked && !isAccepted && (
                        <span className="pointer-events-none absolute inset-y-0 w-1/3 -translate-x-[220%] skew-x-[-20deg] bg-white/25 blur-sm transition-transform duration-700 group-hover/go:translate-x-[420%]" />
                    )}
                    {isAccepted ? (
                        <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                            <span>Wird gestartet...</span>
                        </>
                    ) : (
                        <>
                            Zustimmen & Starten
                            <ArrowRight className="h-4 w-4 transition-transform group-hover/go:translate-x-0.5" />
                        </>
                    )}
                </button>
            </div>

            {/* Vertrauens-Chips */}
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-gray-500">
                    <VLock className="h-3 w-3" g1="#fbbf24" g2="#f59e0b" /> TLS-verschlüsselt
                </span>
                <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-gray-500">
                    <VZap className="h-3 w-3" /> DSGVO-konform
                </span>
                <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-gray-500">
                    <VEyeOff className="h-3 w-3" g1="#34d399" g2="#22d3ee" /> Kein Tracking-Verkauf
                </span>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/75 p-4 backdrop-blur-xl">
            {/* Hintergrund */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-black to-background/70" />
                <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full blur-[100px] animate-pulse" style={{ backgroundColor: accent.glow }} />
                <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full blur-[100px] animate-pulse" style={{ backgroundColor: accent.glow, animationDelay: '2s' }} />
                <div className="absolute inset-0 opacity-[0.3] [background-image:linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
                {particles.map((pt, i) => (
                    <span
                        key={i}
                        className={`absolute bottom-[-10px] rounded-full ${pt.cyan ? 'bg-cyan-300/35' : 'bg-violet-400/35'}`}
                        style={{
                            left: `${pt.left}%`,
                            width: pt.size,
                            height: pt.size,
                            animation: `agreement-particle-rise ${pt.duration}s linear ${pt.delay}s infinite`,
                        }}
                    />
                ))}
            </div>

            {/* Hauptkarte */}
            <div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="relative w-full max-w-2xl animate-in fade-in zoom-in-95 duration-300"
            >
                {/* Spotlight (per DOM gesteuert, kein State) */}
                <div
                    ref={glowRef}
                    className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300"
                    style={{ opacity: 0 }}
                />

                <div className={`relative overflow-hidden rounded-2xl border ${accent.border} bg-card/90 backdrop-blur-xl shadow-2xl`}>
                    <div className="absolute top-0 h-px w-full bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
                    <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full blur-3xl" style={{ backgroundColor: accent.glow }} />
                    <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full blur-3xl" style={{ backgroundColor: accent.glow }} />

                    <div className="relative p-6 md:p-8">
                        {view === 'main' && renderMain()}
                        {view === 'privacy' && renderPrivacy()}
                        {view === 'collect' && renderCollect()}
                        {view === 'optout' && renderOptout()}
                    </div>
                </div>
            </div>

            <style>{`
                .agreement-scrollbar::-webkit-scrollbar { width: 4px; }
                .agreement-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 10px; }
                .agreement-scrollbar::-webkit-scrollbar-thumb { background: rgba(168,85,247,0.3); border-radius: 10px; }
                .agreement-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(168,85,247,0.5); }
                @keyframes agreement-particle-rise {
                    0% { transform: translateY(0); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 0.6; }
                    100% { transform: translateY(-105vh); opacity: 0; }
                }
            `}</style>
        </div>
    );
};

export default AgreementDialog;
