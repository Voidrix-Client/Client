const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
const unzipper = require('unzipper');
const { app } = require('electron');
const { resolvePrimaryInstancesDir, resolveInstanceDirByName } = require('./utils/instances-path');

class BackupManager {
    constructor() {
        this.backupsDir = path.join(app.getPath('userData'), 'backups');
        this.instancesDir = resolvePrimaryInstancesDir();
        this.intervals = new Map();
        this.activeBackups = new Map();
        this.backupQueue = new Map();
    }

    async init(ipcMain) {
        await fs.ensureDir(this.backupsDir);
        console.log('[VoidrixBackup] Initialized at:', this.backupsDir);

        if (ipcMain) {
            ipcMain.handle('backup:manual', async (_, instanceName) => {
                return await this.createBackup(instanceName);
            });

            ipcMain.handle('backup:list', async (_, instanceName) => {
                return await this.listBackups(instanceName);
            });

            ipcMain.handle('backup:restore', async (_, instanceName, backupName) => {
                return await this.restoreBackup(instanceName, backupName);
            });

            ipcMain.handle('backup:delete', async (_, instanceName, backupName) => {
                return await this.deleteBackup(instanceName, backupName);
            });

            ipcMain.handle('backup:schedule', async (_, instanceName, intervalMinutes) => {
                return await this.startScheduler(instanceName, intervalMinutes);
            });

            ipcMain.handle('backup:stop-schedule', async (_, instanceName) => {
                return this.stopScheduler(instanceName);
            });

            ipcMain.handle('backup:get-schedules', async () => {
                return this.getSchedules();
            });

            ipcMain.handle('backup:get-size', async (_, instanceName) => {
                return await this.getBackupSize(instanceName);
            });

            ipcMain.handle('backup:export', async (_, instanceName, backupName, exportPath) => {
                return await this.exportBackup(instanceName, backupName, exportPath);
            });

            ipcMain.handle('backup:import', async (_, importPath, instanceName) => {
                return await this.importBackup(importPath, instanceName);
            });

            console.log('[VoidrixBackup] IPC handlers registered.');
        }
    }

    async createBackup(instanceName, options = {}) {
        this.instancesDir = resolvePrimaryInstancesDir();
        const instanceDir = resolveInstanceDirByName(instanceName) || path.join(this.instancesDir, instanceName);
        const savesDir = path.join(instanceDir, 'saves');
        const worldsDir = path.join(instanceDir, 'worlds');
        const configDir = path.join(instanceDir, 'config');
        const modsDir = path.join(instanceDir, 'mods');
        
        if (this.activeBackups.has(instanceName)) {
            return { success: false, error: 'Backup already in progress' };
        }

        const hasSaves = await fs.pathExists(savesDir);
        const hasWorlds = await fs.pathExists(worldsDir);
        
        if (!hasSaves && !hasWorlds && !options.includeEmpty) {
            console.log(`[VoidrixBackup] No saves/worlds found for ${instanceName}, skipping backup.`);
            return { success: false, error: 'No saves or worlds found' };
        }

        this.activeBackups.set(instanceName, true);
        
        try {
            const instanceBackupsDir = path.join(this.backupsDir, instanceName);
            await fs.ensureDir(instanceBackupsDir);
            
            const timestamp = new Date().toISOString().replace(/T/, '_').replace(/:/g, '-').slice(0, 19);
            const fileName = `${instanceName}_${timestamp}.zip`;
            const filePath = path.join(instanceBackupsDir, fileName);

            return new Promise((resolve, reject) => {
                const output = fs.createWriteStream(filePath);
                const archive = archiver('zip', { zlib: { level: 9 } });
                
                let progress = 0;
                let totalFiles = 0;
                
                output.on('error', (err) => {
                    console.error('[VoidrixBackup] WriteStream error:', err);
                    this.activeBackups.delete(instanceName);
                    reject(err);
                });

                output.on('close', async () => {
                    const size = archive.pointer();
                    console.log(`[VoidrixBackup] Backup created: ${fileName} (${(size / 1024 / 1024).toFixed(2)} MB)`);
                    
                    try {
                        const configPath = path.join(instanceDir, 'instance.json');
                        if (await fs.pathExists(configPath)) {
                            const config = await fs.readJson(configPath);
                            config.lastBackup = Date.now();
                            config.lastBackupSize = size;
                            config.lastBackupName = fileName;
                            await fs.writeJson(configPath, config, { spaces: 4 });
                        }
                    } catch (e) {
                        console.error('[VoidrixBackup] Failed to update instance lastBackup:', e);
                    }

                    await this.cleanupBackups(instanceName);
                    await this.triggerCloudUpload(instanceName, filePath);
                    
                    this.activeBackups.delete(instanceName);
                    
                    if (this.backupQueue.has(instanceName)) {
                        const next = this.backupQueue.get(instanceName);
                        this.backupQueue.delete(instanceName);
                        setTimeout(() => this.createBackup(next.instanceName, next.options), 1000);
                    }
                    
                    resolve({ 
                        success: true, 
                        path: filePath, 
                        name: fileName, 
                        size: size,
                        sizeFormatted: this.formatSize(size),
                        timestamp: Date.now()
                    });
                });

                archive.on('error', (err) => {
                    console.error('[VoidrixBackup] Archiver error:', err);
                    this.activeBackups.delete(instanceName);
                    reject(err);
                });

                archive.on('progress', (progressData) => {
                    if (progressData.files && progressData.files.processed !== totalFiles) {
                        totalFiles = progressData.files.processed;
                        const percent = (progressData.files.processed / (progressData.files.total || 1)) * 100;
                        if (Math.floor(percent) > progress) {
                            progress = Math.floor(percent);
                            app.emit('backup:progress', { instanceName, progress });
                        }
                    }
                });

                archive.pipe(output);
                
                const addDirIfExists = async (dir, name) => {
                    if (await fs.pathExists(dir)) {
                        archive.directory(dir, name);
                    }
                };
                
                addDirIfExists(savesDir, 'saves');
                addDirIfExists(worldsDir, 'worlds');
                
                if (options.includeConfig) {
                    addDirIfExists(configDir, 'config');
                }
                
                if (options.includeMods) {
                    addDirIfExists(modsDir, 'mods');
                }
                
                const instanceInfo = {
                    name: instanceName,
                    version: options.version || 'unknown',
                    backupDate: new Date().toISOString(),
                    launcherVersion: app.getVersion()
                };
                archive.append(JSON.stringify(instanceInfo, null, 2), { name: 'instance-info.json' });
                
                archive.finalize();
            });
        } catch (error) {
            this.activeBackups.delete(instanceName);
            throw error;
        }
    }

    async triggerCloudUpload(instanceName, filePath) {
        try {
            const settingsPath = path.join(app.getPath('userData'), 'settings.json');
            if (await fs.pathExists(settingsPath)) {
                const settings = await fs.readJson(settingsPath);
                if (settings.cloudBackupSettings?.enabled && settings.cloudBackupSettings?.provider) {
                    console.log(`[VoidrixBackup] Triggering cloud upload for ${instanceName}`);
                    app.emit('backup:created', { 
                        providerId: settings.cloudBackupSettings.provider, 
                        filePath, 
                        instanceName 
                    });
                }
            }
        } catch (e) {
            console.error('[VoidrixBackup] Cloud upload trigger failed:', e);
        }
    }

    async listBackups(instanceName) {
        const instanceBackupsDir = path.join(this.backupsDir, instanceName);
        if (!(await fs.pathExists(instanceBackupsDir))) {
            return { success: true, backups: [] };
        }

        const files = await fs.readdir(instanceBackupsDir);
        const backups = [];
        
        for (const file of files.filter(f => f.endsWith('.zip'))) {
            const filePath = path.join(instanceBackupsDir, file);
            const stats = await fs.stat(filePath);
            
            let backupDate = stats.mtime;
            try {
                const dateMatch = file.match(/\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}/);
                if (dateMatch) {
                    backupDate = new Date(dateMatch[0].replace(/_/g, ' ').replace(/-/g, '/'));
                }
            } catch (e) {}
            
            backups.push({
                name: file,
                path: filePath,
                size: stats.size,
                sizeFormatted: this.formatSize(stats.size),
                created: stats.birthtime,
                modified: stats.mtime,
                backupDate: backupDate,
                isCorrupted: false
            });
        }
        
        backups.sort((a, b) => b.modified.getTime() - a.modified.getTime());
        
        return { success: true, backups };
    }

    async restoreBackup(instanceName, backupName) {
        const instanceBackupsDir = path.join(this.backupsDir, instanceName);
        const backupPath = path.join(instanceBackupsDir, backupName);
        
        if (!(await fs.pathExists(backupPath))) {
            return { success: false, error: 'Backup file not found' };
        }
        
        const instanceDir = resolveInstanceDirByName(instanceName) || path.join(this.instancesDir, instanceName);
        const savesDir = path.join(instanceDir, 'saves');
        const worldsDir = path.join(instanceDir, 'worlds');
        
        const preRestoreBackup = await this.createBackup(`${instanceName}_prerestore`);
        
        try {
            if (await fs.pathExists(savesDir)) {
                await fs.remove(savesDir);
            }
            if (await fs.pathExists(worldsDir)) {
                await fs.remove(worldsDir);
            }
            
            await fs.createReadStream(backupPath)
                .pipe(unzipper.Extract({ path: instanceDir }))
                .promise();
            
            console.log(`[VoidrixBackup] Restored backup: ${backupName} to ${instanceName}`);
            
            try {
                const configPath = path.join(instanceDir, 'instance.json');
                if (await fs.pathExists(configPath)) {
                    const config = await fs.readJson(configPath);
                    config.lastRestore = Date.now();
                    config.lastRestoreBackup = backupName;
                    await fs.writeJson(configPath, config, { spaces: 4 });
                }
            } catch (e) {
                console.error('[VoidrixBackup] Failed to update instance restore info:', e);
            }
            
            return { 
                success: true, 
                backupName,
                preRestoreBackup: preRestoreBackup.success ? preRestoreBackup.name : null
            };
        } catch (error) {
            console.error('[VoidrixBackup] Restore failed:', error);
            
            if (preRestoreBackup.success) {
                console.log('[VoidrixBackup] Attempting to restore pre-restore backup...');
                await this.restoreBackup(instanceName, preRestoreBackup.name);
            }
            
            return { success: false, error: error.message };
        }
    }

    async deleteBackup(instanceName, backupName) {
        const instanceBackupsDir = path.join(this.backupsDir, instanceName);
        const backupPath = path.join(instanceBackupsDir, backupName);
        
        if (!(await fs.pathExists(backupPath))) {
            return { success: false, error: 'Backup file not found' };
        }
        
        try {
            await fs.remove(backupPath);
            console.log(`[VoidrixBackup] Deleted backup: ${backupName}`);
            return { success: true };
        } catch (error) {
            console.error('[VoidrixBackup] Failed to delete backup:', error);
            return { success: false, error: error.message };
        }
    }

    async exportBackup(instanceName, backupName, exportPath) {
        const instanceBackupsDir = path.join(this.backupsDir, instanceName);
        const backupPath = path.join(instanceBackupsDir, backupName);
        
        if (!(await fs.pathExists(backupPath))) {
            return { success: false, error: 'Backup file not found' };
        }
        
        try {
            const destPath = path.join(exportPath, backupName);
            await fs.copy(backupPath, destPath);
            console.log(`[VoidrixBackup] Exported backup: ${backupName} to ${destPath}`);
            return { success: true, path: destPath };
        } catch (error) {
            console.error('[VoidrixBackup] Failed to export backup:', error);
            return { success: false, error: error.message };
        }
    }

    async importBackup(importPath, instanceName) {
        if (!(await fs.pathExists(importPath))) {
            return { success: false, error: 'Import file not found' };
        }
        
        try {
            const instanceBackupsDir = path.join(this.backupsDir, instanceName);
            await fs.ensureDir(instanceBackupsDir);
            
            const fileName = path.basename(importPath);
            const destPath = path.join(instanceBackupsDir, fileName);
            
            await fs.copy(importPath, destPath);
            console.log(`[VoidrixBackup] Imported backup: ${fileName}`);
            
            return { success: true, name: fileName };
        } catch (error) {
            console.error('[VoidrixBackup] Failed to import backup:', error);
            return { success: false, error: error.message };
        }
    }

    async cleanupBackups(instanceName, keepCount = null) {
        const instanceBackupsDir = path.join(this.backupsDir, instanceName);
        if (!(await fs.pathExists(instanceBackupsDir))) return { success: true, deleted: 0 };
        
        const settingsPath = path.join(app.getPath('userData'), 'settings.json');
        let maxBackups = 10;
        
        if (await fs.pathExists(settingsPath)) {
            try {
                const settings = await fs.readJson(settingsPath);
                if (settings.backupSettings && settings.backupSettings.maxBackups) {
                    maxBackups = settings.backupSettings.maxBackups;
                }
            } catch (e) {}
        }
        
        const keep = keepCount || maxBackups;
        const files = await fs.readdir(instanceBackupsDir);
        const backupFiles = files
            .filter(f => f.endsWith('.zip'))
            .map(f => ({
                name: f,
                path: path.join(instanceBackupsDir, f),
                time: fs.statSync(path.join(instanceBackupsDir, f)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time);

        let deleted = 0;
        if (backupFiles.length > keep) {
            const toDelete = backupFiles.slice(keep);
            for (const file of toDelete) {
                await fs.remove(file.path);
                console.log(`[VoidrixBackup] Deleted old backup: ${file.name}`);
                deleted++;
            }
        }
        
        return { success: true, deleted };
    }

    async getBackupSize(instanceName) {
        const instanceBackupsDir = path.join(this.backupsDir, instanceName);
        if (!(await fs.pathExists(instanceBackupsDir))) {
            return { success: true, size: 0, sizeFormatted: '0 B', count: 0 };
        }
        
        let totalSize = 0;
        const files = await fs.readdir(instanceBackupsDir);
        const backupFiles = files.filter(f => f.endsWith('.zip'));
        
        for (const file of backupFiles) {
            const stats = await fs.stat(path.join(instanceBackupsDir, file));
            totalSize += stats.size;
        }
        
        return { 
            success: true, 
            size: totalSize, 
            sizeFormatted: this.formatSize(totalSize),
            count: backupFiles.length
        };
    }

    async startScheduler(instanceName, intervalMinutes) {
        this.stopScheduler(instanceName);

        if (intervalMinutes <= 0) {
            return { success: true, stopped: true };
        }

        console.log(`[VoidrixBackup] Starting scheduler for ${instanceName} every ${intervalMinutes} minutes.`);
        
        const interval = setInterval(async () => {
            try {
                const instanceDir = resolveInstanceDirByName(instanceName);
                if (!(await fs.pathExists(instanceDir))) {
                    console.log(`[VoidrixBackup] Instance ${instanceName} no longer exists, stopping scheduler.`);
                    this.stopScheduler(instanceName);
                    return;
                }
                
                await this.createBackup(instanceName);
            } catch (err) {
                console.error(`[VoidrixBackup] Scheduled backup failed for ${instanceName}:`, err);
            }
        }, intervalMinutes * 60 * 1000);

        this.intervals.set(instanceName, interval);
        await this.saveSchedule(instanceName, intervalMinutes);
        
        return { success: true, intervalMinutes };
    }

    stopScheduler(instanceName) {
        if (this.intervals.has(instanceName)) {
            clearInterval(this.intervals.get(instanceName));
            this.intervals.delete(instanceName);
            console.log(`[VoidrixBackup] Stopped scheduler for ${instanceName}.`);
            this.saveSchedule(instanceName, null);
            return { success: true };
        }
        return { success: false, error: 'No active schedule' };
    }

    async saveSchedule(instanceName, intervalMinutes) {
        try {
            const schedulesPath = path.join(this.backupsDir, 'schedules.json');
            let schedules = {};
            
            if (await fs.pathExists(schedulesPath)) {
                schedules = await fs.readJson(schedulesPath);
            }
            
            if (intervalMinutes === null) {
                delete schedules[instanceName];
            } else {
                schedules[instanceName] = {
                    intervalMinutes,
                    startedAt: Date.now(),
                    instanceName
                };
            }
            
            await fs.writeJson(schedulesPath, schedules, { spaces: 4 });
        } catch (e) {
            console.error('[VoidrixBackup] Failed to save schedule:', e);
        }
    }

    async getSchedules() {
        const schedulesPath = path.join(this.backupsDir, 'schedules.json');
        if (!(await fs.pathExists(schedulesPath))) {
            return { success: true, schedules: {} };
        }
        
        try {
            const schedules = await fs.readJson(schedulesPath);
            return { success: true, schedules };
        } catch (e) {
            return { success: true, schedules: {} };
        }
    }

    formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

module.exports = new BackupManager();
