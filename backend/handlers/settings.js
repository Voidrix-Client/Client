const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const os = require('os');

// ============================================================================
// Constants & Configuration
// ============================================================================

const PATHS = {
    settings: path.join(app.getPath('userData'), 'settings.json'),
    fonts: path.join(app.getPath('userData'), 'fonts'),
    backgrounds: path.join(app.getPath('userData'), 'backgrounds')
};

const THEMES = {
    dark: {
        name: 'Midnight',
        primaryColor: '#8b5cf6',
        backgroundColor: '#0a0a0f',
        surfaceColor: '#12121a',
        textOnBackground: '#ffffff',
        textOnSurface: '#e5e5e5',
        textOnPrimary: '#ffffff',
        glassBlur: 12,
        glassOpacity: 0.85,
        consoleOpacity: 0.85,
        borderRadius: 16,
        sidebarGlow: 15,
        globalGlow: 10,
        panelOpacity: 0.9,
        bgOverlay: 0.5,
        autoAdaptColor: true,
        fontFamily: 'Inter',
        customFonts: [],
        bgMedia: { url: '', type: 'none' }
    },
    light: {
        name: 'Dawn',
        primaryColor: '#8b5cf6',
        backgroundColor: '#f5f5f5',
        surfaceColor: '#ffffff',
        textOnBackground: '#1a1a1a',
        textOnSurface: '#2d2d2d',
        textOnPrimary: '#ffffff',
        glassBlur: 12,
        glassOpacity: 0.95,
        consoleOpacity: 0.95,
        borderRadius: 16,
        sidebarGlow: 5,
        globalGlow: 5,
        panelOpacity: 0.95,
        bgOverlay: 0.3,
        autoAdaptColor: true,
        fontFamily: 'Inter',
        customFonts: [],
        bgMedia: { url: '', type: 'none' }
    },
    purple: {
        name: 'Royal',
        primaryColor: '#a855f7',
        backgroundColor: '#1e1a2f',
        surfaceColor: '#2d2640',
        textOnBackground: '#ffffff',
        textOnSurface: '#e9e9ff',
        textOnPrimary: '#ffffff',
        glassBlur: 12,
        glassOpacity: 0.85,
        consoleOpacity: 0.85,
        borderRadius: 16,
        sidebarGlow: 20,
        globalGlow: 15,
        panelOpacity: 0.9,
        bgOverlay: 0.5,
        autoAdaptColor: true,
        fontFamily: 'Inter',
        customFonts: [],
        bgMedia: { url: '', type: 'none' }
    },
    ocean: {
        name: 'Abyss',
        primaryColor: '#06b6d4',
        backgroundColor: '#0f172a',
        surfaceColor: '#1e293b',
        textOnBackground: '#ffffff',
        textOnSurface: '#cbd5e1',
        textOnPrimary: '#ffffff',
        glassBlur: 12,
        glassOpacity: 0.85,
        consoleOpacity: 0.85,
        borderRadius: 16,
        sidebarGlow: 15,
        globalGlow: 10,
        panelOpacity: 0.9,
        bgOverlay: 0.5,
        autoAdaptColor: true,
        fontFamily: 'Inter',
        customFonts: [],
        bgMedia: { url: '', type: 'none' }
    },
    forest: {
        name: 'Verdant',
        primaryColor: '#10b981',
        backgroundColor: '#064e3b',
        surfaceColor: '#065f46',
        textOnBackground: '#ffffff',
        textOnSurface: '#d1fae5',
        textOnPrimary: '#ffffff',
        glassBlur: 12,
        glassOpacity: 0.85,
        consoleOpacity: 0.85,
        borderRadius: 16,
        sidebarGlow: 15,
        globalGlow: 10,
        panelOpacity: 0.9,
        bgOverlay: 0.5,
        autoAdaptColor: true,
        fontFamily: 'Inter',
        customFonts: [],
        bgMedia: { url: '', type: 'none' }
    },
    sunset: {
        name: 'Horizon',
        primaryColor: '#6366f1',
        backgroundColor: '#1a1b3a',
        surfaceColor: '#262a52',
        textOnBackground: '#ffffff',
        textOnSurface: '#dbe4ff',
        textOnPrimary: '#ffffff',
        glassBlur: 12,
        glassOpacity: 0.85,
        consoleOpacity: 0.85,
        borderRadius: 16,
        sidebarGlow: 15,
        globalGlow: 10,
        panelOpacity: 0.9,
        bgOverlay: 0.5,
        autoAdaptColor: true,
        fontFamily: 'Inter',
        customFonts: [],
        bgMedia: { url: '', type: 'none' }
    }
};

const RAM_PRESETS = {
    '1GB': 1024,
    '2GB': 2048,
    '4GB': 4096,
    '6GB': 6144,
    '8GB': 8192,
    '10GB': 10240,
    '12GB': 12288,
    '16GB': 16384,
    '24GB': 24576,
    '32GB': 32768
};

const RESOLUTION_PRESETS = {
    '720p': { width: 1280, height: 720 },
    '1080p': { width: 1920, height: 1080 },
    '2K': { width: 2560, height: 1440 },
    '4K': { width: 3840, height: 2160 }
};

const DEFAULT_SETTINGS = {
    // Java
    javaPath: '',
    minMemory: 1024,
    maxMemory: 4096,
    javaProfile: 'default',
    javaArgs: '-Xmx4G -XX:+UseG1GC -XX:+UnlockExperimentalVMOptions -XX:+ParallelRefProcEnabled -XX:+UseStringDeduplication',
    
    // Resolution
    resolutionWidth: 1920,
    resolutionHeight: 1080,
    
    // Instance
    instancesPath: '',
    copySettingsEnabled: false,
    copySettingsSourceInstance: '',
    
    // Launcher
    startPage: 'dashboard',
    language: 'en_us',
    minimizeOnLaunch: true,
    quitOnGameExit: false,
    minimizeToTray: false,
    minimalMode: true,
    showQuickSwitchButton: true,
    voidrixUI: true,
    voidrixTheme: 'voidrix_default',
    
    // Integration
    enableDiscordRPC: true,
    discordRPCSettings: {
        showInstanceName: true,
        showGameStatus: true,
        showPlayTime: true,
        customStatus: 'Using Voidrix'
    },
    autoUploadLogs: true,
    showDisabledFeatures: false,
    enableSmartLogAnalytics: true,
    
    // Performance
    optimization: true,
    focusMode: false,
    lowGraphicsMode: false,
    legacyGpuSupport: false,
    
    // Mods
    enableAutoInstallMods: false,
    autoInstallMods: [],
    
    // Theme
    theme: THEMES.dark,
    
    // Backup
    backupSettings: {
        enabled: true,
        onLaunch: true,
        onClose: true,
        interval: 60,
        maxBackups: 10
    },
    
    // Cloud
    cloudBackupSettings: {
        enabled: false,
        provider: 'GOOGLE_DRIVE',
        autoRestore: false
    },
    
    // Misc
    actionBarActions: [],
    telemetryEnabled: true,
    hasAcceptedToS: false,
    hasSelectedLanguage: false,
    hasSelectedThemeMode: false
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Deep merge settings with defaults
 */
const buildSettings = (customSettings = {}) => {
    return {
        ...DEFAULT_SETTINGS,
        ...customSettings,
        theme: {
            ...DEFAULT_SETTINGS.theme,
            ...(customSettings.theme || {})
        },
        backupSettings: {
            ...DEFAULT_SETTINGS.backupSettings,
            ...(customSettings.backupSettings || {})
        },
        cloudBackupSettings: {
            ...DEFAULT_SETTINGS.cloudBackupSettings,
            ...(customSettings.cloudBackupSettings || {})
        },
        discordRPCSettings: {
            ...DEFAULT_SETTINGS.discordRPCSettings,
            ...(customSettings.discordRPCSettings || {})
        }
    };
};

/**
 * Read settings from disk
 */
const readSettingsFile = async () => {
    try {
        if (await fs.pathExists(PATHS.settings)) {
            const settings = await fs.readJson(PATHS.settings);
            return buildSettings(settings);
        }
    } catch (error) {
        console.error('[Settings] Failed to read settings file:', error);
    }
    return buildSettings();
};

/**
 * Write settings to disk
 */
const writeSettingsFile = async (settings) => {
    try {
        await fs.ensureDir(path.dirname(PATHS.settings));
        await fs.writeJson(PATHS.settings, settings, { spaces: 4 });
        return true;
    } catch (error) {
        console.error('[Settings] Failed to write settings file:', error);
        return false;
    }
};

/**
 * Emit settings update to all windows
 */
const emitSettingsUpdate = (settings) => {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach(win => {
        if (!win.isDestroyed()) {
            win.webContents.send('theme:updated', settings.theme);
            win.webContents.send('settings:updated', settings);
        }
    });
    app.emit('settings-updated', settings);
};

/**
 * Normalize font name from file path
 */
const normalizeFontName = (filePath) => {
    const baseName = path.basename(filePath, path.extname(filePath)).trim();
    return (baseName || 'Custom Font').replace(/[_-]+/g, ' ');
};

/**
 * Validate path is within allowed directory
 */
const isPathWithinDirectory = (filePath, directory) => {
    const normalizedPath = path.normalize(filePath).toLowerCase();
    const normalizedDir = path.normalize(directory).toLowerCase();
    return normalizedPath.startsWith(normalizedDir);
};

// ============================================================================
// IPC Handlers
// ============================================================================

module.exports = (ipcMain) => {
    
    // ------------------------------------------------------------------------
    // Settings CRUD
    // ------------------------------------------------------------------------
    
    ipcMain.handle('settings:get', async () => {
        try {
            const settings = await readSettingsFile();
            return { success: true, settings };
        } catch (error) {
            console.error('[Settings] Get failed:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('settings:save', async (_, newSettings) => {
        try {
            const mergedSettings = buildSettings(newSettings);
            const success = await writeSettingsFile(mergedSettings);
            
            if (success) {
                emitSettingsUpdate(mergedSettings);
                return { success: true };
            }
            
            return { success: false, error: 'Failed to write settings file' };
        } catch (error) {
            console.error('[Settings] Save failed:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('settings:reset', async () => {
        try {
            const defaultSettings = buildSettings();
            const success = await writeSettingsFile(defaultSettings);
            
            if (success) {
                emitSettingsUpdate(defaultSettings);
                return { success: true };
            }
            
            return { success: false, error: 'Failed to reset settings' };
        } catch (error) {
            console.error('[Settings] Reset failed:', error);
            return { success: false, error: error.message };
        }
    });

    // Legacy handlers for compatibility
    ipcMain.handle('get-settings', async () => {
        const result = await readSettingsFile();
        return { theme: 'dark', ...THEMES.dark, ...result };
    });

    ipcMain.handle('save-settings', async (_, newSettings) => {
        await writeSettingsFile(newSettings);
        return { success: true };
    });

    // ------------------------------------------------------------------------
    // Themes
    // ------------------------------------------------------------------------
    
    ipcMain.handle('settings:themes', async () => {
        return { success: true, themes: THEMES };
    });

    ipcMain.handle('settings:apply-theme', async (_, themeName) => {
        try {
            const theme = THEMES[themeName];
            if (!theme) {
                return { success: false, error: `Theme "${themeName}" not found` };
            }

            const settings = await readSettingsFile();
            const newSettings = {
                ...settings,
                theme: { 
                    ...theme, 
                    customFonts: settings.theme?.customFonts || [] 
                }
            };
            
            await writeSettingsFile(newSettings);
            emitSettingsUpdate(newSettings);
            
            return { success: true, settings: newSettings };
        } catch (error) {
            console.error('[Settings] Apply theme failed:', error);
            return { success: false, error: error.message };
        }
    });

    // ------------------------------------------------------------------------
    // Presets
    // ------------------------------------------------------------------------
    
    ipcMain.handle('settings:ram-presets', async () => {
        return { success: true, presets: RAM_PRESETS };
    });

    ipcMain.handle('settings:resolution-presets', async () => {
        return { success: true, presets: RESOLUTION_PRESETS };
    });

    // ------------------------------------------------------------------------
    // System Info & Recommendations
    // ------------------------------------------------------------------------
    
    ipcMain.handle('settings:system-info', async () => {
        try {
            const totalMemory = os.totalmem();
            const freeMemory = os.freemem();
            const cpus = os.cpus();
            
            return {
                success: true,
                info: {
                    totalMemory,
                    freeMemory,
                    cpuCores: cpus.length,
                    cpuModel: cpus[0]?.model || 'Unknown',
                    platform: os.platform(),
                    arch: os.arch(),
                    release: os.release(),
                    recommendedRamMB: Math.min(totalMemory / (1024 * 1024) * 0.75, 8192),
                    maxRamMB: Math.min(totalMemory / (1024 * 1024) * 0.9, 32768)
                }
            };
        } catch (error) {
            console.error('[Settings] System info failed:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('settings:recommended', async () => {
        try {
            const totalMemoryGB = os.totalmem() / (1024 * 1024 * 1024);
            
            let recommendedRam = 4096;
            let recommendedJavaProfile = 'default';
            
            if (totalMemoryGB >= 32) {
                recommendedRam = 16384;
                recommendedJavaProfile = 'zgc';
            } else if (totalMemoryGB >= 16) {
                recommendedRam = 8192;
                recommendedJavaProfile = 'performance';
            } else if (totalMemoryGB >= 8) {
                recommendedRam = 4096;
                recommendedJavaProfile = 'default';
            } else {
                recommendedRam = 2048;
                recommendedJavaProfile = 'low-end';
            }
            
            return {
                success: true,
                recommended: {
                    maxMemory: recommendedRam,
                    minMemory: Math.floor(recommendedRam / 4),
                    javaProfile: recommendedJavaProfile,
                    resolutionWidth: 1920,
                    resolutionHeight: 1080,
                    optimization: true,
                    lowGraphicsMode: totalMemoryGB < 4
                }
            };
        } catch (error) {
            console.error('[Settings] Recommendations failed:', error);
            return { success: false, error: error.message };
        }
    });

    // ------------------------------------------------------------------------
    // Background Management
    // ------------------------------------------------------------------------
    
    ipcMain.handle('settings:select-background', async () => {
        try {
            const result = await dialog.showOpenDialog({
                properties: ['openFile'],
                filters: [
                    { name: 'Media Files', extensions: ['png', 'jpg', 'jpeg', 'gif', 'mp4', 'webm'] }
                ]
            });

            if (result.canceled || !result.filePaths.length) {
                return { success: false, cancelled: true };
            }

            const srcPath = result.filePaths[0];
            const ext = path.extname(srcPath).toLowerCase();
            const type = ['.mp4', '.webm'].includes(ext) ? 'video' : 'image';

            await fs.ensureDir(PATHS.backgrounds);

            const destName = `bg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
            const destPath = path.join(PATHS.backgrounds, destName);

            await fs.copy(srcPath, destPath);

            return {
                success: true,
                url: destPath.replace(/\\/g, '/'),
                type
            };
        } catch (error) {
            console.error('[Settings] Select background failed:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('settings:delete-background', async (_, filePath) => {
        try {
            if (!filePath) {
                return { success: false, error: 'No file path provided' };
            }

            if (!isPathWithinDirectory(filePath, PATHS.backgrounds)) {
                console.error('[Settings] Attempted to delete file outside backgrounds directory:', filePath);
                return { success: false, error: 'Invalid file path' };
            }

            if (await fs.pathExists(filePath)) {
                await fs.remove(filePath);
                return { success: true };
            }

            return { success: false, error: 'File not found' };
        } catch (error) {
            console.error('[Settings] Delete background failed:', error);
            return { success: false, error: error.message };
        }
    });

    // ------------------------------------------------------------------------
    // Font Management
    // ------------------------------------------------------------------------
    
    ipcMain.handle('settings:select-font', async () => {
        try {
            const result = await dialog.showOpenDialog({
                properties: ['openFile'],
                filters: [
                    { name: 'Font Files', extensions: ['ttf', 'otf', 'woff', 'woff2'] }
                ]
            });

            if (result.canceled || !result.filePaths.length) {
                return { success: false, cancelled: true };
            }

            const srcPath = result.filePaths[0];
            const ext = path.extname(srcPath).toLowerCase();
            const format = ext.slice(1);

            await fs.ensureDir(PATHS.fonts);

            const fontId = uuidv4();
            const destPath = path.join(PATHS.fonts, `${fontId}${ext}`);

            await fs.copy(srcPath, destPath);

            const settings = await readSettingsFile();
            const font = {
                id: fontId,
                name: normalizeFontName(srcPath),
                family: `CustomFont_${fontId}`,
                path: destPath.replace(/\\/g, '/'),
                format
            };

            const newSettings = {
                ...settings,
                theme: {
                    ...settings.theme,
                    fontFamily: font.family,
                    customFonts: [...(settings.theme.customFonts || []), font]
                }
            };

            await writeSettingsFile(newSettings);
            emitSettingsUpdate(newSettings);

            return { success: true, font, settings: newSettings };
        } catch (error) {
            console.error('[Settings] Select font failed:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('settings:delete-font', async (_, fontId) => {
        try {
            const settings = await readSettingsFile();
            const customFonts = settings.theme.customFonts || [];
            const targetFont = customFonts.find(font => font.id === fontId);

            if (!targetFont) {
                return { success: false, error: 'Font not found' };
            }

            // Delete font file
            if (targetFont.path && await fs.pathExists(targetFont.path)) {
                await fs.remove(targetFont.path);
            }

            // Update settings
            const newSettings = {
                ...settings,
                theme: {
                    ...settings.theme,
                    fontFamily: settings.theme.fontFamily === targetFont.family 
                        ? 'Inter' 
                        : settings.theme.fontFamily,
                    customFonts: customFonts.filter(font => font.id !== fontId)
                }
            };

            await writeSettingsFile(newSettings);
            emitSettingsUpdate(newSettings);

            return { success: true, settings: newSettings };
        } catch (error) {
            console.error('[Settings] Delete font failed:', error);
            return { success: false, error: error.message };
        }
    });

    // ------------------------------------------------------------------------
    // Dialog Helpers
    // ------------------------------------------------------------------------
    
    ipcMain.handle('dialog:save-file', async (_, options) => {
        try {
            const result = await dialog.showSaveDialog(options);
            return result.canceled ? null : result.filePath;
        } catch (error) {
            console.error('[Settings] Save file dialog failed:', error);
            return null;
        }
    });

    ipcMain.handle('dialog:open-folder', async (_, options = {}) => {
        try {
            const result = await dialog.showOpenDialog({
                ...options,
                properties: ['openDirectory', ...(options.properties || [])]
            });
            return result.canceled ? null : result.filePaths;
        } catch (error) {
            console.error('[Settings] Open folder dialog failed:', error);
            return null;
        }
    });

    ipcMain.handle('dialog:open-file', async (_, options = {}) => {
        try {
            const result = await dialog.showOpenDialog({
                ...options,
                properties: ['openFile', ...(options.properties || [])]
            });
            
            if (result.canceled) {
                return { cancelled: true, filePaths: [] };
            }
            
            return { cancelled: false, filePaths: result.filePaths };
        } catch (error) {
            console.error('[Settings] Open file dialog failed:', error);
            return { cancelled: true, filePaths: [], error: error.message };
        }
    });

    // ------------------------------------------------------------------------
    // Initialization
    // ------------------------------------------------------------------------
    
    // Ensure required directories exist
    (async () => {
        try {
            await fs.ensureDir(PATHS.fonts);
            await fs.ensureDir(PATHS.backgrounds);
            console.log('[Settings] Initialized successfully');
        } catch (error) {
            console.error('[Settings] Initialization failed:', error);
        }
    })();
};