const fs = require('fs-extra');
const axios = require('axios');
const Store = require('electron-store');
const { app, shell, BrowserWindow } = require('electron');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const { promisify } = require('util');
const pipeline = promisify(require('stream').pipeline);

const envPath = app.isPackaged ? path.join(process.resourcesPath, '.env') : path.join(app.getAppPath(), '.env');
require('dotenv').config({ path: envPath });

const store = new Store();

// VoidrixCloud - Eigenes Branding
const PROVIDERS = {
    VOIDRIX_CLOUD: {
        name: 'Voidrix Cloud',
        clientId: process.env.VOIDRIX_CLOUD_CLIENT_ID,
        clientSecret: process.env.VOIDRIX_CLOUD_CLIENT_SECRET,
        authUrl: 'https://cloud.valtrixmc.xyz/oauth2/authorize',
        tokenUrl: 'https://cloud.valtrixmc.xyz/oauth2/token',
        apiUrl: 'https://cloud.valtrixmc.xyz/api/v1',
        scope: 'backup:read backup:write user:profile',
        icon: '☁️'
    },
    GOOGLE_DRIVE: {
        name: 'Google Drive',
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        apiUrl: 'https://www.googleapis.com/drive/v3',
        scope: 'https://www.googleapis.com/auth/drive.file openid profile email',
        icon: '📁'
    },
    DROPBOX: {
        name: 'Dropbox',
        clientId: process.env.DROPBOX_CLIENT_ID,
        clientSecret: process.env.DROPBOX_CLIENT_SECRET,
        authUrl: 'https://www.dropbox.com/oauth2/authorize',
        tokenUrl: 'https://api.dropboxapi.com/oauth2/token',
        apiUrl: 'https://api.dropboxapi.com/2',
        scope: '',
        icon: '📦'
    }
};

const REDIRECT_URI = 'https://voidrixclient.xyz/callback';
const BACKUP_FOLDER = 'VoidrixBackups';
const MAX_BACKUP_SIZE = 500 * 1024 * 1024; // 500 MB

class CloudBackupHandler {
    constructor(ipcMain, mainWindow) {
        this.ipcMain = ipcMain;
        this.mainWindow = mainWindow;
        this.uploadQueue = new Map();
        this.registerHandlers();
    }

    registerHandlers() {
        this.ipcMain.handle('cloud:login', async (_, providerId) => {
            return await this.login(providerId);
        });

        this.ipcMain.handle('cloud:logout', async (_, providerId) => {
            return this.logout(providerId);
        });

        this.ipcMain.handle('cloud:get-status', async () => {
            return this.getStatus();
        });

        this.ipcMain.handle('cloud:list-backups', async (_, providerId, instanceName) => {
            return await this.listBackups(providerId, instanceName);
        });

        this.ipcMain.handle('cloud:upload', async (_, providerId, filePath, instanceName, options = {}) => {
            return await this.uploadBackup(providerId, filePath, instanceName, options);
        });

        this.ipcMain.handle('cloud:download', async (_, providerId, fileId, targetPath) => {
            return await this.downloadBackup(providerId, fileId, targetPath);
        });

        this.ipcMain.handle('cloud:delete-backup', async (_, providerId, fileId) => {
            return await this.deleteBackup(providerId, fileId);
        });

        this.ipcMain.handle('cloud:get-usage', async (_, providerId) => {
            return await this.getStorageUsage(providerId);
        });

        this.ipcMain.handle('cloud:backup-now', async (_, instanceName, providerId) => {
            return await this.createAndUploadBackup(instanceName, providerId);
        });

        this.ipcMain.handle('cloud:restore-backup', async (_, instanceName, backupId, providerId) => {
            return await this.restoreBackup(instanceName, backupId, providerId);
        });

        this.ipcMain.handle('cloud:schedule-backup', async (_, instanceName, schedule, providerId) => {
            return await this.scheduleBackup(instanceName, schedule, providerId);
        });

        // Event listener für automatische Backups
        const { app } = require('electron');
        app.on('backup:created', async ({ providerId, filePath, instanceName }) => {
            console.log(`[VoidrixCloud] Backup created for ${instanceName} to ${providerId}`);
            try {
                const result = await this.uploadBackup(providerId, filePath, instanceName);
                if (result.success) {
                    console.log(`[VoidrixCloud] Upload successful: ${instanceName}`);
                    this.mainWindow?.webContents.send('cloud:upload-complete', {
                        providerId,
                        instanceName,
                        fileId: result.fileId
                    });
                    
                    try {
                        await fs.remove(filePath);
                        console.log(`[VoidrixCloud] Temp backup deleted: ${filePath}`);
                    } catch (cleanupErr) {
                        console.error(`[VoidrixCloud] Failed to delete temp backup:`, cleanupErr.message);
                    }
                } else {
                    console.error(`[VoidrixCloud] Upload failed: ${result.error}`);
                    this.mainWindow?.webContents.send('cloud:upload-error', {
                        providerId,
                        instanceName,
                        error: result.error
                    });
                }
            } catch (err) {
                console.error(`[VoidrixCloud] Critical error during upload:`, err.message);
            }
        });
    }

    getStatus() {
        const cloudSettings = store.get('cloud_backups') || {};
        const status = {};
        
        for (const key in PROVIDERS) {
            const providerData = cloudSettings[key];
            status[key] = {
                loggedIn: !!providerData?.tokens,
                user: providerData?.user || null,
                lastLogin: providerData?.lastLogin || null,
                totalBackups: providerData?.totalBackups || 0,
                totalSize: providerData?.totalSize || 0,
                icon: PROVIDERS[key].icon,
                name: PROVIDERS[key].name
            };
        }
        return status;
    }

    logout(providerId) {
        const cloudSettings = store.get('cloud_backups') || {};
        if (cloudSettings[providerId]) {
            delete cloudSettings[providerId];
            store.set('cloud_backups', cloudSettings);
            this.mainWindow?.webContents.send('cloud:logout', { providerId });
            return { success: true };
        }
        return { success: false, error: 'Not logged in' };
    }

    async login(providerId) {
        const provider = PROVIDERS[providerId];
        if (!provider) return { success: false, error: 'Invalid provider' };

        return new Promise((resolve) => {
            const authWin = new BrowserWindow({
                width: 600,
                height: 800,
                show: false,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true
                }
            });

            let url = `${provider.authUrl}?client_id=${provider.clientId}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code`;

            if (provider.scope) {
                url += `&scope=${encodeURIComponent(provider.scope)}`;
            }

            authWin.loadURL(url);
            authWin.show();

            const handleCallback = async (url) => {
                if (url.startsWith(REDIRECT_URI)) {
                    const urlParams = new URL(url).searchParams;
                    const code = urlParams.get('code');
                    const error = urlParams.get('error');

                    if (error) {
                        resolve({ success: false, error });
                        authWin.close();
                        return;
                    }

                    if (code) {
                        try {
                            const tokens = await this.exchangeCodeForTokens(providerId, code);
                            const user = await this.getUserInfo(providerId, tokens.access_token);

                            const cloudSettings = store.get('cloud_backups') || {};
                            cloudSettings[providerId] = {
                                tokens,
                                user,
                                lastLogin: Date.now(),
                                totalBackups: 0,
                                totalSize: 0
                            };
                            store.set('cloud_backups', cloudSettings);

                            this.mainWindow?.webContents.send('cloud:login', { 
                                providerId, 
                                success: true, 
                                user 
                            });

                            resolve({ success: true, user });
                        } catch (e) {
                            resolve({ success: false, error: e.message });
                        }
                        authWin.close();
                    }
                }
            };

            authWin.webContents.on('will-navigate', (event, url) => {
                handleCallback(url);
            });

            authWin.webContents.on('will-redirect', (event, url) => {
                handleCallback(url);
            });

            authWin.on('closed', () => {
                resolve({ success: false, error: 'Authentication canceled' });
            });
        });
    }

    async exchangeCodeForTokens(providerId, code) {
        const provider = PROVIDERS[providerId];
        const params = new URLSearchParams();
        params.append('client_id', provider.clientId);
        params.append('client_secret', provider.clientSecret);
        params.append('code', code);
        params.append('redirect_uri', REDIRECT_URI);
        params.append('grant_type', 'authorization_code');

        const response = await axios.post(provider.tokenUrl, params);
        return response.data;
    }

    async getUserInfo(providerId, accessToken) {
        try {
            if (providerId === 'VOIDRIX_CLOUD') {
                const res = await axios.get(`${PROVIDERS.VOIDRIX_CLOUD.apiUrl}/user/profile`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                return { 
                    name: res.data.username, 
                    email: res.data.email,
                    avatar: res.data.avatar,
                    plan: res.data.plan,
                    storageUsed: res.data.storage_used,
                    storageLimit: res.data.storage_limit
                };
            } else if (providerId === 'GOOGLE_DRIVE') {
                const res = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                return { name: res.data.name, email: res.data.email, avatar: res.data.picture };
            } else if (providerId === 'DROPBOX') {
                const res = await axios.post('https://api.dropboxapi.com/2/users/get_current_account', null, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                return { 
                    name: res.data.name.display_name, 
                    email: res.data.email,
                    avatar: `https://www.dropbox.com/avatar/${res.data.account_id}`
                };
            }
        } catch (e) {
            console.error(`[VoidrixCloud] Failed to get user info for ${providerId}:`, e.message);
            return { name: 'Unknown User', email: '' };
        }
    }

    async getStorageUsage(providerId) {
        const accessToken = await this.getAccessToken(providerId);
        if (!accessToken) return { success: false, error: 'Not logged in' };

        try {
            if (providerId === 'VOIDRIX_CLOUD') {
                const res = await axios.get(`${PROVIDERS.VOIDRIX_CLOUD.apiUrl}/user/storage`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                return { success: true, used: res.data.used, limit: res.data.limit };
            } else if (providerId === 'GOOGLE_DRIVE') {
                const res = await axios.get('https://www.googleapis.com/drive/v3/about', {
                    headers: { Authorization: `Bearer ${accessToken}` },
                    params: { fields: 'storageQuota' }
                });
                return { 
                    success: true, 
                    used: res.data.storageQuota.usage,
                    limit: res.data.storageQuota.limit 
                };
            }
            return { success: false, error: 'Provider not supported' };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    async refreshTokens(providerId) {
        const cloudSettings = store.get('cloud_backups') || {};
        const providerData = cloudSettings[providerId];
        if (!providerData || !providerData.tokens.refresh_token) return null;

        const provider = PROVIDERS[providerId];
        const params = new URLSearchParams();
        params.append('client_id', provider.clientId);
        params.append('client_secret', provider.clientSecret);
        params.append('refresh_token', providerData.tokens.refresh_token);
        params.append('grant_type', 'refresh_token');

        try {
            const response = await axios.post(provider.tokenUrl, params);
            providerData.tokens = { ...providerData.tokens, ...response.data };
            cloudSettings[providerId] = providerData;
            store.set('cloud_backups', cloudSettings);
            return providerData.tokens.access_token;
        } catch (e) {
            console.error(`[VoidrixCloud] Token refresh failed for ${providerId}:`, e.message);
            return null;
        }
    }

    async getAccessToken(providerId) {
        const cloudSettings = store.get('cloud_backups') || {};
        const providerData = cloudSettings[providerId];
        if (!providerData) return null;
        
        const token = providerData.tokens.access_token;
        const expiresAt = providerData.tokens.expires_at;
        
        if (expiresAt && expiresAt < Date.now()) {
            return await this.refreshTokens(providerId);
        }
        
        return token;
    }

    async getOrCreateFolder(providerId, folderName, parentId = null) {
        let accessToken = await this.getAccessToken(providerId);
        if (!accessToken) return null;

        try {
            if (providerId === 'GOOGLE_DRIVE') {
                let q = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
                if (parentId) q += ` and '${parentId}' in parents`;
                else q += ` and 'root' in parents`;

                const res = await axios.get('https://www.googleapis.com/drive/v3/files', {
                    headers: { Authorization: `Bearer ${accessToken}` },
                    params: { q, fields: 'files(id)' }
                });

                if (res.data.files && res.data.files.length > 0) {
                    return res.data.files[0].id;
                }

                const metadata = {
                    name: folderName,
                    mimeType: 'application/vnd.google-apps.folder'
                };
                if (parentId) metadata.parents = [parentId];

                const createRes = await axios.post('https://www.googleapis.com/drive/v3/files', metadata, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                return createRes.data.id;
            } else if (providerId === 'VOIDRIX_CLOUD') {
                const res = await axios.post(`${PROVIDERS.VOIDRIX_CLOUD.apiUrl}/folders`, {
                    name: folderName,
                    parent_id: parentId
                }, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                return res.data.id;
            }
            return null;
        } catch (e) {
            if (e.response?.status === 401) {
                console.log(`[VoidrixCloud] 401 in getOrCreateFolder, refreshing token...`);
                accessToken = await this.refreshTokens(providerId);
                if (accessToken) {
                    return this.getOrCreateFolder(providerId, folderName, parentId);
                }
            }
            console.error(`[VoidrixCloud] Error managing folder:`, e.message);
            return null;
        }
    }

    async uploadBackup(providerId, filePath, instanceName, options = {}) {
        let accessToken = await this.getAccessToken(providerId);
        if (!accessToken) return { success: false, error: 'Not logged in' };

        const fileName = path.basename(filePath);
        const fileSize = (await fs.stat(filePath)).size;
        
        if (fileSize > MAX_BACKUP_SIZE) {
            return { success: false, error: `Backup too large (${(fileSize / 1024 / 1024).toFixed(2)} MB). Max size: 500 MB` };
        }

        // Check if already uploading
        const queueKey = `${providerId}:${instanceName}`;
        if (this.uploadQueue.has(queueKey)) {
            return { success: false, error: 'Upload already in progress' };
        }

        this.uploadQueue.set(queueKey, true);

        try {
            if (providerId === 'GOOGLE_DRIVE') {
                const rootFolderId = await this.getOrCreateFolder(providerId, BACKUP_FOLDER);
                const instanceFolderId = await this.getOrCreateFolder(providerId, instanceName, rootFolderId);
                
                const fileContent = await fs.readFile(filePath);
                const boundary = '-------' + crypto.randomBytes(16).toString('hex');
                const delimiter = "\r\n--" + boundary + "\r\n";
                const close_delim = "\r\n--" + boundary + "--";

                const metadata = {
                    name: fileName,
                    parents: instanceFolderId ? [instanceFolderId] : (rootFolderId ? [rootFolderId] : [])
                };

                const multipartBody = Buffer.concat([
                    Buffer.from(delimiter + 'Content-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(metadata)),
                    Buffer.from(delimiter + 'Content-Type: application/zip\r\n\r\n'),
                    fileContent,
                    Buffer.from(close_delim)
                ]);

                const res = await axios.post('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', multipartBody, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': `multipart/related; boundary=${boundary}`
                    },
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity
                });
                
                await this.updateBackupStats(providerId, instanceName, fileSize);
                return { success: true, fileId: res.data.id, fileName: res.data.name };

            } else if (providerId === 'DROPBOX') {
                const fileContent = await fs.readFile(filePath);
                const res = await axios.post('https://content.dropboxapi.com/2/files/upload', fileContent, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Dropbox-API-Arg': JSON.stringify({
                            path: `/${BACKUP_FOLDER}/${instanceName}/${fileName}`,
                            mode: 'overwrite',
                            autorename: true,
                            mute: false
                        }),
                        'Content-Type': 'application/octet-stream'
                    },
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity
                });
                
                await this.updateBackupStats(providerId, instanceName, fileSize);
                return { success: true, fileId: res.data.id, fileName: res.data.name };
                
            } else if (providerId === 'VOIDRIX_CLOUD') {
                const formData = new FormData();
                const fileContent = await fs.readFile(filePath);
                formData.append('file', new Blob([fileContent]), fileName);
                formData.append('instance', instanceName);
                
                const res = await axios.post(`${PROVIDERS.VOIDRIX_CLOUD.apiUrl}/backups/upload`, formData, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'multipart/form-data'
                    },
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity
                });
                
                await this.updateBackupStats(providerId, instanceName, fileSize);
                return { success: true, fileId: res.data.id, fileName: res.data.filename };
            }
            
            return { success: false, error: 'Provider not supported' };
        } catch (e) {
            if (e.response?.status === 401) {
                accessToken = await this.refreshTokens(providerId);
                if (accessToken) {
                    return this.uploadBackup(providerId, filePath, instanceName, options);
                }
            }
            return { success: false, error: e.message };
        } finally {
            this.uploadQueue.delete(queueKey);
        }
    }

    async updateBackupStats(providerId, instanceName, fileSize) {
        const cloudSettings = store.get('cloud_backups') || {};
        if (cloudSettings[providerId]) {
            cloudSettings[providerId].totalBackups = (cloudSettings[providerId].totalBackups || 0) + 1;
            cloudSettings[providerId].totalSize = (cloudSettings[providerId].totalSize || 0) + fileSize;
            store.set('cloud_backups', cloudSettings);
        }
    }

    async listBackups(providerId, instanceName) {
        let accessToken = await this.getAccessToken(providerId);
        if (!accessToken) return { success: false, error: 'Not logged in' };

        try {
            if (providerId === 'GOOGLE_DRIVE') {
                const rootFolderId = await this.getOrCreateFolder(providerId, BACKUP_FOLDER);
                const instanceFolderId = await this.getOrCreateFolder(providerId, instanceName, rootFolderId);

                const q = instanceFolderId
                    ? `'${instanceFolderId}' in parents and trashed = false`
                    : "name contains '.zip' and trashed = false";

                const res = await axios.get('https://www.googleapis.com/drive/v3/files', {
                    headers: { Authorization: `Bearer ${accessToken}` },
                    params: {
                        q,
                        fields: 'files(id, name, size, createdTime, webViewLink)',
                        orderBy: 'createdTime desc'
                    }
                });
                return { success: true, files: res.data.files };
                
            } else if (providerId === 'DROPBOX') {
                const res = await axios.post('https://api.dropboxapi.com/2/files/list_folder', {
                    path: `/${BACKUP_FOLDER}/${instanceName}`,
                    recursive: false
                }, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                return {
                    success: true,
                    files: res.data.entries.filter(f => f['.tag'] === 'file').map(f => ({
                        id: f.id,
                        name: f.name,
                        size: f.size,
                        createdTime: f.server_modified,
                        webViewLink: `https://www.dropbox.com/home/${BACKUP_FOLDER}/${instanceName}/${f.name}`
                    }))
                };
                
            } else if (providerId === 'VOIDRIX_CLOUD') {
                const res = await axios.get(`${PROVIDERS.VOIDRIX_CLOUD.apiUrl}/backups/${instanceName}`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                return { success: true, files: res.data.backups };
            }
            
            return { success: false, error: 'Provider not supported' };
        } catch (e) {
            if (e.response?.status === 401) {
                accessToken = await this.refreshTokens(providerId);
                if (accessToken) {
                    return this.listBackups(providerId, instanceName);
                }
            }
            return { success: false, error: e.message };
        }
    }

    async deleteBackup(providerId, fileId) {
        let accessToken = await this.getAccessToken(providerId);
        if (!accessToken) return { success: false, error: 'Not logged in' };

        try {
            if (providerId === 'GOOGLE_DRIVE') {
                await axios.delete(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                return { success: true };
            } else if (providerId === 'DROPBOX') {
                await axios.post('https://api.dropboxapi.com/2/files/delete', {
                    path: fileId
                }, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                return { success: true };
            } else if (providerId === 'VOIDRIX_CLOUD') {
                await axios.delete(`${PROVIDERS.VOIDRIX_CLOUD.apiUrl}/backups/${fileId}`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                return { success: true };
            }
            return { success: false, error: 'Provider not supported' };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    async downloadBackup(providerId, fileId, targetPath) {
        let accessToken = await this.getAccessToken(providerId);
        if (!accessToken) return { success: false, error: 'Not logged in' };

        try {
            let url = '';
            let headers = { Authorization: `Bearer ${accessToken}` };

            if (providerId === 'GOOGLE_DRIVE') {
                url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
            } else if (providerId === 'DROPBOX') {
                url = 'https://content.dropboxapi.com/2/files/download';
                headers['Dropbox-API-Arg'] = JSON.stringify({ path: fileId });
            } else if (providerId === 'VOIDRIX_CLOUD') {
                url = `${PROVIDERS.VOIDRIX_CLOUD.apiUrl}/backups/download/${fileId}`;
            }

            const response = await axios.get(url, {
                headers,
                responseType: 'arraybuffer'
            });

            await fs.writeFile(targetPath, response.data);
            return { success: true, path: targetPath };
        } catch (e) {
            if (e.response?.status === 401) {
                accessToken = await this.refreshTokens(providerId);
                if (accessToken) {
                    return this.downloadBackup(providerId, fileId, targetPath);
                }
            }
            return { success: false, error: e.message };
        }
    }

    async createAndUploadBackup(instanceName, providerId) {
        try {
            // Erstelle Backup
            const backupPath = path.join(app.getPath('temp'), `${instanceName}_backup_${Date.now()}.zip`);
            
            this.mainWindow?.webContents.send('cloud:backup-progress', {
                instanceName,
                providerId,
                progress: 0,
                status: 'Creating backup...'
            });
            
            const result = await app.emit('backup:request', {
                instanceName,
                outputPath: backupPath
            });
            
            if (!result?.success) {
                throw new Error(result?.error || 'Backup creation failed');
            }
            
            this.mainWindow?.webContents.send('cloud:backup-progress', {
                instanceName,
                providerId,
                progress: 50,
                status: 'Uploading backup...'
            });
            
            // Upload Backup
            const uploadResult = await this.uploadBackup(providerId, backupPath, instanceName);
            
            if (uploadResult.success) {
                this.mainWindow?.webContents.send('cloud:backup-progress', {
                    instanceName,
                    providerId,
                    progress: 100,
                    status: 'Backup complete',
                    fileId: uploadResult.fileId
                });
                
                // Cleanup temp file
                await fs.remove(backupPath).catch(() => {});
                
                return { success: true, fileId: uploadResult.fileId };
            } else {
                throw new Error(uploadResult.error);
            }
        } catch (e) {
            this.mainWindow?.webContents.send('cloud:backup-error', {
                instanceName,
                providerId,
                error: e.message
            });
            return { success: false, error: e.message };
        }
    }

    async restoreBackup(instanceName, backupId, providerId) {
        try {
            this.mainWindow?.webContents.send('cloud:restore-progress', {
                instanceName,
                providerId,
                progress: 0,
                status: 'Downloading backup...'
            });
            
            const tempPath = path.join(app.getPath('temp'), `${instanceName}_restore_${Date.now()}.zip`);
            const downloadResult = await this.downloadBackup(providerId, backupId, tempPath);
            
            if (!downloadResult.success) {
                throw new Error(downloadResult.error);
            }
            
            this.mainWindow?.webContents.send('cloud:restore-progress', {
                instanceName,
                providerId,
                progress: 50,
                status: 'Restoring backup...'
            });
            
            // Restore Backup
            const restoreResult = await app.emit('backup:restore', {
                instanceName,
                backupPath: tempPath
            });
            
            if (restoreResult?.success) {
                this.mainWindow?.webContents.send('cloud:restore-progress', {
                    instanceName,
                    providerId,
                    progress: 100,
                    status: 'Restore complete'
                });
                
                await fs.remove(tempPath).catch(() => {});
                return { success: true };
            } else {
                throw new Error(restoreResult?.error || 'Restore failed');
            }
        } catch (e) {
            this.mainWindow?.webContents.send('cloud:restore-error', {
                instanceName,
                providerId,
                error: e.message
            });
            return { success: false, error: e.message };
        }
    }

    async scheduleBackup(instanceName, schedule, providerId) {
        const schedules = store.get('backup_schedules') || {};
        schedules[`${providerId}:${instanceName}`] = {
            schedule,
            providerId,
            instanceName,
            lastBackup: null,
            nextBackup: this.calculateNextBackup(schedule)
        };
        store.set('backup_schedules', schedules);
        
        // Setup cron job (simplified - in real app use node-cron)
        this.setupSchedule(instanceName, schedule, providerId);
        
        return { success: true };
    }

    calculateNextBackup(schedule) {
        // Simple implementation - in real app use cron-parser
        const now = Date.now();
        if (schedule === 'daily') return now + 24 * 60 * 60 * 1000;
        if (schedule === 'weekly') return now + 7 * 24 * 60 * 60 * 1000;
        if (schedule === 'monthly') return now + 30 * 24 * 60 * 60 * 1000;
        return null;
    }

    setupSchedule(instanceName, schedule, providerId) {
        // In a real implementation, use node-cron
        // This is a placeholder
        console.log(`[VoidrixCloud] Scheduled backup for ${instanceName} on ${schedule}`);
    }
}

module.exports = (ipcMain, mainWindow) => {
    return new CloudBackupHandler(ipcMain, mainWindow);
};
