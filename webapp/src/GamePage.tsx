import { useState } from "react";
import GameBoard from "./components/board/GameBoard.tsx";
import "./GameSetup.css";

type Mode = "easy" | "hard" | "extreme" | "impossible" | null;

const BOARD_SIZES = [5, 7, 9, 11, 13] as const;
const DEFAULT_BOARD_SIZE = 9;

const BOT_MAP: Record<string, string> = {
  easy: "random_bot",
  hard: "heuristic_bot",
  extreme: "minimax_bot",
  impossible: "montecarlo_bot",
};

const GamePage: React.FC = () => {
  const [mode, setMode] = useState<Mode>(null);
  const [boardSize, setBoardSize] = useState<number>(DEFAULT_BOARD_SIZE);
  const [difficulty, setDifficulty] = useState<"easy" | "hard" | "extreme" | "impossible">("easy");

  if (!mode) {
    return (
      <div className="setup">
        <div className="setup__card">
          <div className="setup__header">
            <span className="setup__tag">Nueva partida</span>
            <h1 className="setup__title">Game Y</h1>
            <p className="setup__subtitle">Conecta los tres lados del tablero para ganar</p>
          </div>

          <div className="setup__divider" />

          <div className="setup__field">
            <label className="setup__label">Tamaño del tablero</label>
            <div className="setup__sizes">
              {BOARD_SIZES.map((s) => (
                <button
                  key={s}
                  className={`setup__size-btn${s === boardSize ? " setup__size-btn--active" : ""}`}
                  onClick={() => setBoardSize(s)}
                >
                  <span className="setup__size-num">{s}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="setup__divider" />

          <div className="setup__field">
            <label className="setup__label">Dificultad</label>
            <div className="setup__diff-options">
              <button
                className={`setup__diff-btn${difficulty === "easy" ? " setup__diff-btn--active" : ""}`}
                onClick={() => setDifficulty("easy")}
              >
                <span className="setup__diff-icon setup__diff-icon--easy" />
                <div className="setup__diff-text">
                  <span className="setup__diff-name">🎲 Fácil</span>
                </div>
              </button>
              <button
                className={`setup__diff-btn${difficulty === "hard" ? " setup__diff-btn--active" : ""}`}
                onClick={() => setDifficulty("hard")}
              >
                <span className="setup__diff-icon setup__diff-icon--hard" />
                <div className="setup__diff-text">
                  <span className="setup__diff-name">🧠 Difícil</span>
                </div>
              </button>
              <button
                className={`setup__diff-btn${difficulty === "extreme" ? " setup__diff-btn--active" : ""}`}
                onClick={() => setDifficulty("extreme")}
              >
                <span className="setup__diff-icon setup__diff-icon--extreme" />
                <div className="setup__diff-text">
                  <span className="setup__diff-name">🔥 Extremo</span>
                </div>
              </button>
              <button
                className={`setup__diff-btn${difficulty === "impossible" ? " setup__diff-btn--active" : ""}`}
                onClick={() => setDifficulty("impossible")}
              >
                <span className="setup__diff-icon setup__diff-icon--impossible" />
                <div className="setup__diff-text">
                  <span className="setup__diff-name">👿 Imposible</span>
                </div>
              </button>
            </div>
          </div>

          <div className="setup__divider" />

          <button className="setup__play-btn" onClick={() => setMode(difficulty)}>
            Comenzar partida
          </button>
        </div>
      </div>
    );
  }

  return <GameBoard size={boardSize} botId={BOT_MAP[mode]} difficulty={mode}/>;
};

export default GamePage;
