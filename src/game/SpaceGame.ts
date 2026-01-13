/**
 * Main Three.js Game Engine - Full Featured
 * With weapon switching, screen shake, boost trails, and more
 */

import * as THREE from 'three';
import { PlayerShip } from './PlayerShip';
import { RemotePlayer } from './RemotePlayer';
import { Projectile } from './Projectile';
import { Explosion } from './Explosion';
import { Environment, ArenaType } from './Environment';
import { GameClient } from '../network/GameClient';
import { PlayerState, ProjectileState, SerializedGameState, PlayerInput, GAME_CONSTANTS, ProjectileType } from '../../shared/Protocol';

export interface GameCallbacks {
    onScoreUpdate: (score: number, kills: number, deaths: number) => void;
    onHealthUpdate: (health: number, shield: number) => void;
    onKillFeed: (killerName: string, victimName: string, weapon: string) => void;
    onChatMessage: (playerName: string, message: string) => void;
    onDeath: () => void;
    onRespawn: () => void;
    onWeaponChange?: (weapon: ProjectileType) => void;
    onBoostChange?: (isBoosting: boolean) => void;
    // Radar/minimap callbacks
    onPlayersUpdate?: (players: PlayerState[], localPlayerId: string) => void;
    onPositionUpdate?: (x: number, z: number, rotation: number) => void;
    onPowerUpsUpdate?: (powerUps: { id: string; type: string; x: number; z: number; isActive: boolean }[]) => void;
}

export class SpaceGame {
    private container: HTMLElement;
    private renderer: THREE.WebGLRenderer;
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private player: PlayerShip;
    private remotePlayers: Map<string, RemotePlayer> = new Map();
    private projectiles: Map<string, Projectile> = new Map();
    private environment: Environment;
    private client: GameClient;
    private callbacks: GameCallbacks;

    private clock: THREE.Clock;
    private animationId: number = 0;
    private isRunning: boolean = false;

    // Input state
    private keys: Set<string> = new Set();
    private mouseX: number = 0;
    private mouseY: number = 0;
    private mouseLocked: boolean = false;
    private isShooting: boolean = false;
    private lastShootTime: number = 0;

    // Player state
    private playerId: string = '';
    private isAlive: boolean = true;

    // Weapon system
    private currentWeapon: ProjectileType = 'laser';
    private weaponCooldowns: Record<ProjectileType, number> = {
        laser: GAME_CONSTANTS.LASER_COOLDOWN,
        missile: GAME_CONSTANTS.MISSILE_COOLDOWN,
        plasma: GAME_CONSTANTS.PLASMA_COOLDOWN,
    };

    // Screen shake
    private shakeIntensity: number = 0;
    private shakeDecay: number = 5;

    // Boost state
    private isBoosting: boolean = false;
    private boostTrails: THREE.Points[] = [];

    // Speed lines effect
    private speedLines: THREE.Line[] = [];

    // Muzzle flash
    private muzzleFlash: THREE.PointLight | null = null;
    private muzzleFlashTime: number = 0;

    // Explosions
    private explosions: Explosion[] = [];

    // Ship color and arena
    private shipColor: string;
    private arena: ArenaType;

    constructor(container: HTMLElement, callbacks: GameCallbacks, shipColor: string = '#2244aa', arena: ArenaType = 'solar') {
        this.container = container;
        this.callbacks = callbacks;
        this.shipColor = shipColor;
        this.arena = arena;
        this.clock = new THREE.Clock();

        // Initialize renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance',
        });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        container.appendChild(this.renderer.domElement);

        // Initialize scene
        this.scene = new THREE.Scene();

        // Initialize camera
        this.camera = new THREE.PerspectiveCamera(
            70,
            container.clientWidth / container.clientHeight,
            0.1,
            3000
        );
        this.camera.position.set(0, 10, 30);

        // Initialize environment with selected arena
        this.environment = new Environment(this.scene, this.arena);

        // Initialize player ship with selected color
        this.player = new PlayerShip(this.scene, this.camera, this.shipColor);

        // Create muzzle flash light (start invisible)
        this.muzzleFlash = new THREE.PointLight(0x00ffff, 0, 20);
        this.scene.add(this.muzzleFlash);

        // Initialize network client
        this.client = new GameClient();
        this.setupNetworkCallbacks();

        // Setup input handlers
        this.setupInputHandlers();

        // Create speed lines
        this.createSpeedLines();

        // Handle window resize
        window.addEventListener('resize', this.onResize.bind(this));

        // Warn before closing tab while playing (Ctrl+W protection)
        window.addEventListener('beforeunload', (e) => {
            if (this.isRunning && this.isAlive) {
                e.preventDefault();
                e.returnValue = 'You are in a game! Are you sure you want to leave?';
                return e.returnValue;
            }
        });
    }

    private createSpeedLines() {
        const lineCount = 50;
        const material = new THREE.LineBasicMaterial({
            color: 0x4488ff,
            transparent: true,
            opacity: 0,
        });

        for (let i = 0; i < lineCount; i++) {
            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array(6);

            // Random position around the camera
            const angle = Math.random() * Math.PI * 2;
            const radius = 5 + Math.random() * 10;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            positions[0] = x;
            positions[1] = y;
            positions[2] = -20 - Math.random() * 30;
            positions[3] = x;
            positions[4] = y;
            positions[5] = positions[2] - 10;

            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            const line = new THREE.Line(geometry, material.clone());
            this.speedLines.push(line);
            this.scene.add(line);
        }
    }

    private setupNetworkCallbacks() {
        this.client.onInit = (playerId, gameState, spawnPosition) => {
            this.playerId = playerId;
            this.player.setPosition(spawnPosition.x, spawnPosition.y, spawnPosition.z);
            this.syncGameState(gameState);
        };

        this.client.onGameState = (gameState) => {
            this.syncGameState(gameState);
        };

        this.client.onPlayerJoined = (player) => {
            this.addRemotePlayer(player);
        };

        this.client.onPlayerLeft = (playerId) => {
            this.removeRemotePlayer(playerId);
        };

        this.client.onPlayerHit = (data) => {
            if (data.targetId === this.playerId) {
                this.callbacks.onHealthUpdate(data.newHealth, 0);
                this.player.showDamageEffect();
                this.triggerScreenShake(0.5);
            }
            // Note: Hit visual feedback handled by health bar update on enemy
        };

        this.client.onPlayerKilled = (data) => {
            console.log('Player killed:', data.victimName, 'by', data.killerName);
            this.callbacks.onKillFeed(data.killerName, data.victimName, data.weapon);

            // Create explosion at the exact death position from server
            // This fixes the issue where client might have removed the player entity already
            if (data.position) {
                console.log('Creating explosion at server position', data.position);
                const explosion = new Explosion(this.scene, new THREE.Vector3(data.position.x, data.position.y, data.position.z));
                this.explosions.push(explosion);
                this.triggerScreenShake(0.8);
            } else {
                // Fallback (shouldn't happen with new protocol)
                const victim = this.remotePlayers.get(data.victimId);
                if (victim) {
                    const pos = victim.getPosition();
                    const explosion = new Explosion(this.scene, pos);
                    this.explosions.push(explosion);
                }
            }

            if (data.victimId === this.playerId) {
                this.isAlive = false;
                this.callbacks.onDeath();
                this.triggerScreenShake(1.5); // Big shake on death

                // Ensure player hidden
                this.player.setVisible(false);
            }
        };

        this.client.onPlayerRespawned = (player) => {
            if (player.id === this.playerId) {
                this.isAlive = true;
                this.player.setVisible(true);
                this.player.setPosition(player.position.x, player.position.y, player.position.z);
                this.callbacks.onRespawn();
                this.callbacks.onHealthUpdate(player.health, player.shield);
            }
        };


        this.client.onChatMessage = (data) => {
            this.callbacks.onChatMessage(data.playerName, data.message);
        };
    }

    private syncGameState(state: SerializedGameState) {
        // Update remote players
        for (const [id, playerState] of Object.entries(state.players)) {
            if (id === this.playerId) {
                this.callbacks.onScoreUpdate(playerState.score, playerState.kills, playerState.deaths);
                this.callbacks.onHealthUpdate(playerState.health, playerState.shield);
                continue;
            }

            let remote = this.remotePlayers.get(id);
            if (!remote) {
                remote = this.addRemotePlayer(playerState);
            }
            remote?.updateFromServer(playerState);
        }

        // Remove disconnected players
        for (const id of this.remotePlayers.keys()) {
            if (!state.players[id]) {
                this.removeRemotePlayer(id);
            }
        }

        // Update projectiles
        const currentProjIds = new Set(state.projectiles.map(p => p.id));

        for (const projState of state.projectiles) {
            let proj = this.projectiles.get(projState.id);
            if (!proj) {
                // Create new projectile
                proj = new Projectile(this.scene, projState);
                this.projectiles.set(projState.id, proj);
            } else {
                // Update existing projectile position from server
                proj.updatePosition(projState.position.x, projState.position.y, projState.position.z);
            }
        }

        for (const [id, proj] of this.projectiles) {
            if (!currentProjIds.has(id)) {
                proj.dispose();
                this.projectiles.delete(id);
            }
        }

        // Update radar/minimap with player data
        const allPlayers = Object.values(state.players);
        this.callbacks.onPlayersUpdate?.(allPlayers, this.playerId);

        // Update power-ups for minimap
        const powerUpData = state.powerUps.map(p => ({
            id: p.id,
            type: p.type,
            x: p.position.x,
            z: p.position.z,
            isActive: p.isActive,
        }));
        this.callbacks.onPowerUpsUpdate?.(powerUpData);
    }

    private addRemotePlayer(playerState: PlayerState): RemotePlayer {
        const remote = new RemotePlayer(this.scene, playerState);
        this.remotePlayers.set(playerState.id, remote);
        return remote;
    }

    private removeRemotePlayer(playerId: string) {
        const remote = this.remotePlayers.get(playerId);
        if (remote) {
            remote.dispose();
            this.remotePlayers.delete(playerId);
        }
    }

    private setupInputHandlers() {
        // Keyboard down
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();

            // Prevent browser shortcuts when in-game (pointer locked)
            // This prevents Ctrl+W from closing the tab, Ctrl+S from saving, etc.
            if (this.mouseLocked && e.ctrlKey && ['w', 's', 'r', 'q'].includes(key)) {
                e.preventDefault();
            }

            // Prevent default for game keys
            if (['w', 'a', 's', 'd', ' ', 'q', 'e', 'r', '1', '2', '3'].includes(key)) {
                e.preventDefault();
            }
            this.keys.add(key);

            // Weapon switching with 1, 2, 3
            if (key === '1') this.switchWeapon('laser');
            if (key === '2') this.switchWeapon('missile');
            if (key === '3') this.switchWeapon('plasma');

            // Rear-view flip (R key) - quickly flip 180 degrees
            if (key === 'r' && this.isAlive) {
                this.player.flip180();
            }

            // Respawn on space when dead
            if (e.code === 'Space' && !this.isAlive) {
                this.client.respawn();
            }
        });

        // Keyboard up
        window.addEventListener('keyup', (e) => {
            this.keys.delete(e.key.toLowerCase());
        });

        // Mouse movement
        this.container.addEventListener('mousemove', (e) => {
            if (this.mouseLocked) {
                // Store raw delta, will be used once and reset
                this.mouseX = e.movementX * 0.003;
                this.mouseY = e.movementY * 0.003;
            }
        });

        // Mouse buttons
        this.container.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                if (!this.mouseLocked) {
                    this.container.requestPointerLock();
                }
                this.isShooting = true;
            }
            // Right click for secondary weapon
            if (e.button === 2) {
                this.switchWeapon(this.currentWeapon === 'missile' ? 'laser' : 'missile');
            }
        });

        this.container.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.isShooting = false;
            }
        });

        // Mouse wheel for weapon cycling
        this.container.addEventListener('wheel', (e) => {
            e.preventDefault();
            const weapons: ProjectileType[] = ['laser', 'missile', 'plasma'];
            const currentIndex = weapons.indexOf(this.currentWeapon);
            const newIndex = (currentIndex + (e.deltaY > 0 ? 1 : -1) + 3) % 3;
            this.switchWeapon(weapons[newIndex]);
        });

        // Pointer lock change
        document.addEventListener('pointerlockchange', () => {
            this.mouseLocked = document.pointerLockElement === this.container;
            if (!this.mouseLocked) {
                this.isShooting = false;
            }
        });

        // Prevent context menu
        this.container.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    private switchWeapon(weapon: ProjectileType) {
        if (this.currentWeapon !== weapon) {
            this.currentWeapon = weapon;
            this.callbacks.onWeaponChange?.(weapon);
        }
    }

    private triggerScreenShake(intensity: number) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    }

    private triggerMuzzleFlash() {
        if (!this.muzzleFlash) return;

        // Position at ship nose
        const shipPos = this.player.getPosition();
        const forward = this.player.getForwardDirection();
        this.muzzleFlash.position.set(
            shipPos.x - forward.x * 3,
            shipPos.y - forward.y * 3,
            shipPos.z - forward.z * 3
        );

        // Set color based on weapon
        switch (this.currentWeapon) {
            case 'missile':
                this.muzzleFlash.color.setHex(0xff6600);
                break;
            case 'plasma':
                this.muzzleFlash.color.setHex(0xff00ff);
                break;
            default:
                this.muzzleFlash.color.setHex(0x00ffff);
        }

        this.muzzleFlash.intensity = 5;
        this.muzzleFlashTime = 0.05;
    }

    async connect(serverUrl: string, playerName: string, team?: 'red' | 'blue', mode?: string, botBehavior?: string) {
        await this.client.connect(serverUrl);
        this.client.join(playerName, team, mode, botBehavior);
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.clock.start();
        this.animate();
    }

    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    private animate = () => {
        if (!this.isRunning) return;
        this.animationId = requestAnimationFrame(this.animate);

        const delta = Math.min(this.clock.getDelta(), 0.1);
        const time = this.clock.getElapsedTime();

        // Process input and update player
        if (this.isAlive) {
            this.processInput(delta);
            this.player.update(delta, time);

            // Update position for radar
            const pos = this.player.getPosition();
            const rot = this.player.getRotationY();
            this.callbacks.onPositionUpdate?.(pos.x, pos.z, rot);
        }

        // Update remote players
        for (const remote of this.remotePlayers.values()) {
            remote.update(delta, time, this.camera);
        }

        // Update projectiles
        for (const proj of this.projectiles.values()) {
            proj.update(delta);
        }

        // Update environment
        this.environment.update(delta, time, this.camera.position);

        // Update screen shake
        this.updateScreenShake(delta);

        // Update muzzle flash
        this.updateMuzzleFlash(delta);

        // Update speed lines
        this.updateSpeedLines(delta);

        // Update explosions
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const stillActive = this.explosions[i].update(delta);
            if (!stillActive) {
                this.explosions.splice(i, 1);
            }
        }

        // Render
        this.renderer.render(this.scene, this.camera);
    };

    private updateScreenShake(delta: number) {
        if (this.shakeIntensity > 0.01) {
            // Apply random offset to camera
            const shakeX = (Math.random() - 0.5) * this.shakeIntensity;
            const shakeY = (Math.random() - 0.5) * this.shakeIntensity;
            this.camera.position.x += shakeX;
            this.camera.position.y += shakeY;

            // Decay shake
            this.shakeIntensity *= Math.pow(0.1, delta * this.shakeDecay);
        } else {
            this.shakeIntensity = 0;
        }
    }

    private updateMuzzleFlash(delta: number) {
        if (this.muzzleFlash && this.muzzleFlashTime > 0) {
            this.muzzleFlashTime -= delta;
            if (this.muzzleFlashTime <= 0) {
                this.muzzleFlash.intensity = 0;
            }
        }
    }

    private updateSpeedLines(delta: number) {
        // Speed lines activate when boosting
        const boostActive = this.isBoosting;

        this.speedLines.forEach((line, i) => {
            const mat = line.material as THREE.LineBasicMaterial;

            if (boostActive) {
                // Show and animate speed lines when boosting fast
                mat.opacity = Math.min(mat.opacity + delta * 3, 0.4);

                // Move lines toward camera
                const positions = line.geometry.attributes.position.array as Float32Array;
                const boostSpeed = 50; // Speed for animation
                positions[2] += boostSpeed * delta * 0.5;
                positions[5] += boostSpeed * delta * 0.5;

                // Reset if too close
                if (positions[2] > 10) {
                    const angle = Math.random() * Math.PI * 2;
                    const radius = 5 + Math.random() * 10;
                    positions[0] = Math.cos(angle) * radius;
                    positions[1] = Math.sin(angle) * radius;
                    positions[2] = -30 - Math.random() * 20;
                    positions[3] = positions[0];
                    positions[4] = positions[1];
                    positions[5] = positions[2] - 5 - Math.random() * 5;
                }

                line.geometry.attributes.position.needsUpdate = true;

                // Position relative to camera
                line.position.copy(this.camera.position);
                line.quaternion.copy(this.camera.quaternion);
            } else {
                mat.opacity = Math.max(mat.opacity - delta * 5, 0);
            }
        });
    }

    private processInput(delta: number) {
        const input: PlayerInput = {
            forward: 0,
            strafe: 0,
            vertical: 0,
            pitch: 0,
            yaw: 0,
            roll: 0,
            boost: false,
            timestamp: Date.now(),
        };

        // WASD movement
        if (this.keys.has('w')) input.forward = 1;
        if (this.keys.has('s')) input.forward = -1;
        if (this.keys.has('a')) input.strafe = -1;
        if (this.keys.has('d')) input.strafe = 1;

        // Vertical movement
        if (this.keys.has(' ')) input.vertical = 1;
        if (this.keys.has('shift')) input.vertical = -1;

        // Roll
        if (this.keys.has('q')) input.roll = 1;
        if (this.keys.has('e')) input.roll = -1;

        // Boost (B key instead of Ctrl to avoid browser shortcuts)
        if (this.keys.has('b')) {
            input.boost = true;
            if (!this.isBoosting) {
                this.isBoosting = true;
                this.callbacks.onBoostChange?.(true);
            }
        } else {
            if (this.isBoosting) {
                this.isBoosting = false;
                this.callbacks.onBoostChange?.(false);
            }
        }

        // Mouse look
        if (this.mouseLocked) {
            input.pitch = this.mouseY;
            input.yaw = this.mouseX;
        }

        // Reset mouse delta after use (prevents drift)
        this.mouseX = 0;
        this.mouseY = 0;

        // Apply input
        this.player.applyInput(input, delta);
        this.client.sendInput(input);

        // Handle shooting
        if (this.isShooting && this.mouseLocked) {
            const now = Date.now();
            const cooldown = this.weaponCooldowns[this.currentWeapon];

            if (now - this.lastShootTime >= cooldown) {
                this.lastShootTime = now;
                let direction = this.player.getForwardDirection();
                const playerPos = this.player.getPosition();

                // Auto-aim: Find closest enemy near crosshair and adjust direction
                const autoAimAngle = 0.3; // ~17 degrees cone
                let closestEnemy: THREE.Vector3 | null = null;
                let closestDot = Math.cos(autoAimAngle);

                for (const remote of this.remotePlayers.values()) {
                    if (!remote.playerState.isAlive) continue;

                    const enemyPos = remote.getPosition();
                    const toEnemy = new THREE.Vector3(
                        enemyPos.x - playerPos.x,
                        enemyPos.y - playerPos.y,
                        enemyPos.z - playerPos.z
                    );
                    const dist = toEnemy.length();
                    if (dist > 300) continue; // Max auto-aim range

                    toEnemy.normalize();
                    const forwardVec = new THREE.Vector3(direction.x, direction.y, direction.z);
                    const dot = forwardVec.dot(toEnemy);

                    if (dot > closestDot) {
                        closestDot = dot;
                        closestEnemy = toEnemy;
                    }
                }

                // If enemy found near crosshair, blend toward them
                if (closestEnemy) {
                    const blendAmount = 0.4; // 40% auto-aim assist
                    direction = {
                        x: direction.x * (1 - blendAmount) + closestEnemy.x * blendAmount,
                        y: direction.y * (1 - blendAmount) + closestEnemy.y * blendAmount,
                        z: direction.z * (1 - blendAmount) + closestEnemy.z * blendAmount,
                    };
                    // Normalize
                    const len = Math.sqrt(direction.x * direction.x + direction.y * direction.y + direction.z * direction.z);
                    direction.x /= len;
                    direction.y /= len;
                    direction.z /= len;
                }

                // Send to server
                this.client.shoot(this.currentWeapon, direction);

                // Create instant local projectile for immediate visual feedback
                const speed = this.currentWeapon === 'missile' ? 80 : this.currentWeapon === 'plasma' ? 120 : 200;
                const localProjectile = new Projectile(this.scene, {
                    id: `local_${now}`,
                    ownerId: this.playerId,
                    type: this.currentWeapon,
                    position: { x: playerPos.x, y: playerPos.y, z: playerPos.z },
                    velocity: { x: direction.x * speed, y: direction.y * speed, z: direction.z * speed },
                    damage: 0,
                    createdAt: now,
                });
                this.projectiles.set(`local_${now}`, localProjectile);

                // Remove local projectile after a short time (server will provide the real one)
                setTimeout(() => {
                    const proj = this.projectiles.get(`local_${now}`);
                    if (proj) {
                        proj.dispose();
                        this.projectiles.delete(`local_${now}`);
                    }
                }, 500);

                this.triggerMuzzleFlash();

                // Small shake when shooting
                if (this.currentWeapon === 'missile') {
                    this.triggerScreenShake(0.2);
                } else {
                    this.triggerScreenShake(0.05);
                }
            }
        }
    }

    private onResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    sendChatMessage(message: string) {
        this.client.sendChat(message);
    }

    dispose() {
        this.stop();
        this.client.disconnect();
        this.player.dispose();
        this.environment.dispose();

        for (const remote of this.remotePlayers.values()) {
            remote.dispose();
        }

        for (const proj of this.projectiles.values()) {
            proj.dispose();
        }

        for (const line of this.speedLines) {
            line.geometry.dispose();
            (line.material as THREE.Material).dispose();
            this.scene.remove(line);
        }

        this.renderer.dispose();
        window.removeEventListener('resize', this.onResize.bind(this));
    }
}
