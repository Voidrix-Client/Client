const { contextBridge, ipcRenderer } = require('electron');

console.log('[Preload] 🚀 Preload script wird ausgeführt...');

const electronAPI = {
    // ============================================
    // SYSTEM INFORMATIONEN
    // ============================================
    getSystemInfo: () => ipcRenderer.invoke('system:get-info'),
    
    // ============================================
    // APP & WINDOW
    // ============================================
    platform: process.platform,
    isPackaged: ipcRenderer.sendSync('app:is-packaged'),
    isDeveloperMode: ipcRenderer.sendSync('app:is-developer-mode'),
    getVersion: () => ipcRenderer.invoke('app:get-version'),
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),
    restartApp: () => ipcRenderer.invoke('app:restart'),
    softReset: () => ipcRenderer.invoke('app:soft-reset'),
    factoryReset: () => ipcRenderer.invoke('app:factory-reset'),
    openExternal: (url) => ipcRenderer.invoke('open-external', url),
    
    // ============================================
    // DIALOGS
    // ============================================
    openFileDialog: (options) => ipcRenderer.invoke('dialog:open-file', options),
    showSaveDialog: (options) => ipcRenderer.invoke('dialog:save-file', options),
    selectFolder: () => ipcRenderer.invoke('dialog:select-folder'),
    
    // ============================================
    // SETTINGS
    // ============================================
    getSettings: () => ipcRenderer.invoke('settings:get'),
    saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
    selectBackgroundMedia: () => ipcRenderer.invoke('settings:select-background'),
    deleteBackgroundMedia: (path) => ipcRenderer.invoke('settings:delete-background', path),
    selectCustomFont: () => ipcRenderer.invoke('settings:select-font'),
    deleteCustomFont: (fontId) => ipcRenderer.invoke('settings:delete-font', fontId),
    
    // ============================================
    // AUTH
    // ============================================
    login: () => ipcRenderer.invoke('auth:login'),
    logout: () => ipcRenderer.invoke('auth:logout'),
    validateSession: () => ipcRenderer.invoke('auth:validate'),
    getProfile: () => ipcRenderer.invoke('auth:get-profile'),
    getAccounts: () => ipcRenderer.invoke('auth:get-accounts'),
    switchAccount: (uuid) => ipcRenderer.invoke('auth:switch-account', uuid),
    removeAccount: (uuid) => ipcRenderer.invoke('auth:remove-account', uuid),
    
    // ============================================
    // THEMES
    // ============================================
    getCustomPresets: () => ipcRenderer.invoke('theme:get-custom-presets'),
    saveCustomPreset: (preset) => ipcRenderer.invoke('theme:save-custom-preset', preset),
    deleteCustomPreset: (handle) => ipcRenderer.invoke('theme:delete-custom-preset', handle),
    exportCustomPreset: (preset) => ipcRenderer.invoke('theme:export-custom-preset', preset),
    importCustomPreset: () => ipcRenderer.invoke('theme:import-custom-preset'),
    installThemeFromMarketplace: (url) => ipcRenderer.invoke('theme:install-from-marketplace', url),
    
    // ============================================
    // INSTANCES
    // ============================================
    getInstances: () => ipcRenderer.invoke('instance:get-all'),
    createInstance: (name, version, loader, icon, loaderVersion, options) => 
        ipcRenderer.invoke('instance:create', { name, version, loader, icon, loaderVersion, options }),
    updateInstance: (name, config) => ipcRenderer.invoke('instance:update', name, config),
    updateInstanceConfig: (name, config) => ipcRenderer.invoke('instance:update', name, config),
    migrateInstance: (name, config) => ipcRenderer.invoke('instance:migrate', name, config),
    reinstallInstance: (name, type) => ipcRenderer.invoke('instance:reinstall', name, type),
    deleteInstance: (name) => ipcRenderer.invoke('instance:delete', name),
    renameInstance: (oldName, newName) => ipcRenderer.invoke('instance:rename', oldName, newName),
    duplicateInstance: (name) => ipcRenderer.invoke('instance:duplicate', name),
    exportInstance: (name) => ipcRenderer.invoke('instance:export', name),
    exportVoidrixModpack: (name) => ipcRenderer.invoke('instance:export-voidrixmodpack', name),
    exportMrpack: (name) => ipcRenderer.invoke('instance:export-mrpack', name),
    exportInstanceZip: (name) => ipcRenderer.invoke('instance:export-zip', name),
    openResourcePacksFolder: (name) => ipcRenderer.invoke('instance:open-resourcepacks-folder', name),
    installResourcePack: (name, filePath) => ipcRenderer.invoke('instance:install-resourcepack', name, filePath),
    downloadResourcePack: (name, url) => ipcRenderer.invoke('instance:download-resourcepack', name, url),
    importInstance: () => ipcRenderer.invoke('instance:import'),
    importMrPack: () => ipcRenderer.invoke('instance:import-mrpack'),
    importVoidrixModpackStrict: () => ipcRenderer.invoke('instance:import-voidrixmodpack-strict'),
    importVoidrixModpackFile: (filePath) => ipcRenderer.invoke('instance:import-voidrixmodpack-file', filePath),
    importFile: () => ipcRenderer.invoke('instance:unified-import-v3'),
    openInstanceFolder: (name) => ipcRenderer.invoke('instance:open-folder', name),
    installModpack: (url, name, iconUrl) => ipcRenderer.invoke('instance:install-modpack', url, name, iconUrl),
    backupInstance: (instanceName) => ipcRenderer.invoke('backup:manual', instanceName),
    listLocalBackups: (instanceName) => ipcRenderer.invoke('instance:list-local-backups', instanceName),
    getBackupsDir: (instanceName) => ipcRenderer.invoke('instance:get-backups-dir', instanceName),
    restoreLocalBackup: (instanceName, backupFileName) => ipcRenderer.invoke('instance:restore-local-backup', instanceName, backupFileName),
    removeFile: (filePath) => ipcRenderer.invoke('instance:remove-file', filePath),
    
    // ============================================
    // MODS & RESOURCEPACKS
    // ============================================
    getMods: (instanceName) => ipcRenderer.invoke('instance:get-mods', instanceName),
    getResourcePacks: (instanceName) => ipcRenderer.invoke('instance:get-resourcepacks', instanceName),
    getShaders: (instanceName) => ipcRenderer.invoke('instance:get-shaders', instanceName),
    toggleMod: (instanceName, fileName) => ipcRenderer.invoke('instance:toggle-mod', instanceName, fileName),
    deleteMod: (instanceName, fileName, type) => ipcRenderer.invoke('instance:delete-mod', instanceName, fileName, type),
    installLocalMod: (instanceName, filePath) => ipcRenderer.invoke('instance:install-local-mod', instanceName, filePath),
    checkUpdates: (instanceName, files) => ipcRenderer.invoke('instance:check-updates', instanceName, files),
    updateFile: (data) => ipcRenderer.invoke('instance:update-file', data),
    
    // ============================================
    // WORLDS
    // ============================================
    getWorlds: (instanceName) => ipcRenderer.invoke('instance:get-worlds', instanceName),
    openWorldFolder: (instanceName, folderName) => ipcRenderer.invoke('instance:open-world-folder', instanceName, folderName),
    backupWorld: (instanceName, folderName, forceCloud) => ipcRenderer.invoke('instance:backup-world', instanceName, folderName, forceCloud),
    deleteWorld: (instanceName, folderName) => ipcRenderer.invoke('instance:delete-world', instanceName, folderName),
    exportWorld: (instanceName, folderName) => ipcRenderer.invoke('instance:export-world', instanceName, folderName),
    
    // ============================================
    // LAUNCHER
    // ============================================
    launchGame: (instanceName, quickPlay) => ipcRenderer.invoke('launcher:launch', instanceName, quickPlay),
    getLiveLogs: (instanceName) => ipcRenderer.invoke('launcher:get-live-logs', instanceName),
    killGame: (instanceName) => ipcRenderer.invoke('launcher:kill', instanceName),
    abortLaunch: (instanceName) => ipcRenderer.invoke('launcher:abort-launch', instanceName),
    getLogFiles: (instanceName) => ipcRenderer.invoke('instance:get-log-files', instanceName),
    getLog: (instanceName, filename) => ipcRenderer.invoke('instance:get-log', instanceName, filename),
    getActiveProcesses: () => ipcRenderer.invoke('launcher:get-active-processes'),
    getProcessStats: (pid) => ipcRenderer.invoke('launcher:get-process-stats', pid),
    
    // ============================================
    // MODRINTH & MODS
    // ============================================
    searchModrinth: (query, facets, options) => ipcRenderer.invoke('modrinth:search', query, facets, options),
    modrinthSearch: (query, facets, options) => ipcRenderer.invoke('modrinth:search', query, facets, options),
    installMod: (data) => ipcRenderer.invoke('modrinth:install', data),
    modrinthInstall: (data) => ipcRenderer.invoke('modrinth:install', data),
    getModVersions: (projectId, loaders, gameVersions, fallbackCurseForgeProjectId) => 
        ipcRenderer.invoke('modrinth:get-versions', projectId, loaders, gameVersions, fallbackCurseForgeProjectId),
    getModrinthProject: (projectId) => ipcRenderer.invoke('modrinth:get-project', projectId),
    resolveDependencies: (versionId, loaders, gameVersions) => 
        ipcRenderer.invoke('modrinth:resolve-dependencies', versionId, loaders, gameVersions),
    
    // ============================================
    // VERSIONS & LOADERS
    // ============================================
    getVanillaVersions: () => ipcRenderer.invoke('data:get-vanilla-versions'),
    getServerVersions: (software, mcVersion) => ipcRenderer.invoke('data:get-server-versions', software, mcVersion),
    getLoaderVersions: (loader, mcVersion) => ipcRenderer.invoke('instance:get-loader-versions', loader, mcVersion),
    getSupportedGameVersions: (loader) => ipcRenderer.invoke('instance:get-supported-game-versions', loader),
    getLoaders: (mcVersion, loaderType) => ipcRenderer.invoke('data:get-loaders', mcVersion, loaderType),
    
    // ============================================
    // JAVA
    // ============================================
    installJava: (version) => ipcRenderer.invoke('java:install', version),
    getJavaRuntimes: () => ipcRenderer.invoke('java:list'),
    deleteJavaRuntime: (path) => ipcRenderer.invoke('java:delete', path),
    openJavaFolder: () => ipcRenderer.invoke('java:open-folder'),
    
    // ============================================
    // SKINS
    // ============================================
    getCurrentSkin: (token) => ipcRenderer.invoke('skin:get-current', token),
    uploadSkin: (token, skinPath, variant) => ipcRenderer.invoke('skin:upload', token, skinPath, variant),
    uploadSkinFromUrl: (token, skinUrl, variant) => ipcRenderer.invoke('skin:upload-from-url', token, skinUrl, variant),
    setCape: (token, capeId) => ipcRenderer.invoke('skin:set-cape', token, capeId),
    saveLocalSkin: (filePath) => ipcRenderer.invoke('skin:save-local', filePath),
    saveLocalSkinFromUrl: (skinUrl) => ipcRenderer.invoke('skin:save-local-from-url', skinUrl),
    saveLocalSkinFromUsername: (username) => ipcRenderer.invoke('skin:save-local-from-username', username),
    getLocalSkins: () => ipcRenderer.invoke('skin:get-local'),
    exportLocalSkin: (id) => ipcRenderer.invoke('skin:export-local', id),
    deleteLocalSkin: (id) => ipcRenderer.invoke('skin:delete-local', id),
    renameLocalSkin: (id, newName) => ipcRenderer.invoke('skin:rename-local', id, newName),
    
    // ============================================
    // MODPACK CODES
    // ============================================
    exportModpackAsCode: (data) => ipcRenderer.invoke('modpack:export-code', data),
    importModpackFromCode: (code) => ipcRenderer.invoke('modpack:import-code', code),
    getModpackCodes: () => ipcRenderer.invoke('modpack:list-codes'),
    deleteModpackCode: (code) => ipcRenderer.invoke('modpack:delete-code', code),
    installSharedContent: (instanceName, modpackData) => 
        ipcRenderer.invoke('modpack:install-shared-content', { instanceName, modpackData }),
    
    // ============================================
    // TEXTUREPACKS
    // ============================================
    loadTexturepackZip: (options) => ipcRenderer.invoke('texturepack:load-zip', options),
    loadDefaultTexturepack: (projectId) => ipcRenderer.invoke('texturepack:load-default', projectId),
    exportTexturepack: (payload) => ipcRenderer.invoke('texturepack:export', payload),
    
    // ============================================
    // EXTENSIONS
    // ============================================
    getExtensions: () => ipcRenderer.invoke('extensions:list'),
    installExtension: (sourcePath) => ipcRenderer.invoke('extensions:install', sourcePath),
    removeExtension: (id) => ipcRenderer.invoke('extensions:remove', id),
    toggleExtension: (id, enabled) => ipcRenderer.invoke('extensions:toggle', id, enabled),
    invokeExtension: (extId, channel, ...args) => ipcRenderer.invoke(`ext:${extId}:${channel}`, ...args),
    fetchMarketplace: () => ipcRenderer.invoke('extensions:fetch-marketplace'),
    
    // ============================================
    // CLOUD
    // ============================================
    cloudLogin: (providerId) => ipcRenderer.invoke('cloud:login', providerId),
    cloudLogout: (providerId) => ipcRenderer.invoke('cloud:logout', providerId),
    cloudGetStatus: () => ipcRenderer.invoke('cloud:get-status'),
    cloudListBackups: (providerId, instanceName) => ipcRenderer.invoke('cloud:list-backups', providerId, instanceName),
    cloudUpload: (providerId, filePath, instanceName) => ipcRenderer.invoke('cloud:upload', providerId, filePath, instanceName),
    cloudDownload: (providerId, fileId, targetPath) => ipcRenderer.invoke('cloud:download', providerId, fileId, targetPath),
    
    // ============================================
    // UPDATER
    // ============================================
    checkForUpdates: () => ipcRenderer.invoke('updater:check'),
    downloadUpdate: (url, name) => ipcRenderer.invoke('updater:download', url, name),
    installUpdate: (path) => ipcRenderer.invoke('updater:install', path),
    setTestVersion: (version) => ipcRenderer.invoke('updater:set-test-version', version),
    restartAndInstall: () => ipcRenderer.send('update:quit-and-install'),
    
    // ============================================
    // NEWS & MISC
    // ============================================
    getNews: () => ipcRenderer.invoke('data:get-news'),
    runExternalFile: (filePath) => ipcRenderer.invoke('external:run-file', filePath),
    ping: () => ipcRenderer.invoke('ping'),
    
    // ============================================
    // EVENT LISTENERS
    // ============================================
    onUpdateAvailable: (callback) => {
        const subscription = (_event, value) => callback(value);
        ipcRenderer.on('update:available', subscription);
        return () => ipcRenderer.removeListener('update:available', subscription);
    },
    onUpdateNotAvailable: (callback) => {
        const subscription = (_event, value) => callback(value);
        ipcRenderer.on('update:not-available', subscription);
        return () => ipcRenderer.removeListener('update:not-available', subscription);
    },
    onUpdateProgress: (callback) => {
        const subscription = (_event, value) => callback(value);
        ipcRenderer.on('update:progress', subscription);
        return () => ipcRenderer.removeListener('update:progress', subscription);
    },
    onUpdateDownloaded: (callback) => {
        const subscription = (_event, value) => callback(value);
        ipcRenderer.on('update:downloaded', subscription);
        return () => ipcRenderer.removeListener('update:downloaded', subscription);
    },
    onUpdateError: (callback) => {
        const subscription = (_event, value) => callback(value);
        ipcRenderer.on('update:error', subscription);
        return () => ipcRenderer.removeListener('update:error', subscription);
    },
    onLaunchProgress: (callback) => {
        const subscription = (_event, value) => callback(value);
        ipcRenderer.on('launch:progress', subscription);
        return () => ipcRenderer.removeListener('launch:progress', subscription);
    },
    onLaunchLog: (callback) => {
        const subscription = (_event, value) => callback(value);
        ipcRenderer.on('launch:log', subscription);
        return () => ipcRenderer.removeListener('launch:log', subscription);
    },
    onInstanceStatus: (callback) => {
        const subscription = (_event, value) => callback(value);
        ipcRenderer.on('instance:status', subscription);
        return () => ipcRenderer.removeListener('instance:status', subscription);
    },
    onModpackFile: (callback) => {
        const subscription = (_event, filePath) => callback(filePath);
        ipcRenderer.on('modpack:import-file', subscription);
        return () => ipcRenderer.removeListener('modpack:import-file', subscription);
    },
    onInstallProgress: (callback) => {
        const subscription = (_event, value) => callback(value);
        ipcRenderer.on('install:progress', subscription);
        return () => ipcRenderer.removeListener('install:progress', subscription);
    },
    onLoginSuccess: (callback) => {
        const subscription = (_event, value) => callback(value);
        ipcRenderer.on('auth:success', subscription);
        return () => ipcRenderer.removeListener('auth:success', subscription);
    },
    onThemeUpdated: (callback) => {
        const subscription = (_event, value) => callback(value);
        ipcRenderer.on('theme:updated', subscription);
        return () => ipcRenderer.removeListener('theme:updated', subscription);
    },
    onSettingsUpdated: (callback) => {
        const subscription = (_event, value) => callback(value);
        ipcRenderer.on('settings:updated', subscription);
        return () => ipcRenderer.removeListener('settings:updated', subscription);
    },
    onJavaProgress: (callback) => {
        const subscription = (_event, value) => callback(value);
        ipcRenderer.on('java:progress', subscription);
        return () => ipcRenderer.removeListener('java:progress', subscription);
    },
    onWindowStateChange: (callback) => {
        const subscription = (_event, value) => callback(value);
        ipcRenderer.on('window-state', subscription);
        return () => ipcRenderer.removeListener('window-state', subscription);
    },
    onExtensionFile: (callback) => {
        const subscription = (_event, value) => callback(value);
        ipcRenderer.on('extension:open-file', subscription);
        return () => ipcRenderer.removeListener('extension:open-file', subscription);
    },
    onExtensionMessage: (extId, channel, callback) => {
        const subscription = (_event, ...args) => callback(...args);
        ipcRenderer.on(`ext:${extId}:${channel}`, subscription);
        return () => ipcRenderer.removeListener(`ext:${extId}:${channel}`, subscription);
    },
    onUpdaterProgress: (callback) => {
        const subscription = (_event, value) => callback(value);
        ipcRenderer.on('updater:progress', subscription);
        return () => ipcRenderer.removeListener('updater:progress', subscription);
    },
    onCrashReport: (callback) => {
        const subscription = (_event, value) => callback(value);
        ipcRenderer.on('launcher:crash-report', subscription);
        return () => ipcRenderer.removeListener('launcher:crash-report', subscription);
    }
};

// API in den Renderer-Prozess exportieren
try {
    contextBridge.exposeInMainWorld('electronAPI', electronAPI);
    console.log('[Preload] ✅ ElectronAPI erfolgreich exposed mit', Object.keys(electronAPI).length, 'Methoden');
    console.log('[Preload] System-Info API verfügbar:', typeof electronAPI.getSystemInfo === 'function');
} catch (error) {
    console.error('[Preload] ❌ Fehler beim Exposen der API:', error);
}