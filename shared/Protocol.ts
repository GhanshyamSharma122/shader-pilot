/**
 * Shared types for client-server communication
 * This file is used by both the game server and client
 */

// Vector types
export interface Vector3 {
    x: number;
    y: number;
    z: number;
}

export interface Quaternion {
    x: number;
    y: number;
    z: number;
    w: number;
}

// Player state synced across network
export interface PlayerState {
    id: string;
    name: string;
    position: Vector3;
    rotation: Quaternion;
    velocity: Vector3;
    health: number;
    maxHealth: number;
    shield: number;
    score: number;
    kills: number;
    deaths: number;
    team: 'red' | 'blue' | null; // null for FFA
    isAlive: boolean;
    lastUpdateTime: number;
}

// Projectile types
export type ProjectileType = 'laser' | 'missile' | 'plasma';

export interface ProjectileState {
    id: string;
    ownerId: string;
    type: ProjectileType;
    position: Vector3;
    velocity: Vector3;
    damage: number;
    createdAt: number;
}

// Power-up types
export type PowerUpType = 'health' | 'shield' | 'speed' | 'rapidfire' | 'damage';

export interface PowerUpState {
    id: string;
    type: PowerUpType;
    position: Vector3;
    respawnTime: number;
    isActive: boolean;
}

// Game mode
export type GameMode = 'ffa' | 'team';

// Full game state sent to clients
export interface GameState {
    players: Map<string, PlayerState> | Record<string, PlayerState>;
    projectiles: ProjectileState[];
    powerUps: PowerUpState[];
    gameMode: GameMode;
    teamScores: { red: number; blue: number };
    serverTime: number;
}

// Client -> Server events
export interface ClientToServerEvents {
    'player:join': (data: { name: string; team?: 'red' | 'blue'; mode?: string; botBehavior?: string }) => void;
    'player:input': (data: PlayerInput) => void;
    'player:shoot': (data: ShootInput) => void;
    'player:respawn': () => void;
    'chat:message': (message: string) => void;
}

// Server -> Client events
export interface ServerToClientEvents {
    'game:state': (state: SerializedGameState) => void;
    'game:init': (data: InitData) => void;
    'player:joined': (player: PlayerState) => void;
    'player:left': (playerId: string) => void;
    'player:hit': (data: HitData) => void;
    'player:killed': (data: KillData) => void;
    'player:respawned': (player: PlayerState) => void;
    'powerup:collected': (data: PowerUpCollectedData) => void;
    'chat:message': (data: ChatMessage) => void;
}

// Serialized game state (Map -> Record for JSON)
export interface SerializedGameState {
    players: Record<string, PlayerState>;
    projectiles: ProjectileState[];
    powerUps: PowerUpState[];
    gameMode: GameMode;
    teamScores: { red: number; blue: number };
    serverTime: number;
}

// Player input from client
export interface PlayerInput {
    forward: number;    // -1 to 1
    strafe: number;     // -1 to 1
    vertical: number;   // -1 to 1
    pitch: number;      // -1 to 1
    yaw: number;        // -1 to 1
    roll: number;       // -1 to 1
    boost: boolean;
    timestamp: number;
}

// Shoot input
export interface ShootInput {
    type: ProjectileType;
    direction: Vector3;
}

// Init data sent when player joins
export interface InitData {
    playerId: string;
    gameState: SerializedGameState;
    spawnPosition: Vector3;
}

// Hit notification
export interface HitData {
    targetId: string;
    attackerId: string;
    damage: number;
    newHealth: number;
}

// Kill notification
export interface KillData {
    victimId: string;
    killerId: string;
    victimName: string;
    killerName: string;
    weapon: ProjectileType;
}

// Power-up collected
export interface PowerUpCollectedData {
    powerUpId: string;
    playerId: string;
    type: PowerUpType;
}

// Chat message
export interface ChatMessage {
    playerId: string;
    playerName: string;
    message: string;
    timestamp: number;
    team?: 'red' | 'blue';
}

// Game constants
export const GAME_CONSTANTS = {
    TICK_RATE: 60,
    WORLD_SIZE: 2000,
    MAX_PLAYERS: 16,

    // Player
    PLAYER_SPEED: 50,
    PLAYER_BOOST_MULTIPLIER: 2,
    PLAYER_MAX_HEALTH: 100,
    PLAYER_MAX_SHIELD: 50,
    RESPAWN_TIME: 3000,

    // Weapons
    LASER_SPEED: 200,
    LASER_DAMAGE: 15,
    LASER_COOLDOWN: 150,

    MISSILE_SPEED: 80,
    MISSILE_DAMAGE: 40,
    MISSILE_COOLDOWN: 1000,

    PLASMA_SPEED: 120,
    PLASMA_DAMAGE: 25,
    PLASMA_COOLDOWN: 300,

    // Power-ups
    POWERUP_SPAWN_INTERVAL: 15000,
    POWERUP_RESPAWN_TIME: 30000,
    SPEED_BOOST_DURATION: 10000,
    RAPIDFIRE_DURATION: 8000,
    DAMAGE_BOOST_DURATION: 12000,
};
