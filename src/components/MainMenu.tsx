/**
 * Main Menu Component
 * Clean, polished menu with proper styling
 */

import React, { useState } from 'react';

// Ship color presets
const SHIP_COLORS = [
    { name: 'Ocean Blue', hex: '#2266cc' },
    { name: 'Crimson Red', hex: '#cc2244' },
    { name: 'Emerald Green', hex: '#22cc66' },
    { name: 'Royal Purple', hex: '#8844cc' },
    { name: 'Solar Orange', hex: '#ee7722' },
    { name: 'Hot Pink', hex: '#ee44aa' },
    { name: 'Golden Yellow', hex: '#ccaa22' },
    { name: 'Arctic Cyan', hex: '#22cccc' },
];

// Arena options
const ARENAS = [
    { id: 'solar', name: 'Solar System', icon: '☀️' },
    { id: 'earth', name: 'Earth Orbit', icon: '🌍' },
    { id: 'mars', name: 'Mars Station', icon: '🔴' },
    { id: 'jupiter', name: 'Jupiter Storm', icon: '🟤' },
];

interface MainMenuProps {
    onJoin: (playerName: string, gameMode: 'ffa' | 'team' | 'practice', team?: 'red' | 'blue', shipColor?: string, arena?: string, botBehavior?: string) => void;
    isConnecting: boolean;
    error?: string;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onJoin, isConnecting, error }) => {
    const [playerName, setPlayerName] = useState('');
    const [gameMode, setGameMode] = useState<'ffa' | 'team' | 'practice'>('ffa');
    const [team, setTeam] = useState<'red' | 'blue'>('red');
    const [selectedColor, setSelectedColor] = useState(0);
    const [customColor, setCustomColor] = useState('#2266cc');
    const [useCustom, setUseCustom] = useState(false);
    const [arena, setArena] = useState('solar');
    const [botBehavior, setBotBehavior] = useState<'aggressive' | 'passive'>('aggressive');

    const shipColor = useCustom ? customColor : SHIP_COLORS[selectedColor].hex;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (playerName.trim().length < 2) return;
        onJoin(playerName.trim(), gameMode, gameMode === 'team' ? team : undefined, shipColor, arena, gameMode === 'practice' ? botBehavior : undefined);
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(180deg, #1a0a2e 0%, #000 50%, #000 100%)',
            fontFamily: 'monospace',
            overflow: 'auto',
            padding: '20px',
        }}>
            {/* Grid background */}
            <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'linear-gradient(rgba(0,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.03) 1px, transparent 1px)',
                backgroundSize: '50px 50px',
                pointerEvents: 'none',
            }} />

            <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: '480px',
                background: 'rgba(10,15,30,0.95)',
                border: '2px solid rgba(0,255,255,0.3)',
                borderRadius: '16px',
                padding: '32px',
                boxShadow: '0 0 40px rgba(0,255,255,0.1)',
            }}>
                {/* Title */}
                <h1 style={{
                    fontSize: '48px',
                    fontWeight: 900,
                    textAlign: 'center',
                    background: 'linear-gradient(90deg, #00ffff, #aa44ff, #ff44aa)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '8px',
                }}>NEON VOID</h1>
                <p style={{
                    textAlign: 'center',
                    color: '#666',
                    fontSize: '12px',
                    letterSpacing: '4px',
                    marginBottom: '32px',
                }}>MULTIPLAYER SPACE SHOOTER</p>

                <form onSubmit={handleSubmit}>
                    {/* Call Sign */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', color: '#00cccc', fontSize: '11px', marginBottom: '6px' }}>
                            CALL SIGN
                        </label>
                        <input
                            type="text"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value.slice(0, 16))}
                            placeholder="Enter your name..."
                            disabled={isConnecting}
                            autoFocus
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                background: 'rgba(0,20,40,0.8)',
                                border: '2px solid rgba(0,255,255,0.4)',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '16px',
                                fontFamily: 'monospace',
                                outline: 'none',
                            }}
                        />
                    </div>

                    {/* Ship Color */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', color: '#00cccc', fontSize: '11px', marginBottom: '8px' }}>
                            SHIP COLOR
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {/* Color swatches */}
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {SHIP_COLORS.map((color, idx) => (
                                    <button
                                        key={color.name}
                                        type="button"
                                        title={color.name}
                                        onClick={() => { setSelectedColor(idx); setUseCustom(false); }}
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '6px',
                                            border: !useCustom && selectedColor === idx ? '3px solid #fff' : '2px solid rgba(255,255,255,0.2)',
                                            background: color.hex,
                                            cursor: 'pointer',
                                            boxShadow: !useCustom && selectedColor === idx ? `0 0 12px ${color.hex}` : 'none',
                                            transform: !useCustom && selectedColor === idx ? 'scale(1.15)' : 'scale(1)',
                                            transition: 'all 0.2s',
                                        }}
                                    />
                                ))}
                            </div>

                            {/* Custom picker */}
                            <input
                                type="color"
                                value={customColor}
                                onChange={(e) => { setCustomColor(e.target.value); setUseCustom(true); }}
                                title="Custom color"
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '6px',
                                    border: useCustom ? '3px solid #fff' : '2px solid rgba(255,255,255,0.2)',
                                    cursor: 'pointer',
                                    background: 'transparent',
                                }}
                            />
                        </div>

                        {/* Preview */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                            <div style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '4px',
                                background: shipColor,
                                boxShadow: `0 0 10px ${shipColor}`,
                            }} />
                            <span style={{ color: '#888', fontSize: '12px' }}>{shipColor.toUpperCase()}</span>
                        </div>
                    </div>

                    {/* Battleground */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', color: '#00cccc', fontSize: '11px', marginBottom: '8px' }}>
                            BATTLEGROUND
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                            {ARENAS.map((a) => (
                                <button
                                    key={a.id}
                                    type="button"
                                    onClick={() => setArena(a.id)}
                                    style={{
                                        padding: '12px 8px',
                                        background: arena === a.id ? 'linear-gradient(135deg, rgba(0,255,255,0.2), rgba(128,0,255,0.2))' : 'rgba(30,40,60,0.6)',
                                        border: arena === a.id ? '2px solid #00cccc' : '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                    }}
                                >
                                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>{a.icon}</div>
                                    <div style={{ fontSize: '9px', color: arena === a.id ? '#00ffff' : '#888' }}>{a.name}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Game Mode */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', color: '#00cccc', fontSize: '11px', marginBottom: '8px' }}>
                            GAME MODE
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                            <button
                                type="button"
                                onClick={() => setGameMode('practice')}
                                style={{
                                    padding: '12px',
                                    background: gameMode === 'practice' ? 'linear-gradient(135deg, #22aa44, #44cc66)' : 'rgba(30,40,60,0.6)',
                                    border: gameMode === 'practice' ? '2px solid #44ff88' : '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: gameMode === 'practice' ? '#fff' : '#888',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                }}
                            >
                                🎯 PRACTICE
                            </button>
                            <button
                                type="button"
                                onClick={() => setGameMode('ffa')}
                                style={{
                                    padding: '12px',
                                    background: gameMode === 'ffa' ? 'linear-gradient(135deg, #0088cc, #00aaff)' : 'rgba(30,40,60,0.6)',
                                    border: gameMode === 'ffa' ? '2px solid #00ccff' : '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: gameMode === 'ffa' ? '#fff' : '#888',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                }}
                            >
                                ⚔️ FREE FOR ALL
                            </button>
                            <button
                                type="button"
                                onClick={() => setGameMode('team')}
                                style={{
                                    padding: '12px',
                                    background: gameMode === 'team' ? 'linear-gradient(135deg, #8800cc, #aa44ff)' : 'rgba(30,40,60,0.6)',
                                    border: gameMode === 'team' ? '2px solid #aa66ff' : '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: gameMode === 'team' ? '#fff' : '#888',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                }}
                            >
                                👥 TEAM BATTLE
                            </button>
                        </div>
                        {gameMode === 'practice' && (
                            <p style={{ color: '#44cc66', fontSize: '11px', marginTop: '8px', textAlign: 'center' }}>
                                Fight AI bots to improve your skills!
                            </p>
                        )}
                    </div>

                    {/* Team Selection */}
                    {gameMode === 'team' && (
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', color: '#00cccc', fontSize: '11px', marginBottom: '8px' }}>
                                SELECT TEAM
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                <button
                                    type="button"
                                    onClick={() => setTeam('red')}
                                    style={{
                                        padding: '12px',
                                        background: team === 'red' ? 'rgba(200,50,50,0.8)' : 'rgba(30,40,60,0.6)',
                                        border: team === 'red' ? '2px solid #ff6666' : '1px solid rgba(255,100,100,0.3)',
                                        borderRadius: '8px',
                                        color: team === 'red' ? '#fff' : '#cc6666',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                    }}
                                >
                                    🔴 RED TEAM
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTeam('blue')}
                                    style={{
                                        padding: '12px',
                                        background: team === 'blue' ? 'rgba(50,100,200,0.8)' : 'rgba(30,40,60,0.6)',
                                        border: team === 'blue' ? '2px solid #6688ff' : '1px solid rgba(100,150,255,0.3)',
                                        borderRadius: '8px',
                                        color: team === 'blue' ? '#fff' : '#6688cc',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                    }}
                                >
                                    🔵 BLUE TEAM
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div style={{
                            background: 'rgba(200,50,50,0.2)',
                            border: '1px solid rgba(255,100,100,0.5)',
                            borderRadius: '8px',
                            padding: '12px',
                            marginBottom: '20px',
                            color: '#ff8888',
                            fontSize: '12px',
                            textAlign: 'center',
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Launch Button */}
                    <button
                        type="submit"
                        disabled={isConnecting || playerName.trim().length < 2}
                        style={{
                            width: '100%',
                            padding: '16px',
                            background: isConnecting || playerName.trim().length < 2
                                ? 'rgba(80,80,100,0.5)'
                                : 'linear-gradient(90deg, #ff44aa, #aa44ff, #00ccff)',
                            border: 'none',
                            borderRadius: '8px',
                            color: isConnecting || playerName.trim().length < 2 ? '#666' : '#fff',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            cursor: isConnecting || playerName.trim().length < 2 ? 'not-allowed' : 'pointer',
                            boxShadow: isConnecting || playerName.trim().length < 2 ? 'none' : '0 0 20px rgba(170,68,255,0.4)',
                            transition: 'all 0.3s',
                        }}
                    >
                        {isConnecting ? '⟳ CONNECTING...' : 'LAUNCH'}
                    </button>
                </form>

                {/* Controls hint */}
                <div style={{ marginTop: '20px', textAlign: 'center', color: '#555', fontSize: '11px' }}>
                    <p>WASD move • Mouse aim • Click shoot • 1/2/3 weapons</p>
                    <p>Q/E roll • Space/Shift up/down • Ctrl boost</p>
                </div>
            </div>
        </div>
    );
};
