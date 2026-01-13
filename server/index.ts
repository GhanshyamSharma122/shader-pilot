/**
 * Multiplayer Game Server
 * Socket.io based real-time game server with 60Hz tick rate
 */

import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { GameState } from './GameState.js';
import {
    ClientToServerEvents,
    ServerToClientEvents,
    PlayerInput,
    ShootInput,
    ChatMessage,
    GAME_CONSTANTS,
    GameMode,
} from '../shared/Protocol.js';

const PORT = process.env.PORT || 3001;

// Create Express app and HTTP server
const app = express();
const httpServer = createServer(app);

// Create Socket.io server with CORS for development
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
        methods: ['GET', 'POST'],
    },
});

// Initialize game state
let gameState = new GameState('ffa');

// Track socket -> player mapping
const socketToPlayer = new Map<string, string>();

// Chat history (last 50 messages)
const chatHistory: ChatMessage[] = [];
const MAX_CHAT_HISTORY = 50;

// Connection handler
io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Handle player joining
    socket.on('player:join', (data) => {
        const { name, team, mode, botBehavior } = data as { name: string; team?: 'red' | 'blue'; mode?: string; botBehavior?: string };
        const playerId = socket.id;

        // Add player to game
        const player = gameState.addPlayer(playerId, name, team);
        socketToPlayer.set(socket.id, playerId);

        // Enable practice mode with bots if requested
        if (mode === 'practice' && !gameState.isPracticeMode) {
            const isPassive = botBehavior === 'passive';
            console.log(`🤖 Enabling practice mode with ${isPassive ? 'STATIONARY' : 'AGGRESSIVE'} bots`);
            gameState.enablePracticeMode(3, isPassive); // Spawn 3 bots
        }

        console.log(`👤 Player joined: ${name} (${playerId}) ${team ? `Team: ${team}` : 'FFA'} ${mode === 'practice' ? '(Practice)' : ''}`);

        // Send initialization data to the new player
        socket.emit('game:init', {
            playerId,
            gameState: gameState.serialize(),
            spawnPosition: player.position,
        });

        // Notify other players
        socket.broadcast.emit('player:joined', player);
    });

    // Handle player input
    socket.on('player:input', (input: PlayerInput) => {
        const playerId = socketToPlayer.get(socket.id);
        if (playerId) {
            gameState.updatePlayerInput(playerId, input);
        }
    });

    // Handle shooting
    socket.on('player:shoot', (shootInput: ShootInput) => {
        const playerId = socketToPlayer.get(socket.id);
        if (playerId) {
            gameState.playerShoot(playerId, shootInput);
        }
    });

    // Handle respawn request
    socket.on('player:respawn', () => {
        const playerId = socketToPlayer.get(socket.id);
        if (playerId) {
            const player = gameState.respawnPlayer(playerId);
            if (player) {
                io.emit('player:respawned', player);
            }
        }
    });

    // Handle chat messages
    socket.on('chat:message', (message: string) => {
        const playerId = socketToPlayer.get(socket.id);
        if (!playerId) return;

        const player = gameState.players.get(playerId);
        if (!player) return;

        const chatMessage: ChatMessage = {
            playerId,
            playerName: player.name,
            message: message.slice(0, 200), // Limit message length
            timestamp: Date.now(),
            team: player.team || undefined,
        };

        chatHistory.push(chatMessage);
        if (chatHistory.length > MAX_CHAT_HISTORY) {
            chatHistory.shift();
        }

        io.emit('chat:message', chatMessage);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        const playerId = socketToPlayer.get(socket.id);
        if (playerId) {
            console.log(`👋 Player left: ${playerId}`);
            gameState.removePlayer(playerId);
            socketToPlayer.delete(socket.id);
            io.emit('player:left', playerId);
        }
    });
});

// Game loop - runs at ~60Hz
const TICK_INTERVAL = 1000 / GAME_CONSTANTS.TICK_RATE;
let lastTick = Date.now();

function gameLoop() {
    const now = Date.now();
    const deltaTime = (now - lastTick) / 1000; // Convert to seconds
    lastTick = now;

    // Update game state
    const { hits, kills, powerUpsCollected } = gameState.update(deltaTime);

    // Send hit notifications
    hits.forEach(hit => {
        io.emit('player:hit', hit);
    });

    // Send kill notifications
    kills.forEach(kill => {
        io.emit('player:killed', kill);
    });

    // Send power-up collection notifications
    powerUpsCollected.forEach(collected => {
        io.emit('powerup:collected', collected);
    });

    // Broadcast game state to all clients
    io.emit('game:state', gameState.serialize());
}

setInterval(gameLoop, TICK_INTERVAL);

// API endpoints
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        players: gameState.players.size,
        gameMode: gameState.gameMode,
        uptime: process.uptime(),
    });
});

app.post('/api/mode/:mode', (req, res) => {
    const mode = req.params.mode as GameMode;
    if (mode === 'ffa' || mode === 'team') {
        gameState.setGameMode(mode);
        res.json({ success: true, mode });
    } else {
        res.status(400).json({ error: 'Invalid game mode' });
    }
});

// Start server
httpServer.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║     🚀 NEON VOID - Multiplayer Space Shooter 🚀      ║
╠═══════════════════════════════════════════════════════╣
║  Server running on port ${PORT}                          ║
║  Game Mode: ${gameState.gameMode.toUpperCase().padEnd(42)}║
║  Tick Rate: ${GAME_CONSTANTS.TICK_RATE} Hz${' '.repeat(38)}║
╚═══════════════════════════════════════════════════════╝
  `);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    io.close();
    process.exit();
});
