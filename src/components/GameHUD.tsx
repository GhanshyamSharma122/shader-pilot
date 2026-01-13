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

            {/* Kill Feed - Top Right */}
            <div className="fixed top-6 right-6 z-40 pointer-events-none">
                <div className="flex flex-col gap-1">
                    {killFeed.slice(-5).map((kill, index) => (
                        <div
                            key={kill.timestamp + index}
                            className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded px-3 py-1 text-sm font-mono animate-fade-in"
                        >
                            <span className="text-cyan-400">{kill.killerName}</span>
                            <span className="text-gray-500 mx-2">⚡</span>
                            <span className="text-pink-400">{kill.victimName}</span>
                        </div>
                    ))}
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
                    <div className="relative" style={{ width: '80px', height: '80px' }}>
                        {/* Outer ring */}
                        <div
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan-400/60"
                            style={{ width: '60px', height: '60px', boxShadow: '0 0 10px rgba(34, 211, 238, 0.3)' }}
                        />
                        {/* Inner circle */}
                        <div
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-pink-400/70"
                            style={{ width: '24px', height: '24px' }}
                        />
                        {/* Center dot */}
                        <div
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400"
                            style={{
                                width: '6px',
                                height: '6px',
                                boxShadow: '0 0 8px rgba(34, 211, 238, 0.8), 0 0 16px rgba(34, 211, 238, 0.4)'
                            }}
                        />
                        {/* Cross lines - Top */}
                        <div
                            className="absolute left-1/2 -translate-x-1/2 bg-cyan-400"
                            style={{
                                top: '2px',
                                width: '2px',
                                height: '16px',
                                boxShadow: '0 0 4px rgba(34, 211, 238, 0.6)'
                            }}
                        />
                        {/* Cross lines - Bottom */}
                        <div
                            className="absolute left-1/2 -translate-x-1/2 bg-cyan-400"
                            style={{
                                bottom: '2px',
                                width: '2px',
                                height: '16px',
                                boxShadow: '0 0 4px rgba(34, 211, 238, 0.6)'
                            }}
                        />
                        {/* Cross lines - Left */}
                        <div
                            className="absolute top-1/2 -translate-y-1/2 bg-cyan-400"
                            style={{
                                left: '2px',
                                width: '16px',
                                height: '2px',
                                boxShadow: '0 0 4px rgba(34, 211, 238, 0.6)'
                            }}
                        />
                        {/* Cross lines - Right */}
                        <div
                            className="absolute top-1/2 -translate-y-1/2 bg-cyan-400"
                            style={{
                                right: '2px',
                                width: '16px',
                                height: '2px',
                                boxShadow: '0 0 4px rgba(34, 211, 238, 0.6)'
                            }}
                        />
                        {/* Corner markers - diagonal accents */}
                        <div
                            className="absolute bg-pink-400/60"
                            style={{ top: '8px', left: '8px', width: '8px', height: '2px', transform: 'rotate(-45deg)' }}
                        />
                        <div
                            className="absolute bg-pink-400/60"
                            style={{ top: '8px', right: '8px', width: '8px', height: '2px', transform: 'rotate(45deg)' }}
                        />
                        <div
                            className="absolute bg-pink-400/60"
                            style={{ bottom: '8px', left: '8px', width: '8px', height: '2px', transform: 'rotate(45deg)' }}
                        />
                        <div
                            className="absolute bg-pink-400/60"
                            style={{ bottom: '8px', right: '8px', width: '8px', height: '2px', transform: 'rotate(-45deg)' }}
                        />
                    </div>
                </div>
            )}
        </>
    );
};
