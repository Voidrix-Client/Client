# Komponenten-Refactoring Guide

## 📋 Komplette Umbennennungs-Liste

### 🎛️ **Modal/Dialog Komponenten** → `components/modals/`

| Alt | Neu | Grund |
|-----|-----|-------|
| `AgreementModal.tsx` | `AgreementDialog.tsx` | Einheitliche "Dialog"-Konvention |
| `BackupManagerModal.tsx` | `BackupManagerDialog.tsx` | Konsistent |
| `ConfirmationModal.tsx` | `ConfirmDialog.tsx` | Kürzer, klarer |
| `CrashModal.tsx` | `CrashReportDialog.tsx` | Aussagekräftiger |
| `InstanceSettingsModal.tsx` | `InstanceSettingsDialog.tsx` | Konsistent |
| `LanguageSelectionModal.tsx` | `LanguageSelectorDialog.tsx` | Klarer Name |
| `ModDependencyModal.tsx` | `ModDependencyDialog.tsx` | Konsistent |
| `ModpackCodeModal.tsx` | `ModpackShareDialog.tsx` | Besserer Name |
| `PixelEditorModal.tsx` | `PixelEditorDialog.tsx` | Konsistent |
| `ReinstallModal.tsx` | `ReinstallDialog.tsx` | Konsistent |
| `ThemeExportModal.tsx` | `ThemeExportDialog.tsx` | Konsistent |
| `ThemeModeSelectionModal.tsx` | `ThemeSwitcherDialog.tsx` | Besserer Name |

### 📊 **Dashboard Komponenten** → `components/dashboard/`

| Alt | Neu | Grund |
|-----|-----|-------|
| `DashboardCustomizer.tsx` | `DashboardLayoutCustomizer.tsx` | Klarer Zweck |
| (neu) | `DashboardCard.tsx` | Wiederverwendbare Karte |
| (neu) | `DashboardStats.tsx` | Statistik-Widget |
| (neu) | `InstanceCard.tsx` | Instance-Vorschau |
| (neu) | `DownloadQueueWidget.tsx` | Download-Queue-Anzeige |

### 🎮 **Instance Komponenten** → `components/instance/`

| Alt | Neu | Grund |
|-----|-----|-------|
| `ServerConsole.tsx` → `InstanceConsole.tsx` | Einheitlich für Instances |
| (neu) | `InstanceList.tsx` | Instance-Auflistung |
| (neu) | `InstanceCard.tsx` | Instance-Karte |
| (neu) | `InstanceStatusIndicator.tsx` | Status-Anzeige |
| (neu) | `InstanceActions.tsx` | Action-Buttons |

### 🎨 **Layout Komponenten** → `components/layout/`

| Alt | Neu | Grund |
|-----|-----|-------|
| `TopBar.tsx` | `TopNavBar.tsx` | Klarer Name |
| `AppSidebar.tsx` | `AppSideBar.tsx` | Konsistente Casing |
| `PageHeader.tsx` | (bleibt) | Bereits gut benannt |
| `PageContent.tsx` | (bleibt) | Bereits gut benannt |
| `EmptyState.tsx` | (bleibt) | Bereits gut benannt |

### 🎨 **Theme Komponenten** → `components/theme/`

| Alt | Neu | Grund |
|-----|-----|-------|
| `ThemeCard.tsx` | `ThemePresetCard.tsx` | Klarer Zweck |
| (neu) | `ThemePreview.tsx` | Theme-Vorschau |
| (neu) | `ColorSchemeSelector.tsx` | Farb-Auswahl |

### 🔧 **Shared/Common Komponenten** → `components/shared/` oder `components/common/`

| Alt | Neu | Ordner | Grund |
|-----|-----|--------|-------|
| `CommandPalette.tsx` | `CommandPalette.tsx` | `shared/` | Übergreifende Komponente |
| `LoadingOverlay.tsx` | `LoadingOverlay.tsx` | `shared/` | Globale Komponente |
| `UpdateNotification.tsx` | `UpdateNotification.tsx` | `shared/` | Globale Komponente |
| `AnnouncementBar.tsx` | `AnnouncementBar.tsx` | `shared/` | Globale Komponente |
| `WindowControls.tsx` | `WindowControls.tsx` | `layout/` | Window-Kontrollen |

### 🎛️ **Input Komponenten** → `components/common/inputs/`

| Alt | Neu | Grund |
|-----|-----|-------|
| `ColorPicker.tsx` | `ColorPickerInput.tsx` | Klarer Kontext |
| `Dropdown.tsx` | `SelectDropdown.tsx` | Besserer Name |
| `SliderControl.tsx` | `RangeSlider.tsx` | Prägnanter |
| `ToggleBox.tsx` | `ToggleSwitch.tsx` | Besserer Name |
| `FileBrowser.tsx` | `FileInput.tsx` | Klarer Kontext |

### 📌 **Spezielle Komponenten**

| Alt | Neu | Ordner | Grund |
|-----|-----|--------|-------|
| `OptimizedImage.tsx` | `LazyImage.tsx` | `common/` | Klarer Zweck |
| `PlayerHead.tsx` | `PlayerHeadAvatar.tsx` | `common/` | Klarer Zweck |
| `MiniPreview.tsx` | `ThemePreview.tsx` | `theme/` | Gehört zu Themes |
| `ImportDropZone.tsx` | `ModpackImportZone.tsx` | `modpack/` | Modpack-spezifisch |
| `VoidrixIcon.tsx` | (löschen) | - | Nur ein SVG |
| `VoidrixIcons.tsx` | (löschen) | - | Icons in lucide-react verwenden |

## 📁 Finale Ordnerstruktur

```
src/components/
├── common/
│   ├── inputs/
│   │   ├── ColorPickerInput.tsx
│   │   ├── SelectDropdown.tsx
│   │   ├── RangeSlider.tsx
│   │   ├── ToggleSwitch.tsx
│   │   ├── FileInput.tsx
│   │   └── index.ts
│   ├── buttons/
│   │   ├── PrimaryButton.tsx
│   │   ├── SecondaryButton.tsx
│   │   └── index.ts
│   ├── LazyImage.tsx
│   ├── PlayerHeadAvatar.tsx
│   └── index.ts
│
├── modals/
│   ├── ConfirmDialog.tsx
│   ├── AgreementDialog.tsx
│   ├── ThemeCustomizeDialog.tsx
│   ├── BackupManagerDialog.tsx
│   ├── InstanceSettingsDialog.tsx
│   ├── ModpackShareDialog.tsx
│   ├── CrashReportDialog.tsx
│   ├── PixelEditorDialog.tsx
│   ├── ModDependencyDialog.tsx
│   ├── ThemeExportDialog.tsx
│   ├── ReinstallDialog.tsx
│   ├── LanguageSelectorDialog.tsx
│   └── index.ts
│
├── dashboard/
│   ├── DashboardLayoutCustomizer.tsx
│   ├── DashboardCard.tsx
│   ├── DashboardStats.tsx
│   ├── InstanceCard.tsx
│   ├── DownloadQueueWidget.tsx
│   └── index.ts
│
├── instance/
│   ├── InstanceList.tsx
│   ├── InstanceCard.tsx
│   ├── InstanceConsole.tsx
│   ├── InstanceStatusIndicator.tsx
│   ├── InstanceActions.tsx
│   └── index.ts
│
├── layout/
│   ├── TopNavBar.tsx
│   ├── AppSideBar.tsx
│   ├── PageHeader.tsx
│   ├── PageContent.tsx
│   ├── EmptyState.tsx
│   ├── WindowControls.tsx
│   └── index.ts
│
├── theme/
│   ├── ThemePresetCard.tsx
│   ├── ThemePreview.tsx
│   ├── ColorSchemeSelector.tsx
│   └── index.ts
│
├── modpack/
│   ├── ModpackGalleryCard.tsx
│   ├── ModpackDetailsView.tsx
│   ├── ModpackImportZone.tsx
│   └── index.ts
│
├── shared/
│   ├── CommandPalette.tsx
│   ├── LoadingOverlay.tsx
│   ├── UpdateNotification.tsx
│   ├── AnnouncementBar.tsx
│   └── index.ts
│
└── ui/
    ├── (Radix UI Wrappers)
    └── index.ts
```

## 🗑️ Zu löschende Dateien (alte Duplikate)

```
DELETE:
- ModpackCardPremium.tsx (→ ModpackGalleryCard.tsx)
- ModpackDetailModal.tsx (→ ModpackDetailsView.tsx)
- ModpacksPremium.tsx (→ ModpacksPage.tsx)
- VoidrixIcon.tsx
- VoidrixIcons.tsx
```

## ✅ Refactoring-Schritte

### Phase 1: Index-Dateien erstellen
- ✅ `components/modals/index.ts`
- ⏳ `components/common/index.ts`
- ⏳ `components/common/inputs/index.ts`
- ⏳ `components/dashboard/index.ts`
- ⏳ `components/instance/index.ts`
- ⏳ `components/layout/index.ts`
- ⏳ `components/theme/index.ts`

### Phase 2: Komponenten verschieben
- ⏳ Modal-Komponenten nach `components/modals/`
- ⏳ Input-Komponenten nach `components/common/inputs/`
- ⏳ Layout-Komponenten nach `components/layout/`
- ⏳ Theme-Komponenten nach `components/theme/`
- ⏳ Instance-Komponenten nach `components/instance/`
- ⏳ Dashboard-Komponenten nach `components/dashboard/`

### Phase 3: Komponenten umbenennen
- ⏳ Modal-Komponenten auf `-Dialog` standardisieren
- ⏳ Input-Komponenten umbenennen für Klarheit
- ⏳ Layout-Komponenten umbenennen

### Phase 4: Imports aktualisieren
- ⏳ Alle Imports in Seiten aktualisieren
- ⏳ Alle Imports in anderen Komponenten aktualisieren
- ⏳ Zentrale Index-Dateien für Export

### Phase 5: Aufräumen
- ⏳ Alte Dateien löschen
- ⏳ Doppelte Dateien entfernen
- ⏳ Nicht verwendete Komponenten identifizieren

## 📝 Beispiel: Import-Änderungen

### Alt:
```typescript
import ConfirmationModal from '../components/ConfirmationModal';
import DashboardCustomizer from '../components/DashboardCustomizer';
import TopBar from '../components/TopBar';
```

### Neu:
```typescript
import { ConfirmDialog } from '../components/modals';
import { DashboardLayoutCustomizer } from '../components/dashboard';
import { TopNavBar } from '../components/layout';
```

## 🎯 Vorteile der Reorganisation

✅ **Bessere Übersichtlichkeit** - Komponenten sind nach Kategorie organisiert
✅ **Einheitliche Naming** - Konsistente Konvention (Dialog, Input, etc.)
✅ **Leichtere Navigation** - Schneller die richtige Komponente finden
✅ **Bessere Imports** - Index-Dateien für vereinfachte Imports
✅ **Wartbarkeit** - Einfacher Komponenten zu verwalten
✅ **Skalierbarkeit** - Struktur wächst mit dem Projekt
