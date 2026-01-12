/**
 * Game Network Client
 * Socket.io client for multiplayer communication
 */

import { io, Socket } from 'socket.io-client';
import {
    ClientToServerEvents,
    ServerToClientEvents,
    PlayerState,
    SerializedGameState,
    PlayerInput,
    ShootInput,
    Vector3,
    ProjectileType,
    HitData,
    KillData,
    ChatMessage,
    InitData,
    PowerUpCollectedData,
} from '../../shared/Protocol';

export class GameClient {
    private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
    private connected: boolean = false;

    // Callbacks
    onInit: ((playerId: string, gameState: SerializedGameState, spawnPosition: Vector3) => void) | null = null;
    onGameState: ((state: SerializedGameState) => void) | null = null;
    onPlayerJoined: ((player: PlayerState) => void) | null = null;
    onPlayerLeft: ((playerId: string) => void) | null = null;
    onPlayerHit: ((data: HitData) => void) | null = null;
    onPlayerKilled: ((data: KillData) => void) | null = null;
    onPlayerRespawned: ((player: PlayerState) => void) | null = null;
    onPowerUpCollected: ((data: PowerUpCollectedData) => void) | null = null;
    onChatMessage: ((data: ChatMessage) => void) | null = null;
    onConnectionChange: ((connected: boolean) => void) | null = null;

    async connect(serverUrl: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.socket = io(serverUrl, {
                transports: ['websocket'],
                timeout: 10000,
            });

            this.socket.on('connect', () => {
                console.log('🔌 Connected to game server');
                this.connected = true;
                this.onConnectionChange?.(true);
                resolve();
            });

            this.socket.on('disconnect', () => {
                console.log('❌ Disconnected from game server');
                this.connected = false;
                this.onConnectionChange?.(false);
            });

            this.socket.on('connect_error', (error) => {
                console.error('Connection error:', error);
                reject(error);
            });

            // Game events
            this.socket.on('game:init', (data: InitData) => {
                this.onInit?.(data.playerId, data.gameState, data.spawnPosition);
            });

            this.socket.on('game:state', (state: SerializedGameState) => {
                this.onGameState?.(state);
            });

            this.socket.on('player:joined', (player: PlayerState) => {
                this.onPlayerJoined?.(player);
            });

            this.socket.on('player:left', (playerId: string) => {
                this.onPlayerLeft?.(playerId);
            });

            this.socket.on('player:hit', (data: HitData) => {
                this.onPlayerHit?.(data);
            });

            this.socket.on('player:killed', (data: KillData) => {
                this.onPlayerKilled?.(data);
            });

            this.socket.on('player:respawned', (player: PlayerState) => {
                this.onPlayerRespawned?.(player);
            });

            this.socket.on('powerup:collected', (data: PowerUpCollectedData) => {
                this.onPowerUpCollected?.(data);
            });

            this.socket.on('chat:message', (data: ChatMessage) => {
                this.onChatMessage?.(data);
            });
        });
    }

    join(name: string, team?: 'red' | 'blue', mode?: string) {
        if (!this.socket) return;
        this.socket.emit('player:join', { name, team, mode });
    }

    sendInput(input: PlayerInput) {
        if (!this.socket || !this.connected) return;
        this.socket.emit('player:input', input);
    }

    shoot(type: ProjectileType, direction: Vector3) {
        if (!this.socket || !this.connected) return;
        this.socket.emit('player:shoot', { type, direction });
    }

    respawn() {
        if (!this.socket || !this.connected) return;
        this.socket.emit('player:respawn');
    }

    sendChat(message: string) {
        if (!this.socket || !this.connected) return;
        this.socket.emit('chat:message', message);
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.connected = false;
    }

    isConnected(): boolean {
        return this.connected;
    }
}
