import { useState } from "react";
import "./GameBoard.css";

//const N = 9;

function generateBoard(size: number) {
  const cells: { q: number; r: number }[] = [];
  for (let q = 0; q < size; q++) {
    for (let r = 0; r < size - q; r++) {
      cells.push({ q, r });
    }
  }
  return cells;
}

const HEX_SIZE = 26;

function hexToPixel(q: number, r: number) {
  const x = HEX_SIZE * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const y = HEX_SIZE * (3 / 2) * r;
  return { x, y };
}

function hexCorners(cx: number, cy: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i - 30);
    return `${cx + HEX_SIZE * Math.cos(angle)},${cy + HEX_SIZE * Math.sin(angle)}`;
  }).join(" ");
}

function getSides(q: number, r: number, size: number): number[] {
  const sides: number[] = [];
  if (q === 0) sides.push(0);
  if (r === 0) sides.push(1);
  if (q + r === size - 1) sides.push(2);
  return sides;
}

const SIDE_COLORS  = ["#f0a040", "#4fb3ff", "#f05070"];
const SIDE_NAMES   = ["Lado izquierdo", "Lado superior", "Lado inferior"];

type Player = 1 | 2;
type Board  = Record<string, Player>;

const PLAYER_FILL:   Record<Player, string> = { 1: "#c8c0f0", 2: "#f0b84a" };
const PLAYER_STROKE: Record<Player, string> = { 1: "#9080d0", 2: "#c08828" };
const PLAYER_LABEL:  Record<Player, string> = { 1: "Jugador 1", 2: "Jugador 2" };

// Paleta oscura para las celdas
const CELL_BASE    = "#1a1a24";
const CELL_EDGE_OP = "28";   // opacidad hex para el tinte de borde
const CELL_CORNER  = "#1e1e2a";
const CELL_STROKE  = "#2a2a3a";
const CELL_STROKE_CORNER = "#333348";


type GameBoardProps = {
  size?: number; // opcional
};

export default function GameBoard( {size = 9 }: GameBoardProps) {
  const cells = generateBoard(size);
  const [board, setBoard]     = useState<Board>({});
  const [current, setCurrent] = useState<Player>(1);
  const [hovered, setHovered] = useState<string | null>(null);

  const positions = cells.map(({ q, r }) => hexToPixel(q, r));
  const minX = Math.min(...positions.map(p => p.x)) - HEX_SIZE;
  const minY = Math.min(...positions.map(p => p.y)) - HEX_SIZE;
  const maxX = Math.max(...positions.map(p => p.x)) + HEX_SIZE;
  const maxY = Math.max(...positions.map(p => p.y)) + HEX_SIZE;
  const pad  = 24;
  const viewBox = `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`;

  const handleClick = (q: number, r: number) => {
    const key = `${q},${r}`;
    if (board[key]) return;
    setBoard(prev => ({ ...prev, [key]: current }));
    setCurrent(c => c === 1 ? 2 : 1);
  };

  const reset = () => {
    setBoard({});
    setCurrent(1);
    setHovered(null);
  };

  return (
      <div className="game-page">

        <div className="game-header">
          <h1 className="game-title">Game Y</h1>
          <p className="game-subtitle">Conecta los tres lados para ganar</p>
        </div>

        <div className="side-legend">
          {SIDE_NAMES.map((name, i) => (
              <div key={i} className="side-legend-item">
                <div className={`side-legend-dot side-legend-dot--${i}`} />
                <span className="side-legend-label">{name}</span>
              </div>
          ))}
        </div>

        <div className="board-container">
          <svg viewBox={viewBox} className="board-svg">
            {cells.map(({ q, r }) => {
              const { x, y } = hexToPixel(q, r);
              const key      = `${q},${r}`;
              const owner    = board[key];
              const sides    = getSides(q, r, size);
              const isHovered = hovered === key && !owner;

              let baseFill = CELL_BASE;
              if (sides.length === 1)  baseFill = SIDE_COLORS[sides[0]] + CELL_EDGE_OP;
              if (sides.length >= 2)   baseFill = CELL_CORNER;

              let fill = baseFill;
              if (owner)          fill = PLAYER_FILL[owner];
              else if (isHovered) fill = current === 1 ? "#c8c0f022" : "#f0b84a22";

              const stroke      = owner ? PLAYER_STROKE[owner] : (sides.length >= 2 ? CELL_STROKE_CORNER : CELL_STROKE);
              const strokeWidth = sides.length >= 2 ? 1.5 : 1;

              return (
                  <g
                      key={key}
                      className={`hex-cell${owner ? " hex-cell--occupied" : ""}`}
                      onClick={() => handleClick(q, r)}
                      onMouseEnter={() => setHovered(key)}
                      onMouseLeave={() => setHovered(null)}
                  >
                    <polygon
                        className="hex-polygon"
                        points={hexCorners(x, y)}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                    />
                    {sides.length >= 2 && sides.map((s, idx) => (
                        <circle
                            key={idx}
                            cx={x + (idx === 0 ? -5 : 5)}
                            cy={y}
                            r={2.5}
                            fill={SIDE_COLORS[s]}
                            opacity={owner ? 0.3 : 0.8}
                        />
                    ))}
                  </g>
              );
            })}
          </svg>
        </div>

        <div className="turn-indicator">
          <div className={`turn-dot turn-dot--${current}`} />
          <span className="turn-label">Turno de {PLAYER_LABEL[current]}</span>
        </div>

        <button className="reset-button" onClick={reset}>
          Nueva partida
        </button>

      </div>
  );
}