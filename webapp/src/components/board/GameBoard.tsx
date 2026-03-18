import { useMemo, useState } from "react";
import "./GameBoard.css";
import { type Difficulty } from "../GameResultApi";
import { useGameY, type Player } from "./GameBoardLogic.ts";
import {
    generateBoard,
    getSides,
    hexCorners,
    hexToPixel,
    computeViewBox,
} from "./HexGeometryUtils.ts";
import { useTranslation } from "react-i18next";

// Visual constants
const SIDE_COLORS = ["#f0a040", "#4fb3ff", "#f05070"];
const SIDE_NAMES_KEYS = ["game.sideLeft", "game.sideBottom", "game.sideRight"];
const PLAYER_FILL: Record<Player, string> = { 1: "#c8c0f0", 2: "#f0b84a" };
const PLAYER_STROKE: Record<Player, string> = { 1: "#9080d0", 2: "#c08828" };
const PLAYER_LABEL_KEYS: Record<Player, string> = { 1: "game.player", 2: "game.bot" };

const CELL_BASE = "#1a1a24";
const CELL_EDGE_OPACITY = "28";
const CELL_CORNER = "#1e1e2a";
const CELL_STROKE = "#2a2a3a";
const CELL_STROKE_CORNER = "#333348";

function SideLegend() {
    const { t } = useTranslation();
    return (
        <div className="side-legend">
            {SIDE_NAMES_KEYS.map((key, i) => (
                <div key={i} className="side-legend-item">
                    <div className={`side-legend-dot side-legend-dot--${i}`} />
                    <span className="side-legend-label">{t(key)}</span>
                </div>
            ))}
        </div>
    );
}

function WinnerBanner({ winner }: { winner: string | null }) {
    const { t } = useTranslation();
    const message =
        winner === null ? t('game.gameOver')
            : winner === "0" ? t('game.playerWins')
                : t('game.botWins');

    return (
        <div className="game-over-banner" style={{
            margin: "12px 0", padding: "10px 14px", borderRadius: 8,
            background: "#2a2a3a", color: "#fff", border: "1px solid #444",
            textAlign: "center", fontSize: "1.1rem",
        }}>
            {message}
        </div>
    );
}

type HexCellProps = {
    q: number;
    r: number;
    size: number;
    owner: Player | undefined;
    isHovered: boolean;
    onClick: () => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
};

function HexCell({ q, r, size, owner, isHovered, onClick, onMouseEnter, onMouseLeave }: HexCellProps) {
    const { x, y } = hexToPixel(q, r);
    const sides = getSides(q, r, size);

    let fill = CELL_BASE;
    if (sides.length === 1) fill = SIDE_COLORS[sides[0]] + CELL_EDGE_OPACITY;
    if (sides.length >= 2) fill = CELL_CORNER;
    if (isHovered) fill = "#ffffff22";
    if (owner) fill = PLAYER_FILL[owner];

    const stroke = owner
        ? PLAYER_STROKE[owner]
        : sides.length >= 2 ? CELL_STROKE_CORNER : CELL_STROKE;
    const strokeWidth = sides.length >= 2 ? 1.5 : 1;

    return (
        <g
            className={`hex-cell${owner ? " hex-cell--occupied" : ""}`}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
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
}

type GameBoardProps = {
    size?: number;
    userName?: string;
    botId?: string;
    difficulty?: Difficulty;
};

export default function GameBoard({ size = 9, botId = "random_bot", difficulty = "easy" }: GameBoardProps) {
    const { t } = useTranslation();
    const cells = useMemo(() => generateBoard(size), [size]);
    const [hovered, setHovered] = useState<string | null>(null);

    const { board, currentPlayer, loadingBot, gameOver, winner, handleCellClick, resetGame } =
        useGameY(size, botId, difficulty);

    const viewBox = useMemo(() => {
        const positions = cells.map(({ q, r }) => hexToPixel(q, r));
        return computeViewBox(positions);
    }, [cells]);

    const canHover = currentPlayer === 1 && !loadingBot && !gameOver;

    return (
        <div className="game-page">
            <div className="game-header">
                <h1 className="game-title">{t('game.title')}</h1>
                <p className="game-subtitle">{t('game.subtitle')}</p>
            </div>

            {gameOver && <WinnerBanner winner={winner} />}

            <SideLegend />

            <div className="board-container">
                <svg
                    viewBox={viewBox}
                    className="board-svg"
                    style={gameOver ? { pointerEvents: "none", opacity: 0.85 } : undefined}
                >
                    {cells.map(({ q, r }) => {
                        const key = `${q},${r}`;
                        return (
                            <HexCell
                                key={key}
                                q={q}
                                r={r}
                                size={size}
                                owner={board[key]}
                                isHovered={hovered === key && !board[key] && canHover}
                                onClick={() => handleCellClick(q, r)}
                                onMouseEnter={() => setHovered(key)}
                                onMouseLeave={() => setHovered(null)}
                            />
                        );
                    })}
                </svg>
            </div>

            <div className="turn-indicator">
                <div className={`turn-dot turn-dot--${currentPlayer}`} />
                <span className="turn-label">{t('game.turn', { player: t(PLAYER_LABEL_KEYS[currentPlayer]) })}</span>
            </div>

            <button className="reset-button" onClick={resetGame}>
                {t('game.newGame')}
            </button>
        </div>
    );
}