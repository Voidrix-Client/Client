# VoidrixClient - Komponenten-Organisierung

## ✅ Neu organisierte Komponenten

### 📁 `src/components/modpack/`
Premium Modpack-Komponenten für die Modpack-Galerie

#### **ModpackGalleryCard.tsx**
- **Zweck**: Einzelne Modpack-Karte in der Galerie
- **Features**:
  - Premium Hover-Effekte mit Glow
  - Download/Follower-Statistiken
  - Favoriten-Button
  - Schöne Animationen
  - Responsive Design
- **Props**: `pack`, `installingPack`, `onInstall`, `onShowDetails`, `t`
- **Ersetzt**: `ModpackCardPremium.tsx`

#### **ModpackDetailsView.tsx**
- **Zweck**: Detailliertes Modal für Modpack-Informationen
- **Features**:
  - Große Modpack-Vorschau
  - Vollständige Statistiken
  - Share/Favoriten-Buttons
  - Install-Button
  - Kategorie-Tags
  - Metadaten (Updated, Versions, Views)
- **Props**: `pack`, `isOpen`, `onClose`, `onInstall`, `installingPack`, `t`
- **Ersetzt**: `ModpackDetailModal.tsx`

### 📁 `src/utils/`
Wiederverwendbare Utility-Funktionen

#### **formatting.ts** (NEU)
Zentrale Formatierungs-Utilities:
- `formatNumber()` - Zahlen als K, M, B (1500 → 1.5K)
- `formatDate()` - Datum formatieren (1/15/2024)
- `formatDateTime()` - Datum mit Zeit
- `formatRelativeTime()` - Relative Zeit (2 hours ago)
- `formatBytes()` - Bytes als KB, MB, GB
- `formatDuration()` - Sekunden als HH:MM:SS
- `formatPercentage()` - Prozentfomatierung
- `truncateString()` - String kürzen mit "..."
- `capitalize()` - Ersten Buchstaben großschreiben
- `camelCaseToTitle()` - camelCase zu Title Case

### 📁 `src/pages/modpacks/`
Modpack-Seiten und deren Komponenten

#### **ModpacksPage.tsx** (NEU)
- **Zweck**: Hauptseite für Modpack-Browse und -Installation
- **Features**:
  - Grid/List View Toggle
  - Sortier-Optionen (Downloads, Newest, Updated, Favorited)
  - Suche & Filter
  - Infinite Scroll / Load More
  - Premium Design mit Animationen
- **Struktur**: Nutzt `ModpackGalleryCard` & `ModpackDetailsView`
- **Ersetzt**: Die alte `Modpacks.tsx`

### 📁 `src/config/`
Konfiguration und Konstanten

#### **themes.ts** (Erweitert)
Jetzt mit 13 Themes statt 7:
- `voidrix_default` - Standard Violett
- `voidrix_forest` - Wald-Design
- `voidrix_horizon` - Blau
- `voidrix_night` - Dunkelblau
- `voidrix_lava` - Orange/Rot
- `voidrix_water` - Cyan
- `voidrix_light` - Helles Design
- `voidrix_cyberpunk` - 🎮 Magenta & Cyan Neon
- `voidrix_neon` - 🟢 Helles Grün Neon
- `voidrix_aurora` - 🌌 Eisblaues Glow
- `voidrix_sunset` - 🌅 Warmes Orange
- `voidrix_twilight` - 🌙 Mystisches Violett
- `voidrix_mint` - 🌿 Frisches Grün

#### **designTokens.ts** (Erweitert)
Zentrale Design-Token:
- `spacing` - Abstände (xs → 3xl)
- `borderRadius` - Border-Radien
- `zIndex` - Z-Index-Werte (strukturiert)
- `animationDuration` - Animation-Dauernsecondary (fast, normal, slow)
- `animationTiming` - Timing-Funktionen
- `opacity` - Opazität-Werte
- `shadow` - Schatten-Werte
- `breakpoints` - Responsive Breakpoints
- `fontSize` - Schriftgrößen
- `lineHeight` - Zeilenhöhen
- `transitions` - Übergangs-Vorgaben

## 🔄 Umbennennungs-Übersicht

| Alt | Neu | Ordner | Grund |
|-----|-----|--------|-------|
| `ModpackCardPremium.tsx` | `ModpackGalleryCard.tsx` | `components/modpack/` | Klarer: "Gallery" zeigt Kontext |
| `ModpackDetailModal.tsx` | `ModpackDetailsView.tsx` | `components/modpack/` | Konsistent mit anderen Views |
| `ModpacksPremium.tsx` | `ModpacksPage.tsx` | `pages/modpacks/` | Klarer Seiten-Name |
| `clipboardUtils.ts` | (in formattin.ts) | `utils/` | Zusammengefasst |
| (neu) | `formatting.ts` | `utils/` | Zentrale Formatierungs-Utilities |

## 📋 Verwendungsbeispiel

### Modpack-Seite verwenden:
```typescript
import ModpacksPage from './pages/modpacks/ModpacksPage';

export default function App() {
  return <ModpacksPage />;
}
```

### Formatierungs-Utilities verwenden:
```typescript
import { formatNumber, formatDate, formatRelativeTime } from './utils/formatting';

// Zahlen formatieren
formatNumber(1500)          // "1.5K"
formatNumber(2500000)       // "2.5M"

// Datum formatieren
formatDate("2024-01-15")    // "1/15/2024"
formatRelativeTime("2024-01-15") // "1w ago"
```

### Themes verwenden:
```typescript
import { VOIDRIX_THEME_PRESETS, getThemeByName } from './config/themes';

// Ein Theme erhalten
const theme = getThemeByName('voidrix_cyberpunk');

// Alle Themes auflisten
const allThemes = Object.keys(VOIDRIX_THEME_PRESETS);
```

## 🎯 Standards befolgen

### Komponenten-Datei:
```typescript
// 1. Imports
import React from 'react';
import { SomeIcon } from 'lucide-react';
import { SomeComponent } from '../path/to/component';

// 2. Types/Interfaces
interface MyComponentProps {
  prop1: string;
  prop2: number;
}

// 3. Main Component
const MyComponent = React.memo(function MyComponent({
  prop1,
  prop2
}: MyComponentProps) {
  // Component logic
  return (
    // JSX
  );
});

// 4. Display Name
MyComponent.displayName = 'MyComponent';

// 5. Export
export default MyComponent;
```

### Utility-Datei:
```typescript
// Beschreibung
/** Format large numbers as K, M, B */
export function formatNumber(num?: number): string {
  // Implementation
}

/** Another utility function */
export function anotherFunction(param: Type): ReturnType {
  // Implementation
}
```

## 🚀 Nächste Schritte

1. ✅ Modpack-Komponenten reorganisiert
2. ✅ Formatting-Utilities zentralisiert
3. ✅ Neue Themes hinzugefügt
4. ⏳ Dashboard-Komponenten reorganisieren
5. ⏳ Instance-Komponenten organisieren
6. ⏳ Modal-Komponenten zusammenfassen
7. ⏳ Alte Dateien aufräumen

## 📁 Verzeichnis-Struktur nach Reorganisation

```
src/
├── components/
│   ├── modpack/
│   │   ├── ModpackGalleryCard.tsx ✅
│   │   └── ModpackDetailsView.tsx ✅
│   ├── common/
│   ├── instance/
│   ├── modals/
│   ├── layout/
│   ├── theme/
│   ├── ui/
│   └── shared/
│
├── pages/
│   ├── modpacks/
│   │   └── ModpacksPage.tsx ✅
│   ├── dashboard/
│   ├── instances/
│   └── ...
│
├── config/
│   ├── themes.ts ✅ (erweitert)
│   ├── designTokens.ts ✅ (erweitert)
│   └── ...
│
├── utils/
│   ├── formatting.ts ✅ (NEU)
│   ├── clipboard.ts
│   └── ...
│
└── ...
```
