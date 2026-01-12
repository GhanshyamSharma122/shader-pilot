/**
 * Minimap Component
 * Radar showing nearby players and power-ups - positioned top right
 */

import React from 'react';

interface MinimapPlayer {
    id: string;
    name: string;
    x: number;
    z: number;
    team: 'red' | 'blue' | null;
    isAlive: boolean;
}

interface MinimapPowerUp {
    id: string;
    type: string;
    x: number;
    z: number;
    isActive: boolean;
}

interface MinimapProps {
    players: MinimapPlayer[];
    powerUps: MinimapPowerUp[];
    playerPosition: { x: number; z: number };
    playerRotation: number;
    localPlayerId: string;
    mapScale?: number;
}

export const Minimap: React.FC<MinimapProps> = ({
    players,
    powerUps,
    playerPosition,
    playerRotation,
    localPlayerId,
    mapScale = 0.1,
}) => {
    const mapSize = 140;
    const radarRange = 500;

    const worldToMinimap = (worldX: number, worldZ: number) => {
        const relativeX = worldX - playerPosition.x;
        const relativeZ = worldZ - playerPosition.z;

        const cos = Math.cos(-playerRotation);
        const sin = Math.sin(-playerRotation);
        const rotatedX = relativeX * cos - relativeZ * sin;
        const rotatedZ = relativeX * sin + relativeZ * cos;

        const mapX = (rotatedX / radarRange) * (mapSize / 2) + mapSize / 2;
        const mapY = (rotatedZ / radarRange) * (mapSize / 2) + mapSize / 2;

        return { x: mapX, y: mapY };
    };

    return (
        <div className="fixed top-6 right-6 z-40">
            <div
                className="relative rounded-lg overflow-hidden"
                style={{
                    width: mapSize,
                    height: mapSize,
                    background: 'rgba(0,10,20,0.85)',
                    border: '2px solid rgba(0, 255, 255, 0.4)',
                    boxShadow: '0 0 15px rgba(0, 255, 255, 0.2)',
                }}
            >
                {/* Grid lines */}
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `
              linear-gradient(to right, rgba(0, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
            `,
                        backgroundSize: `${mapSize / 5}px ${mapSize / 5}px`,
                    }}
                />

                {/* Center cross */}
                <div className="absolute top-1/2 left-0 right-0 h-px bg-cyan-500/30" />
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-cyan-500/30" />

                {/* Power-ups */}
                {powerUps.filter(p => p.isActive).map(powerUp => {
                    const pos = worldToMinimap(powerUp.x, powerUp.z);
                    if (pos.x < 0 || pos.x > mapSize || pos.y < 0 || pos.y > mapSize) return null;

                    return (
                        <div
                            key={powerUp.id}
                            className="absolute w-2 h-2"
                            style={{
                                left: pos.x - 4,
                                top: pos.y - 4,
                                background: '#facc15',
                                boxShadow: '0 0 4px #facc15',
                            }}
                        />
                    );
                })}

                {/* Other players */}
                {players.filter(p => p.id !== localPlayerId && p.isAlive).map(player => {
                    const pos = worldToMinimap(player.x, player.z);
                    if (pos.x < 0 || pos.x > mapSize || pos.y < 0 || pos.y > mapSize) return null;

                    const color = player.team === 'red' ? '#ef4444' : player.team === 'blue' ? '#3b82f6' : '#f472b6';

                    return (
                        <div
                            key={player.id}
                            className="absolute"
                            style={{
                                left: pos.x - 3,
                                top: pos.y - 3,
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                backgroundColor: color,
                                boxShadow: `0 0 6px ${color}`,
                            }}
                        />
                    );
                })}

                {/* Player (center) */}
                <div
                    className="absolute"
                    style={{
                        left: mapSize / 2 - 5,
                        top: mapSize / 2 - 5,
                        width: 0,
                        height: 0,
                        borderLeft: '5px solid transparent',
                        borderRight: '5px solid transparent',
                        borderBottom: '10px solid #00ffff',
                        filter: 'drop-shadow(0 0 4px #00ffff)',
                    }}
                />
            </div>

            {/* Label */}
            <div className="text-center mt-1 text-xs text-cyan-400/70 font-mono">
                RADAR
            </div>
        </div>
    );
};
