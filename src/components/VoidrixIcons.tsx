import React from 'react';

/**
 * Voidrix Icon-Set — eigene, handgezeichnete SVG-Icons mit Farbverlauf.
 * Jedes Icon akzeptiert `g1`/`g2` für den Verlauf (Standard: Voidrix Lila→Cyan).
 * Die Gradient-IDs enthalten Name + Farben, damit sich mehrfach verwendete
 * Icons mit unterschiedlichen Farben nicht gegenseitig überschreiben.
 */

export type VIconProps = { className?: string; g1?: string; g2?: string };

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

export const VController = ({ className, g1 = '#c084fc', g2 = '#22d3ee' }: VIconProps) =>
    iconBase('vx-pad', g1, g2, (u) => (
        <>
            <path d="M7.2 7.5 H16.8 C19.4 7.5 21.3 9.8 20.9 12.4 L20.3 16.2 C20 18 18 18.9 16.6 17.8 L14.6 16.2 H9.4 L7.4 17.8 C6 18.9 4 18 3.7 16.2 L3.1 12.4 C2.7 9.8 4.6 7.5 7.2 7.5 Z"
                stroke={u} strokeWidth="1.7" strokeLinejoin="round" fill={u} fillOpacity="0.12" />
            <path d="M8.2 10.4 V13.4 M6.7 11.9 H9.7" stroke={u} strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="15.2" cy="11" r="1" fill={u} />
            <circle cx="17.2" cy="12.9" r="1" fill={u} />
        </>
    ), className);

export const VFlame = ({ className, g1 = '#c084fc', g2 = '#22d3ee' }: VIconProps) =>
    iconBase('vx-flame', g1, g2, (u) => (
        <>
            <path d="M12 3 C12 3 6.5 8 6.5 13.5 C6.5 17 9 20 12 20 C15 20 17.5 17 17.5 13.5 C17.5 10.5 15.5 8 15.5 8 C15.5 8 15 10.5 13.5 11 C13.5 11 14 6 12 3 Z"
                stroke={u} strokeWidth="1.7" strokeLinejoin="round" fill={u} fillOpacity="0.15" />
            <path d="M12 20 C10.4 20 9.2 18.5 9.2 16.8 C9.2 14.9 12 12.6 12 12.6 C12 12.6 14.8 14.9 14.8 16.8 C14.8 18.5 13.6 20 12 20 Z"
                fill={u} fillOpacity="0.6" />
        </>
    ), className);

export const VClock = ({ className, g1 = '#c084fc', g2 = '#22d3ee' }: VIconProps) =>
    iconBase('vx-clock', g1, g2, (u) => (
        <>
            <circle cx="12" cy="12" r="8.5" stroke={u} strokeWidth="1.7" fill={u} fillOpacity="0.1" />
            <path d="M12 7.5 V12 L15.2 14" stroke={u} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </>
    ), className);

export const VDownload = ({ className, g1 = '#c084fc', g2 = '#22d3ee' }: VIconProps) =>
    iconBase('vx-dl', g1, g2, (u) => (
        <>
            <path d="M12 3.5 V13.5 M12 13.5 L8.2 9.7 M12 13.5 L15.8 9.7" stroke={u} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4.5 15.5 V17.5 C4.5 19.2 5.8 20.5 7.5 20.5 H16.5 C18.2 20.5 19.5 19.2 19.5 17.5 V15.5"
                stroke={u} strokeWidth="1.7" strokeLinecap="round" />
        </>
    ), className);

export const VTrophy = ({ className, g1 = '#c084fc', g2 = '#22d3ee' }: VIconProps) =>
    iconBase('vx-trophy', g1, g2, (u) => (
        <>
            <path d="M8 4 H16 V10 C16 12.8 14.2 15 12 15 C9.8 15 8 12.8 8 10 Z"
                stroke={u} strokeWidth="1.7" strokeLinejoin="round" fill={u} fillOpacity="0.15" />
            <path d="M8 6 H5.2 C5.2 9 6.4 10.8 8 11.2 M16 6 H18.8 C18.8 9 17.6 10.8 16 11.2"
                stroke={u} strokeWidth="1.6" strokeLinecap="round" />
            <path d="M12 15 V17.5 M9 20 H15 M10 17.5 H14 V20 H10 Z" stroke={u} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </>
    ), className);

export const VCompass = ({ className, g1 = '#c084fc', g2 = '#22d3ee' }: VIconProps) =>
    iconBase('vx-compass', g1, g2, (u) => (
        <>
            <circle cx="12" cy="12" r="8.5" stroke={u} strokeWidth="1.7" fill={u} fillOpacity="0.08" />
            <path d="M15.5 8.5 L13.5 13.5 L8.5 15.5 L10.5 10.5 Z" stroke={u} strokeWidth="1.5" strokeLinejoin="round" fill={u} fillOpacity="0.35" />
            <circle cx="12" cy="12" r="1" fill={u} />
        </>
    ), className);

export const VPackage = ({ className, g1 = '#c084fc', g2 = '#22d3ee' }: VIconProps) =>
    iconBase('vx-pkg', g1, g2, (u) => (
        <>
            <path d="M12 3.2 L20 7.2 V16.8 L12 20.8 L4 16.8 V7.2 Z" stroke={u} strokeWidth="1.7" strokeLinejoin="round" fill={u} fillOpacity="0.1" />
            <path d="M4 7.2 L12 11.2 L20 7.2 M12 11.2 V20.8" stroke={u} strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M8 5.2 L16 9.2" stroke={u} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
        </>
    ), className);

export const VCrown = ({ className, g1 = '#c084fc', g2 = '#22d3ee' }: VIconProps) =>
    iconBase('vx-crown', g1, g2, (u) => (
        <>
            <path d="M4.5 17 L3.5 7.5 L8.2 11 L12 5.5 L15.8 11 L20.5 7.5 L19.5 17 Z"
                stroke={u} strokeWidth="1.6" strokeLinejoin="round" fill={u} fillOpacity="0.15" />
            <path d="M4.5 19.5 H19.5" stroke={u} strokeWidth="1.7" strokeLinecap="round" />
        </>
    ), className);

export const VSpark = ({ className, g1 = '#c084fc', g2 = '#22d3ee' }: VIconProps) =>
    iconBase('vx-spark', g1, g2, (u) => (
        <path d="M12 3 L13.6 10.4 L21 12 L13.6 13.6 L12 21 L10.4 13.6 L3 12 L10.4 10.4 Z" fill={u} fillOpacity="0.9" />
    ), className);

export const VHeart = ({ className, g1 = '#fb7185', g2 = '#f472b6' }: VIconProps) =>
    iconBase('vx-heart', g1, g2, (u) => (
        <path d="M12 20 C12 20 3.5 14.8 3.5 8.9 C3.5 6 5.8 4 8.2 4 C9.8 4 11.2 4.9 12 6.2 C12.8 4.9 14.2 4 15.8 4 C18.2 4 20.5 6 20.5 8.9 C20.5 14.8 12 20 12 20 Z"
            stroke={u} strokeWidth="1.7" strokeLinejoin="round" fill={u} fillOpacity="0.2" />
    ), className);

export const VGlobe = ({ className, g1 = '#c084fc', g2 = '#22d3ee' }: VIconProps) =>
    iconBase('vx-globe', g1, g2, (u) => (
        <>
            <circle cx="12" cy="12" r="8.5" stroke={u} strokeWidth="1.7" fill={u} fillOpacity="0.08" />
            <path d="M3.5 12 H20.5 M12 3.5 C14.8 6 14.8 18 12 20.5 C9.2 18 9.2 6 12 3.5 Z" stroke={u} strokeWidth="1.5" />
        </>
    ), className);

export const VChartUp = ({ className, g1 = '#c084fc', g2 = '#22d3ee' }: VIconProps) =>
    iconBase('vx-chartup', g1, g2, (u) => (
        <>
            <path d="M4 19 H20" stroke={u} strokeWidth="1.7" strokeLinecap="round" />
            <path d="M5 15 L9.5 10.5 L13 13.5 L19 7" stroke={u} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15.5 7 H19 V10.5" stroke={u} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </>
    ), className);

export const VSun = ({ className, g1 = '#fbbf24', g2 = '#fb923c' }: VIconProps) =>
    iconBase('vx-sun', g1, g2, (u) => (
        <>
            <circle cx="12" cy="12" r="4" stroke={u} strokeWidth="1.7" fill={u} fillOpacity="0.25" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
                <path key={a} d="M12 3.5 V5.5" stroke={u} strokeWidth="1.7" strokeLinecap="round" transform={`rotate(${a} 12 12)`} />
            ))}
        </>
    ), className);

export const VMoon = ({ className, g1 = '#c084fc', g2 = '#818cf8' }: VIconProps) =>
    iconBase('vx-moon', g1, g2, (u) => (
        <>
            <path d="M19.5 14.2 C18.4 14.8 17.1 15.1 15.8 15.1 C11.5 15.1 8 11.6 8 7.3 C8 6 8.3 4.8 8.9 3.7 C5.8 4.8 3.5 7.8 3.5 11.4 C3.5 15.9 7.2 19.6 11.7 19.6 C15.2 19.6 18.3 17.4 19.5 14.2 Z"
                stroke={u} strokeWidth="1.7" strokeLinejoin="round" fill={u} fillOpacity="0.15" />
            <path d="M16.5 4.5 L17 6 L18.5 6.5 L17 7 L16.5 8.5 L16 7 L14.5 6.5 L16 6 Z" fill={u} />
        </>
    ), className);

export const VSunrise = ({ className, g1 = '#fbbf24', g2 = '#f472b6' }: VIconProps) =>
    iconBase('vx-sunrise', g1, g2, (u) => (
        <>
            <path d="M4 17.5 H20" stroke={u} strokeWidth="1.7" strokeLinecap="round" />
            <path d="M7.5 17.5 A4.5 4.5 0 0 1 16.5 17.5" stroke={u} strokeWidth="1.7" fill={u} fillOpacity="0.2" />
            <path d="M12 6 V8.5 M5.5 10 L7 11.5 M18.5 10 L17 11.5" stroke={u} strokeWidth="1.6" strokeLinecap="round" />
            <path d="M8 20.5 H16" stroke={u} strokeWidth="1.6" strokeLinecap="round" opacity="0.5" />
        </>
    ), className);

export const VRefresh = ({ className, g1 = '#c084fc', g2 = '#22d3ee' }: VIconProps) =>
    iconBase('vx-refresh', g1, g2, (u) => (
        <>
            <path d="M19.5 12 A7.5 7.5 0 1 1 17.3 6.7" stroke={u} strokeWidth="1.8" strokeLinecap="round" />
            <path d="M17.5 3.5 L17.5 7 L14 7" stroke={u} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </>
    ), className);

export const VRocket = ({ className, g1 = '#c084fc', g2 = '#22d3ee' }: VIconProps) =>
    iconBase('vx-rocket', g1, g2, (u) => (
        <>
            <path d="M12 3 C15 5 16.5 8.5 16.5 12 L16.5 14.5 L12 12.8 L7.5 14.5 L7.5 12 C7.5 8.5 9 5 12 3 Z"
                stroke={u} strokeWidth="1.7" strokeLinejoin="round" fill={u} fillOpacity="0.12" />
            <circle cx="12" cy="9.5" r="1.6" stroke={u} strokeWidth="1.5" />
            <path d="M7.5 14.5 L5.5 18 L8.5 17 M16.5 14.5 L18.5 18 L15.5 17" stroke={u} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 15.5 L12 20 M10.3 17 L10.3 19 M13.7 17 L13.7 19" stroke={u} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
        </>
    ), className);

export const VBulb = ({ className, g1 = '#fbbf24', g2 = '#c084fc' }: VIconProps) =>
    iconBase('vx-bulb', g1, g2, (u) => (
        <>
            <path d="M12 3.5 C15.6 3.5 18.2 6.2 18.2 9.6 C18.2 11.8 17 13.3 15.9 14.6 C15.3 15.3 15 16 15 16.8 H9 C9 16 8.7 15.3 8.1 14.6 C7 13.3 5.8 11.8 5.8 9.6 C5.8 6.2 8.4 3.5 12 3.5 Z"
                stroke={u} strokeWidth="1.7" strokeLinejoin="round" fill={u} fillOpacity="0.15" />
            <path d="M9.5 19.2 H14.5 M10.5 21.2 H13.5" stroke={u} strokeWidth="1.6" strokeLinecap="round" />
            <path d="M10.5 9 L12 11 L13.8 8.4" stroke={u} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
        </>
    ), className);

export const VBrush = ({ className, g1 = '#c084fc', g2 = '#22d3ee' }: VIconProps) =>
    iconBase('vx-brush', g1, g2, (u) => (
        <>
            <path d="M19.5 4.5 C20.5 5.5 20.5 7 19.5 8 L12.5 15 L9 11.5 L16 4.5 C17 3.5 18.5 3.5 19.5 4.5 Z"
                stroke={u} strokeWidth="1.7" strokeLinejoin="round" fill={u} fillOpacity="0.12" />
            <path d="M9 11.5 C7 12 5.8 13.2 5.4 15.2 C5.1 16.8 4.6 17.8 3.5 18.5 C5 19.8 7.5 20 9.2 19 C10.8 18 11.8 16.6 12.5 15"
                stroke={u} strokeWidth="1.7" strokeLinejoin="round" fill={u} fillOpacity="0.25" />
        </>
    ), className);

export const VGear = ({ className, g1 = '#c084fc', g2 = '#22d3ee' }: VIconProps) =>
    iconBase('vx-gear', g1, g2, (u) => (
        <>
            <circle cx="12" cy="12" r="3.2" stroke={u} strokeWidth="1.7" fill={u} fillOpacity="0.15" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
                <path key={a} d="M12 3.2 V5.6" stroke={u} strokeWidth="1.8" strokeLinecap="round" transform={`rotate(${a} 12 12)`} />
            ))}
            <circle cx="12" cy="12" r="7.2" stroke={u} strokeWidth="1.5" opacity="0.5" />
        </>
    ), className);

export const VServer = ({ className, g1 = '#c084fc', g2 = '#22d3ee' }: VIconProps) =>
    iconBase('vx-server', g1, g2, (u) => (
        <>
            <rect x="4" y="4" width="16" height="6.4" rx="1.8" stroke={u} strokeWidth="1.7" fill={u} fillOpacity="0.1" />
            <rect x="4" y="13.6" width="16" height="6.4" rx="1.8" stroke={u} strokeWidth="1.7" fill={u} fillOpacity="0.1" />
            <circle cx="7.4" cy="7.2" r="1" fill={u} />
            <circle cx="7.4" cy="16.8" r="1" fill={u} />
            <path d="M11 7.2 H16.6 M11 16.8 H16.6" stroke={u} strokeWidth="1.5" strokeLinecap="round" />
        </>
    ), className);

export const VUsers = ({ className, g1 = '#c084fc', g2 = '#22d3ee' }: VIconProps) =>
    iconBase('vx-users', g1, g2, (u) => (
        <>
            <circle cx="9.5" cy="8.5" r="3.4" stroke={u} strokeWidth="1.7" fill={u} fillOpacity="0.15" />
            <path d="M3.5 19.5 C3.5 15.9 6.2 13.8 9.5 13.8 C12.8 13.8 15.5 15.9 15.5 19.5" stroke={u} strokeWidth="1.7" strokeLinecap="round" />
            <path d="M15.5 5.6 A3.4 3.4 0 0 1 15.5 11.4 M17.6 14.2 C19.5 15.1 20.5 17 20.5 19.5" stroke={u} strokeWidth="1.7" strokeLinecap="round" opacity="0.7" />
        </>
    ), className);

export const VChip = ({ className, g1 = '#c084fc', g2 = '#22d3ee' }: VIconProps) =>
    iconBase('vx-chip', g1, g2, (u) => (
        <>
            <rect x="7" y="7" width="10" height="10" rx="2" stroke={u} strokeWidth="1.7" fill={u} fillOpacity="0.15" />
            <rect x="10" y="10" width="4" height="4" rx="1" fill={u} fillOpacity="0.6" />
            {[9, 12, 15].map((x) => (
                <path key={`t${x}`} d={`M${x} 3.5 V7 M${x} 17 V20.5`} stroke={u} strokeWidth="1.5" strokeLinecap="round" />
            ))}
            {[9, 12, 15].map((y) => (
                <path key={`s${y}`} d={`M3.5 ${y} H7 M17 ${y} H20.5`} stroke={u} strokeWidth="1.5" strokeLinecap="round" />
            ))}
        </>
    ), className);

/** Glas-Kachel mit Farbschein für Icons (einheitlicher Look im ganzen Client) */
export function VTile({ icon: Icon, className, glow = 'rgba(124,58,237,0.25)', g1, g2, iconClassName }: {
    icon: React.FC<VIconProps>; className?: string; glow?: string; g1?: string; g2?: string; iconClassName?: string;
}) {
    return (
        <div className={`relative flex shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ${className ?? 'h-10 w-10'}`}>
            <div className="absolute inset-0 rounded-xl opacity-50" style={{ background: `radial-gradient(circle at 30% 20%, ${glow}, transparent 70%)` }} />
            <Icon className={`relative ${iconClassName ?? 'h-5 w-5'}`} g1={g1} g2={g2} />
        </div>
    );
}
