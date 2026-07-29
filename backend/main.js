const { app, BrowserWindow, ipcMain, protocol, dialog } = require('electron');

const path = require('path');
const fs = require('fs-extra');

console.log('Electron versions:', process.versions);
if (require('electron-squirrel-startup')) {
    app.quit();
}

let mainWindow;

// ============ BLOCKLIST SYSTEM ============
const blocklistPath = 'C:\\Users\\paulr\\Desktop\\DEV\\Launcher\\VoidrixClient\\voidrixwhitelist\\voidrix-blocklist.json';

// Funktion zum Laden der Blocklist
function loadBlocklist() {
    try {
        if (fs.existsSync(blocklistPath)) {
            const data = fs.readFileSync(blocklistPath, 'utf8');
            return JSON.parse(data);
        } else {
            console.log('[Blocklist] Blocklist-Datei nicht gefunden:', blocklistPath);
            return { blocked: [] };
        }
    } catch (error) {
        console.error('[Blocklist] Fehler beim Laden der Blocklist:', error);
        return { blocked: [] };
    }
}

// Funktion zum Prüfen, ob ein Benutzername gesperrt ist
function isUserBlocked(username) {
    if (!username) return false;
    
    const blocklist = loadBlocklist();
    
    // Prüfe, ob der Benutzername in der Blocklist ist
    if (blocklist.blocked && Array.isArray(blocklist.blocked)) {
        const isBlocked = blocklist.blocked.some(blocked => 
            blocked.toLowerCase() === username.toLowerCase()
        );
        
        if (isBlocked) {
            console.log(`[Blocklist] ⛔ Gesperrter Account erkannt: ${username}`);
        }
        
        return isBlocked;
    }
    
    return false;
}

// Funktion zum Anzeigen der Sperr-Nachricht
function showBlockedDialog(username) {
    const blockedMessage = `FEHLER: ACCOUNT GESPERRT VOM LAUNCHER\n\nDer Account "${username}" wurde vom Launcher gesperrt.\n\nKontaktiere den Support für weitere Informationen.`;
    
    dialog.showErrorBox('Account gesperrt', blockedMessage);
    
    // Sende auch eine Nachricht an den Renderer
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('account-blocked', username);
    }
    
    // App nach 3 Sekunden beenden
    setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.close();
        }
        app.quit();
    }, 3000);
}

// Überwache Änderungen an der Blocklist-Datei
function watchBlocklistFile() {
    try {
        fs.watch(blocklistPath, (eventType, filename) => {
            if (eventType === 'change') {
                console.log('[Blocklist] Blocklist wurde aktualisiert');
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('blocklist-updated');
                }
            }
        });
        console.log('[Blocklist] Blocklist-Überwachung gestartet');
    } catch (error) {
        console.error('[Blocklist] Fehler beim Überwachen der Blocklist:', error);
    }
}

// Funktion zum Prüfen des aktuell eingeloggten Users
async function checkCurrentUser() {
    try {
        // Hole den aktuellen User aus dem Auth-Handler
        const profile = await ipcMain.emit('auth:get-profile-sync');
        if (profile && profile.name) {
            if (isUserBlocked(profile.name)) {
                showBlockedDialog(profile.name);
                return false;
            }
        }
        return true;
    } catch (error) {
        console.error('[Blocklist] Fehler beim Prüfen des aktuellen Users:', error);
        return true;
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        minWidth: 900,
        minHeight: 600,
        title: 'Minecraft Launcher',
        frame: false,
        backgroundColor: '#121212',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
        },
    });

    console.log('[Main] Preload script configured.');
    console.log('[Main] ========== REGISTRIERE ALLE HANDLER ==========');

    try {

        console.log('[Main] Registering auth handler...');
        require('./handlers/auth')(ipcMain, mainWindow);
        console.log('[Main] Registering instances handler...');
        require('./handlers/instances')(ipcMain, mainWindow);
        console.log('[Main] Registering launcher handler...');
        const launcherApi = require('./handlers/launcher')(ipcMain, mainWindow);
        
        // BLOCKLIST: Intercepte den Launch um gesperrte Accounts zu verhindern
        const originalLaunchInstance = launcherApi.launchInstance;
        if (originalLaunchInstance) {
            launcherApi.launchInstance = async (instanceName) => {
                try {
                    const profile = await getCurrentProfile();
                    if (profile && profile.name && isUserBlocked(profile.name)) {
                        showBlockedDialog(profile.name);
                        throw new Error('Account ist gesperrt');
                    }
                    return originalLaunchInstance(instanceName);
                } catch (error) {
                    console.error('[Blocklist] Launch blockiert:', error);
                    throw error;
                }
            };
        }
        
        const handleCliArgs = (argv) => {
            console.log('[Main] Processing CLI args:', argv);
            const runIndex = argv.indexOf('run');
            if (runIndex !== -1 && argv.length > runIndex + 1) {
                const instanceName = argv[runIndex + 1];
                console.log(`[Main] CLI Launch request detected for: ${instanceName}`);
                setTimeout(async () => {
                    try {
                        const profile = await getCurrentProfile();
                        if (profile && profile.name && isUserBlocked(profile.name)) {
                            showBlockedDialog(profile.name);
                            return;
                        }
                        console.log(`[Main] Triggering CLI launch for ${instanceName}`);
                        await launcherApi.launchInstance(instanceName);
                    } catch (err) {
                        console.error('[Main] CLI launch failed:', err);
                    }
                }, 3000);
            }
        };
        handleCliArgs(process.argv);
        const gotTheLock = app.requestSingleInstanceLock();
        if (!gotTheLock) {
            app.quit();
        } else {
            app.on('second-instance', (event, commandLine, workingDirectory) => {

                if (mainWindow) {
                    if (mainWindow.isMinimized()) mainWindow.restore();
                    mainWindow.focus();
                }

                handleCliArgs(commandLine);
            });
        }
        console.log('[Main] Registering modrinth handler...');
        require('./handlers/modrinth')(ipcMain, mainWindow);
        console.log('[Main] Registering data handler...');
        require('./handlers/data')(ipcMain, mainWindow);
        console.log('[Main] Registering settings handler...');
        require('./handlers/settings')(ipcMain, mainWindow);
        console.log('[Main] Registering external handler...');
        require('./handlers/external')(ipcMain, mainWindow);
        console.log('[Main] Registering modpack code handler...');
        try {
            const modpackHandler = require('./handlers/modpackCode');
            modpackHandler(ipcMain, mainWindow);
            console.log('[Main] Modpack code handler registered successfully.');
        } catch (error) {
            console.error('[Main] Error registering modpack code handler:', error);
        }
        console.log('[Main] Registering skins handler...');
        require('./handlers/skins')(ipcMain, mainWindow);
        console.log('[Main] Registering extensions handler...');
        require('./handlers/extensions')(ipcMain, mainWindow);
        console.log('[Main] Registering cloud backup handler...');
        require('./handlers/cloudBackup')(ipcMain, mainWindow);
        console.log('[Main] Registering texturepacks handler...');
        require('./handlers/texturepacks')(ipcMain, mainWindow);
        console.log('[Main] Registering remote control handler...');
        require('./handlers/remoteControl')(ipcMain, mainWindow);
        console.log('[Main] Registering discord handler...');
        try {
            const discord = require('./handlers/discord');
            discord.initRPC();
        } catch (error) {
            console.error('[Main] Discord RPC error:', error);
        }

        console.log('[Main] All handlers registered successfully.');
    } catch (error) {
        console.error('[Main] Error registering handlers:', error);
    }
    
    const allHandlers = ipcMain._events ? Object.keys(ipcMain._events) : [];
    console.log('[Main] ALLE registrierten IPC Handler:', allHandlers);
    const modpackHandlers = allHandlers.filter(key => key.includes('modpack'));
    console.log('[Main] Modpack Handler gefunden:', modpackHandlers);
    
    ipcMain.on('window-minimize', () => mainWindow.minimize());
    ipcMain.on('window-maximize', () => {
        if (mainWindow.isMaximized()) mainWindow.unmaximize();
        else mainWindow.maximize();
    });
    ipcMain.on('window-close', () => mainWindow.close());

    ipcMain.handle('app:get-version', () => {
        try {
            const pkg = require(path.join(__dirname, '../package.json'));
            return pkg.version;
        } catch (e) {
            return app.getVersion();
        }
    });

    // ============ BLOCKLIST IPC HANDLER ============
    ipcMain.handle('blocklist:check-user', async (event, username) => {
        const isBlocked = isUserBlocked(username);
        if (isBlocked) {
            showBlockedDialog(username);
        }
        return { blocked: isBlocked };
    });
    
    ipcMain.handle('blocklist:check-current-user', async () => {
        try {
            const profile = await getCurrentProfile();
            if (profile && profile.name) {
                return { 
                    blocked: isUserBlocked(profile.name),
                    username: profile.name 
                };
            }
            return { blocked: false };
        } catch (error) {
            console.error('[Blocklist] Fehler beim Prüfen des aktuellen Users:', error);
            return { blocked: false };
        }
    });
    
    ipcMain.handle('blocklist:get-list', async () => {
        return loadBlocklist();
    });
    
    ipcMain.handle('blocklist:reload', async () => {
        return loadBlocklist();
    });

    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
        mainWindow.loadURL('http://localhost:3000');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
    
    // Nach dem Laden des Fensters den aktuellen User prüfen
    mainWindow.webContents.on('did-finish-load', async () => {
        setTimeout(async () => {
            await checkCurrentUser();
        }, 1000);
    });
}

// Hilfsfunktion zum Abrufen des aktuellen Profils
async function getCurrentProfile() {
    return new Promise((resolve) => {
        // Versuche über verschiedene Wege das aktuelle Profil zu bekommen
        if (mainWindow && mainWindow.webContents) {
            mainWindow.webContents.executeJavaScript('window.electronAPI?.getProfile?.()')
                .then(resolve)
                .catch(() => resolve(null));
        } else {
            resolve(null);
        }
    });
}

app.whenReady().then(() => {
    protocol.registerFileProtocol('extension', (request, callback) => {
        const url = request.url.replace(/^extension:\/\/?/, '');
        try {
            const decodedUrl = decodeURIComponent(url);
            const extensionsDir = path.join(app.getPath('userData'), 'extensions');
            const filePath = path.normalize(path.join(extensionsDir, decodedUrl));

            if (!filePath.startsWith(extensionsDir)) {
                return callback({ error: -2 });
            }
            callback({ path: filePath });
        } catch (error) {
            console.error('Failed to parse extension URL:', error);
            callback({ error: -2 });
        }
    });

    createWindow();
    
    // Starte Blocklist-Überwachung
    watchBlocklistFile();
    
    // Initiale Blocklist laden
    const initialBlocklist = loadBlocklist();
    console.log(`[Blocklist] Geladen: ${initialBlocklist.blocked.length} gesperrte Accounts`);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});