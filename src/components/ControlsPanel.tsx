/**
 * Controls Panel - Shows all keybinds in-game
 */

import React from 'react';

export const ControlsPanel: React.FC = () => {
    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: 'rgba(0, 10, 20, 0.85)',
            border: '1px solid rgba(0, 255, 255, 0.3)',
            borderRadius: '8px',
            padding: '12px 16px',
            fontFamily: 'monospace',
            fontSize: '11px',
            color: '#aaa',
            zIndex: 100,
            minWidth: '160px',
        }}>
            <div style={{
                color: '#00cccc',
                fontWeight: 'bold',
                marginBottom: '8px',
                fontSize: '10px',
                letterSpacing: '1px'
            }}>
                CONTROLS
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                    <Row keys="W/A/S/D" action="Move" />
                    <Row keys="Mouse" action="Aim" />
                    <Row keys="Click" action="Shoot" />
                    <Row keys="1/2/3" action="Weapons" />
                    <Row keys="Q/E" action="Roll" />
                    <Row keys="R" action="Flip 180°" highlight />
                    <Row keys="Space" action="Up" />
                    <Row keys="Shift" action="Down" />
                    <Row keys="B" action="Boost" highlight />
                </tbody>
            </table>
        </div>
    );
};

const Row: React.FC<{ keys: string; action: string; highlight?: boolean }> = ({ keys, action, highlight }) => (
    <tr>
        <td style={{
            color: highlight ? '#00ffff' : '#888',
            paddingRight: '12px',
            paddingTop: '2px',
            paddingBottom: '2px',
        }}>
            {keys}
        </td>
        <td style={{
            color: highlight ? '#aaffaa' : '#666',
            paddingTop: '2px',
            paddingBottom: '2px',
        }}>
            {action}
        </td>
    </tr>
);
