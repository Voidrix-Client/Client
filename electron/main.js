const { app, BrowserWindow, ipcMain, protocol, net, Menu, Tray, nativeImage } = require('electron');
const fs = require('fs-extra');
const path = require('path');
const pkg = require('../package.json');
const { exec } = require('child_process');

if (process.platform === 'linux' && process.env.XDG_CURRENT_DESKTOP === 'COSMIC') {
    process.env.XDG_CURRENT_DESKTOP = 'Unity';
}

app.setName(pkg.productName || 'VoidrixClient');
app.setAboutPanelOptions({
    applicationName: pkg.productName || 'VoidrixClient',
    applicationVersion: pkg.version
});

app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('disable-gpu-driver-bug-workarounds');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');

if (process.platform === 'linux') {
    app.commandLine.appendSwitch('disable-gpu-sandbox');
    app.commandLine.appendSwitch('use-gl', 'egl');
}
app.commandLine.appendSwitch('enable-webgl-draft-extensions');
app.commandLine.appendSwitch('disable-features', 'NetworkServiceSandbox,CalculateNativeWinOcclusion');

const settingsPath = path.join(app.getPath('userData'), 'settings.json');
try {
    if (fs.existsSync(settingsPath)) {
        const settings = fs.readJsonSync(settingsPath);
        if (settings.legacyGpuSupport) {
            console.log('[Main] Legacy GPU Support enabled: Disabling hardware acceleration and forcing desktop GL');
            app.disableHardwareAcceleration();
            app.commandLine.appendSwitch('use-gl', 'desktop');
        }
    }
} catch (e) {
    console.error('[Main] Failed to read settings for legacy GPU check:', e);
}

const logPath = path.join(app.getPath('userData'), 'startup.log');
function logToFile(msg) {
    const time = new Date().toISOString();
    try {
        fs.appendFileSync(logPath, `[${time}] ${msg}\n`);
    } catch (e) {
        console.error('Failed to write to log file:', e);
    }
}

process.on('uncaughtException', (error) => {
    logToFile(`CRITICAL: Uncaught Exception: ${error.message}\nStack: ${error.stack}`);
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    logToFile(`CRITICAL: Unhandled Rejection at: ${promise}\nReason: ${reason}`);
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

logToFile('NUCLEAR STARTUP CHECK: main.js is running!');
logToFile(`[DEBUG] CWD: ${process.cwd()}`);
logToFile(`[DEBUG] __dirname: ${__dirname}`);
logToFile(`[DEBUG] Preload Path: ${path.join(__dirname, '../backend/preload.js')}`);
logToFile(`[DEBUG] userData: ${app.getPath('userData')}`);

ipcMain.handle('ping', () => {
    console.log('Ping received!');
    return 'pong';
});

ipcMain.handle('app:restart', () => {
    app.relaunch();
    app.exit(0);
});

const { pathToFileURL } = require('url');
const dns = require('dns');
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}
protocol.registerSchemesAsPrivileged([
    {
        scheme: 'app-media',
        privileges: {
            secure: true,
            standard: true,
            supportFetchAPI: true,
            bypassCSP: true,
            corsEnabled: true,
            stream: true
        }
    }
]);

let mainWindow;
let splashWindow;
let tray = null;
let isQuiting = false;
const isDeveloperMode = process.env.NODE_ENV === 'development';

function createSplashWindow() {
    splashWindow = new BrowserWindow({
        width: 440,
        height: 560,
        resizable: false,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        icon: path.join(__dirname, '../resources/icon.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            sandbox: false,
            zoomFactor: 1.0
        }
    });

    // Chromium speichert Zoom pro Origin (file://) dauerhaft — für den Splash
    // immer auf 100% zurücksetzen und Zoomen sperren, sonst wird er abgeschnitten.
    splashWindow.webContents.on('did-finish-load', () => {
        splashWindow.webContents.setZoomLevel(0);
        splashWindow.webContents.setZoomFactor(1.0);
        splashWindow.webContents.setVisualZoomLevelLimits(1, 1);
    });

    try {
        const splashPath = path.join(__dirname, '../public/splash.html');
        if (fs.existsSync(splashPath)) {
            splashWindow.loadFile(splashPath);
        } else {
            console.error('[Main] Splash screen file not found:', splashPath);
        }
    } catch (err) {
        console.error('[Main] Failed to load splash screen:', err);
    }
    splashWindow.center();
}

async function checkAndLaunch() {
    createSplashWindow();

    let retryCount = 0;
    const maxRetries = 3;

    const performCheck = async () => {
        if (isDeveloperMode) {
            console.log('[Main] Skipping update check in dev mode.');
            splashWindow.webContents.send('updater:status', { status: 'Searching for updates' });
            setTimeout(() => {
                splashWindow.webContents.send('updater:status', { status: 'Starting' });
                setTimeout(launchMain, 1500);
            }, 1000);
            return;
        }

        splashWindow.webContents.send('updater:status', { status: 'Searching for updates', retryCount });

        try {
            const axios = require('axios');
            const { compareVersions } = require('../backend/utils/version-utils');
            const pkg = require('../package.json');

            const REPO = 'VoidrixClient/VoidrixClient';
            const GITHUB_API = `https://api.github.com/repos/${REPO}/releases/latest`;

            const response = await axios.get(GITHUB_API, {
                headers: { 'User-Agent': 'VoidrixClient-AutoUpdater' }
            });
            const release = response.data;
            const latestVersion = release.tag_name;
            const currentVersion = pkg.version;

            const needsUpdate = compareVersions(currentVersion, latestVersion) === 1;

            if (needsUpdate) {
                const platform = process.platform;
                let asset = null;
                let deltaAsset = null;

                if (platform === 'win32') {
                    asset = release.assets.find(a => a.name.endsWith('.exe'));
                    deltaAsset = release.assets.find(a => a.name.endsWith('.delta')); // Delta file
                } else if (platform === 'linux') {
                    asset = release.assets.find(a => a.name.endsWith('.AppImage') || a.name.endsWith('.deb') || a.name.endsWith('.rpm'));
                    deltaAsset = release.assets.find(a => a.name.endsWith('.delta'));
                } else if (platform === 'darwin') {
                    asset = release.assets.find(a => a.name.endsWith('.zip') || a.name.endsWith('.dmg'));
                    deltaAsset = release.assets.find(a => a.name.endsWith('.delta'));
                }

                if (deltaAsset) {
                    splashWindow.webContents.send('updater:status', { status: 'Downloading delta update...', progress: 0 });

                    const downloadDir = path.join(app.getPath('userData'), 'updates');
                    await fs.ensureDir(downloadDir);
                    const deltaFilePath = path.join(downloadDir, path.basename(deltaAsset.name));

                    const downloadRes = await axios({
                        url: deltaAsset.browser_download_url,
                        method: 'GET',
                        responseType: 'stream'
                    });

                    const writer = fs.createWriteStream(deltaFilePath);
                    downloadRes.data.pipe(writer);

                    await new Promise((resolve, reject) => {
                        writer.on('finish', resolve);
                        writer.on('error', reject);
                    });

                    splashWindow.webContents.send('updater:status', { status: 'Applying delta update...' });
                    try {
                        await applyDeltaUpdate(deltaFilePath, app.getPath('userData'));
                        splashWindow.webContents.send('updater:status', { status: 'Update applied successfully!' });
                    } catch (error) {
                        splashWindow.webContents.send('updater:status', { status: 'Delta update failed. Downloading full update...' });
                    }
                } else if (asset) {
                    splashWindow.webContents.send('updater:status', { status: 'Downloading full update...', progress: 0 });

                    const downloadDir = path.join(app.getPath('userData'), 'updates');
                    await fs.ensureDir(downloadDir);
                    const targetPath = path.join(downloadDir, path.basename(asset.name));

                    const downloadRes = await axios({
                        url: asset.browser_download_url,
                        method: 'GET',
                        responseType: 'stream'
                    });

                    const writer = fs.createWriteStream(targetPath);
                    downloadRes.data.pipe(writer);

                    await new Promise((resolve, reject) => {
                        writer.on('finish', resolve);
                        writer.on('error', reject);
                    });

                    splashWindow.webContents.send('updater:status', { status: 'Full update downloaded. Please restart the application.' });
                }
            }

            splashWindow.webContents.send('updater:status', { status: 'Starting' });
            setTimeout(launchMain, 1500);

        } catch (err) {
            console.error('[Main] Update check failed:', err);
            retryCount++;
            if (retryCount <= maxRetries) {
                setTimeout(performCheck, 1000);
            } else {
                splashWindow.webContents.send('updater:status', { status: 'Starting' });
                setTimeout(launchMain, 1500);
            }
        }
    };

    splashWindow.webContents.once('did-finish-load', () => {
        performCheck();
    });
}

function launchMain() {
    createWindow();
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1600,
        height: 900,
        minWidth: 900,
        minHeight: 600,
        title: 'VoidrixClient',
        frame: false,
        icon: path.join(__dirname, '../resources/icon.png'),
        backgroundColor: '#121212',
        show: false,
        webPreferences: {
            preload: path.join(__dirname, '../backend/preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            v8CacheOptions: 'bypassHeatCheck'
        },
    });

    mainWindow.once('ready-to-show', () => {
        setTimeout(() => {
            if (splashWindow) {
                splashWindow.close();
                splashWindow = null;
            }
            mainWindow.show();
            mainWindow.focus();
        }, 500);
    });

    console.log('[Main] Preload script configured.');
    const handlers = [
        { name: 'auth', path: '../backend/handlers/auth' },
        { name: 'instances', path: '../backend/handlers/instances' },
        { name: 'launcher', path: '../backend/handlers/launcher' },
        { name: 'modrinth', path: '../backend/handlers/modrinth' },
        { name: 'data', path: '../backend/handlers/data' },
        { name: 'settings', path: '../backend/handlers/settings' },
        { name: 'skins', path: '../backend/handlers/skins' },
        { name: 'modpackCode', path: '../backend/handlers/modpackCode' },
        { name: 'extensions', path: '../backend/handlers/extensions' },
        { name: 'cloudBackup', path: '../backend/handlers/cloudBackup' },
        { name: 'java', path: '../backend/handlers/java' },
        { name: 'external', path: '../backend/handlers/external' },
        { name: 'updater', path: '../backend/handlers/updater' }
    ];

    for (const h of handlers) {
        logToFile(`[Main] Registering ${h.name} handler...`);
        try {
            const handler = require(h.path);
            if (typeof handler === 'function') {
                if (h.name === 'data' || h.name === 'settings' || h.name === 'java' || h.name === 'external') {
                    handler(ipcMain);
                } else {
                    handler(ipcMain, mainWindow);
                }
                logToFile(`[Main] ✅ ${h.name} handler registered.`);
            } else {
                logToFile(`[Main] ⚠️ ${h.name} handler is not a function.`);
            }
        } catch (e) {
            logToFile(`[Main] ❌ CRITICAL: Failed to register ${h.name} handler: ${e.message}\n${e.stack}`);
            console.error(`[Main] Failed to register ${h.name} handler:`, e);
        }
    }

    ipcMain.on('app:is-packaged', (event) => {
        event.returnValue = app.isPackaged;
    });

    ipcMain.on('app:is-developer-mode', (event) => {
        event.returnValue = isDeveloperMode;
    });

    ipcMain.handle('app:get-version', () => {
        try {
            const pkg = require(path.join(__dirname, '../package.json'));
            return pkg.version;
        } catch (e) {
            return app.getVersion();
        }
    });

    try {
        logToFile('[Main] Initializing Discord RPC...');
        const discord = require('../backend/handlers/discord');
        discord.initRPC();
        logToFile('[Main] ✅ Discord RPC initialized.');
    } catch (e) {
        logToFile(`[Main] ❌ Failed to initialize Discord RPC: ${e.message}`);
    }

    try {
        logToFile('[Main] Initializing Backup Manager...');
        const backupManager = require('../backend/backupManager');
        backupManager.init(ipcMain);
        logToFile('[Main] ✅ Backup Manager initialized.');
    } catch (e) {
        logToFile(`[Main] ❌ Failed to initialize Backup Manager: ${e.message}`);
    }
    if (isDeveloperMode) {
        logToFile('[Main] Loading development URL...');
        mainWindow.loadURL('http://localhost:3000');
        mainWindow.webContents.openDevTools();
    } else {
        const indexPath = path.join(__dirname, '../dist/index.html');
        logToFile(`[Main] Loading production file: ${indexPath}`);

        if (!fs.existsSync(indexPath)) {
            logToFile(`[Main] CRITICAL ERROR: Production index.html not found at ${indexPath}`);
            console.error(`[Main] CRITICAL ERROR: Production index.html not found at ${indexPath}`);
        }

        mainWindow.loadFile(indexPath).catch(err => {
            logToFile(`[Main] Failed to load production file: ${err.message}\n${err.stack}`);
            console.error('[Main] Failed to load production file:', err);
        });
    }
    ipcMain.on('window-minimize', () => {
        try {
            const settingsPath = path.join(app.getPath('userData'), 'settings.json');
            if (fs.existsSync(settingsPath)) {
                const settings = fs.readJsonSync(settingsPath, { throws: false }) || {};
                if (settings.minimizeToTray) {
                    mainWindow.hide();
                    return;
                }
            }
        } catch (e) { }
        mainWindow.minimize();
    });

    ipcMain.on('window-maximize', () => {
        if (mainWindow.isMaximized()) mainWindow.unmaximize();
        else mainWindow.maximize();
    });

    ipcMain.on('window-close', () => {
        try {
            const settingsPath = path.join(app.getPath('userData'), 'settings.json');
            if (fs.existsSync(settingsPath)) {
                const settings = fs.readJsonSync(settingsPath, { throws: false }) || {};
                if (settings.minimizeToTray && !isQuiting) {
                    mainWindow.hide();
                    return;
                }
            }
        } catch (e) { }
        mainWindow.close();
    });

    mainWindow.on('maximize', () => mainWindow.webContents.send('window-state', true));
    mainWindow.on('unmaximize', () => mainWindow.webContents.send('window-state', false));

    mainWindow.on('close', (event) => {
        if (!isQuiting) {
            try {
                const settingsPath = path.join(app.getPath('userData'), 'settings.json');
                if (fs.existsSync(settingsPath)) {
                    const settings = fs.readJsonSync(settingsPath, { throws: false }) || {};
                    if (settings.minimizeToTray) {
                        event.preventDefault();
                        mainWindow.hide();
                    }
                }
            } catch (e) { }
        }
    });
}

function setupAppMediaProtocol() {
    protocol.handle('app-media', (request) => {
        try {
            const url = new URL(request.url);
            let decodedPath = decodeURIComponent(url.pathname);

            if (process.platform === 'win32') {
                if (decodedPath.startsWith('/')) {
                    decodedPath = decodedPath.substring(1);
                }
                if (decodedPath.startsWith(':')) {
                    decodedPath = decodedPath.substring(1);
                }

                if (url.host) {
                    const host = decodeURIComponent(url.host);
                    if (host.endsWith(':')) {
                        decodedPath = host + (decodedPath.startsWith('/') ? '' : '/') + decodedPath;
                    } else {
                        decodedPath = host + ':/' + (decodedPath.startsWith('/') ? '' : '/') + decodedPath;
                    }
                } else {
                    if (decodedPath.length > 1 && /^[a-zA-Z]$/.test(decodedPath[0]) && (decodedPath[1] === '/' || decodedPath[1] === '\\' || decodedPath[1] === ':')) {
                        if (decodedPath[1] !== ':') {
                            decodedPath = decodedPath[0] + ':' + decodedPath.substring(1);
                        }
                    }
                }
            } else {
                decodedPath = decodeURIComponent(url.host + url.pathname);
            }

            console.log(`[Main] app-media request: ${request.url} -> decodedPath: ${decodedPath}`);

            const resolvedPath = path.resolve(decodedPath);

            const userDataPath = app.getPath('userData');
            const isInside = process.platform === 'win32'
                ? resolvedPath.toLowerCase().startsWith(userDataPath.toLowerCase())
                : resolvedPath.startsWith(userDataPath);

            if (!isInside) {
                console.error(`[Main] Blocked app-media attempt to access path outside userData: ${resolvedPath}`);
                return new Response('Access Denied', { status: 403 });
            }

            return net.fetch(pathToFileURL(resolvedPath).toString());
        } catch (e) {
            console.error('Protocol error:', e);
            return new Response(null, { status: 404 });
        }
    });

    const template = [
        ...(process.platform === 'darwin' ? [{
            label: app.name,
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideOthers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        }] : []),
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'delete' },
                { role: 'selectAll' }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            role: 'window',
            submenu: [
                { role: 'minimize' },
                { role: 'zoom' },
                { type: 'separator' },
                { role: 'front' },
                { type: 'separator' },
                { role: 'window' }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

const handleDeepLink = (argv) => {
    const extensionFile = argv.find(arg => arg.endsWith('.mcextension'));
    const modpackFile = argv.find(arg => arg.endsWith('.voidrixmodpack'));

    if (extensionFile) {
        console.log('[Main] extension file opened:', extensionFile);

        if (mainWindow && mainWindow.webContents && !mainWindow.webContents.isLoading()) {
            mainWindow.webContents.send('extension:open-file', extensionFile);
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        } else if (mainWindow) {
            mainWindow.once('ready-to-show', () => {
                mainWindow.webContents.send('extension:open-file', extensionFile);
            });
        }
    }

    if (modpackFile) {
        console.log('[Main] modpack file opened:', modpackFile);

        if (mainWindow && mainWindow.webContents && !mainWindow.webContents.isLoading()) {
            mainWindow.webContents.send('modpack:import-file', modpackFile);
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        } else if (mainWindow) {
            mainWindow.once('ready-to-show', () => {
                mainWindow.webContents.send('modpack:import-file', modpackFile);
            });
        }
    }
};

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
            handleDeepLink(commandLine);
        } else if (splashWindow) {
            splashWindow.focus();
        }
    });
}

app.whenReady().then(() => {
    if (process.platform === 'darwin') {
        const dockIconPath = path.join(__dirname, '../resources/icon-mac.png');
        if (fs.existsSync(dockIconPath)) {
            app.dock.setIcon(nativeImage.createFromPath(dockIconPath));
        }
    }

    setupAppMediaProtocol();
    checkAndLaunch();
    handleDeepLink(process.argv);
    processPendingOpenFiles();

    try {
        let iconPath = path.join(__dirname, '../resources/icon.png');
        if (process.platform === 'win32') {
            const icoIcon = path.join(__dirname, '../resources/icon.ico');
            if (fs.existsSync(icoIcon)) iconPath = icoIcon;
        } else if (process.platform === 'linux') {
            const pngIcon = path.join(__dirname, '../resources/icon.png');
            if (fs.existsSync(pngIcon)) iconPath = pngIcon;
        }
        tray = new Tray(iconPath);
        const contextMenu = Menu.buildFromTemplate([
            {
                label: 'Show App', click: () => {
                    if (mainWindow) {
                        mainWindow.show();
                        mainWindow.focus();
                    }
                }
            },
            {
                label: 'Quit', click: () => {
                    isQuiting = true;
                    app.quit();
                }
            }
        ]);
        tray.setToolTip('VoidrixClient');
        tray.setContextMenu(contextMenu);
        tray.on('click', () => {
            if (mainWindow) {
                if (mainWindow.isMinimized()) mainWindow.restore();
                mainWindow.show();
                mainWindow.focus();
            }
        });
        tray.on('double-click', () => {
            if (mainWindow) {
                mainWindow.show();
                mainWindow.focus();
            }
        });
    } catch (err) {
        console.error('Failed to create tray icon', err);
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            if (mainWindow) {
                mainWindow.show();
            } else {
                checkAndLaunch();
            }
        }
    });

});

const pendingOpenFiles = [];

const processFilePath = (filePath) => {
    if (!filePath || !filePath.toLowerCase().endsWith('.voidrixmodpack')) return;

    console.log('[Main] Processing file open:', filePath);
    if (mainWindow && mainWindow.webContents && !mainWindow.webContents.isLoading()) {
        mainWindow.webContents.send('modpack:import-file', filePath);
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
    } else if (mainWindow) {
        mainWindow.once('ready-to-show', () => {
            mainWindow.webContents.send('modpack:import-file', filePath);
        });
    } else {
        pendingOpenFiles.push(filePath);
    }
};

const processPendingOpenFiles = () => {
    while (pendingOpenFiles.length) {
        const file = pendingOpenFiles.shift();
        processFilePath(file);
    }
};

app.on('open-file', (event, filePath) => {
    event.preventDefault();
    console.log('[Main] macOS open-file:', filePath);

    if (filePath.toLowerCase().endsWith('.mcextension')) {
        if (mainWindow && mainWindow.webContents && !mainWindow.webContents.isLoading()) {
            mainWindow.webContents.send('extension:open-file', filePath);
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        } else if (mainWindow) {
            mainWindow.once('ready-to-show', () => {
                mainWindow.webContents.send('extension:open-file', filePath);
            });
        } else {
            pendingOpenFiles.push(filePath);
        }
    } else if (filePath.toLowerCase().endsWith('.voidrixmodpack')) {
        processFilePath(filePath);
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
