import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNotification } from "../context/NotificationContext";
import { RangeSlider, SelectDropdown } from "../components/common/inputs";
import { ThemePresetCard, ThemePreview } from "../components/theme";
import { ThemeExportDialog } from "../components/modals";
import { syncCustomFonts } from "../services/fontManager";
import { updateShadcnVars } from "../lib/utils";
import ThemeMarketplace from "./ThemeMarketplace";
import PageHeader from "../components/layout/PageHeader";
import PageContent from "../components/layout/PageContent";
import { Button } from "../components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { ScrollArea } from "../components/ui/scroll-area";
import { Badge } from "../components/ui/badge";
import {
  Upload,
  Download,
  Trash2,
  Image as ImageIcon,
  RotateCcw,
  Save,
  Type,
  Palette,
  Sparkles,
  Layout,
  Eye,
  Moon,
  Sun,
  Globe,
  Layers,
  Droplets,
  Zap,
  Shield,
  Star,
  Heart,
  Brush,
  Contrast,
  AlertCircle,
  Loader2
} from "lucide-react";

// Typdefinitionen
interface Theme {
  primaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textOnBackground: string;
  textOnSurface: string;
  textOnPrimary: string;
  glassBlur: number;
  glassOpacity: number;
  consoleOpacity: number;
  borderRadius: number;
  bgMedia: { url: string; type: string };
  sidebarGlow: number;
  globalGlow: number;
  panelOpacity: number;
  bgOverlay: number;
  autoAdaptColor: boolean;
  fontFamily: string;
  customFonts: any[];
}

interface Preset {
  name: string;
  primary: string;
  bg: string;
  surface: string;
  textOnBackground: string;
  textOnSurface: string;
  textOnPrimary: string;
  category?: string;
  rating?: number;
  sidebarGlow?: number;
  globalGlow?: number;
  panelOpacity?: number;
  bgOverlay?: number;
  fontFamily?: string;
}

const PRESETS: Preset[] = [
  {
    name: "Voidrix Forest",
    primary: "#e26602",
    bg: "#111111",
    surface: "#1c1c1c",
    textOnBackground: "#f5f5f5",
    textOnSurface: "#f5f5f5",
    textOnPrimary: "#1a1208",
    category: "default",
    rating: 5,
  },
  {
    name: "Light Voidrix",
    primary: "#d24e01",
    bg: "#f9ddb1",
    surface: "#f5c77e",
    textOnBackground: "#2a1a0e",
    textOnSurface: "#2c1b0f",
    textOnPrimary: "#fff4ea",
    category: "light",
    rating: 4,
  },
  {
    name: "Emerald",
    primary: "#1bd96a",
    bg: "#111111",
    surface: "#1c1c1c",
    textOnBackground: "#ecfff5",
    textOnSurface: "#e8fff3",
    textOnPrimary: "#062012",
    category: "vibrant",
    rating: 5,
  },
  {
    name: "Ruby",
    primary: "#ff5c6c",
    bg: "#140a0c",
    surface: "#1f1114",
    textOnBackground: "#ffecef",
    textOnSurface: "#ffe8ec",
    textOnPrimary: "#2a0b11",
    category: "vibrant",
    rating: 4,
  },
  {
    name: "Sapphire",
    primary: "#3da9fc",
    bg: "#0b1220",
    surface: "#121a2b",
    textOnBackground: "#eaf3ff",
    textOnSurface: "#e5f0ff",
    textOnPrimary: "#081a2b",
    category: "cool",
    rating: 5,
  },
  {
    name: "Amethyst",
    primary: "#b388ff",
    bg: "#14121c",
    surface: "#1c1826",
    textOnBackground: "#f2eaff",
    textOnSurface: "#eee4ff",
    textOnPrimary: "#1f1433",
    category: "cool",
    rating: 5,
  },
  {
    name: "Ocean",
    primary: "#00e0c6",
    bg: "#071418",
    surface: "#0f1f24",
    textOnBackground: "#dcfffa",
    textOnSurface: "#d7fff9",
    textOnPrimary: "#04221e",
    category: "cool",
    rating: 5,
  },
  {
    name: "Sunset",
    primary: "#ff8a5b",
    bg: "#1a0f0a",
    surface: "#241611",
    textOnBackground: "#fff0e9",
    textOnSurface: "#ffebe3",
    textOnPrimary: "#311204",
    category: "warm",
    rating: 4,
  },
  {
    name: "Cyberpunk",
    primary: "#f3e600",
    bg: "#1a0033",
    surface: "#2d004d",
    textOnBackground: "#f7eeff",
    textOnSurface: "#f3e7ff",
    textOnPrimary: "#1d1a00",
    category: "neon",
    rating: 5,
  },
  {
    name: "Frost",
    primary: "#a5f3fc",
    bg: "#0f172a",
    surface: "#1e293b",
    textOnBackground: "#e8f4ff",
    textOnSurface: "#e4f0ff",
    textOnPrimary: "#082027",
    category: "cool",
    rating: 4,
  },
  {
    name: "Autumn",
    primary: "#fb923c",
    bg: "#1c1917",
    surface: "#292524",
    textOnBackground: "#fff3eb",
    textOnSurface: "#ffefe7",
    textOnPrimary: "#2f1503",
    category: "warm",
    rating: 4,
  },
  {
    name: "Midnight",
    primary: "#3b82f6",
    bg: "#000000",
    surface: "#111111",
    textOnBackground: "#eaf2ff",
    textOnSurface: "#edf3ff",
    textOnPrimary: "#081a38",
    category: "dark",
    rating: 5,
  },
  {
    name: "Candy",
    primary: "#f472b6",
    bg: "#1e1b4b",
    surface: "#312e81",
    textOnBackground: "#f8f1ff",
    textOnSurface: "#f6eeff",
    textOnPrimary: "#2f0b23",
    category: "vibrant",
    rating: 4,
  },
  {
    name: "Gold",
    primary: "#fbbf24",
    bg: "#171717",
    surface: "#262626",
    textOnBackground: "#fff7e6",
    textOnSurface: "#fff4e0",
    textOnPrimary: "#2e2100",
    category: "warm",
    rating: 4,
  },
  {
    name: "Lava Core",
    primary: "#ff5a1f",
    bg: "#1b0b07",
    surface: "#2a120d",
    textOnBackground: "#ffe9dd",
    textOnSurface: "#ffdccc",
    textOnPrimary: "#2b1208",
    category: "warm",
    rating: 5,
    sidebarGlow: 0.75,
    globalGlow: 0.6,
    panelOpacity: 0.9,
    bgOverlay: 0.35,
  },
  {
    name: "Deep Water",
    primary: "#33b6ff",
    bg: "#061520",
    surface: "#0c2433",
    textOnBackground: "#e6f8ff",
    textOnSurface: "#d6f0ff",
    textOnPrimary: "#072536",
    category: "cool",
    rating: 5,
    sidebarGlow: 0.65,
    globalGlow: 0.55,
    panelOpacity: 0.9,
    bgOverlay: 0.32,
  },
];

interface FontOption {
  value: string;
  label: string;
  category: string;
  style?: React.CSSProperties;
  actionIcon?: React.ReactNode;
  fontId?: string;
}

const FONT_OPTIONS: FontOption[] = [
  { value: "Poppins", label: "Poppins", category: "modern" },
  { value: "Inter", label: "Inter", category: "modern" },
  { value: "Montserrat", label: "Montserrat", category: "modern" },
  { value: "Roboto", label: "Roboto", category: "classic" },
  { value: "Geist", label: "Geist", category: "modern" },
  { value: "JetBrains Mono", label: "JetBrains Mono", category: "mono" },
  { value: "Open Sans", label: "Open Sans", category: "classic" },
  { value: "Nunito", label: "Nunito", category: "modern" },
  { value: "Ubuntu", label: "Ubuntu", category: "classic" },
  { value: "Outfit", label: "Outfit", category: "modern" },
];

const DEFAULT_THEME: Theme = {
  primaryColor: "#e26602",
  backgroundColor: "#111111",
  surfaceColor: "#1c1c1c",
  textOnBackground: "#fafafa",
  textOnSurface: "#fafafa",
  textOnPrimary: "#0d0d0d",
  glassBlur: 10,
  glassOpacity: 0.8,
  consoleOpacity: 0.8,
  borderRadius: 12,
  bgMedia: { url: "", type: "none" },
  sidebarGlow: 0,
  globalGlow: 0,
  panelOpacity: 0.85,
  bgOverlay: 0.4,
  autoAdaptColor: false,
  fontFamily: "Poppins",
  customFonts: [],
};

const sanitizeTheme = (nextTheme: any): Theme => {
  const availableFonts = new Set([
    ...FONT_OPTIONS.map((font) => font.value),
    ...((nextTheme.customFonts ?? []).map((font: any) => font.family)),
  ]);

  if (!availableFonts.has(nextTheme.fontFamily)) {
    return {
      ...nextTheme,
      fontFamily: "Poppins",
    };
  }

  return nextTheme;
};

// Terminal Icon Component
const TerminalIcon = ({ className, ...props }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
    >
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
);

// ColorPicker Component
const ColorPicker = ({ value, onChange }: { value: string; onChange: (val: string) => void }) => (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="relative w-12 h-12 rounded-xl cursor-pointer border-2 border-border bg-background transition-all duration-200 hover:scale-105 hover:shadow-lg"
          style={{
            background: value,
            WebkitAppearance: "none",
            MozAppearance: "none",
            appearance: "none",
          }}
      />
      <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
      {value.toUpperCase()}
    </span>
    </div>
);

function Styling() {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const [theme, setTheme] = useState<Theme>({ ...DEFAULT_THEME });
  const [activeView, setActiveView] = useState<string>("editor");
  const [customPresets, setCustomPresets] = useState<any[]>([]);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  const categories = [
    { id: "all", label: "All", icon: Palette },
    { id: "default", label: "Default", icon: Star },
    { id: "dark", label: "Dark", icon: Moon },
    { id: "light", label: "Light", icon: Sun },
    { id: "cool", label: "Cool", icon: Droplets },
    { id: "warm", label: "Warm", icon: Zap },
    { id: "vibrant", label: "Vibrant", icon: Sparkles },
    { id: "neon", label: "Neon", icon: Zap },
  ];

  const filteredPresets = PRESETS.filter((preset) =>
      activeCategory === "all" ? true : preset.category === activeCategory
  );

  const fontOptions: any[] = [
    ...(theme.customFonts ?? []).map((font: any) => ({
      value: font.family,
      label: font.name,
      style: { fontFamily: font.family },
      actionIcon: <Trash2 className="h-3.5 w-3.5" />,
      fontId: font.id,
      category: "custom",
    })),
    ...FONT_OPTIONS.map((font) => ({
      value: font.value,
      label: font.label,
      style: { fontFamily: font.value },
      category: font.category,
    })),
  ];

  useEffect(() => {
    loadTheme();
    loadCustomPresets();
  }, []);

  useEffect(() => {
    if (activeView === "editor") {
      loadCustomPresets();
    }
  }, [activeView]);

  const loadCustomPresets = async () => {
    try {
      const res = await window.electronAPI.getCustomPresets();
      if (res.success) setCustomPresets(res.presets);
    } catch (error) {
      console.error("Failed to load custom presets:", error);
    }
  };

  const handleDeletePreset = async (handle: string) => {
    try {
      const res = await window.electronAPI.deleteCustomPreset(handle);
      if (res.success) {
        addNotification(t("styling.preset_deleted"), "success");
        loadCustomPresets();
      }
    } catch (error) {
      console.error("Failed to delete preset:", error);
    }
  };

  const handleExportTheme = async (themeName: string) => {
    const presetData = {
      handle: themeName.toLowerCase().replace(/[^a-z0-9_-]/g, "_"),
      name: themeName,
      primary: theme.primaryColor,
      bg: theme.backgroundColor,
      surface: theme.surfaceColor,
      textOnBackground: theme.textOnBackground,
      textOnSurface: theme.textOnSurface,
      textOnPrimary: theme.textOnPrimary,
      sidebarGlow: theme.sidebarGlow,
      globalGlow: theme.globalGlow,
      panelOpacity: theme.panelOpacity,
      bgOverlay: theme.bgOverlay,
      fontFamily: theme.fontFamily,
    };

    try {
      const res = await window.electronAPI.exportCustomPreset(presetData);
      if (res.success) {
        addNotification(t("styling.exported_to", { path: res.path }), "success");
        setShowExportModal(false);
      } else if (res.error !== "Cancelled") {
        addNotification(`${t("styling.export")} failed: ${res.error}`, "error");
      }
    } catch (error) {
      console.error("Failed to export theme:", error);
    }
  };

  const handleImportTheme = async () => {
    try {
      const res = await window.electronAPI.importCustomPreset();
      if (res.success) {
        addNotification(t("styling.imported_success"), "success");
        loadCustomPresets();
      } else if (res.error !== "Cancelled") {
        addNotification(`${t("styling.import")} failed: ${res.error}`, "error");
      }
    } catch (error) {
      console.error("Failed to import theme:", error);
    }
  };

  const applyPreset = (p: Preset) => {
    const nt = sanitizeTheme({
      ...theme,
      primaryColor: p.primary,
      backgroundColor: p.bg,
      surfaceColor: p.surface,
      textOnBackground: p.textOnBackground ?? theme.textOnBackground,
      textOnSurface: p.textOnSurface ?? theme.textOnSurface,
      textOnPrimary: p.textOnPrimary ?? theme.textOnPrimary,
      sidebarGlow: p.sidebarGlow ?? theme.sidebarGlow,
      globalGlow: p.globalGlow ?? theme.globalGlow,
      panelOpacity: p.panelOpacity ?? theme.panelOpacity,
      bgOverlay: p.bgOverlay ?? theme.bgOverlay,
      fontFamily: p.fontFamily ?? theme.fontFamily,
    });
    setTheme(nt);
    setHasChanges(true);
    applyTheme(nt, true);
  };

  const loadTheme = async () => {
    try {
      const res = await window.electronAPI.getSettings();
      if (res.success && res.settings.theme) {
        const loadedTheme = sanitizeTheme({ ...DEFAULT_THEME, ...res.settings.theme });
        setTheme(loadedTheme);
        applyTheme(loadedTheme);
      }
    } catch (error) {
      console.error("Failed to load theme:", error);
    }
  };

  const handleSelectCustomFont = async () => {
    try {
      const res = await window.electronAPI.selectCustomFont();
      if (res.success && res.settings?.theme) {
        const nextTheme = sanitizeTheme({ ...DEFAULT_THEME, ...res.settings.theme });
        setTheme(nextTheme);
        setHasChanges(true);
        applyTheme(nextTheme);
      }
    } catch (error) {
      console.error("Failed to select custom font:", error);
    }
  };

  const handleDeleteCustomFont = async (option: any) => {
    if (!option.fontId) return;

    try {
      const res = await window.electronAPI.deleteCustomFont(option.fontId);
      if (res.success && res.settings?.theme) {
        const nextTheme = sanitizeTheme({ ...DEFAULT_THEME, ...res.settings.theme });
        setTheme(nextTheme);
        setHasChanges(true);
        applyTheme(nextTheme);
      }
    } catch (error) {
      console.error("Failed to delete custom font:", error);
    }
  };

  const applyTheme = (t: Theme, isPreview: boolean = false) => {
    const root = document.documentElement;
    syncCustomFonts(t.customFonts ?? []);
    root.style.setProperty("--primary-color", t.primaryColor);
    root.style.setProperty("--background-color", t.backgroundColor);
    root.style.setProperty("--surface-color", t.surfaceColor);
    root.style.setProperty("--text-on-background", t.textOnBackground ?? "#fafafa");
    root.style.setProperty("--text-on-surface", t.textOnSurface ?? "#fafafa");
    root.style.setProperty("--text-on-primary", t.textOnPrimary ?? "#0d0d0d");
    root.style.setProperty("--glass-blur", `${t.glassBlur}px`);
    root.style.setProperty("--glass-opacity", String(t.glassOpacity));
    root.style.setProperty("--console-opacity", String(t.consoleOpacity ?? 0.8));
    root.style.setProperty("--border-radius", `${t.borderRadius ?? 12}px`);
    root.style.setProperty("--sidebar-glow-intensity", String(t.sidebarGlow ?? 0));
    root.style.setProperty("--global-glow-intensity", String(t.globalGlow ?? 0));
    root.style.setProperty("--panel-opacity", String(t.panelOpacity ?? 0.85));
    root.style.setProperty("--bg-overlay-opacity", String(t.bgOverlay ?? 0.4));
    root.style.setProperty("--launcher-font", `'${t.fontFamily ?? "Poppins"}'`);

    const adjustColor = (hex: string, pct: number) => {
      const n = parseInt(hex.replace("#", ""), 16);
      const a = Math.round(2.55 * pct);
      const R = (n >> 16) + a;
      const G = ((n >> 8) & 0x00ff) + a;
      const B = (n & 0x0000ff) + a;
      return (
          "#" +
          (
              0x1000000 +
              (R < 255 ? (R < 0 ? 0 : R) : 255) * 0x10000 +
              (G < 255 ? (G < 0 ? 0 : G) : 255) * 0x100 +
              (B < 255 ? (B < 0 ? 0 : B) : 255)
          )
              .toString(16)
              .slice(1)
      );
    };

    root.style.setProperty("--primary-hover-color", adjustColor(t.primaryColor, 15));
    root.style.setProperty("--background-dark-color", adjustColor(t.backgroundColor, -20));

    const hexToRgb = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `${r}, ${g}, ${b}`;
    };

    root.style.setProperty("--surface-color-rgb", hexToRgb(t.surfaceColor));
    root.style.setProperty("--primary-color-rgb", hexToRgb(t.primaryColor));
    root.style.setProperty("--background-dark-color-rgb", hexToRgb(adjustColor(t.backgroundColor, -20)));

    if (!isPreview) {
      if (t.bgMedia && t.bgMedia.url) {
        root.style.setProperty("--bg-url", t.bgMedia.url);
        root.style.setProperty("--bg-type", t.bgMedia.type);
      } else {
        root.style.setProperty("--bg-url", "");
        root.style.setProperty("--bg-type", "none");
      }
    }

    updateShadcnVars(t);
  };

  const handleUpdate = (key: string, value: any) => {
    const newTheme = sanitizeTheme({ ...theme, [key]: value });
    setTheme(newTheme);
    setHasChanges(true);
    const isBackgroundChange = key === "bgMedia" || key === "bgOverlay";
    applyTheme(newTheme, isBackgroundChange);
  };

  const extractColor = (url: string, type: string): Promise<string> => {
    return new Promise((resolve) => {
      if (type === "video") {
        const video = document.createElement("video");
        video.crossOrigin = "Anonymous";
        video.onloadeddata = () => {
          const canvas = document.createElement("canvas");
          canvas.width = 100;
          canvas.height = 100;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(video, 0, 0, 100, 100);
            const data = ctx.getImageData(0, 0, 100, 100).data;
            let r = 0,
                g = 0,
                b = 0;
            for (let i = 0; i < data.length; i += 4) {
              r += data[i];
              g += data[i + 1];
              b += data[i + 2];
            }
            const count = data.length / 4;
            const rgbToHex = (r: number, g: number, b: number) =>
                "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
            resolve(rgbToHex(Math.round(r / count), Math.round(g / count), Math.round(b / count)));
          }
        };
        video.src = `app-media:///${url.replace(/\\/g, "/")}`;
        video.load();
      } else {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = 100;
          canvas.height = 100;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, 100, 100);
            const data = ctx.getImageData(0, 0, 100, 100).data;
            let r = 0,
                g = 0,
                b = 0;
            for (let i = 0; i < data.length; i += 4) {
              r += data[i];
              g += data[i + 1];
              b += data[i + 2];
            }
            const count = data.length / 4;
            const rgbToHex = (r: number, g: number, b: number) =>
                "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
            resolve(rgbToHex(Math.round(r / count), Math.round(g / count), Math.round(b / count)));
          }
        };
        img.src = `app-media:///${url.replace(/\\/g, "/")}`;
      }
    });
  };

  const handleSelectBackground = async () => {
    try {
      const res = await window.electronAPI.selectBackgroundMedia();
      if (res.success && res.url) {
        if (theme.autoAdaptColor) {
          const color = await extractColor(res.url, res.type);
          setTheme((prev) => {
            const nt = {
              ...prev,
              bgMedia: { url: res.url, type: res.type },
              primaryColor: color,
            };
            setHasChanges(true);
            applyTheme(nt, true);
            return nt;
          });
        } else {
          handleUpdate("bgMedia", { url: res.url, type: res.type });
        }
      }
    } catch (error) {
      console.error("Failed to select background:", error);
    }
  };

  const handleFactoryReset = () => {
    const nextTheme = {
      ...DEFAULT_THEME,
      customFonts: theme.customFonts ?? [],
    };
    setTheme(nextTheme);
    setHasChanges(true);
    applyTheme(nextTheme, false);
    addNotification(t("styling.reset_factory_success"), "success");
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await window.electronAPI.getSettings();
      if (res.success) {
        const newSettings = { ...res.settings, theme };
        const saveRes = await window.electronAPI.saveSettings(newSettings);
        if (saveRes.success) {
          applyTheme(theme, false);
          setHasChanges(false);
          addNotification(t("styling.saved_success"), "success");
        }
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      addNotification("Failed to save settings", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    loadTheme();
    setHasChanges(false);
  };

  return (
      <div className="relative flex flex-col h-full overflow-hidden bg-gradient-to-br from-background via-background to-background/95">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(72rem_26rem_at_8%_-5%,rgba(124,58,237,0.14),transparent),radial-gradient(54rem_26rem_at_92%_110%,rgba(59,130,246,0.1),transparent)]" />
        <PageHeader
            title={t("styling.title")}
            description={
              activeView === "editor"
                  ? "Customize every aspect of your VoidrixClient appearance"
                  : "Discover and install custom themes built by the community"
            }
        >
          <Tabs value={activeView} onValueChange={setActiveView}>
            <TabsList className="bg-muted/50 backdrop-blur-sm border border-border/60">
              <TabsTrigger value="editor" className="gap-2">
                <Brush className="h-3.5 w-3.5" />
                {t("styling.editor", "Editor")}
              </TabsTrigger>
              <TabsTrigger value="marketplace" className="gap-2">
                <Globe className="h-3.5 w-3.5" />
                {t("extensions.theme_marketplace", "Marketplace")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </PageHeader>

        <PageContent className="relative">
          {activeView === "marketplace" ? (
              <ThemeMarketplace />
          ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Sidebar - Themes */}
                  <div className="lg:col-span-3 space-y-4">
                    <Card className="border-border/60 bg-gradient-to-br from-card/85 via-card/60 to-card/40 backdrop-blur-sm shadow-[0_16px_40px_-28px_rgba(124,58,237,0.7)]">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Sparkles className="h-3.5 w-3.5" />
                            {t("styling.quick_themes")}
                          </CardTitle>
                          <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleImportTheme}
                              className="h-7 px-2 text-[10px] font-medium gap-1"
                          >
                            <Download className="h-3 w-3" />
                            Import
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        {/* Category Tabs */}
                        <div className="px-4 pb-3">
                          <div className="flex flex-wrap gap-1.5">
                            {categories.map((cat) => {
                              const Icon = cat.icon;
                              const isActiveCategory = activeCategory === cat.id;
                              return (
                                  <button
                                      key={cat.id}
                                      onClick={() => setActiveCategory(cat.id)}
                                      className={`
                                inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all duration-200
                                ${
                                          isActiveCategory
                                              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                                              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                                      }
                              `}
                                  >
                                    <Icon className="h-3 w-3" />
                                    {cat.label}
                                  </button>
                              );
                            })}
                          </div>
                        </div>

                        <ScrollArea className="h-[480px] px-4 pb-4">
                          <div className="space-y-4">
                            {customPresets.length > 0 && (
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                Custom
                              </span>
                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                                  </div>
                                  <div className="grid grid-cols-1 gap-2">
                                    {customPresets.map((p) => (
                                        <ThemePresetCard
                                            key={p.handle}
                                            theme={p}
                                            onApply={() => applyPreset(p)}
                                            onDelete={() => handleDeletePreset(p.handle)}
                                            isCustom={true}
                                        />
                                    ))}
                                  </div>
                                </div>
                            )}

                            {filteredPresets.length > 0 && (
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                Presets
                              </span>
                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                                  </div>
                                  <div className="grid grid-cols-1 gap-2">
                                    {filteredPresets.map((p) => (
                                        <ThemePresetCard
                                            key={p.name}
                                            theme={p}
                                            onApply={() => applyPreset(p)}
                                        />
                                    ))}
                                  </div>
                                </div>
                            )}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Main Content */}
                  <div className="lg:col-span-9 space-y-4">
                    {/* Live Preview */}
                    <Card className="border-border/60 bg-gradient-to-br from-card/85 via-card/60 to-card/40 backdrop-blur-sm overflow-hidden shadow-[0_16px_40px_-28px_rgba(59,130,246,0.7)]">
                      <CardHeader className="pb-3 border-b border-border/50">
                        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                          <Eye className="h-3.5 w-3.5" />
                          {t("styling.live_preview")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <ThemePreview theme={theme} />
                      </CardContent>
                    </Card>

                    {/* Color Controls */}
                    <Card className="border-border/60 bg-gradient-to-br from-card/85 via-card/60 to-card/40 backdrop-blur-sm">
                      <CardHeader className="pb-3 border-b border-border/50">
                        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                          <Palette className="h-3.5 w-3.5" />
                          {t("styling.accent_base_text_color")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {[
                            {
                              id: "accent",
                              label: "Accent Color",
                              baseKey: "primaryColor",
                              textKey: "textOnPrimary",
                              icon: Zap,
                            },
                            {
                              id: "background",
                              label: "Background",
                              baseKey: "backgroundColor",
                              textKey: "textOnBackground",
                              icon: Layout,
                            },
                            {
                              id: "panels",
                              label: "Panels",
                              baseKey: "surfaceColor",
                              textKey: "textOnSurface",
                              icon: Layers,
                            },
                          ].map((row) => {
                            const RowIcon = row.icon;
                            return (
                                <div key={row.id} className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    <RowIcon className="h-3 w-3 text-muted-foreground" />
                                    <Label className="text-xs font-medium text-muted-foreground">
                                      {row.label}
                                    </Label>
                                  </div>
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex-1 text-center">
                                      <div className="text-[9px] text-muted-foreground mb-1">Base</div>
                                      <ColorPicker
                                          value={theme[row.baseKey as keyof Theme] as string}
                                          onChange={(val) => handleUpdate(row.baseKey, val)}
                                      />
                                    </div>
                                    <div className="flex-1 text-center">
                                      <div className="text-[9px] text-muted-foreground mb-1">Text</div>
                                      <ColorPicker
                                          value={theme[row.textKey as keyof Theme] as string}
                                          onChange={(val) => handleUpdate(row.textKey, val)}
                                      />
                                    </div>
                                  </div>
                                </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Effects & Atmosphere */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Effects Card */}
                      <Card className="border-border/60 bg-gradient-to-br from-card/85 via-card/60 to-card/40 backdrop-blur-sm">
                        <CardHeader className="pb-3 border-b border-border/50">
                          <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Zap className="h-3.5 w-3.5" />
                            {t("styling.interactive_effects")}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5 pt-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                                <Type className="h-3 w-3" />
                                {t("styling.launcher_font")}
                              </Label>
                              <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleSelectCustomFont}
                                  className="h-7 text-[10px] font-medium gap-1 border-border/60 bg-background/35 hover:bg-primary/5"
                              >
                                <Type className="h-3 w-3" />
                                Add Font
                              </Button>
                            </div>
                            <SelectDropdown
                                options={fontOptions}
                                value={theme.fontFamily ?? "Poppins"}
                                onChange={(val: string) => handleUpdate("fontFamily", val)}
                                onOptionAction={handleDeleteCustomFont}
                            />
                          </div>
                          <RangeSlider
                              label={t("styling.corner_roundness")}
                              value={theme.borderRadius ?? 12}
                              min={0}
                              max={32}
                              step={2}
                              unit="px"
                              icon={<Layout className="h-3 w-3" />}
                              onChange={(val: number) => handleUpdate("borderRadius", val)}
                          />
                          <RangeSlider
                              label={t("styling.glass_blur")}
                              value={theme.glassBlur}
                              min={0}
                              max={40}
                              step={1}
                              unit="px"
                              icon={<Contrast className="h-3 w-3" />}
                              onChange={(val: number) => handleUpdate("glassBlur", val)}
                          />
                          <RangeSlider
                              label={t("styling.sidebar_glow")}
                              value={Math.round((theme.sidebarGlow ?? 0) * 100)}
                              min={0}
                              max={100}
                              step={5}
                              unit="%"
                              icon={<Shield className="h-3 w-3" />}
                              onChange={(val: number) => handleUpdate("sidebarGlow", val / 100)}
                          />
                          <RangeSlider
                              label={t("styling.global_glow")}
                              value={Math.round((theme.globalGlow ?? 0) * 100)}
                              min={0}
                              max={100}
                              step={5}
                              unit="%"
                              icon={<Sparkles className="h-3 w-3" />}
                              onChange={(val: number) => handleUpdate("globalGlow", val / 100)}
                          />
                          <RangeSlider
                              label={t("styling.panel_opacity")}
                              value={Math.round((theme.panelOpacity ?? 0.85) * 100)}
                              min={0}
                              max={100}
                              step={5}
                              unit="%"
                              icon={<Layers className="h-3 w-3" />}
                              onChange={(val: number) => handleUpdate("panelOpacity", val / 100)}
                          />
                          <RangeSlider
                              label={t("styling.console_opacity")}
                              value={Math.round((theme.consoleOpacity ?? 0.8) * 100)}
                              min={0}
                              max={100}
                              step={5}
                              unit="%"
                              icon={<TerminalIcon className="h-3 w-3" />}
                              onChange={(val: number) => handleUpdate("consoleOpacity", val / 100)}
                          />
                        </CardContent>
                      </Card>

                      {/* Atmosphere Card */}
                      <Card className="border-border/60 bg-gradient-to-br from-card/85 via-card/60 to-card/40 backdrop-blur-sm">
                        <CardHeader className="pb-3 border-b border-border/50">
                          <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Droplets className="h-3.5 w-3.5" />
                            {t("styling.atmosphere")}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5 pt-4">
                          <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-background/35">
                            <div className="space-y-0.5">
                              <Label className="text-xs font-medium flex items-center gap-2">
                                <Heart className="h-3 w-3 text-primary" />
                                Auto Color Adaptation
                              </Label>
                              <p className="text-[10px] text-muted-foreground">
                                Automatically extract accent color from background
                              </p>
                            </div>
                            <Switch
                                checked={theme.autoAdaptColor}
                                onCheckedChange={(checked) => handleUpdate("autoAdaptColor", checked)}
                            />
                          </div>

                          <div
                              onClick={handleSelectBackground}
                              className="relative aspect-video rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group overflow-hidden"
                          >
                            {theme.bgMedia?.url ? (
                                <>
                                  {theme.bgMedia.type === "video" ? (
                                      <video
                                          src={`app-media:///${theme.bgMedia.url.replace(/\\/g, "/")}`}
                                          className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity"
                                          autoPlay
                                          loop
                                          muted
                                      />
                                  ) : (
                                      <img
                                          src={`app-media:///${theme.bgMedia.url.replace(/\\/g, "/")}`}
                                          className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity"
                                          alt=""
                                      />
                                  )}
                                  <div className="relative z-10">
                                    <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                                      <ImageIcon className="h-3 w-3 mr-1" />
                                      Change Background
                                    </Badge>
                                  </div>
                                </>
                            ) : (
                                <>
                                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all">
                                    <ImageIcon className="h-8 w-8 text-primary/60 group-hover:text-primary transition-colors" />
                                  </div>
                                  <div className="text-center">
                                    <p className="text-xs font-medium text-muted-foreground">
                                      Click to select background
                                    </p>
                                    <p className="text-[9px] text-muted-foreground/60 mt-0.5">
                                      Images or videos supported
                                    </p>
                                  </div>
                                </>
                            )}
                          </div>

                          {theme.bgMedia?.url && (
                              <div className="space-y-4">
                                <RangeSlider
                                    label="Overlay Intensity"
                                    value={Math.round((theme.bgOverlay ?? 0.4) * 100)}
                                    min={0}
                                    max={100}
                                    step={5}
                                    unit="%"
                                    icon={<Layers className="h-3 w-3" />}
                                    onChange={(val: number) => handleUpdate("bgOverlay", val / 100)}
                                />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={async () => {
                                      if (theme.bgMedia.url) {
                                        await window.electronAPI.deleteBackgroundMedia(theme.bgMedia.url);
                                      }
                                      handleUpdate("bgMedia", { url: "", type: "none" });
                                    }}
                                    className="text-destructive hover:text-destructive w-full justify-center gap-2 border border-destructive/20 hover:border-destructive/40"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Remove Background
                                </Button>
                              </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    <Separator className="bg-border/50" />

                    {/* Action Buttons */}
                    <div className="rounded-xl border border-border/60 bg-card/35 px-3 py-2.5 flex justify-end gap-2">
                      {hasChanges && (
                          <div className="flex items-center gap-2 mr-auto">
                            <AlertCircle className="h-3.5 w-3.5 text-violet-400" />
                            <span className="text-[10px] text-muted-foreground">Unsaved changes</span>
                          </div>
                      )}
                      <Button variant="outline" size="sm" onClick={handleReset} className="gap-2 border-border/60 bg-background/35 hover:bg-primary/5">
                        <RotateCcw className="h-3.5 w-3.5" />
                        {t("styling.reset")}
                      </Button>
                      <Button
                          variant="outline"
                          size="sm"
                          onClick={handleFactoryReset}
                          className="gap-2 text-destructive hover:text-destructive border-destructive/30 bg-destructive/5 hover:bg-destructive/10"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Factory Reset
                      </Button>
                      <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowExportModal(true)}
                          className="gap-2 border-border/60 bg-background/35 hover:bg-primary/5"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Export
                      </Button>
                      <Button size="sm" onClick={handleSave} disabled={isSaving} className="gap-2 bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:opacity-95">
                        {isSaving ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <Save className="h-3.5 w-3.5" />
                        )}
                        {isSaving ? "Saving..." : t("styling.save")}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
          )}
        </PageContent>

        {showExportModal && (
            <ThemeExportDialog
                presetData={theme}
                onClose={() => setShowExportModal(false)}
                onExport={handleExportTheme}
            />
        )}
      </div>
  );
}

export default Styling;