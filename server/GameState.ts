/**
 * Game State Manager
 * Handles all game logic, physics, and state management on the server
 */

import {
    PlayerState,
    ProjectileState,
    PowerUpState,
    GameMode,
    SerializedGameState,
    PlayerInput,
    ShootInput,
    Vector3,
    Quaternion,
    PowerUpType,
    GAME_CONSTANTS,
} from '../shared/Protocol.js';

// Random spawn positions
const SPAWN_POSITIONS: Vector3[] = [
    { x: 0, y: 0, z: 0 },
    { x: 500, y: 100, z: 500 },
    { x: -500, y: -100, z: 500 },
    { x: 500, y: 50, z: -500 },
    { x: -500, y: -50, z: -500 },
    { x: 0, y: 200, z: 800 },
    { x: 0, y: -200, z: -800 },
    { x: 800, y: 0, z: 0 },
    { x: -800, y: 0, z: 0 },
];

// Team spawn positions
const TEAM_SPAWNS = {
    red: [
        { x: -800, y: 0, z: 0 },
        { x: -700, y: 100, z: 200 },
        { x: -700, y: -100, z: -200 },
    ],
    blue: [
        { x: 800, y: 0, z: 0 },
        { x: 700, y: 100, z: 200 },
        { x: 700, y: -100, z: -200 },
    ],
};

// Bot names
const BOT_NAMES = [
    'Viper', 'Ghost', 'Phoenix', 'Shadow', 'Storm',
    'Blaze', 'Frost', 'Thunder', 'Raven', 'Wolf',
    'Cobra', 'Falcon', 'Hawk', 'Tiger', 'Dragon'
];

// Bot state
interface BotState {
    id: string;
    targetId: string | null;
    lastShootTime: number;
    moveDirection: Vector3;
    changeDirectionTime: number;
    respawnTime: number;
}

export class GameState {
    players: Map<string, PlayerState> = new Map();
    projectiles: ProjectileState[] = [];
    powerUps: PowerUpState[] = [];
    gameMode: GameMode = 'ffa';
    teamScores = { red: 0, blue: 0 };
    isPracticeMode: boolean = false;

    private projectileIdCounter = 0;
    private powerUpIdCounter = 0;
    private botIdCounter = 0;
    private lastPowerUpSpawn = 0;

    // Bot tracking
    private bots: Map<string, BotState> = new Map();
    private botCount = 0;

    constructor(mode: GameMode = 'ffa') {
        this.gameMode = mode;
        this.initPowerUps();
    }

    private initPowerUps() {
        const positions: Vector3[] = [
            { x: 0, y: 0, z: 0 },
            { x: 300, y: 50, z: 300 },
            { x: -300, y: -50, z: 300 },
            { x: 300, y: 0, z: -300 },
            { x: -300, y: 0, z: -300 },
            { x: 0, y: 150, z: 0 },
        ];

        const types: PowerUpType[] = ['health', 'shield', 'speed', 'rapidfire', 'damage'];

        positions.forEach((pos, i) => {
            this.powerUps.push({
                id: `powerup_${this.powerUpIdCounter++}`,
                type: types[i % types.length],
                position: pos,
                respawnTime: 0,
                isActive: true,
            });
        });
    }

    // Enable practice mode with bots
    enablePracticeMode(numBots: number = 3) {
        this.isPracticeMode = true;
        this.botCount = numBots;

        // Spawn initial bots
        for (let i = 0; i < numBots; i++) {
            this.spawnBot();
        }
    }

    private spawnBot(): PlayerState {
        const botId = `bot_${this.botIdCounter++}`;
        const botName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)] + '_' + Math.floor(Math.random() * 100);
        const spawnPos = this.getSpawnPosition(null);

        const bot: PlayerState = {
            id: botId,
            name: `🤖 ${botName}`,
            position: { ...spawnPos },
            rotation: { x: 0, y: Math.random() * Math.PI * 2, z: 0, w: 1 },
            velocity: { x: 0, y: 0, z: 0 },
            health: GAME_CONSTANTS.PLAYER_MAX_HEALTH,
            maxHealth: GAME_CONSTANTS.PLAYER_MAX_HEALTH,
            shield: 0,
            score: 0,
            kills: 0,
            deaths: 0,
            team: null,
            isAlive: true,
            lastUpdateTime: Date.now(),
        };

        this.players.set(botId, bot);

        // Create bot state
        this.bots.set(botId, {
            id: botId,
            targetId: null,
            lastShootTime: 0,
            moveDirection: this.randomDirection(),
            changeDirectionTime: Date.now() + 2000 + Math.random() * 3000,
            respawnTime: 0,
        });

        return bot;
    }

    private randomDirection(): Vector3 {
        const angle = Math.random() * Math.PI * 2;
        const pitch = (Math.random() - 0.5) * Math.PI * 0.3;
        return {
            x: Math.cos(angle) * Math.cos(pitch),
            y: Math.sin(pitch),
            z: Math.sin(angle) * Math.cos(pitch),
        };
    }

    addPlayer(id: string, name: string, team?: 'red' | 'blue'): PlayerState {
        const spawnPos = this.getSpawnPosition(team || null);

        const player: PlayerState = {
            id,
            name,
            position: { ...spawnPos },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
            velocity: { x: 0, y: 0, z: 0 },
            health: GAME_CONSTANTS.PLAYER_MAX_HEALTH,
            maxHealth: GAME_CONSTANTS.PLAYER_MAX_HEALTH,
            shield: 0,
            score: 0,
            kills: 0,
            deaths: 0,
            team: this.gameMode === 'team' ? (team || 'red') : null,
            isAlive: true,
            lastUpdateTime: Date.now(),
        };

        this.players.set(id, player);
        return player;
    }

    removePlayer(id: string) {
        this.players.delete(id);
        this.projectiles = this.projectiles.filter(p => p.ownerId !== id);
    }

    getSpawnPosition(team: 'red' | 'blue' | null): Vector3 {
        if (team && this.gameMode === 'team') {
            const spawns = TEAM_SPAWNS[team];
            return { ...spawns[Math.floor(Math.random() * spawns.length)] };
        }
        return { ...SPAWN_POSITIONS[Math.floor(Math.random() * SPAWN_POSITIONS.length)] };
    }

    updatePlayerInput(playerId: string, input: PlayerInput) {
        const player = this.players.get(playerId);
        if (!player || !player.isAlive) return;

        const speed = GAME_CONSTANTS.PLAYER_SPEED * (input.boost ? GAME_CONSTANTS.PLAYER_BOOST_MULTIPLIER : 1);

        player.velocity.x = input.strafe * speed;
        player.velocity.y = input.vertical * speed;
        player.velocity.z = input.forward * speed;

        const rotSpeed = 0.03;
        player.rotation.x += input.pitch * rotSpeed;
        player.rotation.y += input.yaw * rotSpeed;
        player.rotation.z += input.roll * rotSpeed;

        player.lastUpdateTime = Date.now();
    }

    playerShoot(playerId: string, shootInput: ShootInput): ProjectileState | null {
        const player = this.players.get(playerId);
        if (!player || !player.isAlive) return null;

        const { type, direction } = shootInput;

        let speed: number, damage: number;
        switch (type) {
            case 'missile':
                speed = GAME_CONSTANTS.MISSILE_SPEED;
                damage = GAME_CONSTANTS.MISSILE_DAMAGE;
                break;
            case 'plasma':
                speed = GAME_CONSTANTS.PLASMA_SPEED;
                damage = GAME_CONSTANTS.PLASMA_DAMAGE;
                break;
            default:
                speed = GAME_CONSTANTS.LASER_SPEED;
                damage = GAME_CONSTANTS.LASER_DAMAGE;
        }

        const projectile: ProjectileState = {
            id: `proj_${this.projectileIdCounter++}`,
            ownerId: playerId,
            type,
            position: { ...player.position },
            velocity: {
                x: direction.x * speed,
                y: direction.y * speed,
                z: direction.z * speed,
            },
            damage,
            createdAt: Date.now(),
        };

        this.projectiles.push(projectile);
        return projectile;
    }

    respawnPlayer(playerId: string): PlayerState | null {
        const player = this.players.get(playerId);
        if (!player) return null;

        const spawnPos = this.getSpawnPosition(player.team);

        player.position = { ...spawnPos };
        player.rotation = { x: 0, y: 0, z: 0, w: 1 };
        player.velocity = { x: 0, y: 0, z: 0 };
        player.health = GAME_CONSTANTS.PLAYER_MAX_HEALTH;
        player.shield = 0;
        player.isAlive = true;
        player.lastUpdateTime = Date.now();

        return player;
    }

    // Update bot AI
    private updateBots(deltaTime: number): void {
        const now = Date.now();

        this.bots.forEach((botState, botId) => {
            const bot = this.players.get(botId);
            if (!bot) return;

            // Handle respawn
            if (!bot.isAlive) {
                if (botState.respawnTime === 0) {
                    botState.respawnTime = now + 3000; // 3 second respawn
                } else if (now >= botState.respawnTime) {
                    this.respawnPlayer(botId);
                    botState.respawnTime = 0;
                }
                return;
            }

            // Find nearest human player target
            let nearestPlayer: PlayerState | null = null;
            let nearestDistance = Infinity;

            this.players.forEach((player, playerId) => {
                if (playerId === botId || !player.isAlive || this.bots.has(playerId)) return;

                const dx = player.position.x - bot.position.x;
                const dy = player.position.y - bot.position.y;
                const dz = player.position.z - bot.position.z;
                const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestPlayer = player;
                }
            });

            // Update movement
            if (now >= botState.changeDirectionTime) {
                botState.moveDirection = this.randomDirection();
                botState.changeDirectionTime = now + 2000 + Math.random() * 3000;
            }

            const botSpeed = 25;

            if (nearestPlayer && nearestDistance < 300) {
                // Chase player
                const dx = nearestPlayer.position.x - bot.position.x;
                const dy = nearestPlayer.position.y - bot.position.y;
                const dz = nearestPlayer.position.z - bot.position.z;
                const len = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (len > 0) {
                    bot.velocity.x = (dx / len) * botSpeed;
                    bot.velocity.y = (dy / len) * botSpeed;
                    bot.velocity.z = (dz / len) * botSpeed;

                    // Face target
                    bot.rotation.y = Math.atan2(dx, dz);
                }

                // Shoot at player
                if (nearestDistance < 200 && now - botState.lastShootTime > 500) {
                    botState.lastShootTime = now;

                    const direction = {
                        x: dx / len,
                        y: dy / len,
                        z: dz / len,
                    };

                    this.playerShoot(botId, { type: 'laser', direction });
                }
            } else {
                // Random movement
                bot.velocity.x = botState.moveDirection.x * botSpeed;
                bot.velocity.y = botState.moveDirection.y * botSpeed;
                bot.velocity.z = botState.moveDirection.z * botSpeed;
            }
        });
    }

    update(deltaTime: number): { hits: HitResult[], kills: KillResult[], powerUpsCollected: PowerUpCollectResult[] } {
        const hits: HitResult[] = [];
        const kills: KillResult[] = [];
        const powerUpsCollected: PowerUpCollectResult[] = [];
        const now = Date.now();

        // Update bots
        if (this.isPracticeMode) {
            this.updateBots(deltaTime);
        }

        // Update player positions
        this.players.forEach(player => {
            if (!player.isAlive) return;

            player.position.x += player.velocity.x * deltaTime;
            player.position.y += player.velocity.y * deltaTime;
            player.position.z += player.velocity.z * deltaTime;

            // World bounds
            const bounds = GAME_CONSTANTS.WORLD_SIZE / 2;
            player.position.x = Math.max(-bounds, Math.min(bounds, player.position.x));
            player.position.y = Math.max(-bounds, Math.min(bounds, player.position.y));
            player.position.z = Math.max(-bounds, Math.min(bounds, player.position.z));
        });

        // Update projectiles
        const projectilesToRemove: string[] = [];

        this.projectiles.forEach(proj => {
            proj.position.x += proj.velocity.x * deltaTime;
            proj.position.y += proj.velocity.y * deltaTime;
            proj.position.z += proj.velocity.z * deltaTime;

            if (now - proj.createdAt > 5000) {
                projectilesToRemove.push(proj.id);
                return;
            }

            const bounds = GAME_CONSTANTS.WORLD_SIZE / 2;
            if (Math.abs(proj.position.x) > bounds ||
                Math.abs(proj.position.y) > bounds ||
                Math.abs(proj.position.z) > bounds) {
                projectilesToRemove.push(proj.id);
                return;
            }

            // Check collision with players
            this.players.forEach(player => {
                if (!player.isAlive) return;
                if (player.id === proj.ownerId) return;

                if (this.gameMode === 'team') {
                    const owner = this.players.get(proj.ownerId);
                    if (owner && owner.team === player.team) return;
                }

                const dx = player.position.x - proj.position.x;
                const dy = player.position.y - proj.position.y;
                const dz = player.position.z - proj.position.z;
                const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (distance < 10) {
                    projectilesToRemove.push(proj.id);

                    let damage = proj.damage;
                    if (player.shield > 0) {
                        const shieldDamage = Math.min(player.shield, damage);
                        player.shield -= shieldDamage;
                        damage -= shieldDamage;
                    }
                    player.health -= damage;

                    hits.push({
                        targetId: player.id,
                        attackerId: proj.ownerId,
                        damage: proj.damage,
                        newHealth: player.health,
                    });

                    if (player.health <= 0) {
                        player.health = 0;
                        player.isAlive = false;
                        player.deaths++;

                        const attacker = this.players.get(proj.ownerId);
                        if (attacker) {
                            attacker.kills++;
                            attacker.score += 100;

                            if (this.gameMode === 'team' && attacker.team) {
                                this.teamScores[attacker.team]++;
                            }
                        }

                        kills.push({
                            victimId: player.id,
                            killerId: proj.ownerId,
                            victimName: player.name,
                            killerName: attacker?.name || 'Unknown',
                            weapon: proj.type,
                        });
                    }
                }
            });
        });

        this.projectiles = this.projectiles.filter(p => !projectilesToRemove.includes(p.id));

        // Update power-ups
        this.powerUps.forEach(powerUp => {
            if (!powerUp.isActive) {
                if (now >= powerUp.respawnTime) {
                    powerUp.isActive = true;
                }
                return;
            }

            this.players.forEach(player => {
                if (!player.isAlive) return;

                const dx = player.position.x - powerUp.position.x;
                const dy = player.position.y - powerUp.position.y;
                const dz = player.position.z - powerUp.position.z;
                const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (distance < 15) {
                    this.applyPowerUp(player, powerUp.type);
                    powerUp.isActive = false;
                    powerUp.respawnTime = now + GAME_CONSTANTS.POWERUP_RESPAWN_TIME;

                    powerUpsCollected.push({
                        powerUpId: powerUp.id,
                        playerId: player.id,
                        type: powerUp.type,
                    });
                }
            });
        });

        return { hits, kills, powerUpsCollected };
    }

    private applyPowerUp(player: PlayerState, type: PowerUpType) {
        switch (type) {
            case 'health':
                player.health = Math.min(player.maxHealth, player.health + 50);
                break;
            case 'shield':
                player.shield = Math.min(GAME_CONSTANTS.PLAYER_MAX_SHIELD, player.shield + 50);
                break;
        }
    }

    serialize(): SerializedGameState {
        const playersObj: Record<string, PlayerState> = {};
        this.players.forEach((player, id) => {
            playersObj[id] = player;
        });

        return {
            players: playersObj,
            projectiles: this.projectiles,
            powerUps: this.powerUps,
            gameMode: this.gameMode,
            teamScores: this.teamScores,
            serverTime: Date.now(),
        };
    }

    setGameMode(mode: GameMode) {
        this.gameMode = mode;
        this.teamScores = { red: 0, blue: 0 };
    }
}

// Result types
interface HitResult {
    targetId: string;
    attackerId: string;
    damage: number;
    newHealth: number;
}

interface KillResult {
    victimId: string;
    killerId: string;
    victimName: string;
    killerName: string;
    weapon: string;
}

interface PowerUpCollectResult {
    powerUpId: string;
    playerId: string;
    type: PowerUpType;
}

