const axios = require('axios');
const { app } = require('electron');
const fs = require('fs-extra');
const path = require('path');

// API Endpoints
const MOJANG_MANIFEST = 'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json';
const FABRIC_META = 'https://meta.fabricmc.net/v2/versions/loader';
const QUILT_META = 'https://meta.quiltmc.org/v3/versions/loader';
const FORGE_PROMO = 'https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json';
const NEOFORGE_META = 'https://maven.neoforged.net/releases/net/neoforged/neoforge/maven-metadata.xml';

// Cache für bessere Performance
let versionsCache = new Map();
let loaderCache = new Map();
let newsCache = null;
let newsCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 Minuten

module.exports = (ipcMain) => {
    // ==================== VANILLA VERSIONS ====================
    ipcMain.handle('data:get-vanilla-versions', async () => {
        try {
            // Check cache
            if (versionsCache.has('vanilla') && versionsCache.get('vanilla').timestamp > Date.now() - CACHE_DURATION) {
                return { success: true, versions: versionsCache.get('vanilla').data };
            }

            const response = await axios.get(MOJANG_MANIFEST, { timeout: 10000 });
            const versions = response.data.versions;
            
            // Cache speichern
            versionsCache.set('vanilla', {
                data: versions,
                timestamp: Date.now()
            });
            
            return { success: true, versions };
        } catch (e) {
            console.error("Failed to fetch vanilla versions:", e.message);
            return { success: false, error: e.message };
        }
    });

    // ==================== LOADER VERSIONS ====================
    ipcMain.handle('data:get-loader-versions', async (_, mcVersion, loaderType) => {
        const cacheKey = `${loaderType}:${mcVersion}`;
        
        try {
            // Check cache
            if (loaderCache.has(cacheKey) && loaderCache.get(cacheKey).timestamp > Date.now() - CACHE_DURATION) {
                return { success: true, versions: loaderCache.get(cacheKey).data };
            }

            let versions = [];
            
            if (loaderType === 'fabric') {
                const url = `${FABRIC_META}/${mcVersion}`;
                const response = await axios.get(url, { timeout: 10000 });
                versions = response.data.map(v => ({
                    version: v.loader.version,
                    name: v.loader.version,
                    type: 'fabric',
                    url: `https://meta.fabricmc.net/v2/versions/loader/${mcVersion}/${v.loader.version}/server/jar`
                }));
            } 
            else if (loaderType === 'quilt') {
                const url = `${QUILT_META}/${mcVersion}`;
                const response = await axios.get(url, { timeout: 10000 });
                versions = response.data.map(v => ({
                    version: v.loader.version,
                    name: v.loader.version,
                    type: 'quilt',
                    url: `https://meta.quiltmc.org/v3/versions/loader/${mcVersion}/${v.loader.version}/server/jar`
                }));
            }
            else if (loaderType === 'forge') {
                const response = await axios.get(FORGE_PROMO, { timeout: 10000 });
                const promos = response.data.promos;
                const relevant = Object.entries(promos).filter(([key]) => key.startsWith(mcVersion + '-'));
                versions = relevant.map(([key, value]) => ({
                    version: value,
                    name: key,
                    type: 'forge',
                    url: `https://maven.minecraftforge.net/net/minecraftforge/forge/${mcVersion}-${value}/forge-${mcVersion}-${value}-installer.jar`
                }));
            }
            else if (loaderType === 'neoforge') {
                try {
                    const response = await axios.get(NEOFORGE_META, { timeout: 10000 });
                    const versionsList = [];
                    const versionRegex = /<version>([^<]+)<\/version>/g;
                    let match;
                    while ((match = versionRegex.exec(response.data)) !== null) {
                        if (match[1].startsWith(mcVersion)) {
                            versionsList.push(match[1]);
                        }
                    }
                    versions = versionsList.map(v => ({
                        version: v,
                        name: v,
                        type: 'neoforge',
                        url: `https://maven.neoforged.net/releases/net/neoforged/neoforge/${v}/neoforge-${v}-installer.jar`
                    }));
                } catch (e) {
                    console.error("Failed to fetch NeoForge versions:", e.message);
                }
            }

            // Cache speichern
            loaderCache.set(cacheKey, {
                data: versions,
                timestamp: Date.now()
            });
            
            return { success: true, versions };
        } catch (e) {
            console.error(`Loader fetch error for ${loaderType}:`, e.message);
            return { success: false, error: e.message };
        }
    });

    // ==================== NEWS ====================
    ipcMain.handle('data:get-news', async (_, forceRefresh = false) => {
        try {
            // Check cache
            if (!forceRefresh && newsCache && newsCacheTime > Date.now() - CACHE_DURATION) {
                return { success: true, news: newsCache };
            }

            const NEWS_URL = 'https://voidrixclient.voidrix.de/news.json';
            console.log(`[News] Fetching from ${NEWS_URL}...`);
            
            const response = await axios.get(NEWS_URL, { timeout: 15000 });
            const news = response.data;
            
            // Cache speichern
            newsCache = news;
            newsCacheTime = Date.now();
            
            console.log(`[News] Fetched ${news.length} items successfully`);
            return { success: true, news };
        } catch (e) {
            console.error("[News] Fetch Error:", e.message);
            
            // Fallback zu cached news
            if (newsCache) {
                console.log("[News] Using cached news data");
                return { success: true, news: newsCache, cached: true };
            }
            
            if (e.response) {
                console.error("[News] Status:", e.response.status);
                console.error("[News] Data:", e.response.data);
            }
            return { success: false, error: e.message };
        }
    });

    // ==================== MODRINTH SEARCH ====================
    ipcMain.handle('data:search-modrinth', async (_, query, facets, options) => {
        try {
            const MODRINTH_API = 'https://api.modrinth.com/v2/search';
            const params = {
                query: query || '',
                facets: JSON.stringify(facets || []),
                limit: options?.limit || 20,
                offset: options?.offset || 0,
                index: options?.index || 'relevance'
            };
            
            if (options?.projectType) {
                params.facets = JSON.stringify([...facets, [`project_type:${options.projectType}`]]);
            }
            
            const response = await axios.get(MODRINTH_API, { params, timeout: 10000 });
            return { success: true, results: response.data.hits, total_hits: response.data.total_hits };
        } catch (e) {
            console.error("Modrinth search error:", e.message);
            return { success: false, error: e.message };
        }
    });

    // ==================== MODRINTH PROJECT ====================
    ipcMain.handle('data:get-modrinth-project', async (_, projectId) => {
        try {
            const response = await axios.get(`https://api.modrinth.com/v2/project/${projectId}`, { timeout: 10000 });
            return { success: true, project: response.data };
        } catch (e) {
            console.error("Modrinth project error:", e.message);
            return { success: false, error: e.message };
        }
    });

    // ==================== MODRINTH VERSIONS ====================
    ipcMain.handle('data:get-modrinth-versions', async (_, projectId, loaders, gameVersions, curseforgeId = null) => {
        try {
            let versions = [];
            
            // Versuche Modrinth
            const params = {};
            if (loaders && loaders.length > 0) {
                params.loaders = JSON.stringify(loaders);
            }
            if (gameVersions && gameVersions.length > 0) {
                params.game_versions = JSON.stringify(gameVersions);
            }
            
            const response = await axios.get(`https://api.modrinth.com/v2/project/${projectId}/version`, { 
                params, 
                timeout: 10000 
            });
            versions = response.data;
            
            // Wenn nichts gefunden und CurseForge ID vorhanden, versuche CurseForge
            if (versions.length === 0 && curseforgeId) {
                const cfResponse = await axios.get(`https://api.modrinth.com/v2/project/${curseforgeId}/version`, { 
                    params, 
                    timeout: 10000 
                });
                versions = cfResponse.data;
            }
            
            return { success: true, versions };
        } catch (e) {
            console.error("Modrinth versions error:", e.message);
            return { success: false, error: e.message };
        }
    });

    // ==================== CURSEFORGE SEARCH ====================
    ipcMain.handle('data:search-curseforge', async (_, query, options) => {
        try {
            const CURSEFORGE_API = 'https://api.curseforge.com/v1/mods/search';
            const response = await axios.get(CURSEFORGE_API, {
                params: {
                    gameId: 432,
                    searchFilter: query || '',
                    pageSize: options?.limit || 20,
                    index: options?.offset || 0,
                    sortField: options?.sortField || 2,
                    sortOrder: options?.sortOrder || 'desc',
                    modLoaderType: options?.modLoaderType || 0
                },
                headers: {
                    'x-api-key': process.env.CURSEFORGE_API_KEY || ''
                },
                timeout: 10000
            });
            return { success: true, results: response.data.data, total_hits: response.data.pagination.totalCount };
        } catch (e) {
            console.error("CurseForge search error:", e.message);
            return { success: false, error: e.message };
        }
    });

    // ==================== GET FEATURED MODS ====================
    ipcMain.handle('data:get-featured-mods', async () => {
        try {
            const response = await axios.get('https://api.modrinth.com/v2/projects', {
                params: {
                    ids: JSON.stringify(['sodium', 'fabric-api', 'iris', 'lithium', 'phosphor'])
                },
                timeout: 10000
            });
            return { success: true, mods: response.data };
        } catch (e) {
            console.error("Featured mods error:", e.message);
            return { success: false, error: e.message };
        }
    });

    // ==================== GET POPULAR MODPACKS ====================
    ipcMain.handle('data:get-popular-modpacks', async (_, limit = 6) => {
        try {
            const response = await axios.get('https://api.modrinth.com/v2/search', {
                params: {
                    facets: JSON.stringify([['project_type:modpack']]),
                    limit,
                    index: 'downloads'
                },
                timeout: 10000
            });
            return { success: true, modpacks: response.data.hits };
        } catch (e) {
            console.error("Popular modpacks error:", e.message);
            return { success: false, error: e.message };
        }
    });

    // ==================== GET MODRINTH CATEGORIES ====================
    ipcMain.handle('data:get-modrinth-categories', async () => {
        try {
            const response = await axios.get('https://api.modrinth.com/v2/tag/category', { timeout: 10000 });
            return { success: true, categories: response.data };
        } catch (e) {
            console.error("Modrinth categories error:", e.message);
            return { success: false, error: e.message };
        }
    });

    // ==================== CLEAR CACHE ====================
    ipcMain.handle('data:clear-cache', async () => {
        versionsCache.clear();
        loaderCache.clear();
        newsCache = null;
        newsCacheTime = 0;
        return { success: true };
    });

    // ==================== GET VERSION INFO ====================
    ipcMain.handle('data:get-version-info', async (_, version) => {
        try {
            const response = await axios.get(`https://launchermeta.mojang.com/mc/game/version_manifest_v2.json`, { timeout: 10000 });
            const versionInfo = response.data.versions.find(v => v.id === version);
            if (!versionInfo) {
                return { success: false, error: 'Version not found' };
            }
            
            const detailsResponse = await axios.get(versionInfo.url, { timeout: 10000 });
            return { success: true, details: detailsResponse.data };
        } catch (e) {
            console.error("Version info error:", e.message);
            return { success: false, error: e.message };
        }
    });

    // ==================== GET LATEST VERSIONS ====================
    ipcMain.handle('data:get-latest-versions', async () => {
        try {
            const response = await axios.get(MOJANG_MANIFEST, { timeout: 10000 });
            const versions = response.data.versions;
            const latest = response.data.latest;
            
            const latestRelease = versions.find(v => v.id === latest.release);
            const latestSnapshot = versions.find(v => v.id === latest.snapshot);
            
            return { 
                success: true, 
                latest: {
                    release: latestRelease,
                    snapshot: latestSnapshot
                }
            };
        } catch (e) {
            console.error("Latest versions error:", e.message);
            return { success: false, error: e.message };
        }
    });

    // ==================== CHECK API STATUS ====================
    ipcMain.handle('data:check-api-status', async () => {
        const endpoints = [
            { name: 'Mojang', url: MOJANG_MANIFEST },
            { name: 'Modrinth', url: 'https://api.modrinth.com/v2/search?limit=1' },
            { name: 'Fabric', url: 'https://meta.fabricmc.net/v2/versions/loader' }
        ];
        
        const results = {};
        
        for (const endpoint of endpoints) {
            try {
                const start = Date.now();
                await axios.get(endpoint.url, { timeout: 5000 });
                results[endpoint.name] = { status: 'ok', latency: Date.now() - start };
            } catch (e) {
                results[endpoint.name] = { status: 'error', error: e.message };
            }
        }
        
        return { success: true, results };
    });
};