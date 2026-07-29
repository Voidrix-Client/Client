export interface ThemePreset {
  primaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textOnBackground: string;
  textOnSurface: string;
  textOnPrimary: string;
  sidebarGlow?: number;
  globalGlow?: number;
  panelOpacity?: number;
  bgOverlay?: number;
}

export interface Theme extends ThemePreset {
  glassBlur?: number;
  glassOpacity?: number;
  consoleOpacity?: number;
  borderRadius?: number;
  autoAdaptColor?: boolean;
  fontFamily?: string;
  customFonts?: any[];
  bgMedia?: { url: string; type: string };
}

// Base theme presets
const VOIDRIX_FOREST_THEME_PRESET: ThemePreset = {
  primaryColor: '#7c3aed',
  backgroundColor: '#111111',
  surfaceColor: '#1c1c1c',
  textOnBackground: '#f5f5f5',
  textOnSurface: '#f5f5f5',
  textOnPrimary: '#f8f7ff'
};

const LIGHT_VOIDRIX_THEME_PRESET: ThemePreset = {
  primaryColor: '#6366f1',
  backgroundColor: '#eef2ff',
  surfaceColor: '#dbeafe',
  textOnBackground: '#1a1d3a',
  textOnSurface: '#1f2447',
  textOnPrimary: '#ffffff'
};

const VOIDRIX_LAVA_THEME_PRESET: ThemePreset = {
  primaryColor: '#ff5a1f',
  backgroundColor: '#1b0b07',
  surfaceColor: '#2a120d',
  textOnBackground: '#ffe9dd',
  textOnSurface: '#ffdccc',
  textOnPrimary: '#2b1208',
  sidebarGlow: 0.75,
  globalGlow: 0.6,
  panelOpacity: 0.9,
  bgOverlay: 0.35
};

const VOIDRIX_WATER_THEME_PRESET: ThemePreset = {
  primaryColor: '#33b6ff',
  backgroundColor: '#061520',
  surfaceColor: '#0c2433',
  textOnBackground: '#e6f8ff',
  textOnSurface: '#d6f0ff',
  textOnPrimary: '#072536',
  sidebarGlow: 0.65,
  globalGlow: 0.55,
  panelOpacity: 0.9,
  bgOverlay: 0.32
};

const VOIDRIX_HORIZON_THEME_PRESET: ThemePreset = {
  primaryColor: '#00a4ff',
  backgroundColor: '#0b1a2b',
  surfaceColor: '#13253c',
  textOnBackground: '#e9f2ff',
  textOnSurface: '#dbe8ff',
  textOnPrimary: '#ffffff'
};

const VOIDRIX_NIGHT_THEME_PRESET: ThemePreset = {
  primaryColor: '#6a5af9',
  backgroundColor: '#0f1329',
  surfaceColor: '#1a2040',
  textOnBackground: '#e6e9ff',
  textOnSurface: '#c8d0ff',
  textOnPrimary: '#ffffff'
};

// Premium Theme Presets
const VOIDRIX_CYBERPUNK_THEME_PRESET: ThemePreset = {
  primaryColor: '#ff00ff',
  backgroundColor: '#0a0e27',
  surfaceColor: '#1a1f3a',
  textOnBackground: '#00ffff',
  textOnSurface: '#00ff88',
  textOnPrimary: '#000000',
  sidebarGlow: 0.8,
  globalGlow: 0.7,
  panelOpacity: 0.95,
  bgOverlay: 0.4
};

const VOIDRIX_NEON_THEME_PRESET: ThemePreset = {
  primaryColor: '#00ff41',
  backgroundColor: '#0d0d0d',
  surfaceColor: '#1a1a1a',
  textOnBackground: '#00ff41',
  textOnSurface: '#00ff88',
  textOnPrimary: '#000000',
  sidebarGlow: 0.9,
  globalGlow: 0.8,
  panelOpacity: 0.93,
  bgOverlay: 0.35
};

const VOIDRIX_AURORA_THEME_PRESET: ThemePreset = {
  primaryColor: '#00d9ff',
  backgroundColor: '#0a1428',
  surfaceColor: '#0f1e3c',
  textOnBackground: '#e0f7ff',
  textOnSurface: '#b0e7ff',
  textOnPrimary: '#ffffff',
  sidebarGlow: 0.7,
  globalGlow: 0.6,
  panelOpacity: 0.9,
  bgOverlay: 0.32
};

const VOIDRIX_SUNSET_THEME_PRESET: ThemePreset = {
  primaryColor: '#ff6b35',
  backgroundColor: '#1a0f0a',
  surfaceColor: '#2d1810',
  textOnBackground: '#ffd4b0',
  textOnSurface: '#ffb88c',
  textOnPrimary: '#ffffff',
  sidebarGlow: 0.8,
  globalGlow: 0.65,
  panelOpacity: 0.92,
  bgOverlay: 0.38
};

const VOIDRIX_TWILIGHT_THEME_PRESET: ThemePreset = {
  primaryColor: '#9d4edd',
  backgroundColor: '#0a0515',
  surfaceColor: '#1a0f2e',
  textOnBackground: '#e0aaff',
  textOnSurface: '#c8b6ff',
  textOnPrimary: '#ffffff',
  sidebarGlow: 0.75,
  globalGlow: 0.62,
  panelOpacity: 0.91,
  bgOverlay: 0.36
};

const VOIDRIX_MINT_THEME_PRESET: ThemePreset = {
  primaryColor: '#00d084',
  backgroundColor: '#0a1810',
  surfaceColor: '#0f2e1f',
  textOnBackground: '#b8ffe0',
  textOnSurface: '#88f0cc',
  textOnPrimary: '#000000',
  sidebarGlow: 0.7,
  globalGlow: 0.58,
  panelOpacity: 0.90,
  bgOverlay: 0.33
};

export const VOIDRIX_THEME_PRESETS: Record<string, ThemePreset> = {
  voidrix_default: VOIDRIX_FOREST_THEME_PRESET,
  voidrix_forest: VOIDRIX_FOREST_THEME_PRESET,
  voidrix_horizon: VOIDRIX_HORIZON_THEME_PRESET,
  voidrix_night: VOIDRIX_NIGHT_THEME_PRESET,
  voidrix_lava: VOIDRIX_LAVA_THEME_PRESET,
  voidrix_water: VOIDRIX_WATER_THEME_PRESET,
  voidrix_light: LIGHT_VOIDRIX_THEME_PRESET,
  voidrix_cyberpunk: VOIDRIX_CYBERPUNK_THEME_PRESET,
  voidrix_neon: VOIDRIX_NEON_THEME_PRESET,
  voidrix_aurora: VOIDRIX_AURORA_THEME_PRESET,
  voidrix_sunset: VOIDRIX_SUNSET_THEME_PRESET,
  voidrix_twilight: VOIDRIX_TWILIGHT_THEME_PRESET,
  voidrix_mint: VOIDRIX_MINT_THEME_PRESET
};

export const DEFAULT_THEME: Theme = {
  ...VOIDRIX_FOREST_THEME_PRESET,
  glassBlur: 10,
  glassOpacity: 0.8,
  consoleOpacity: 0.8,
  borderRadius: 12,
  sidebarGlow: 0,
  globalGlow: 0,
  panelOpacity: 0.85,
  bgOverlay: 0.4,
  autoAdaptColor: false,
  fontFamily: 'Poppins',
  customFonts: [],
  bgMedia: { url: '', type: 'none' }
};

export function getThemeByName(name: string): ThemePreset | null {
  return VOIDRIX_THEME_PRESETS[name] || null;
}

export function getThemeNames(): string[] {
  return Object.keys(VOIDRIX_THEME_PRESETS);
}
