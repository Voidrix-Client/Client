import React, { useState, useEffect, useRef } from 'react';
import { ExtensionProvider } from './context/ExtensionContext';
import { Analytics } from './services/Analytics';
import ExtensionSlot from './components/Extensions/ExtensionSlot';
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Home = React.lazy(() => import('./pages/Home'));
const Search = React.lazy(() => import('./pages/Search'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Styling = React.lazy(() => import('./pages/Styling'));
const Skins = React.lazy(() => import('./pages/Skins'));
const ServerComingSoon = React.lazy(() => import('./pages/ServerComingSoon'));
const InstanceDetails = React.lazy(() => import('./pages/InstanceDetails'));
const Client = React.lazy(() => import('./pages/Client'));
const ClientMods = React.lazy(() => import('./pages/ClientMods'));
const ToolsDashboard = React.lazy(() => import('./pages/ToolsDashboard'));
const Extensions = React.lazy(() => import('./pages/Extensions'));
const Login = React.lazy(() => import('./pages/Login'));
const News = React.lazy(() => import('./pages/News'));
const Partners = React.lazy(() => import('./pages/Partners')); // Partner-Seite importieren
import { isFeatureEnabled } from './config/featureFlags';

import { AppSideBar, TopNavBar, WindowControls } from './components/layout';
import { CommandPalette, LoadingOverlay, UpdateNotification } from './components/shared';
import {
    AgreementDialog,
    LanguageSelectorDialog,
    ThemeSwitcherDialog,
    CrashReportDialog
} from './components/modals';
import { syncCustomFonts } from './services/fontManager';
import { updateShadcnVars } from './lib/utils';
import { useTranslation } from 'react-i18next';
import i18n, { languageMap } from './i18n';
import { VOIDRIX_THEME_PRESETS, DEFAULT_THEME } from './config/themes';

const START_PAGES = new Set(['dashboard', 'library', 'search', 'skins', 'settings']);
const resolveStartPage = (page: string) => (START_PAGES.has(page) ? page : 'dashboard');

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError(error: any) {
        return { hasError: true };
    }
    componentDidCatch(error: any, errorInfo: any) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return <ErrorFallback />;
        }
        return this.props.children;
    }
}

function ErrorFallback() {
    const { t } = useTranslation();
    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-foreground p-8 text-center">
            <h1 className="text-4xl font-bold mb-4 text-destructive">{t('common.error_title')}</h1>
            <p className="text-muted-foreground mb-8 max-w-md">{t('common.error_desc')}</p>
            <button
                onClick={() => window.location.reload()}
                className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-bold hover:opacity-90 transition-opacity"
            >
                {t('common.restart_app')}
            </button>
        </div>
    );
}

function App() {
    const { t, i18n } = useTranslation();
    const [currentView, setCurrentView] = useState('dashboard');
    const [isPending, startTransition] = React.useTransition();
    const [userProfile, setUserProfile] = useState(null);
    const [isGuest, setIsGuest] = useState(false);
    const [theme, setTheme] = useState({
        primaryColor: '#7c3aed',
        backgroundColor: '#111111',
        surfaceColor: '#1c1c1c',
        textOnBackground: '#fafafa',
        textOnSurface: '#fafafa',
        textOnPrimary: '#f8f7ff',
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
    });
    const [selectedInstance, setSelectedInstance] = useState(null);
    const [runningInstances, setRunningInstances] = useState({});
    const [runningInstanceStats, setRunningInstanceStats] = useState({});
    const [activeDownloads, setActiveDownloads] = useState({});
    const [isMaximized, setIsMaximized] = useState(false);
    const [searchCategory, setSearchCategory] = useState(null);
    const [triggerCreateInstance, setTriggerCreateInstance] = useState(false);
    const [appSettings, setAppSettings] = useState<any>({});
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [appVersion, setAppVersion] = useState('');
    const [crashData, setCrashData] = useState(null);
    const [isCrashModalOpen, setIsCrashModalOpen] = useState(false);
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
    const isLavaTheme = appSettings?.voidrixTheme === 'voidrix_lava';
    const isWaterTheme = appSettings?.voidrixTheme === 'voidrix_water';

    const appSettingsRef = useRef<any>({});

    useEffect(() => {
        appSettingsRef.current = appSettings;
    }, [appSettings]);

    const resolveFontFamily = (nextTheme) => {
        const builtInFonts = new Set([
            'Poppins', 'Inter', 'Montserrat', 'Roboto', 'Geist',
            'JetBrains Mono', 'Open Sans', 'Nunito', 'Ubuntu', 'Outfit'
        ]);
        const customFonts = (nextTheme.customFonts ?? []).map((font) => font.family);
        const availableFonts = new Set([...builtInFonts, ...customFonts]);
        return availableFonts.has(nextTheme.fontFamily) ? nextTheme.fontFamily : 'Poppins';
    };

    const applyVoidrixPreset = (settingsObj: any, baseTheme: any) => {
        if (!baseTheme) return baseTheme;
        if (!settingsObj?.voidrixUI) return baseTheme;
        const presetKey = settingsObj.voidrixTheme || 'voidrix_default';
        const preset = VOIDRIX_THEME_PRESETS[presetKey] || VOIDRIX_THEME_PRESETS.voidrix_default;
        return { ...baseTheme, ...preset };
    };

    useEffect(() => {
        Analytics.init();

        const checkSession = async () => {
            let startPage = 'dashboard';
            try {
                const settingsRes = await window.electronAPI?.getSettings();
                if (settingsRes.success && settingsRes.settings.startPage) {
                    startPage = resolveStartPage(settingsRes.settings.startPage);
                }
            } catch (e) { }

            if (window.electronAPI?.validateSession) {
                const res = await window.electronAPI.validateSession();
                if (res.success) {
                    const profile = await window.electronAPI.getProfile();
                    if (profile) {
                        try {
                            let skinRes = await window.electronAPI.getCurrentSkin(profile.access_token);
                            if (!skinRes.success) {
                                await new Promise(r => setTimeout(r, 1000));
                                skinRes = await window.electronAPI.getCurrentSkin(profile.access_token);
                            }
                            if (skinRes.success) {
                                profile.skinUrl = skinRes.url;
                            }
                        } catch (e) {
                            console.error("Failed to prefetch skin", e);
                        }
                        setUserProfile(profile);
                        Analytics.setProfile(profile);
                    }
                }
            } else {
                const profile = await window.electronAPI?.getProfile();
                if (profile) {
                    setUserProfile(profile);
                    Analytics.setProfile(profile);
                }
            }
            setCurrentView(startPage);
        };

        const loadTheme = async () => {
            const res = await window.electronAPI?.getSettings();
            if (res.success) {
                let normalizedSettings = res.settings;
                if (
                    res.settings.hasSelectedLanguage === false &&
                    res.settings.hasAcceptedToS === false &&
                    res.settings.hasSelectedThemeMode === true
                ) {
                    normalizedSettings = { ...res.settings, hasSelectedThemeMode: false };
                    window.electronAPI?.saveSettings(normalizedSettings);
                }

                setAppSettings(normalizedSettings);

                if (normalizedSettings.language) {
                    let lang = normalizedSettings.language;
                    if (languageMap[lang as keyof typeof languageMap]) {
                        lang = languageMap[lang as keyof typeof languageMap];
                        window.electronAPI.saveSettings({ ...normalizedSettings, language: lang });
                    }
                    i18n.changeLanguage(lang);
                    localStorage.setItem('voidrix.language', lang);
                }

                if (normalizedSettings.theme) {
                    let nextTheme = applyVoidrixPreset(normalizedSettings, normalizedSettings.theme);

                    // Migrate legacy orange defaults to violet/blue.
                    if (['#e26602', '#d24e01', '#f97316'].includes((nextTheme.primaryColor || '').toLowerCase())) {
                        nextTheme = {
                            ...nextTheme,
                            primaryColor: '#7c3aed',
                            textOnPrimary: '#f8f7ff'
                        };
                    }

                    setTheme(nextTheme);
                    applyTheme(nextTheme);
                }
            }
        };

        const loadVersion = async () => {
            if (window.electronAPI?.getVersion) {
                try {
                    const v = await window.electronAPI.getVersion();
                    setAppVersion(v);
                } catch (e) { }
            }
        };

        const init = async () => {
            await Promise.all([checkSession(), loadTheme(), loadVersion()]);
            setIsInitialLoading(false);
        };

        init();

        const removeThemeListener = window.electronAPI?.onThemeUpdated((newTheme) => {
            const effectiveTheme = applyVoidrixPreset(appSettingsRef.current, newTheme);
            setTheme(effectiveTheme);
            applyTheme(effectiveTheme);
        });

        const removeSettingsListener = window.electronAPI.onSettingsUpdated?.((newSettings) => {
            setAppSettings(newSettings);

            if (newSettings.theme) {
                const appliedTheme = applyVoidrixPreset(newSettings, newSettings.theme);
                setTheme(appliedTheme);
                applyTheme(appliedTheme);
            }
        });

        const removeStatusListener = window.electronAPI?.onInstanceStatus(({ instanceName, status, pid, fps, loader, version }) => {
            setRunningInstances(prev => {
                const next = { ...prev };
                if (status === 'stopped' || status === 'deleted') {
                    delete next[instanceName];
                    if (status === 'stopped') Analytics.updateStatus(false, instanceName, { loader, version, mode: 'launcher' });
                } else {
                    next[instanceName] = status;
                    if (status === 'running') Analytics.updateStatus(true, instanceName, { loader, version, mode: 'launcher' });
                }
                return next;
            });

            setRunningInstanceStats(prev => {
                const next = { ...prev };
                if (status === 'running') {
                    next[instanceName] = { pid: pid || next[instanceName]?.pid, fps };
                } else {
                    delete next[instanceName];
                }
                return next;
            });

            if (status === 'stopped' || status === 'error' || status === 'deleted') {
                setActiveDownloads(prev => {
                    const next = { ...prev };
                    delete next[instanceName];
                    return next;
                });
            }
        });

        const removeInstallListener = window.electronAPI?.onInstallProgress(({ instanceName, progress, status }) => {
            setActiveDownloads(prev => {
                const next = { ...prev };
                if (progress >= 100) {
                    delete next[instanceName];
                } else {
                    next[instanceName] = { progress: progress || prev[instanceName]?.progress || 0, status, type: 'install' };
                }
                return next;
            });
        });

        const removeLaunchProgressListener = window.electronAPI?.onLaunchProgress((e) => { });

        const removeWindowStateListener = window.electronAPI?.onWindowStateChange((maximized) => {
            setIsMaximized(maximized);
        });

        const removeCrashReportListener = window.electronAPI?.onCrashReport((data) => {
            if (appSettingsRef.current?.enableSmartLogAnalytics !== false) {
                console.log('[App] Received crash report:', data);
                setCrashData(data);
                setIsCrashModalOpen(true);
            } else {
                console.log('[App] Crash detected but Smart Log Analytics is disabled.');
            }
        });

        return () => {
            if (removeInstallListener) removeInstallListener();
            if (removeLaunchProgressListener) removeLaunchProgressListener();
            if (removeStatusListener) removeStatusListener();
            if (removeThemeListener) removeThemeListener();
            if (removeSettingsListener) removeSettingsListener();
            if (removeWindowStateListener) removeWindowStateListener();
            if (removeCrashReportListener) removeCrashReportListener();
        };
    }, []);

    const handleAcceptAgreement = async () => {
        const newSettings = { ...appSettings, hasAcceptedToS: true };
        const res = await window.electronAPI.saveSettings(newSettings);
        if (res.success) {
            setAppSettings(newSettings);
        }
    };

    const handleDeclineAgreement = async () => {
        const newSettings = { ...appSettings, hasSelectedLanguage: false };
        await window.electronAPI.saveSettings(newSettings);
        window.close();
    };

    const handleLanguageSelect = async (code) => {
        const newSettings = { ...appSettings, language: code, hasSelectedLanguage: true };
        const res = await window.electronAPI.saveSettings(newSettings);
        if (res.success) {
            setAppSettings(newSettings);
            i18n.changeLanguage(code);
            localStorage.setItem('voidrix.language', code);
        }
    };

    const handleThemeModeSelect = async (mode) => {
        const presetKeyMap = {
            dark: 'voidrix_forest',
            light: 'voidrix_light'
        } as const;
        const selectedPresetKey = (presetKeyMap[mode as keyof typeof presetKeyMap] || mode || 'voidrix_forest') as keyof typeof VOIDRIX_THEME_PRESETS;
        const selectedThemePreset = VOIDRIX_THEME_PRESETS[selectedPresetKey] || VOIDRIX_THEME_PRESETS.voidrix_forest;
        const nextTheme = {
            ...(appSettings.theme || {}),
            ...selectedThemePreset
        };
        const newSettings = {
            ...appSettings,
            hasSelectedThemeMode: true,
            voidrixUI: true,
            voidrixTheme: selectedPresetKey,
            theme: nextTheme
        };

        const res = await window.electronAPI.saveSettings(newSettings);
        if (res.success) {
            setAppSettings(newSettings);
            setTheme(nextTheme);
            applyTheme(nextTheme);
        }
    };

    const applyTheme = (t) => {
        const root = document.documentElement;
        const fontFamily = resolveFontFamily(t);
        syncCustomFonts(t.customFonts ?? []);
        root.style.setProperty('--primary-color', t.primaryColor);
        root.style.setProperty('--background-color', t.backgroundColor);
        root.style.setProperty('--surface-color', t.surfaceColor);
        root.style.setProperty('--text-on-background', t.textOnBackground ?? '#fafafa');
        root.style.setProperty('--text-on-surface', t.textOnSurface ?? '#fafafa');
        root.style.setProperty('--text-on-primary', t.textOnPrimary ?? '#0d0d0d');
        root.style.setProperty('--glass-blur', `${t.glassBlur}px`);
        root.style.setProperty('--glass-opacity', t.glassOpacity);
        root.style.setProperty('--console-opacity', t.consoleOpacity ?? 0.8);
        root.style.setProperty('--border-radius', `${t.borderRadius ?? 12}px`);
        root.style.setProperty('--sidebar-glow-intensity', t.sidebarGlow ?? 0);
        root.style.setProperty('--global-glow-intensity', t.globalGlow ?? 0);
        root.style.setProperty('--panel-opacity', t.panelOpacity ?? 0.85);
        root.style.setProperty('--bg-overlay-opacity', t.bgOverlay ?? 0.4);
        root.style.setProperty('--launcher-font', `'${fontFamily}'`);

        const adjustColor = (hex, percent) => {
            if (!hex || typeof hex !== 'string') return '#ffffff';
            const num = parseInt(hex.replace('#', ''), 16);
            const amt = Math.round(2.55 * percent);
            const R = (num >> 16) + amt;
            const G = (num >> 8 & 0x00FF) + amt;
            const B = (num & 0x0000FF) + amt;
            return '#' + (0x1000000 + (R < 255 ? R < 0 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 0 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 0 ? 0 : B : 255)).toString(16).slice(1);
        };

        root.style.setProperty('--primary-hover-color', adjustColor(t.primaryColor, 15));

        const hexToRgb = (hex) => {
            if (!hex || typeof hex !== 'string') return '28, 28, 28';
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `${r}, ${g}, ${b}`;
        };
        root.style.setProperty('--surface-color-rgb', hexToRgb(t.surfaceColor));
        root.style.setProperty('--primary-color-rgb', hexToRgb(t.primaryColor));

        const darken = (hex, percent) => {
            if (!hex || typeof hex !== 'string') return '#000000';
            const num = parseInt(hex.replace('#', ''), 16);
            const amt = Math.round(2.55 * percent);
            const R = (num >> 16) - amt;
            const G = (num >> 8 & 0x00FF) - amt;
            const B = (num & 0x0000FF) - amt;
            return '#' + (0x1000000 + (R < 255 ? R < 0 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 0 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 0 ? 0 : B : 255)).toString(16).slice(1);
        };
        root.style.setProperty('--background-dark-color', darken(t.backgroundColor, 20));
        root.style.setProperty('--background-dark-color-rgb', hexToRgb(darken(t.backgroundColor, 20)));

        if (t.bgMedia && t.bgMedia.url) {
            root.style.setProperty('--bg-url', t.bgMedia.url);
            root.style.setProperty('--bg-type', t.bgMedia.type);
        } else {
            root.style.setProperty('--bg-url', '');
            root.style.setProperty('--bg-type', 'none');
        }

        updateShadcnVars(t);
    };

    const handleLoginSuccess = async (profile) => {
        if (profile && profile.access_token && window.electronAPI.getCurrentSkin) {
            try {
                let skinRes = await window.electronAPI.getCurrentSkin(profile.access_token);
                if (!skinRes.success) {
                    await new Promise(r => setTimeout(r, 1000));
                    skinRes = await window.electronAPI.getCurrentSkin(profile.access_token);
                }
                if (skinRes.success) {
                    profile.skinUrl = skinRes.url;
                }
            } catch (e) {
                console.error("Failed to prefetch skin", e);
            }
        }
        let startPage = 'dashboard';
        try {
            const settingsRes = await window.electronAPI.getSettings();
            if (settingsRes.success && settingsRes.settings.startPage) {
                startPage = resolveStartPage(settingsRes.settings.startPage);
            }
        } catch (e) { }

        startTransition(() => {
            setUserProfile(profile);
            Analytics.setProfile(profile);
            setCurrentView(startPage);
        });
    };

    const handleLogout = () => {
        startTransition(() => {
            setUserProfile(null);
            setIsGuest(false);
        });
    };

    const handleGuestMode = () => {
        startTransition(() => {
            setIsGuest(true);
        });
    };

    const handleInstanceClick = (instance) => {
        setSelectedInstance(instance);
        startTransition(() => {
            setCurrentView('instance-details');
        });
    };

    const handleInstanceUpdate = (updatedInstance) => {
        setSelectedInstance(updatedInstance);
    };

    const handleBackToDashboard = () => {
        setSelectedInstance(null);
        startTransition(() => {
            setCurrentView('dashboard');
        });
    };

    const handleNavigate = (viewId) => {
        startTransition(() => {
            setCurrentView(viewId);
        });
    };

    const isThemeModeSelectionOpen = !isInitialLoading && appSettings.hasSelectedThemeMode === false;
    const isLanguageSelectionOpen =
        !isInitialLoading &&
        appSettings.hasSelectedThemeMode === true &&
        appSettings.hasSelectedLanguage === false;
    const isAgreementModalOpen =
        !isInitialLoading &&
        appSettings.hasSelectedThemeMode === true &&
        appSettings.hasSelectedLanguage === true &&
        appSettings.hasAcceptedToS === false;
    const isSetupComplete =
        !isThemeModeSelectionOpen &&
        !isLanguageSelectionOpen &&
        !isAgreementModalOpen;
    const isLoginView = isSetupComplete && !userProfile && !isGuest;
    const isCommandPaletteAvailable = !isLoginView && !isLanguageSelectionOpen && !isAgreementModalOpen && !isThemeModeSelectionOpen;
    const canAccessSkins = Boolean(userProfile) && !isGuest;

    React.useEffect(() => {
        const handler = async (event) => {
            const importedInstanceName = event?.detail?.instanceName;

            setCurrentView('dashboard');

            if (importedInstanceName) {
                try {
                    await new Promise((resolve) => setTimeout(resolve, 300));
                    await window.electronAPI.launchGame(importedInstanceName);
                    console.log(`[App] Auto-launched imported modpack instance: ${importedInstanceName}`);
                } catch (err) {
                    console.warn('[App] Auto-launch of imported modpack failed:', err);
                }
            }
        };

        window.addEventListener('voidrixmodpack-imported', handler);
        return () => window.removeEventListener('voidrixmodpack-imported', handler);
    }, []);

    return (
        <ExtensionProvider>
            {isLoginView ? (
                <React.Suspense fallback={
                    <div className="h-screen w-screen flex items-center justify-center bg-background">
                        <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    </div>
                }>
                    <Login onLoginSuccess={handleLoginSuccess} onGuestMode={handleGuestMode} />
                </React.Suspense>
            ) : (
                <div
                    className="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground font-sans selection:bg-primary/30 selection:text-foreground relative"
                    data-voidrix-theme={appSettings?.voidrixTheme || 'voidrix_default'}
                >
                    {isLavaTheme && (
                        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                            <div className="absolute -inset-[20%] opacity-70 [background:radial-gradient(circle_at_20%_15%,rgba(255,106,0,0.35),transparent_45%),radial-gradient(circle_at_80%_85%,rgba(255,45,0,0.28),transparent_45%),radial-gradient(circle_at_50%_50%,rgba(255,140,0,0.15),transparent_55%)] animate-[lava-flow_16s_linear_infinite]" />
                            <div className="absolute inset-0 opacity-35 [background:repeating-linear-gradient(145deg,rgba(255,120,0,0.12)_0px,rgba(255,120,0,0.12)_14px,transparent_14px,transparent_30px)] animate-[lava-heat_7s_ease-in-out_infinite]" />
                        </div>
                    )}

                    {isWaterTheme && (
                        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                            <div className="absolute -inset-[20%] opacity-65 [background:radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.3),transparent_45%),radial-gradient(circle_at_85%_75%,rgba(14,165,233,0.26),transparent_45%),radial-gradient(circle_at_55%_45%,rgba(96,165,250,0.14),transparent_55%)] animate-[water-flow_18s_linear_infinite]" />
                            <div className="absolute inset-0 opacity-30 [background:repeating-linear-gradient(160deg,rgba(56,189,248,0.11)_0px,rgba(56,189,248,0.11)_12px,transparent_12px,transparent_28px)] animate-[water-ripple_6s_ease-in-out_infinite]" />
                        </div>
                    )}

                    {theme?.bgMedia?.url && theme.bgMedia.url.trim() !== '' && (
                        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                            {theme.bgMedia.type === 'video' ? (
                                <video
                                    key={theme.bgMedia.url}
                                    autoPlay muted loop playsInline
                                    preload="auto"
                                    className="absolute inset-0 w-full h-full object-cover"
                                    style={{ transform: 'translateZ(0)' }}
                                    onCanPlay={(e) => (e.target as HTMLElement).classList.add('opacity-100')}
                                    onError={(e) => {
                                        console.error("Background video decoding error:", e);
                                        setTheme(prev => ({ ...prev, bgMedia: { ...prev.bgMedia, type: 'none' } }));
                                    }}
                                >
                                    <source src={`app-media:///${theme.bgMedia.url.replace(/\\/g, '/')}`} type="video/mp4" />
                                </video>
                            ) : (
                                <img
                                    key={theme.bgMedia.url}
                                    src={`app-media:///${theme.bgMedia.url.replace(/\\/g, '/')}`}
                                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 opacity-100"
                                    alt=""
                                />
                            )}
                            <div
                                className="absolute inset-0 bg-background pointer-events-none"
                                style={{ opacity: theme.bgOverlay ?? 0.4 }}
                            />
                        </div>
                    )}

                    <TopNavBar
                        userProfile={userProfile}
                        onProfileUpdate={setUserProfile}
                        isMaximized={isMaximized}
                        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
                        onNavigate={handleNavigate}
                        runningInstances={runningInstances}
                        activeDownloads={activeDownloads}
                        isCommandPaletteAvailable={isCommandPaletteAvailable}
                    />

                    <div className="flex flex-1 overflow-hidden relative z-10">
                        <AppSideBar
                            currentView={currentView}
                            setView={(view) => startTransition(() => setCurrentView(view))}
                            onLogout={handleLogout}
                            isGuest={isGuest}
                            userProfile={userProfile}
                            onProfileUpdate={setUserProfile}
                        />

                        <main className="flex-1 overflow-hidden flex flex-col relative">
                            {isPending && (
                                <div className="absolute top-0 left-0 w-full h-0.5 z-[100] overflow-hidden bg-muted">
                                    <div className="h-full bg-primary/60 animate-progress-fast"></div>
                                </div>
                            )}

                            <React.Suspense fallback={
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                </div>
                            }>
                                {currentView === 'dashboard' && <Home onInstanceClick={handleInstanceClick} runningInstances={runningInstances} isGuest={isGuest} userProfile={userProfile} activeDownloads={activeDownloads} onNavigateSearch={(category) => { setSearchCategory(category); setCurrentView('search'); }} />}
                                {currentView === 'library' && <Dashboard onInstanceClick={handleInstanceClick} runningInstances={runningInstances} runningInstanceStats={runningInstanceStats} activeDownloads={activeDownloads} triggerCreate={triggerCreateInstance} onCreateHandled={() => setTriggerCreateInstance(false)} isGuest={isGuest} />}
                                {currentView === 'search' && <Search initialCategory={searchCategory} onCategoryConsumed={() => setSearchCategory(null)} />}
                                {currentView === 'skins' && !isGuest && <Skins onLogout={handleLogout} onProfileUpdate={setUserProfile} />}
                                {currentView === 'server' && <ServerComingSoon />}
                                {currentView === 'settings' && <Settings />}
                                {currentView === 'instance-details' && selectedInstance && (
                                    <InstanceDetails instance={selectedInstance} onBack={handleBackToDashboard} runningInstances={runningInstances} onInstanceUpdate={handleInstanceUpdate} isGuest={isGuest} />
                                )}
                                {currentView === 'styling' && <Styling />}
                                {currentView === 'extensions' && <Extensions />}
                                {currentView === 'tools' && <ToolsDashboard />}
                                {currentView === 'open-client' && isFeatureEnabled('openClientPage') && <Client />}
                                {currentView === 'mods' && isFeatureEnabled('openClientPage') && <ClientMods />}
                                {currentView === 'news' && <News />}
                                {currentView === 'partners' && <Partners />}
                            </React.Suspense>
                        </main>
                    </div>

                    <UpdateNotification />
                </div>
            )}

            <CommandPalette
                open={isCommandPaletteOpen}
                onOpenChange={setIsCommandPaletteOpen}
                onNavigate={handleNavigate}
                isAvailable={isCommandPaletteAvailable}
                canAccessSkins={canAccessSkins}
            />

            {appVersion && (
                <div className="absolute bottom-1 left-1 z-[9999] text-muted-foreground font-mono text-[10px] opacity-30 pointer-events-none select-none">
                    v{appVersion}
                </div>
            )}

            {!userProfile && !isGuest && (
                <WindowControls isMaximized={isMaximized} className="fixed top-4 right-4 z-[10001] rounded-xl border border-border bg-popover/80 p-1 backdrop-blur-md" />
            )}

            <ExtensionSlot name="app.overlay" className="absolute inset-0 pointer-events-none z-[9999] *:pointer-events-auto" />

            <CrashReportDialog
                isOpen={isCrashModalOpen}
                onClose={() => setIsCrashModalOpen(false)}
                crashData={crashData}
                onFixApplied={() => {
                    console.log('[App] Fix applied, user may retry launch');
                }}
            />

            {isInitialLoading && <LoadingOverlay message={t('common.loading')} />}

            {isThemeModeSelectionOpen && (
                <ThemeSwitcherDialog onSelect={handleThemeModeSelect} />
            )}

            {isLanguageSelectionOpen && (
                <LanguageSelectorDialog onSelect={handleLanguageSelect} themeId={appSettings?.voidrixTheme} />
            )}

            {isAgreementModalOpen && (
                <AgreementDialog
                    onAccept={handleAcceptAgreement}
                    onDecline={handleDeclineAgreement}
                    themeId={appSettings?.voidrixTheme}
                />
            )}

            <style>{`
                @keyframes lava-flow {
                    0% { transform: translate3d(-2%, -1%, 0) scale(1.02); }
                    50% { transform: translate3d(2%, 1%, 0) scale(1.06); }
                    100% { transform: translate3d(-2%, -1%, 0) scale(1.02); }
                }
                @keyframes lava-heat {
                    0%, 100% { filter: blur(0px) saturate(1); opacity: 0.28; }
                    50% { filter: blur(1.2px) saturate(1.2); opacity: 0.45; }
                }
                @keyframes water-flow {
                    0% { transform: translate3d(1%, -2%, 0) scale(1.01); }
                    50% { transform: translate3d(-1%, 2%, 0) scale(1.05); }
                    100% { transform: translate3d(1%, -2%, 0) scale(1.01); }
                }
                @keyframes water-ripple {
                    0%, 100% { filter: blur(0px); opacity: 0.2; }
                    50% { filter: blur(1px); opacity: 0.38; }
                }
            `}</style>

        </ExtensionProvider>
    );
}

export default function AppWithBoundary() {
    return (
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    );
}