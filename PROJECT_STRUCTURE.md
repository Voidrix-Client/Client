# VoidrixClient - Neue Projektstruktur

## 📁 Ordnerorganisation

```
src/
├── components/
│   ├── common/                      # Häufig verwendete UI-Komponenten
│   │   ├── buttons/
│   │   │   └── PrimaryButton.tsx
│   │   ├── cards/
│   │   │   ├── ModpackCard.tsx
│   │   │   └── InstanceCard.tsx
│   │   ├── inputs/
│   │   │   ├── SearchInput.tsx
│   │   │   └── ColorPicker.tsx
│   │   ├── controls/
│   │   │   └── SliderControl.tsx
│   │   ├── selectors/
│   │   │   └── Dropdown.tsx
│   │   ├── badges/
│   │   │   └── StatusBadge.tsx
│   │   └── indicators/
│   │       └── LoadingSpinner.tsx
│   │
│   ├── modpack/                     # Modpack-spezifische Komponenten
│   │   ├── ModpackCardPremium.tsx   → ModpackGalleryCard.tsx
│   │   ├── ModpackDetailModal.tsx   → ModpackDetailsView.tsx
│   │   ├── ModpackSearch.tsx
│   │   ├── ModpackFilters.tsx
│   │   ├── ModpackStats.tsx
│   │   └── ImportDropZone.tsx
│   │
│   ├── instance/                    # Instance-spezifische Komponenten
│   │   ├── InstanceCard.tsx
│   │   ├── InstanceList.tsx
│   │   ├── InstanceSettings.tsx
│   │   └── InstanceConsole.tsx
│   │
│   ├── modals/                      # Modal-Komponenten
│   │   ├── ConfirmDialog.tsx
│   │   ├── AgreementDialog.tsx
│   │   ├── BackupManagerDialog.tsx
│   │   ├── CrashReportDialog.tsx
│   │   ├── ThemeCustomizeDialog.tsx
│   │   └── ModpackDetailsModal.tsx
│   │
│   ├── layout/                      # Layout-Komponenten
│   │   ├── PageHeader.tsx
│   │   ├── PageContent.tsx
│   │   ├── EmptyState.tsx
│   │   ├── SideBar.tsx
│   │   ├── TopNavBar.tsx
│   │   └── CommandPalette.tsx
│   │
│   ├── theme/                       # Theme-bezogene Komponenten
│   │   ├── ThemeSwitcher.tsx
│   │   ├── ThemePreview.tsx
│   │   ├── ThemeCustomizer.tsx
│   │   └── ColorSchemeCard.tsx
│   │
│   ├── ui/                          # Radix UI Wrapper
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   └── ... (bestehende UI-Komponenten)
│   │
│   └── shared/                      # Übergreifende Komponenten
│       ├── Notifications.tsx
│       ├── ErrorBoundary.tsx
│       └── LoadingOverlay.tsx
│
├── pages/
│   ├── dashboard/
│   │   ├── Dashboard.tsx
│   │   ├── DashboardStats.tsx
│   │   └── DashboardGrid.tsx
│   │
│   ├── modpacks/
│   │   ├── ModpacksPage.tsx         (neue Modpacks-Page)
│   │   ├── ModpackGallery.tsx
│   │   └── ModpackBrowser.tsx
│   │
│   ├── instances/
│   │   ├── InstancesPage.tsx
│   │   └── InstanceDetails.tsx
│   │
│   ├── settings/
│   │   └── SettingsPage.tsx
│   │
│   ├── server/
│   │   ├── ServerDashboard.tsx
│   │   └── ServerDetails.tsx
│   │
│   └── auth/
│       └── LoginPage.tsx
│
├── config/
│   ├── themes.ts                    # Theme-Definitionen
│   ├── designTokens.ts              # Design-Tokens
│   ├── appConfig.ts                 # App-Konfiguration
│   └── constants.ts                 # Konstanten
│
├── services/
│   ├── api/
│   │   ├── modpackService.ts
│   │   ├── instanceService.ts
│   │   └── serverService.ts
│   ├── state/
│   │   ├── appState.ts
│   │   └── themeState.ts
│   ├── clipboard.ts
│   └── analytics.ts
│
├── utils/
│   ├── formatting.ts                # Zahlen, Daten formatieren
│   ├── clipboard.ts                 # Clipboard-Operationen
│   ├── validation.ts                # Input-Validierung
│   ├── colors.ts                    # Farb-Utilities
│   └── strings.ts                   # String-Utilities
│
├── hooks/
│   ├── useModpacks.ts
│   ├── useInstances.ts
│   ├── useTheme.ts
│   └── useNotification.ts
│
├── styles/
│   ├── index.css
│   ├── animations.css
│   └── tailwind-overrides.css
│
├── types/
│   ├── modpack.ts
│   ├── instance.ts
│   ├── server.ts
│   └── common.ts
│
└── App.tsx
```

## 🔄 Umbennennungsplan

### Komponenten → Bessere Namen

| Alt | Neu | Grund |
|-----|-----|-------|
| ModpackCardPremium.tsx | ModpackGalleryCard.tsx | Beschreibt Verwendung besser |
| ModpackDetailModal.tsx | ModpackDetailsView.tsx | Konsistent mit anderen Views |
| ImportDropZone.tsx | ModpackImportZone.tsx | Klarer Kontext (Modpacks) |
| ConfirmationModal.tsx | ConfirmDialog.tsx | Konsistente Naming-Konvention |
| CrashModal.tsx | CrashReportDialog.tsx | Aussagekräftiger Name |
| ThemeModeSelectionModal.tsx | ThemeSwitcher.tsx | Prägnanter Name |
| BackupManagerModal.tsx | BackupManagerDialog.tsx | Konsistent |
| InstanceSettingsModal.tsx | InstanceSettingsDialog.tsx | Konsistent |
| SliderControl.tsx | RangeSlider.tsx | Bessere Beschreibung |
| TopBar.tsx | TopNavBar.tsx | Klarer Name |
| AppSidebar.tsx | SideBar.tsx | Einfacher |
| ColorPicker.tsx | ColorPickerInput.tsx | Klarer Kontext |

## ✨ Neue Komponenten zum Erstellen

- `ModpackStats.tsx` - Statistik-Anzeige für Modpacks
- `ModpackFilters.tsx` - Filter-Komponente für Modpack-Suche
- `ModpackSearch.tsx` - Spezialisierte Such-Komponente
- `PrimaryButton.tsx` - Standardisierte Button-Komponente
- `StatusBadge.tsx` - Standardisierte Badge-Komponente
- `SearchInput.tsx` - Spezialisierte Such-Input
- `RangeSlider.tsx` - Verbesserte Slider-Komponente
- `ThemeSwitcher.tsx` - Theme-Wechsel-Komponente
- `LoadingSpinner.tsx` - Standardisierte Loader-Komponente
- `ErrorBoundary.tsx` - Error-Boundary für React

## 📋 Standards

### Dateibenennung
- **Komponenten**: PascalCase (z.B. `ModpackCard.tsx`)
- **Utilities**: camelCase (z.B. `formatNumber.ts`)
- **Types**: camelCase mit `-type` Suffix (z.B. `modpack-type.ts`)
- **Hooks**: camelCase mit `use-` Prefix (z.B. `useModpacks.ts`)

### Ordnerorganisation
- **Nach Feature**: Zusammenhängende Komponenten in einen Ordner
- **Nach Typ**: UI-Komponenten, Pages, Services, etc.
- **Flache Struktur bevorzugt**: Max 2 Ebenen tief

### Komponenten-Struktur
```typescript
// Imports
// Types/Interfaces
// Main Component (mit React.memo wenn nötig)
// Exports
// Styles (am Ende, wenn nötig)
```
