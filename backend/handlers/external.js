const { shell } = require('electron');
const fs = require('fs-extra');
const { spawn, exec } = require('child_process');
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const execPromise = promisify(exec);

module.exports = (ipcMain) => {

    // ==================== OPEN EXTERNAL URL ====================
    ipcMain.handle('open-external', async (_event, url) => {
        try {
            if (!url || typeof url !== 'string') {
                return { success: false, error: 'Invalid URL' };
            }
            
            // URL validieren
            const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
            if (!urlPattern.test(url) && !url.startsWith('http')) {
                return { success: false, error: 'Invalid URL format' };
            }
            
            await shell.openExternal(url);
            console.log(`[External] Opened URL: ${url}`);
            return { success: true };
        } catch (error) {
            console.error('[External] Error opening URL:', error);
            return { success: false, error: error.message };
        }
    });

    // ==================== OPEN EXTERNAL FILE ====================
    ipcMain.handle('external:open-file', async (_event, filePath) => {
        try {
            if (!filePath || typeof filePath !== 'string') {
                return { success: false, error: 'Invalid path' };
            }

            const normalizedPath = path.resolve(filePath);
            const exists = await fs.pathExists(normalizedPath);
            if (!exists) {
                return { success: false, error: 'File does not exist' };
            }

            await shell.openPath(normalizedPath);
            console.log(`[External] Opened file: ${normalizedPath}`);
            return { success: true };
        } catch (error) {
            console.error('[External] Error opening file:', error);
            return { success: false, error: error.message };
        }
    });

    // ==================== OPEN EXTERNAL FOLDER ====================
    ipcMain.handle('external:open-folder', async (_event, folderPath) => {
        try {
            if (!folderPath || typeof folderPath !== 'string') {
                return { success: false, error: 'Invalid path' };
            }

            const normalizedPath = path.resolve(folderPath);
            const exists = await fs.pathExists(normalizedPath);
            if (!exists) {
                return { success: false, error: 'Folder does not exist' };
            }

            await shell.openPath(normalizedPath);
            console.log(`[External] Opened folder: ${normalizedPath}`);
            return { success: true };
        } catch (error) {
            console.error('[External] Error opening folder:', error);
            return { success: false, error: error.message };
        }
    });

    // ==================== RUN EXECUTABLE FILE ====================
    ipcMain.handle('external:run-file', async (_event, filePath, args = []) => {
        try {
            if (!filePath || typeof filePath !== 'string') {
                return { success: false, error: 'Invalid path' };
            }

            const normalizedPath = path.resolve(filePath);
            const exists = await fs.pathExists(normalizedPath);
            if (!exists) {
                return { success: false, error: 'File does not exist' };
            }

            // Prüfe ob ausführbar
            const stats = await fs.stat(normalizedPath);
            if (process.platform !== 'win32' && !(stats.mode & 0o111)) {
                // Auf Unix-Systemen ausführbar machen
                await fs.chmod(normalizedPath, 0o755);
            }

            const child = spawn(normalizedPath, args, {
                detached: true,
                shell: true,
                windowsHide: false,
                stdio: 'ignore',
                cwd: path.dirname(normalizedPath)
            });
            child.unref();

            console.log(`[External] Running file: ${normalizedPath} with args: ${args.join(' ')}`);
            return { success: true, pid: child.pid };
        } catch (error) {
            console.error('[External] Error running file:', error);
            return { success: false, error: error.message };
        }
    });

    // ==================== RUN COMMAND ====================
    ipcMain.handle('external:run-command', async (_event, command, options = {}) => {
        try {
            if (!command || typeof command !== 'string') {
                return { success: false, error: 'Invalid command' };
            }

            const result = await execPromise(command, {
                cwd: options.cwd || os.homedir(),
                timeout: options.timeout || 30000,
                maxBuffer: options.maxBuffer || 1024 * 1024 * 10,
                env: { ...process.env, ...options.env }
            });

            console.log(`[External] Executed command: ${command}`);
            return { 
                success: true, 
                stdout: result.stdout,
                stderr: result.stderr
            };
        } catch (error) {
            console.error('[External] Error running command:', error);
            return { 
                success: false, 
                error: error.message,
                stdout: error.stdout,
                stderr: error.stderr
            };
        }
    });

    // ==================== CHECK IF PATH EXISTS ====================
    ipcMain.handle('external:path-exists', async (_event, filePath) => {
        try {
            const exists = await fs.pathExists(filePath);
            return { success: true, exists };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // ==================== GET FILE INFO ====================
    ipcMain.handle('external:get-file-info', async (_event, filePath) => {
        try {
            const normalizedPath = path.resolve(filePath);
            const exists = await fs.pathExists(normalizedPath);
            if (!exists) {
                return { success: false, error: 'File does not exist' };
            }

            const stats = await fs.stat(normalizedPath);
            return {
                success: true,
                info: {
                    path: normalizedPath,
                    name: path.basename(normalizedPath),
                    dir: path.dirname(normalizedPath),
                    ext: path.extname(normalizedPath),
                    size: stats.size,
                    created: stats.birthtime,
                    modified: stats.mtime,
                    accessed: stats.atime,
                    isFile: stats.isFile(),
                    isDirectory: stats.isDirectory(),
                    permissions: stats.mode
                }
            };
        } catch (error) {
            console.error('[External] Error getting file info:', error);
            return { success: false, error: error.message };
        }
    });

    // ==================== LIST DIRECTORY ====================
    ipcMain.handle('external:list-directory', async (_event, dirPath, options = {}) => {
        try {
            const normalizedPath = path.resolve(dirPath);
            const exists = await fs.pathExists(normalizedPath);
            if (!exists) {
                return { success: false, error: 'Directory does not exist' };
            }

            const stats = await fs.stat(normalizedPath);
            if (!stats.isDirectory()) {
                return { success: false, error: 'Path is not a directory' };
            }

            const files = await fs.readdir(normalizedPath);
            const fileInfos = await Promise.all(
                files.map(async (file) => {
                    const filePath = path.join(normalizedPath, file);
                    try {
                        const fileStats = await fs.stat(filePath);
                        return {
                            name: file,
                            path: filePath,
                            size: fileStats.size,
                            isDirectory: fileStats.isDirectory(),
                            modified: fileStats.mtime,
                            created: fileStats.birthtime
                        };
                    } catch (e) {
                        return { name: file, path: filePath, error: e.message };
                    }
                })
            );

            // Sortiere nach Typ (Ordner zuerst) und dann nach Name
            fileInfos.sort((a, b) => {
                if (a.isDirectory && !b.isDirectory) return -1;
                if (!a.isDirectory && b.isDirectory) return 1;
                return a.name.localeCompare(b.name);
            });

            return { success: true, files: fileInfos };
        } catch (error) {
            console.error('[External] Error listing directory:', error);
            return { success: false, error: error.message };
        }
    });

    // ==================== CREATE DIRECTORY ====================
    ipcMain.handle('external:create-directory', async (_event, dirPath) => {
        try {
            const normalizedPath = path.resolve(dirPath);
            await fs.ensureDir(normalizedPath);
            console.log(`[External] Created directory: ${normalizedPath}`);
            return { success: true, path: normalizedPath };
        } catch (error) {
            console.error('[External] Error creating directory:', error);
            return { success: false, error: error.message };
        }
    });

    // ==================== COPY FILE ====================
    ipcMain.handle('external:copy-file', async (_event, sourcePath, destPath, options = {}) => {
        try {
            const normalizedSource = path.resolve(sourcePath);
            const normalizedDest = path.resolve(destPath);
            
            const exists = await fs.pathExists(normalizedSource);
            if (!exists) {
                return { success: false, error: 'Source file does not exist' };
            }

            await fs.copy(normalizedSource, normalizedDest, {
                overwrite: options.overwrite !== false,
                errorOnExist: options.errorOnExist || false
            });
            
            console.log(`[External] Copied: ${normalizedSource} -> ${normalizedDest}`);
            return { success: true };
        } catch (error) {
            console.error('[External] Error copying file:', error);
            return { success: false, error: error.message };
        }
    });

    // ==================== MOVE FILE ====================
    ipcMain.handle('external:move-file', async (_event, sourcePath, destPath, options = {}) => {
        try {
            const normalizedSource = path.resolve(sourcePath);
            const normalizedDest = path.resolve(destPath);
            
            const exists = await fs.pathExists(normalizedSource);
            if (!exists) {
                return { success: false, error: 'Source file does not exist' };
            }

            await fs.move(normalizedSource, normalizedDest, {
                overwrite: options.overwrite !== false
            });
            
            console.log(`[External] Moved: ${normalizedSource} -> ${normalizedDest}`);
            return { success: true };
        } catch (error) {
            console.error('[External] Error moving file:', error);
            return { success: false, error: error.message };
        }
    });

    // ==================== DELETE FILE ====================
    ipcMain.handle('external:delete-file', async (_event, filePath) => {
        try {
            const normalizedPath = path.resolve(filePath);
            const exists = await fs.pathExists(normalizedPath);
            if (!exists) {
                return { success: false, error: 'File does not exist' };
            }

            await fs.remove(normalizedPath);
            console.log(`[External] Deleted: ${normalizedPath}`);
            return { success: true };
        } catch (error) {
            console.error('[External] Error deleting file:', error);
            return { success: false, error: error.message };
        }
    });

    // ==================== GET SYSTEM INFO ====================
    ipcMain.handle('external:get-system-info', async () => {
        try {
            const cpus = os.cpus();
            const totalMemory = os.totalmem();
            const freeMemory = os.freemem();
            const usedMemory = totalMemory - freeMemory;
            
            return {
                success: true,
                info: {
                    platform: os.platform(),
                    arch: os.arch(),
                    release: os.release(),
                    hostname: os.hostname(),
                    cpus: {
                        count: cpus.length,
                        model: cpus[0]?.model || 'Unknown',
                        speed: cpus[0]?.speed || 0
                    },
                    memory: {
                        total: totalMemory,
                        free: freeMemory,
                        used: usedMemory,
                        totalGB: (totalMemory / 1024 / 1024 / 1024).toFixed(2),
                        freeGB: (freeMemory / 1024 / 1024 / 1024).toFixed(2),
                        usedGB: (usedMemory / 1024 / 1024 / 1024).toFixed(2),
                        usagePercent: ((usedMemory / totalMemory) * 100).toFixed(1)
                    },
                    uptime: os.uptime(),
                    userInfo: os.userInfo(),
                    homedir: os.homedir(),
                    tmpdir: os.tmpdir(),
                    networkInterfaces: Object.keys(os.networkInterfaces())
                }
            };
        } catch (error) {
            console.error('[External] Error getting system info:', error);
            return { success: false, error: error.message };
        }
    });

    // ==================== GET ENVIRONMENT VARIABLES ====================
    ipcMain.handle('external:get-env', async (_event, key) => {
        try {
            if (key) {
                return { success: true, value: process.env[key] };
            }
            return { success: true, env: process.env };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // ==================== GET APP PATHS ====================
    ipcMain.handle('external:get-app-paths', async () => {
        try {
            const { app } = require('electron');
            return {
                success: true,
                paths: {
                    userData: app.getPath('userData'),
                    appData: app.getPath('appData'),
                    desktop: app.getPath('desktop'),
                    documents: app.getPath('documents'),
                    downloads: app.getPath('downloads'),
                    music: app.getPath('music'),
                    pictures: app.getPath('pictures'),
                    videos: app.getPath('videos'),
                    temp: app.getPath('temp'),
                    home: app.getPath('home'),
                    exe: app.getPath('exe'),
                    module: app.getPath('module')
                }
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // ==================== OPEN WITH DEFAULT APP ====================
    ipcMain.handle('external:open-with-default', async (_event, filePath) => {
        try {
            const normalizedPath = path.resolve(filePath);
            const exists = await fs.pathExists(normalizedPath);
            if (!exists) {
                return { success: false, error: 'File does not exist' };
            }

            await shell.openPath(normalizedPath);
            return { success: true };
        } catch (error) {
            console.error('[External] Error opening with default app:', error);
            return { success: false, error: error.message };
        }
    });

    // ==================== REVEAL IN FILE EXPLORER ====================
    ipcMain.handle('external:reveal-in-folder', async (_event, filePath) => {
        try {
            const normalizedPath = path.resolve(filePath);
            const exists = await fs.pathExists(normalizedPath);
            if (!exists) {
                return { success: false, error: 'File does not exist' };
            }

            await shell.showItemInFolder(normalizedPath);
            return { success: true };
        } catch (error) {
            console.error('[External] Error revealing in folder:', error);
            return { success: false, error: error.message };
        }
    });

    // ==================== BEEP ====================
    ipcMain.handle('external:beep', async () => {
        try {
            // System-BEEP
            if (process.platform === 'win32') {
                const beep = spawn('powershell', ['-c', '[System.Console]::Beep(800, 200)']);
                beep.unref();
            } else {
                const beep = spawn('echo', ['-e', '\a'], { shell: true });
                beep.unref();
            }
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
};