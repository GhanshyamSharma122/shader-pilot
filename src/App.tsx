/**
 * NEON VOID - Multiplayer Space Shooter
 * Main Game Application
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SpaceGame, GameCallbacks } from './game/SpaceGame';
import { MainMenu } from './components/MainMenu';
import { GameHUD } from './components/GameHUD';
import { Minimap } from './components/Minimap';
import { Leaderboard } from './components/Leaderboard';
import { ChatPanel } from './components/ChatPanel';
import { ControlsPanel } from './components/ControlsPanel';
import { SerializedGameState, PlayerState } from '../shared/Protocol';

// Server URL - change for production
const SERVER_URL = 'http://localhost:3001';

interface GameStats {
    health: number;
    maxHealth: number;
    shield: number;
    score: number;
    kills: number;
    deaths: number;
}

interface KillFeedEntry {
    killerName: string;
    victimName: string;
    weapon: string;
    timestamp: number;
}

interface ChatMessage {
    playerName: string;
    message: string;
    timestamp: number;
    team?: 'red' | 'blue';
    isSystem?: boolean;
}

const App: React.FC = () => {
    // Game state
    const [gameState, setGameState] = useState<'menu' | 'playing'>('menu');
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | undefined>();

    // Player info
    const [playerId, setPlayerId] = useState<string>('');
    const [playerPosition, setPlayerPosition] = useState({ x: 0, z: 0 });
    const [playerRotation, setPlayerRotation] = useState(0);

    // Game stats
    const [stats, setStats] = useState<GameStats>({
        health: 100,
        maxHealth: 100,
        shield: 0,
        score: 0,
        kills: 0,
        deaths: 0,
    });

    // UI state
    const [isAlive, setIsAlive] = useState(true);
    const [killFeed, setKillFeed] = useState<KillFeedEntry[]>([]);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [players, setPlayers] = useState<PlayerState[]>([]);
    const [gameMode, setGameMode] = useState<'ffa' | 'team' | 'practice'>('ffa');
    const [teamScores, setTeamScores] = useState({ red: 0, blue: 0 });
    const [powerUps, setPowerUps] = useState<{ id: string; type: string; x: number; z: number; isActive: boolean }[]>([]);

    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const gameRef = useRef<SpaceGame | null>(null);

    // Handle game callbacks
    const createGameCallbacks = useCallback((): GameCallbacks => ({
        onScoreUpdate: (score, kills, deaths) => {
            setStats(prev => ({ ...prev, score, kills, deaths }));
        },
        onHealthUpdate: (health, shield) => {
            setStats(prev => ({ ...prev, health, shield }));
        },
        onKillFeed: (killerName, victimName, weapon) => {
            setKillFeed(prev => [...prev.slice(-9), { killerName, victimName, weapon, timestamp: Date.now() }]);
        },
        onChatMessage: (playerName, message) => {
            setChatMessages(prev => [...prev.slice(-49), { playerName, message, timestamp: Date.now() }]);
        },
        onDeath: () => {
            setIsAlive(false);
        },
        onRespawn: () => {
            setIsAlive(true);
        },
    }), []);

    // Handle game state updates
    useEffect(() => {
        if (gameRef.current) {
            // The game engine handles state internally
            // We could add periodic state sync here if needed
        }
    }, []);

    // Handle keyboard for leaderboard
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Tab' && gameState === 'playing') {
                e.preventDefault();
                setShowLeaderboard(true);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Tab') {
                setShowLeaderboard(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [gameState]);

    // Join game handler
    const handleJoin = async (playerName: string, mode: 'ffa' | 'team' | 'practice', team?: 'red' | 'blue', shipColor?: string, arena?: string, botBehavior?: string) => {
        if (!containerRef.current) return;

        setIsConnecting(true);
        setError(undefined);
        setGameMode(mode);

        try {
            // Create game instance with ship color and arena
            const game = new SpaceGame(containerRef.current, createGameCallbacks(), shipColor, arena as any);
            gameRef.current = game;

            // Connect to server with game mode and bot behavior
            await game.connect(SERVER_URL, playerName, team, mode, botBehavior);

            // Start game loop
            game.start();

            setGameState('playing');

            // Add system message
            setChatMessages(prev => [...prev, {
                playerName: 'System',
                message: `Welcome to NEON VOID, ${playerName}!`,
                timestamp: Date.now(),
                isSystem: true,
            }]);
        } catch (err) {
            console.error('Failed to connect:', err);
            setError('Failed to connect to server. Make sure the server is running on port 3001.');
            gameRef.current?.dispose();
            gameRef.current = null;
        } finally {
            setIsConnecting(false);
        }
    };

    // Send chat message
    const handleSendChat = (message: string) => {
        gameRef.current?.sendChatMessage(message);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            gameRef.current?.dispose();
        };
    }, []);

    return (
        <div className="w-screen h-screen bg-black overflow-hidden">
            {/* Game canvas container */}
            <div ref={containerRef} className="w-full h-full" />

            {/* Menu */}
            {gameState === 'menu' && (
                <MainMenu
                    onJoin={handleJoin}
                    isConnecting={isConnecting}
                    error={error}
                />
            )}

            {/* In-game UI */}
            {gameState === 'playing' && (
                <>
                    <GameHUD
                        health={stats.health}
                        maxHealth={stats.maxHealth}
                        shield={stats.shield}
                        score={stats.score}
                        kills={stats.kills}
                        deaths={stats.deaths}
                        isAlive={isAlive}
                        killFeed={killFeed}
                    />

                    <Minimap
                        players={players.map(p => ({
                            id: p.id,
                            name: p.name,
                            x: p.position.x,
                            z: p.position.z,
                            team: p.team,
                            isAlive: p.isAlive,
                        }))}
                        powerUps={powerUps}
                        playerPosition={playerPosition}
                        playerRotation={playerRotation}
                        localPlayerId={playerId}
                    />

                    <Leaderboard
                        players={players}
                        localPlayerId={playerId}
                        gameMode={gameMode}
                        teamScores={teamScores}
                        isVisible={showLeaderboard}
                    />

                    <ChatPanel
                        messages={chatMessages}
                        onSendMessage={handleSendChat}
                        isVisible={true}
                    />

                    <ControlsPanel />
                </>
            )}
        </div>
    );
};

export default App;
