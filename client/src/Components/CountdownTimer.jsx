import React from 'react'

function CountdownTimer({total, elapsed}) {

    const process = 1 - (elapsed / total);
    const red = '#940a3d';
    const green = '#8a9b0f';
    const sampleColor = (process) => {
        const rgb = (hex) => {
            const r = parseInt(hex.substring(1, 3), 16);
            const g = parseInt(hex.substring(3, 5), 16);
            const b = parseInt(hex.substring(5, 7), 16);
            return {r, g, b};
        }
        const r = rgb(red);
        const g = rgb(green);
        const R = Math.floor(r.r + (g.r - r.r) * process);
        const G = Math.floor(r.g + (g.g - r.g) * process);
        const B = Math.floor(r.b + (g.b - r.b) * process);
        return `rgb(${R}, ${G}, ${B})`;
    }

    return (
        <div style={{
            display: 'grid',
            margin: '1em auto',
            width: '5em',
            height: '5em'
        }}>
            <svg viewBox="-50 -50 100 100" strokeWidth="10" style={{
                gridColumn: 1,
                gridRow: 1
            }}>
                <circle r="45" style={{
                    fill:'none', 
                    stroke:'silver'
                }}></circle>
                <circle r="45" pathLength="1" style={{
                    strokeLinecap: 'round',
                    stroke: sampleColor(process),
                    strokeDasharray: `${process} 1`,
                    transform: 'rotate(-90deg)',
                    fill: 'none'
                }}></circle>
            </svg>
            <div style={{
                gridColumn: 1,
                gridRow: 1,
                placeSelf: 'center',
                font: '1.5em/2 ubuntu mono, consolas, monaco, monospace',
            }}>
                {Math.floor(total - elapsed)}s
            </div>
        </div>
    )
}

export default CountdownTimer