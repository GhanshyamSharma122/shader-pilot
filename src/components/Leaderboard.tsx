/**
 * Leaderboard Component
 * Real-time scoreboard showing all players
 */

import React from 'react';

interface LeaderboardPlayer {
    id: string;
    name: string;
    score: number;
    kills: number;
    deaths: number;
    team: 'red' | 'blue' | null;
    isAlive: boolean;
}

interface LeaderboardProps {
    players: LeaderboardPlayer[];
    localPlayerId: string;
    gameMode: 'ffa' | 'team' | 'practice';
    teamScores?: { red: number; blue: number };
    isVisible: boolean;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
    players,
    localPlayerId,
    gameMode,
    teamScores,
    isVisible,
}) => {
    if (!isVisible) return null;

    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

    // For team mode, separate teams
    const redTeam = sortedPlayers.filter(p => p.team === 'red');
    const blueTeam = sortedPlayers.filter(p => p.team === 'blue');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="bg-gray-900/95 backdrop-blur-md border border-purple-500/50 rounded-xl p-6 min-w-96 max-h-[80vh] overflow-auto">
                <h2 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500 mb-4">
                    {gameMode === 'team' ? 'TEAM BATTLE' : 'FREE FOR ALL'}
                </h2>

                {/* Team Scores */}
                {gameMode === 'team' && teamScores && (
                    <div className="flex justify-center gap-8 mb-6">
                        <div className="text-center">
                            <div className="text-red-400 text-sm font-mono">RED TEAM</div>
                            <div className="text-4xl font-bold text-red-500">{teamScores.red}</div>
                        </div>
                        <div className="text-2xl text-gray-500 self-center">VS</div>
                        <div className="text-center">
                            <div className="text-blue-400 text-sm font-mono">BLUE TEAM</div>
                            <div className="text-4xl font-bold text-blue-500">{teamScores.blue}</div>
                        </div>
                    </div>
                )}

                {gameMode === 'team' ? (
                    <div className="flex gap-4">
                        {/* Red Team */}
                        <div className="flex-1">
                            <div className="text-red-400 text-sm font-bold mb-2 text-center">RED TEAM</div>
                            <PlayerTable players={redTeam} localPlayerId={localPlayerId} teamColor="red" />
                        </div>

                        {/* Blue Team */}
                        <div className="flex-1">
                            <div className="text-blue-400 text-sm font-bold mb-2 text-center">BLUE TEAM</div>
                            <PlayerTable players={blueTeam} localPlayerId={localPlayerId} teamColor="blue" />
                        </div>
                    </div>
                ) : (
                    <PlayerTable players={sortedPlayers} localPlayerId={localPlayerId} />
                )}

                <div className="text-center mt-4 text-gray-500 text-xs font-mono">
                    Press TAB to close
                </div>
            </div>
        </div>
    );
};

interface PlayerTableProps {
    players: LeaderboardPlayer[];
    localPlayerId: string;
    teamColor?: 'red' | 'blue';
}

const PlayerTable: React.FC<PlayerTableProps> = ({ players, localPlayerId, teamColor }) => {
    return (
        <table className="w-full text-sm font-mono">
            <thead>
                <tr className="text-gray-500 border-b border-gray-700/50">
                    <th className="text-left py-2 px-2">#</th>
                    <th className="text-left py-2 px-2">PLAYER</th>
                    <th className="text-center py-2 px-2">SCORE</th>
                    <th className="text-center py-2 px-2">K</th>
                    <th className="text-center py-2 px-2">D</th>
                </tr>
            </thead>
            <tbody>
                {players.map((player, index) => {
                    const isLocal = player.id === localPlayerId;
                    const textColor = teamColor === 'red'
                        ? 'text-red-400'
                        : teamColor === 'blue'
                            ? 'text-blue-400'
                            : 'text-cyan-400';

                    return (
                        <tr
                            key={player.id}
                            className={`border-b border-gray-800/30 ${isLocal ? 'bg-cyan-500/10' : ''} ${!player.isAlive ? 'opacity-50' : ''}`}
                        >
                            <td className="py-2 px-2 text-gray-500">{index + 1}</td>
                            <td className={`py-2 px-2 ${isLocal ? 'text-cyan-400 font-bold' : textColor}`}>
                                {player.name}
                                {isLocal && <span className="text-xs text-gray-500 ml-1">(you)</span>}
                            </td>
                            <td className="py-2 px-2 text-center text-yellow-400">{player.score}</td>
                            <td className="py-2 px-2 text-center text-green-400">{player.kills}</td>
                            <td className="py-2 px-2 text-center text-red-400">{player.deaths}</td>
                        </tr>
                    );
                })}
                {players.length === 0 && (
                    <tr>
                        <td colSpan={5} className="py-4 text-center text-gray-500">No players</td>
                    </tr>
                )}
            </tbody>
        </table>
    );
};
