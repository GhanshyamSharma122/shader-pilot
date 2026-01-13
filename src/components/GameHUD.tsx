/**
 * Game HUD Component
 * Displays health, shield, ammo, score, and kill feed
 */

import React from 'react';

interface HUDProps {
    health: number;
    maxHealth: number;
    shield: number;
    score: number;
    kills: number;
    deaths: number;
    isAlive: boolean;
    killFeed: { killerName: string; victimName: string; weapon: string; timestamp: number }[];
    targetStatus: { name: string; health: number; maxHealth: number; shield: number } | null;
}

export const GameHUD: React.FC<HUDProps> = ({
    health,
    maxHealth,
    shield,
    score,
    kills,
    deaths,
    isAlive,
    killFeed,
    targetStatus,
}) => {
    const healthPercent = (health / maxHealth) * 100;
    const shieldPercent = (shield / 50) * 100;

    return (
        <>
            {/* Health & Shield Bars - Bottom Left */}
            <div className="fixed bottom-6 left-6 z-40 pointer-events-none">
                <div className="flex flex-col gap-2">
                    {/* Shield Bar */}
                    <div className="w-64">
                        <div className="flex justify-between text-xs text-cyan-400 mb-1 font-mono">
                            <span>SHIELD</span>
                            <span>{Math.round(shield)}</span>
                        </div>
                        <div className="h-3 bg-gray-900/80 rounded-full border border-cyan-500/50 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 transition-all duration-200"
                                style={{ width: `${shieldPercent}%` }}
                            />
                        </div>
                    </div>

                    {/* Health Bar */}
                    <div className="w-64">
                        <div className="flex justify-between text-xs text-pink-400 mb-1 font-mono">
                            <span>HULL</span>
                            <span>{Math.round(health)}</span>
                        </div>
                        <div className="h-4 bg-gray-900/80 rounded-full border border-pink-500/50 overflow-hidden">
                            <div
                                className="h-full transition-all duration-200"
                                style={{
                                    width: `${healthPercent}%`,
                                    background: healthPercent > 50
                                        ? 'linear-gradient(90deg, #ec4899, #f472b6)'
                                        : healthPercent > 25
                                            ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                                            : 'linear-gradient(90deg, #ef4444, #f87171)',
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Target Status - Left Center */}
            {targetStatus && (
                <div className="fixed left-6 top-1/2 -translate-y-1/2 z-40 pointer-events-none">
                    <div className="bg-gray-900/80 backdrop-blur-sm border border-red-500/50 rounded-lg p-4 w-64 animate-fade-in">
                        <div className="text-sm text-red-400 font-mono mb-2 uppercase tracking-wider">Target Locked</div>
                        <div className="text-xl font-bold text-white mb-3 truncate">{targetStatus.name}</div>

                        {/* Target Shield */}
                        <div className="mb-2">
                            <div className="flex justify-between text-xs text-cyan-400 mb-1 font-mono">
                                <span>SHIELD</span>
                                <span>{Math.round(targetStatus.shield)}</span>
                            </div>
                            <div className="h-2 bg-gray-800 rounded-full border border-cyan-500/30 overflow-hidden">
                                <div
                                    className="h-full bg-cyan-500 transition-all duration-200"
                                    style={{ width: `${(targetStatus.shield / 50) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Target Health */}
                        <div>
                            <div className="flex justify-between text-xs text-red-400 mb-1 font-mono">
                                <span>HULL</span>
                                <span>{Math.round(targetStatus.health)}</span>
                            </div>
                            <div className="h-3 bg-gray-800 rounded-full border border-red-500/30 overflow-hidden">
                                <div
                                    className="h-full bg-red-500 transition-all duration-200"
                                    style={{ width: `${(targetStatus.health / targetStatus.maxHealth) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Score Display - Top Center */}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
                <div className="bg-gray-900/80 backdrop-blur-sm border border-purple-500/50 rounded-lg px-6 py-3 text-center">
                    <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500 font-mono">
                        {score.toLocaleString()}
                    </div>
                    <div className="flex gap-4 text-xs text-gray-400 mt-1 font-mono">
                        <span className="text-green-400">K: {kills}</span>
                        <span className="text-red-400">D: {deaths}</span>
                        <span className="text-yellow-400">K/D: {deaths > 0 ? (kills / deaths).toFixed(2) : kills}</span>
                    </div>
                </div>
            </div>

            {/* Kill Feed - Top Left (was Top Right) */}
            <div className="fixed top-6 left-6 z-40 pointer-events-none">
                <div className="flex flex-col gap-1 items-start">
                    {/* Kill Feed Items */}
                    {killFeed.slice(-5).map((kill, index) => (
                        <div
                            key={kill.timestamp + index}
                            className="px-1 text-sm font-mono animate-fade-in drop-shadow-md"
                        >
                            <span className="text-cyan-400">{kill.killerName}</span>
                            <span className="text-gray-500 mx-2">⚡</span>
                            <span className="text-pink-400">{kill.victimName}</span>
                        </div>
                    ))}

                    {/* My Kills Counter */}
                    <div className="mt-2 text-green-400 font-mono text-sm font-bold px-1 drop-shadow-md">
                        KILLS: {kills}
                    </div>
                </div>
            </div>

            {/* Death Screen */}
            {!isAlive && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-none">
                    <div className="text-center">
                        <div className="text-6xl font-bold text-red-500 mb-4 animate-pulse">
                            DESTROYED
                        </div>
                        <div className="text-xl text-gray-300 font-mono">
                            Press <span className="text-cyan-400 font-bold">SPACE</span> to respawn
                        </div>
                    </div>
                </div>
            )}

            {/* Crosshair */}
            {isAlive && (
                <div className="fixed inset-0 z-30 flex items-center justify-center pointer-events-none">
                    <svg width="40" height="40" viewBox="0 0 40 40" style={{ filter: 'drop-shadow(0 0 4px rgba(0, 255, 255, 0.8))' }}>
                        {/* Center dot */}
                        <circle cx="20" cy="20" r="3" fill="#00ffff" />
                        {/* Top line */}
                        <line x1="20" y1="5" x2="20" y2="14" stroke="#00ffff" strokeWidth="2" strokeLinecap="round" />
                        {/* Bottom line */}
                        <line x1="20" y1="26" x2="20" y2="35" stroke="#00ffff" strokeWidth="2" strokeLinecap="round" />
                        {/* Left line */}
                        <line x1="5" y1="20" x2="14" y2="20" stroke="#00ffff" strokeWidth="2" strokeLinecap="round" />
                        {/* Right line */}
                        <line x1="26" y1="20" x2="35" y2="20" stroke="#00ffff" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </div>
            )}
        </>
    );
};
