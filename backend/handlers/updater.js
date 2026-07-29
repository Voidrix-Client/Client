const { app, shell, dialog } = require('electron');
const axios = require('axios');
const path = require('path');
const fs = require('fs-extra');
const { spawn } = require('child_process');
const { compareVersions } = require('../utils/version-utils');
const pkg = require('../../package.json');

const REPO = 'LuxenStudio/VoidrixClient';
const GITHUB_API = `https://api.github.com/repos/${REPO}/releases/latest`;
const ALL_RELEASES_API = `https://api.github.com/repos/${REPO}/releases`;
const UPDATE_CHECK_INTERVAL = 12 * 60 * 60 * 1000; // 12 hours
const CLEANUP_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

module.exports = (ipcMain, mainWindow) => {
    let testVersionOverride = null;
    let updateCheckInterval = null;
    let autoUpdateEnabled = true;
    let lastCheckTime = null;
    let isDownloading = false;
    let isInstalling = false;

    // ============================================
    // HELPER FUNCTIONS
    // ============================================
    
    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getCurrentVersion = () => testVersionOverride || pkg.version;

    const detectPlatformAsset = (assets, platform, arch) => {
        const patterns = {
            win32: {
                x64: [/win32-x64.*\.exe$/i, /win.*x64.*\.exe$/i, /\.exe$/i],
                ia32: [/win32-ia32.*\.exe$/i, /win.*ia32.*\.exe$/i, /\.exe$/i],
                default: [/\.exe$/i]
            },
            linux: {
                x64: [/linux-x64.*\.AppImage$/i, /linux.*x64.*\.AppImage$/i, /\.AppImage$/i, /\.deb$/i],
                arm64: [/linux-arm64.*\.AppImage$/i, /arm64.*\.AppImage$/i, /\.AppImage$/i],
                default: [/\.AppImage$/i, /\.deb$/i]
            },
            darwin: {
                x64: [/mac.*x64.*\.dmg$/i, /darwin.*x64.*\.dmg$/i, /\.dmg$/i, /\.zip$/i],
                arm64: [/mac.*arm64.*\.dmg$/i, /darwin.*arm64.*\.dmg$/i, /\.dmg$/i],
                default: [/\.dmg$/i, /\.zip$/i]
            }
        };

        const platformPatterns = patterns[platform] || patterns.win32;
        const archPatterns = platformPatterns[arch] || platformPatterns.default;

        for (const pattern of archPatterns) {
            const asset = assets.find(a => pattern.test(a.name));
            if (asset) return asset;
        }

        return null;
    };

    const parseChangelog = (body) => {
        if (!body) return { sections: [], items: [] };
        
        const sections = [];
        const items = [];
        const lines = body.split('\n');
        
        let currentSection = null;
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            
            // Detect section headers
            if (trimmed.startsWith('##') || trimmed.startsWith('###')) {
                currentSection = trimmed.replace(/^#+\s*/, '');
                sections.push(currentSection);
                continue;
            }
            
            // Detect list items
            if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.match(/^\d+\./)) {
                const text = trimmed.replace(/^[-*\d.]\s*/, '');
                const type = text.toLowerCase().includes('fix') || text.toLowerCase().includes('bug') ? 'fix' :
                            text.toLowerCase().includes('neu') || text.toLowerCase().includes('feature') ? 'feature' :
                            text.toLowerCase().includes('verbesser') || text.toLowerCase().includes('improve') ? 'improvement' : 'other';
                
                items.push({
                    type,
                    text,
                    section: currentSection
                });
            }
        }
        
        return { sections, items };
    };

    const sendProgress = (progress) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('updater:progress', Math.min(100, Math.max(0, progress)));
        }
    };

    // ============================================
    // UPDATE CHECK
    // ============================================
    
    ipcMain.handle('updater:check', async () => {
        try {
            const currentVersion = getCurrentVersion().replace(/^v/, '');
            console.log(`[Updater] Checking for updates... (Current: ${currentVersion})`);

            const response = await axios.get(GITHUB_API, {
                headers: { 
                    'User-Agent': 'VoidrixClient-Updater/1.0',
                    'Accept': 'application/vnd.github.v3+json'
                },
                timeout: 15000
            });

            const release = response.data;
            const latestVersion = release.tag_name.replace(/^v/, '');
            const needsUpdate = compareVersions(currentVersion, latestVersion) === 1;

            let asset = null;
            if (needsUpdate) {
                asset = detectPlatformAsset(release.assets, process.platform, process.arch);
            }

            const changelog = parseChangelog(release.body);

            return {
                success: true,
                currentVersion,
                latestVersion,
                needsUpdate,
                major: latestVersion.split('.')[0] !== currentVersion.split('.')[0],
                releaseNotes: release.body,
                releaseDate: release.published_at,
                releaseName: release.name,
                prerelease: release.prerelease,
                changelog,
                asset: asset ? {
                    name: asset.name,
                    size: asset.size,
                    sizeFormatted: formatBytes(asset.size),
                    url: asset.browser_download_url,
                    downloads: asset.download_count,
                    contentType: asset.content_type
                } : null
            };
        } catch (error) {
            console.error('[Updater] Check failed:', error.message);
            
            // Handle rate limiting
            if (error.response?.status === 403) {
                return { 
                    success: false, 
                    error: 'GitHub API rate limit exceeded. Please try again later.',
                    rateLimited: true
                };
            }
            
            return { 
                success: false, 
                error: error.message,
                offline: error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED'
            };
        }
    });

    // ============================================
    // GET ALL RELEASES
    // ============================================
    
    ipcMain.handle('updater:releases', async (_, limit = 10) => {
        try {
            const response = await axios.get(ALL_RELEASES_API, {
                headers: { 
                    'User-Agent': 'VoidrixClient-Updater/1.0',
                    'Accept': 'application/vnd.github.v3+json'
                },
                params: { per_page: limit },
                timeout: 15000
            });

            const currentVersion = getCurrentVersion().replace(/^v/, '');

            const releases = response.data.map(release => {
                const version = release.tag_name.replace(/^v/, '');
                const asset = detectPlatformAsset(release.assets, process.platform, process.arch);
                
                return {
                    version,
                    name: release.name,
                    publishedAt: release.published_at,
                    prerelease: release.prerelease,
                    draft: release.draft,
                    body: release.body,
                    isNewer: compareVersions(currentVersion, version) === 1,
                    isCurrent: version === currentVersion,
                    asset: asset ? {
                        name: asset.name,
                        size: asset.size,
                        sizeFormatted: formatBytes(asset.size),
                        downloadCount: asset.download_count,
                        url: asset.browser_download_url
                    } : null
                };
            });

            return { success: true, releases };
        } catch (error) {
            console.error('[Updater] Failed to fetch releases:', error.message);
            return { 
                success: false, 
                error: error.message,
                offline: error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED'
            };
        }
    });

    // ============================================
    // DOWNLOAD UPDATE
    // ============================================
    
    ipcMain.handle('updater:download', async (_, assetUrl, assetName) => {
        if (isDownloading) {
            return { success: false, error: 'Download already in progress' };
        }
        
        isDownloading = true;
        
        try {
            const downloadDir = path.join(app.getPath('userData'), 'updates');
            await fs.ensureDir(downloadDir);
            
            const timestamp = Date.now();
            const ext = path.extname(assetName);
            const baseName = path.basename(assetName, ext);
            const targetName = `${baseName}_${timestamp}${ext}`;
            const targetPath = path.join(downloadDir, targetName);

            console.log(`[Updater] Downloading to ${targetPath}...`);
            sendProgress(0);

            const response = await axios({
                url: assetUrl,
                method: 'GET',
                responseType: 'stream',
                timeout: 300000, // 5 minutes
                headers: {
                    'User-Agent': 'VoidrixClient-Updater/1.0'
                }
            });

            const totalLength = parseInt(response.headers['content-length'], 10);
            let downloadedLength = 0;
            let lastProgress = 0;

            const writer = fs.createWriteStream(targetPath);
            
            response.data.on('data', (chunk) => {
                downloadedLength += chunk.length;
                if (totalLength) {
                    const progress = (downloadedLength / totalLength) * 100;
                    if (Math.floor(progress) > lastProgress) {
                        lastProgress = Math.floor(progress);
                        sendProgress(progress);
                    }
                }
            });

            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
                response.data.on('error', reject);
            });

            // Verify download
            const stats = await fs.stat(targetPath);
            if (totalLength && stats.size !== totalLength) {
                await fs.remove(targetPath);
                throw new Error('Download incomplete - file size mismatch');
            }

            console.log(`[Updater] Download complete: ${targetPath}`);
            sendProgress(100);
            
            return { 
                success: true, 
                path: targetPath, 
                size: stats.size, 
                sizeFormatted: formatBytes(stats.size) 
            };
        } catch (error) {
            console.error('[Updater] Download failed:', error.message);
            sendProgress(0);
            return { success: false, error: error.message };
        } finally {
            isDownloading = false;
        }
    });

    // ============================================
    // CANCEL DOWNLOAD
    // ============================================
    
    ipcMain.handle('updater:cancel-download', async () => {
        // Implementation depends on how you track the download request
        isDownloading = false;
        return { success: true };
    });

    // ============================================
    // INSTALL UPDATE
    // ============================================
    
    ipcMain.handle('updater:install', async (_, filePath) => {
        if (isInstalling) {
            return { success: false, error: 'Installation already in progress' };
        }
        
        isInstalling = true;
        
        try {
            console.log(`[Updater] Installing from ${filePath}...`);

            if (!await fs.pathExists(filePath)) {
                return { success: false, error: 'Update file not found' };
            }

            const result = await installUpdateByPlatform(filePath);
            
            if (result.success) {
                // Schedule quit
                setTimeout(() => {
                    app.quit();
                }, 1000);
            }
            
            return result;
        } catch (error) {
            console.error('[Updater] Install failed:', error.message);
            return { success: false, error: error.message };
        } finally {
            isInstalling = false;
        }
    });

    // ============================================
    // PLATFORM-SPECIFIC INSTALLATION
    // ============================================
    
    async function installUpdateByPlatform(filePath) {
        const platform = process.platform;
        
        if (platform === 'win32') {
            return installWindows(filePath);
        } else if (platform === 'linux') {
            return installLinux(filePath);
        } else if (platform === 'darwin') {
            return installMacOS(filePath);
        }
        
        return { success: false, error: `Unsupported platform: ${platform}` };
    }

    async function installWindows(filePath) {
        try {
            if (filePath.endsWith('.exe')) {
                const installDir = path.dirname(process.execPath);
                
                // Create VBS script for silent installation
                const vbsPath = path.join(path.dirname(filePath), 'update.vbs');
                const vbsContent = `Set objShell = WScript.CreateObject("WScript.Shell")
WScript.Sleep 2000
On Error Resume Next
objShell.Run """" & WScript.Arguments(0) & """ /S /D=" & Chr(34) & WScript.Arguments(1) & Chr(34), 0, True
WScript.Sleep 1000
objShell.Run """" & WScript.Arguments(2) & """", 1, False
WScript.Quit`;

                await fs.writeFile(vbsPath, vbsContent);
                
                spawn('wscript.exe', [vbsPath, filePath, installDir, process.execPath], { 
                    detached: true, 
                    stdio: 'ignore', 
                    windowsHide: true 
                }).unref();
                
                return { success: true, silent: true };
            }
            
            return { success: false, error: 'Invalid installer format' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async function installLinux(filePath) {
        try {
            if (filePath.endsWith('.AppImage')) {
                await fs.chmod(filePath, 0o755);
                
                const scriptPath = path.join(path.dirname(filePath), 'run-update.sh');
                const scriptContent = `#!/bin/bash
sleep 2
"${filePath}" --appimage-extract-and-run &
disown`;
                
                await fs.writeFile(scriptPath, scriptContent);
                await fs.chmod(scriptPath, 0o755);
                
                spawn(scriptPath, [], { 
                    detached: true, 
                    stdio: 'ignore' 
                }).unref();
                
                return { success: true };
            } else if (filePath.endsWith('.deb')) {
                // Open folder for manual installation
                shell.openPath(path.dirname(filePath));
                return { success: true, manual: true, message: 'Please install the .deb package manually' };
            }
            
            return { success: false, error: 'Unsupported installer format' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async function installMacOS(filePath) {
        try {
            if (filePath.endsWith('.dmg')) {
                const scriptPath = path.join(path.dirname(filePath), 'install.sh');
                const appName = 'VoidrixClient.app';
                const volumeName = path.basename(filePath, '.dmg');
                
                const scriptContent = `#!/bin/bash
sleep 2
echo "Mounting DMG..."
hdiutil attach "${filePath}" -nobrowse -quiet
sleep 3
echo "Copying application..."
cp -R "/Volumes/${volumeName}/${appName}" "/Applications/" 2>/dev/null || cp -R "/Volumes/${volumeName}/*.app" "/Applications/" 2>/dev/null
sleep 2
echo "Unmounting DMG..."
hdiutil detach "/Volumes/${volumeName}" -quiet
sleep 1
echo "Launching application..."
open "/Applications/${appName}" 2>/dev/null || open "/Applications/"*.app 2>/dev/null`;

                await fs.writeFile(scriptPath, scriptContent);
                await fs.chmod(scriptPath, 0o755);
                
                spawn(scriptPath, [], { 
                    detached: true, 
                    stdio: 'ignore' 
                }).unref();
                
                return { success: true };
            } else if (filePath.endsWith('.zip')) {
                // Extract and replace
                const extractDir = path.join(path.dirname(filePath), 'extracted');
                // Would need extraction logic here
                return { success: false, error: 'ZIP extraction not implemented' };
            }
            
            return { success: false, error: 'Unsupported installer format' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // VERSION OVERRIDE
    // ============================================
    
    ipcMain.handle('updater:set-test-version', (_, version) => {
        console.log(`[Updater] Test version override: ${version}`);
        testVersionOverride = version;
        return { success: true, currentVersion: version };
    });

    ipcMain.handle('updater:clear-test-version', () => {
        console.log('[Updater] Clearing test version override');
        testVersionOverride = null;
        return { success: true, currentVersion: pkg.version };
    });

    // ============================================
    // AUTO UPDATE CONTROL
    // ============================================
    
    ipcMain.handle('updater:set-auto-update', (_, enabled) => {
        autoUpdateEnabled = enabled;
        console.log(`[Updater] Auto-update ${enabled ? 'enabled' : 'disabled'}`);
        
        if (enabled) {
            startAutoUpdateCheck();
        } else {
            stopAutoUpdateCheck();
        }
        
        return { success: true };
    });

    ipcMain.handle('updater:get-auto-update', () => {
        return autoUpdateEnabled;
    });

    // ============================================
    // STATUS
    // ============================================
    
    ipcMain.handle('updater:status', async () => {
        const updatesDir = path.join(app.getPath('userData'), 'updates');
        let downloadedUpdates = [];
        
        try {
            if (await fs.pathExists(updatesDir)) {
                const files = await fs.readdir(updatesDir);
                downloadedUpdates = files.filter(f => 
                    f.endsWith('.exe') || f.endsWith('.AppImage') || f.endsWith('.dmg')
                );
            }
        } catch (e) {
            // Ignore
        }

        return {
            currentVersion: getCurrentVersion(),
            autoUpdateEnabled,
            lastCheck: lastCheckTime,
            isDownloading,
            isInstalling,
            platform: process.platform,
            arch: process.arch,
            appPath: app.getAppPath(),
            userDataPath: app.getPath('userData'),
            downloadedUpdates: downloadedUpdates.length
        };
    });

    // ============================================
    // AUTO UPDATE CHECK
    // ============================================
    
    async function runAutoUpdate(notifyIfAvailable = true) {
        if (!autoUpdateEnabled) return null;
        
        console.log('[Updater] Running automatic update check...');
        lastCheckTime = Date.now();
        
        try {
            const response = await axios.get(GITHUB_API, {
                headers: { 
                    'User-Agent': 'VoidrixClient-Updater/1.0',
                    'Accept': 'application/vnd.github.v3+json'
                },
                timeout: 15000
            });

            const release = response.data;
            const latestVersion = release.tag_name.replace(/^v/, '');
            const currentVersion = getCurrentVersion().replace(/^v/, '');
            
            if (compareVersions(currentVersion, latestVersion) === 1) {
                const asset = detectPlatformAsset(release.assets, process.platform, process.arch);
                
                if (asset) {
                    const updateInfo = {
                        version: latestVersion,
                        currentVersion,
                        releaseDate: release.published_at,
                        releaseNotes: release.body,
                        asset: {
                            name: asset.name,
                            size: asset.size,
                            sizeFormatted: formatBytes(asset.size),
                            url: asset.browser_download_url
                        }
                    };
                    
                    console.log(`[Updater] New version available: ${latestVersion}`);
                    
                    if (notifyIfAvailable && mainWindow && !mainWindow.isDestroyed()) {
                        mainWindow.webContents.send('updater:available', updateInfo);
                    }
                    
                    return updateInfo;
                }
            }
            
            console.log('[Updater] No update available');
            return null;
        } catch (error) {
            console.error('[Updater] Auto-check failed:', error.message);
            return null;
        }
    }

    function startAutoUpdateCheck() {
        stopAutoUpdateCheck();
        
        updateCheckInterval = setInterval(() => runAutoUpdate(true), UPDATE_CHECK_INTERVAL);
        
        // Initial check after 3 seconds
        setTimeout(() => runAutoUpdate(true), 3000);
    }

    function stopAutoUpdateCheck() {
        if (updateCheckInterval) {
            clearInterval(updateCheckInterval);
            updateCheckInterval = null;
        }
    }

    // ============================================
    // CLEANUP
    // ============================================
    
    async function cleanupOldUpdates() {
        try {
            const updatesDir = path.join(app.getPath('userData'), 'updates');
            if (!await fs.pathExists(updatesDir)) return;
            
            const files = await fs.readdir(updatesDir);
            const now = Date.now();
            let cleaned = 0;
            
            for (const file of files) {
                const filePath = path.join(updatesDir, file);
                const stats = await fs.stat(filePath);
                
                if (now - stats.mtimeMs > CLEANUP_AGE) {
                    await fs.remove(filePath);
                    cleaned++;
                }
            }
            
            if (cleaned > 0) {
                console.log(`[Updater] Cleaned ${cleaned} old update file(s)`);
            }
        } catch (error) {
            console.error('[Updater] Cleanup failed:', error.message);
        }
    }

    // ============================================
    // MANUAL CHECK (FOR UI)
    // ============================================
    
    ipcMain.handle('updater:check-now', async () => {
        const result = await runAutoUpdate(false);
        
        if (result) {
            mainWindow.webContents.send('updater:available', result);
        }
        
        return { 
            success: true, 
            updateAvailable: !!result,
            updateInfo: result
        };
    });

    // ============================================
    // INITIALIZATION
    // ============================================
    
    async function init() {
        await cleanupOldUpdates();
        startAutoUpdateCheck();
        console.log(`[Updater] Initialized - Version ${getCurrentVersion()}`);
    }

    // Handle app quit
    app.on('will-quit', () => {
        stopAutoUpdateCheck();
    });

    // Run initialization
    init();

    return {
        runAutoUpdate,
        stopAutoUpdateCheck,
        startAutoUpdateCheck,
        getCurrentVersion
    };
};