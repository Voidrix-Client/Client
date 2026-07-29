import { io } from "socket.io-client";
import packageJson from '../../package.json';

class AnalyticsService {
    private socket: any;
    private serverUrl: string;
    private clientVersion: string;
    private os: string;
    private userProfile: any;
    private disabled: boolean;

    constructor() {
        this.socket = null;
        this.serverUrl = 'https://voidrixclient.pluginhub.de';
        this.clientVersion = packageJson.version;
        this.os = 'win32';
        this.userProfile = null;
        this.disabled = false;
    }
    init(serverUrl = 'https://voidrixclient.pluginhub.de') {
        if (this.disabled) {
            console.log('[Analytics] Analytics is disabled for this session');
            return;
        }

        if (this.socket) return;

        // No analytics network traffic in local dev mode by default
        if (import.meta.env.DEV) {
            console.debug('[Analytics] Skipping analytics init in DEV environment');
            return;
        }

        console.log('[Analytics] Initializing connection to', serverUrl);
        this.serverUrl = serverUrl;

        this.socket = io(this.serverUrl, {
            reconnection: true,
            reconnectionAttempts: 3,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            transports: ['websocket'] // Start with WebSocket only
        });

        this.socket.on("connect", () => {
            console.log("[Analytics] Connected to", this.serverUrl, "using", this.socket.io.engine.transport.name);
            this.register();
        });

        this.socket.on("connect_error", (err: any) => {
            const message = err?.message || String(err);

            // DNS failures often happen when the analytics endpoint is unavailable
            if (message.includes('ERR_NAME_NOT_RESOLVED') || message.includes('ENOTFOUND')) {
                console.warn("[Analytics] Analytics endpoint unavailable; disabling analytics for session:", message);
                this.disabled = true;
                this.socket?.disconnect();
                this.socket = null;
                return;
            }

            console.error("[Analytics] Connection error:", message);

            // If we are not already using polling, fall back to it permanently for this session
            if (!this.socket.io.opts.transports.includes('polling')) {
                console.log("[Analytics] Falling back to polling permanently for this session");
                this.socket.io.opts.transports = ['polling'];
                // Force a reconnection with the new transport
                this.socket.connect();
                return;
            }

            // We already fell back and still cannot connect; disable further attempts
            console.warn("[Analytics] Failed to connect with polling too, disabling analytics for session");
            this.disabled = true;
            this.socket.disconnect();
            this.socket = null;
        });

        this.socket.io.on("reconnect_attempt", () => {
            // Ensure we stay on polling if we've already fallen back
            if (this.socket.io.opts.transports.includes('polling')) {
                this.socket.io.opts.transports = ['polling'];
            } else {
                this.socket.io.opts.transports = ['websocket'];
            }
        });

        this.socket.on("disconnect", (reason: string) => {
            console.log("[Analytics] Disconnected:", reason);
            if (reason === "io server disconnect") {
                this.socket.connect();
            }
        });
    }

    setProfile(profile: any) {
        this.userProfile = profile;
        this.register();
    }

    register() {
        if (!this.socket || this.disabled) {
            console.debug('[Analytics] Register skipped (disabled or no socket)');
            return;
        }
        const data: any = {
            version: this.clientVersion,
            os: this.os
        };
        if (this.userProfile) {
            data.username = this.userProfile.name;
            data.uuid = this.userProfile.id;
        }
        this.socket.emit('register', data);
    }

    updateStatus(isPlaying: boolean, instanceName: string | null = null, metadata: any = {}) {
        if (!this.socket || this.disabled) {
            console.debug('[Analytics] Update status skipped: no socket or disabled');
            return;
        }
        console.log('[Analytics] Update Status:', isPlaying, instanceName, metadata);
        this.socket.emit('update-status', {
            isPlaying,
            instance: instanceName,
            software: metadata.loader,
            gameVersion: metadata.version,
            mode: metadata.mode
        });
    }

    trackLaunch(instanceName: string, metadata: any = {}) {
        this.updateStatus(true, instanceName, metadata);
    }

    trackServerCreation(software: string, version: string) {
        if (!this.socket || this.disabled) {
            console.debug('[Analytics] Track server creation skipped: no socket or disabled');
            return;
        }
        console.log('[Analytics] Track Server Creation:', software, version);
        this.socket.emit('track-creation', {
            software,
            version,
            mode: 'server'
        });
    }

    trackInstanceCreation(software: string, version: string) {
        if (!this.socket || this.disabled) {
            console.debug('[Analytics] Track instance creation skipped: no socket or disabled');
            return;
        }
        console.log('[Analytics] Track Instance Creation:', software, version);
        this.socket.emit('track-creation', {
            software,
            version,
            mode: 'launcher'
        });
    }

    trackDownload(type: string, name: string, id: string) {
        if (!this.socket || this.disabled) {
            console.debug('[Analytics] Track download skipped: no socket or disabled');
            return;
        }

        this.socket.emit('track-download', {
            type,
            name,
            id,
            username: this.userProfile ? this.userProfile.name : null
        });
    }
}

export const Analytics = new AnalyticsService();