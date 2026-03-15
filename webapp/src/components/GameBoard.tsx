import { useMemo, useState, useRef } from "react";
import "./GameBoard.css";

type Player = 1 | 2;
type Board = Record<string, Player>;

const HEX_SIZE = 26;
const SIDE_COLORS = ["#f0a040", "#4fb3ff", "#f05070"];
const SIDE_NAMES = ["Lado izquierdo", "Lado inferior", "Lado derecho"];
const PLAYER_FILL: Record<Player, string> = { 1: "#c8c0f0", 2: "#f0b84a" };
const PLAYER_STROKE: Record<Player, string> = { 1: "#9080d0", 2: "#c08828" };
const PLAYER_LABEL: Record<Player, string> = { 1: "Jugador 1", 2: "Bot" };
const CELL_BASE = "#1a1a24";
const CELL_EDGE_OP = "28";
const CELL_CORNER = "#1e1e2a";
const CELL_STROKE = "#2a2a3a";
const CELL_STROKE_CORNER = "#333348";

// Geometry
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

// Function to generate the board
function generateBoard(size: number) {
  const cells: { q: number; r: number }[] = [];
  for (let q = 0; q < size; q++) {
    for (let r = 0; r < size - q; r++) {
      cells.push({ q, r });
    }
  }
  return cells;
}

// Sides of the triangle
function getSides(q: number, r: number, size: number): number[] {
  const sides: number[] = [];
  const z = size - 1 - q - r; 
  if (q === 0) sides.push(0); 
  if (r === 0) sides.push(1);
  if (z === 0) sides.push(2); 
  return sides;
}

// Function to build a YEN to send to the gamey API, using the state of the board.
function buildYEN(size: number, board: Record<string, 1 | 2>) {
  const players: [string, string] = ["B", "R"];
  const occ: Record<string, string> = {};

  for (const [key, p] of Object.entries(board)) {
    const [qStr, rStr] = key.split(",");
    const q = Number(qStr);
    const r = Number(rStr);
    occ[`${q},${r}`] = p === 1 ? "B" : "R";
  }

  // Layout
  const rows: string[] = [];
  for (let x = size - 1; x >= 0; x--) {
    const len = size - x;
    let row = "";
    for (let y = 0; y < len; y++) {
      row += occ[`${x},${y}`] ?? ".";
    }
    rows.push(row);
  }

  return {
    size,
    turn: 1, // 0-indexed: 0="B" (human), 1="R" (bot)
    players,
    layout: rows.join("/"),
  };
}

// Board (Spun around using CSS, in code is upside down)
type GameBoardProps = {
  size?: number;
  userName?: string;
  botId?: string; 
};

export default function GameBoard({ size = 9, userName, botId }: GameBoardProps) {
  const cells = useMemo(() => generateBoard(size), [size]);
  const [board, setBoard] = useState<Board>({});
  const [current, setCurrent] = useState<Player>(1);
  const [hovered, setHovered] = useState<string | null>(null);
  const [loadingBot, setLoadingBot] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const gameFinishedRef = useRef(false);

  const positions = cells.map(({ q, r }) => hexToPixel(q, r));
  const minX = Math.min(...positions.map((p) => p.x)) - HEX_SIZE;
  const minY = Math.min(...positions.map((p) => p.y)) - HEX_SIZE;
  const maxX = Math.max(...positions.map((p) => p.x)) + HEX_SIZE;
  const maxY = Math.max(...positions.map((p) => p.y)) + HEX_SIZE;
  const pad = 24;
  const viewBox = `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`;

  const handleClick = async (q: number, r: number) => {
    if (gameFinishedRef.current || gameOver || loadingBot || current !== 1) return;

    const key = `${q},${r}`;
    if (board[key]) return;

    const nextBoard: Board = { ...board, [key]: 1 };
    setBoard(nextBoard);
    setCurrent(2);
    setLoadingBot(true);

    try {
      const API_URL = "http://localhost:4000";
    const bot = botId ?? "random_bot";
      const yen = buildYEN(size, nextBoard);

      const res = await fetch(`${API_URL}/v1/ybot/choose/${bot}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(yen),
      });


      // In case of 409 error skip it. Might delete if manage to make the error not necessary
      if (res.status === 409) {
        gameFinishedRef.current = true;
        let winnerFromServer: string | null = null;
        try {
          const errJson = await res.json();
          const msg: string = errJson?.message ?? "";
          const m = msg.match(/\(winner:\s*PlayerId\((\d+)\)\)/i);
          if (m && m[1]) winnerFromServer = m[1].trim();
        } catch {}
        setGameOver(true);
        if (winnerFromServer) setWinner(winnerFromServer);
        return;
      }

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}${text ? `: ${text}` : ""}`);
      }

      const data = await res.json();

      console.log("data completo del bot:", data);
      // Read GameStatus
      const status = data?.status;
      if (status && typeof status === "object" && "Finished" in status) {
        // status = { Finished: { winner: <id> } }
        gameFinishedRef.current = true;
        const w = status.Finished?.winner;
        const winnerId = typeof w === "number" ? String(w) : String(w ?? "");
        setWinner(winnerId);
        setGameOver(true);
        return; // Ended, return
      }

      // If ongoing, paint coords int he response
      const coords = data?.coords;
      if (
        coords &&
        typeof coords.x === "number" &&
        typeof coords.y === "number" &&
        typeof coords.z === "number" &&
        coords.x + coords.y + coords.z === size - 1
      ) {
        const botKey = `${coords.x},${coords.y}`; 
        setBoard((prev) => (prev[botKey] ? prev : { ...prev, [botKey]: 2 }));
      } else {
        // If no coords, nothing happens, in case we add the option to skip turns
        return;
      }
    } catch (err: any) {
      console.error("Error del backend:", err);
      alert(`Error al obtener el movimiento del bot: ${String(err?.message ?? err)}`);
    } finally {
      setCurrent(1);
      setLoadingBot(false);
    }
  };

  // To reset the board
  const reset = () => {
    gameFinishedRef.current = false;
    setBoard({});
    setCurrent(1);
    setHovered(null);
    setLoadingBot(false);
    setGameOver(false);
    setWinner(null);
  };

  return (
    <div className="game-page">
      <div className="game-header">
        <h1 className="game-title">Game Y</h1>
        <p className="game-subtitle">Conecta los tres lados para ganar</p>
        <p className="success-message">Hello {userName}! Welcome!</p>
      </div>

      {gameOver && (
        <div
          className="game-over-banner"
          style={{
            margin: "12px 0",
            padding: "10px 14px",
            borderRadius: 8,
            background: "#2a2a3a",
            color: "#fff",
            border: "1px solid #444",
            textAlign: "center",
            fontSize: "1.1rem",
          }}
        >
          {winner === null
            ? "La partida ha terminado"
            : winner === "0"
            ? `Ganó el Jugador!`
            : `¡Ganó el Bot!`}
        </div>
      )}

      <div className="side-legend">
        {SIDE_NAMES.map((name, i) => (
          <div key={i} className="side-legend-item">
            <div className={`side-legend-dot side-legend-dot--${i}`} />
            <span className="side-legend-label">{name}</span>
          </div>
        ))}
      </div>

      <div className="board-container">
        <svg
          viewBox={viewBox}
          className="board-svg"
          style={gameOver ? { pointerEvents: "none", opacity: 0.85 } : undefined}
        >
          {cells.map(({ q, r }) => {
            const { x, y } = hexToPixel(q, r);
            const key = `${q},${r}`;
            const owner = board[key];
            const sides = getSides(q, r, size);
            const isHovered = hovered === key && !owner && current === 1 && !loadingBot;

            let baseFill = CELL_BASE;
            if (sides.length === 1) baseFill = SIDE_COLORS[sides[0]] + CELL_EDGE_OP;
            if (sides.length >= 2) baseFill = CELL_CORNER;

            let fill = baseFill;
            if (owner) fill = PLAYER_FILL[owner];
            else if (isHovered) fill = "#ffffff22";

            const stroke = owner
              ? PLAYER_STROKE[owner]
              : sides.length >= 2
              ? CELL_STROKE_CORNER
              : CELL_STROKE;
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
                {sides.length >= 2 &&
                  sides.map((s, idx) => (
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