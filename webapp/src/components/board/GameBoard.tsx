import { useMemo, useState } from "react";
import "./GameBoard.css";
import { type Difficulty } from "../GameResultApi";
import { useGameY, type Player, type GameMode } from "./GameBoardLogic.ts";
import {
  generateBoard,
  getSides,
  hexCorners,
  hexToPixel,
  computeViewBox,
} from "./HexGeometryUtils.ts";
import { useTranslation } from "react-i18next";

const SIDE_COLORS = ["#f0a040", "#4fb3ff", "#f05070"];
const SIDE_NAME_KEYS = ["game.sideLeft", "game.sideBottom", "game.sideRight"];
const PLAYER_FILL: Record<Player, string> = { 1: "#c8c0f0", 2: "#f0b84a" };
const PLAYER_STROKE: Record<Player, string> = { 1: "#9080d0", 2: "#c08828" };
const PLAYER_LABEL_KEY: Record<Player, string> = { 1: "game.player", 2: "game.bot" };
const DIFFICULTY_LABEL_KEY: Record<string, string> = {
  easy: "game.difficultyEasy",
  hard: "game.difficultyHard",
  extreme: "game.difficultyExtreme",
  impossible: "game.difficultyImpossible",
};

const GAME_MODE_LABEL_KEY: Record<GameMode, string> = {
  classic: "game.modeClassic",
  master: "game.modeMaster",
  fortune: "game.modeFortune",
};

const CELL_BASE = "#1a1a24";
const CELL_EDGE_OPACITY = "28";
const CELL_CORNER = "#1e1e2a";
const CELL_STROKE = "#2a2a3a";
const CELL_STROKE_CORNER = "#333348";

// ---------------------------------------------------------------------------
// Sub-componentes
// ---------------------------------------------------------------------------

function SideLegend() {
  const { t } = useTranslation();
  return (
    <div className="side-legend">
      {SIDE_NAME_KEYS.map((key, i) => (
        <div key={i} className="side-legend-item">
          <div className={`side-legend-dot side-legend-dot--${i}`} />
          <span className="side-legend-label">{t(key)}</span>
        </div>
      ))}
    </div>
  );
}

function CoinFlipOverlay({ result }: { result: "player" | "bot" | null }) {
  const { t } = useTranslation();
  return (
    <div className="coin-overlay">
      <div className="coin-anim">
        <div className="coin-wrapper">
          <div className={`coin coin--${result ?? "player"}`}>
            <div className="coin-face coin-front">★</div>
            <div className="coin-face coin-back">✕</div>
          </div>
        </div>
        <p className="coin-label">
          {result === "player" ? t("game.fortuneYourTurn") : t("game.fortuneBotTurn")}
        </p>
      </div>
    </div>
  );
}

function WinnerBanner({ winner }: { winner: string | null }) {
  const { t } = useTranslation();
  const playerWon = winner === "0";
  const message = winner === null
    ? t('game.gameOver')
    : playerWon
      ? t('game.playerWins')
      : t('game.botWins');

  return (
    <div className={`game-over-banner ${playerWon ? "game-over-banner--win" : "game-over-banner--loss"}`}>
      <span className="game-over-banner__icon">{playerWon ? "★" : "✕"}</span>
      <span className="game-over-banner__text">{message}</span>
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
    : sides.length >= 2
      ? CELL_STROKE_CORNER
      : CELL_STROKE;
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

// Contadores de piezas en el tablero
function usePieceCounts(board: Record<string, Player>) {
  return useMemo(() => {
    let p1 = 0, p2 = 0;
    for (const v of Object.values(board)) {
      if (v === 1) p1++;
      else if (v === 2) p2++;
    }
    return { p1, p2 };
  }, [board]);
}

// ---------------------------------------------------------------------------
// GameBoard
// ---------------------------------------------------------------------------

type GameBoardProps = {
  size?: number;
  userName?: string;
  botId?: string;
  difficulty?: Difficulty;
  gameMode?: GameMode;
};

export default function GameBoard({ size = 9, botId = "random_bot", difficulty = "easy", gameMode = "classic" }: GameBoardProps) {
  const { t } = useTranslation();
  const cells = useMemo(() => generateBoard(size), [size]);
  const [hovered, setHovered] = useState<string | null>(null);

  const { board, currentPlayer, loadingBot, gameOver, winner, handleCellClick, resetGame, masterPiecesLeft, fortuneFlip, coinAnimating, coinAnimResult } =
    useGameY(size, botId, difficulty, gameMode);

  const viewBox = useMemo(() => {
    const positions = cells.map(({ q, r }) => hexToPixel(q, r));
    return computeViewBox(positions);
  }, [cells]);

  const canHover = currentPlayer === 1 && !loadingBot && !gameOver;
  const totalCells = cells.length;
  const { p1, p2 } = usePieceCounts(board);

  return (
    <div className="game-page">
      {/* Panel lateral izquierdo */}
      <aside className="game-sidebar">
        <div className="game-sidebar__section">
          <h2 className="game-sidebar__title">Game Y</h2>
          <p className="game-sidebar__hint">{t('game.subtitle')}</p>
        </div>

        <div className="game-sidebar__section">
          <span className="game-sidebar__label">{t('game.board')}</span>
          <span className="game-sidebar__value">{size} × {size}</span>
        </div>

        <div className="game-sidebar__section">
          <span className="game-sidebar__label">{t('game.difficulty')}</span>
          <span className={`game-sidebar__badge game-sidebar__badge--${difficulty}`}>
            {t(DIFFICULTY_LABEL_KEY[difficulty])}
          </span>
        </div>

        <div className="game-sidebar__section">
          <span className="game-sidebar__label">{t('game.gameMode')}</span>
          <span className={`game-sidebar__badge game-sidebar__badge--mode-${gameMode}`}>
            {t(GAME_MODE_LABEL_KEY[gameMode])}
          </span>
        </div>

        <div className="game-sidebar__divider" />

        {/* Marcador */}
        <div className="game-sidebar__section">
          <span className="game-sidebar__label">{t('game.pieces')}</span>
          <div className="game-sidebar__scores">
            <div className="game-sidebar__score">
              <div className="game-sidebar__score-dot game-sidebar__score-dot--1" />
              <span className="game-sidebar__score-name">{t('game.player')}</span>
              <span className="game-sidebar__score-value">{p1}</span>
            </div>
            <div className="game-sidebar__score">
              <div className="game-sidebar__score-dot game-sidebar__score-dot--2" />
              <span className="game-sidebar__score-name">{t('game.bot')}</span>
              <span className="game-sidebar__score-value">{p2}</span>
            </div>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="game-sidebar__section">
          <span className="game-sidebar__label">{t('game.progress')}</span>
          <div className="game-sidebar__progress-track">
            <div
              className="game-sidebar__progress-bar"
              style={{ width: `${((p1 + p2) / totalCells) * 100}%` }}
            />
          </div>
          <span className="game-sidebar__progress-text">{p1 + p2} / {totalCells}</span>
        </div>

        <div className="game-sidebar__divider" />

        <SideLegend />

        <div className="game-sidebar__spacer" />

        <button className="game-sidebar__reset-btn" onClick={resetGame}>
          {t('game.newGame')}
        </button>
      </aside>

      {/* Zona central del tablero */}
      <main className="game-main">
        {coinAnimating && <CoinFlipOverlay result={coinAnimResult} />}
        {/* Indicador de turno */}
        <div className={`turn-bar ${loadingBot ? "turn-bar--thinking" : ""}`}>
          <div className={`turn-dot turn-dot--${currentPlayer}`} />
          <span className="turn-label">
            {loadingBot
              ? t('game.botThinking')
              : gameMode === "master" && currentPlayer === 1
                ? t('game.masterPiece', { current: 3 - masterPiecesLeft, total: 2 })
                : gameMode === "fortune" && fortuneFlip !== null
                  ? t(fortuneFlip === "player" ? 'game.fortuneYourTurn' : 'game.fortuneBotTurn')
                  : t('game.turn', { player: t(PLAYER_LABEL_KEY[currentPlayer]) })}
          </span>
        </div>

        {gameOver && <WinnerBanner winner={winner} />}

        <div className={`board-container ${gameOver ? "board-container--finished" : ""}`}>
          <svg
            viewBox={viewBox}
            className="board-svg"
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
      </main>
    </div>
  );
}
